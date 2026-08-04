import { NextRequest, NextResponse } from "next/server";
import { generateSelfIntroResult } from "../../../src/map-decision-v1/engine/self-intro-generator";
import {
  computeGenerationCacheKey,
  getCachedGeneration,
  setCachedGeneration,
} from "../../../src/map-decision-v1/engine/generation-cache";
import {
  MAX_INPUT_LENGTH,
  getClientIp,
  isTrustedRequestOrigin,
  releaseGenerationSlotOnFailure,
  reserveGenerationSlot,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { signResult } from "../../../src/map-decision-v1/engine/result-signature";
import { resolveTopic } from "../../../src/map-decision-v1/engine/topics";
import { MapSession, SelfIntroResult } from "../../../src/map-decision-v1/types";

const SIGNATURE_SCOPE = "selfIntro";

type RequestBody = { session: MapSession };
type SuccessResponse = { result: SelfIntroResult; signature: string | null };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.session === "object" && candidate.session !== null;
}

// app/api/generate-idealtype-result/route.ts의 maxIdealTypeMessages()와
// 완전히 같은 계산 방식이다 — 이 주제도 topics.ts의 고정 문항 배열을
// 그대로 밟는 구조라 메시지 개수가 문항 수로 이미 정해져 있다. 문항
// 수가 나중에 바뀌어도 이 상한이 자동으로 따라가서 #81류 사고(상한
// 하드코딩 → 문항 수 변경 시 정상 완주한 사용자가 결과를 못 받는 사고)가
// 재발하지 않는다.
function maxSelfIntroMessages(): number {
  const axisCount = (resolveTopic("selfIntro").axes ?? []).length;
  return axisCount * 2 * 2 + 10;
}

function isOversized(session: MapSession): boolean {
  if (!Array.isArray(session.messages)) return true;
  if (session.messages.length > maxSelfIntroMessages()) return true;
  return session.messages.some((message) => typeof message.text !== "string" || message.text.length > MAX_INPUT_LENGTH);
}

export async function POST(request: NextRequest) {
  if (!isTrustedRequestOrigin(request)) {
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRequestBody(body)) {
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }
  const { session } = body;

  if (isOversized(session)) {
    return NextResponse.json(
      { blocked: true, reason: "payload_too_large", message: "답변 내용이 처리할 수 있는 범위를 넘어섰어요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  // 같은 답변으로 이미 만든 결과가 있으면 레이트리밋 예약(reserveGenerationSlot)
  // 자체를 건드리지 않고 바로 돌려준다 — 백그라운드 전환 후 재요청처럼
  // "같은 사람이 같은 답변으로 다시 요청"한 경우 슬롯을 소모하지 않는다.
  const cacheKey = computeGenerationCacheKey("selfIntro", session);
  const cachedBeforeReservation = await getCachedGeneration<SelfIntroResult>(cacheKey);
  if (cachedBeforeReservation) {
    console.log("[generation-cache] hit, skip reservation");
    return NextResponse.json({
      result: cachedBeforeReservation,
      signature: signResult(SIGNATURE_SCOPE, cachedBeforeReservation),
    } satisfies SuccessResponse);
  }
  console.log("[generation-cache] miss, proceeding to generate");

  const ip = getClientIp(request);
  // 이상형·진로와 같은 레이트리밋 예산을 공유한다(엔드포인트만 분리,
  // 안전장치는 그대로 재사용 — engine/rate-limit.ts는 건드리지 않는다).
  const reservation = await reserveGenerationSlot(ip, session.startedAt);
  if (!reservation.allowed) {
    const message =
      reservation.reason === "session_limit"
        ? "이 카드에서 만들 수 있는 횟수를 모두 사용했어요. 새로 시작해 주세요."
        : reservation.reason === "ip_daily_limit"
          ? "오늘 만들 수 있는 카드 수를 모두 사용했어요. 내일 다시 시도해 주세요."
          : reservation.reason === "global_daily_limit"
            ? "지금 이용자가 많아요. 잠시 후 다시 시도해 주세요."
            : reservation.reason === "unavailable"
              ? "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요."
              : "이 카드는 반복해서 만들지 못했어요. 잠시 후 다시 시도하거나 새로 시작해 주세요.";
    const blockedReason =
      reservation.reason === "session_limit"
        ? "session_generation_limit"
        : reservation.reason === "ip_daily_limit"
          ? "ip_daily_generation_limit"
          : reservation.reason === "global_daily_limit"
            ? "global_daily_generation_limit"
            : reservation.reason === "unavailable"
              ? "generation_unavailable"
              : "generation_failure_limit";
    return NextResponse.json(
      { blocked: true, reason: blockedReason, message } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  const { result, countsAsFailure } = await generateSelfIntroResult(session);
  if (!result) {
    await releaseGenerationSlotOnFailure(ip, session.startedAt, countsAsFailure);
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  await setCachedGeneration(cacheKey, result);

  return NextResponse.json({ result, signature: signResult(SIGNATURE_SCOPE, result) } satisfies SuccessResponse);
}

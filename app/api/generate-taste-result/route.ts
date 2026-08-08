import { NextRequest, NextResponse } from "next/server";
import { generateTasteResult } from "../../../src/map-decision-v1/engine/taste-generator";
import {
  acquireGenerationMarker,
  computeGenerationCacheKey,
  getCachedGeneration,
  hasSufficientTimeBudgetForGeneration,
  releaseGenerationMarker,
  setCachedGeneration,
  waitForCachedGeneration,
} from "../../../src/map-decision-v1/engine/generation-cache";
import {
  MAX_INPUT_LENGTH,
  getClientIp,
  isTrustedRequestOrigin,
  releaseGenerationSlotOnFailure,
  reserveGenerationSlot,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { logGenerationMarker, logGenerationRequest } from "../../../src/map-decision-v1/engine/generation-timing";
import { signResult } from "../../../src/map-decision-v1/engine/result-signature";
import { resolveTopic } from "../../../src/map-decision-v1/engine/topics";
import { MapSession, TasteResult } from "../../../src/map-decision-v1/types";

// 마커 대기(최대 45초) + 실제 생성(실측 100~135초)이 겹치는 최악의
// 경우에도 Vercel 기본 함수 시간제한(플랜에 따라 10~60초)에 걸려 응답이
// 끊기지 않도록 이 라우트만 명시적으로 넉넉하게 늘린다. 값 300은 그
// 최악 경우(45+135=180초)에 여유를 더한 것이다.
export const maxDuration = 300;

const SIGNATURE_SCOPE = "taste";

type RequestBody = { session: MapSession };
type SuccessResponse = { result: TasteResult; signature: string | null };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.session === "object" && candidate.session !== null;
}

// app/api/generate-work-result/route.ts의 maxWorkMessages()와 완전히
// 같은 계산 방식이다 — 이 주제도 topics.ts의 고정 문항 배열을 그대로
// 밟는 구조라 메시지 개수가 문항 수로 이미 정해져 있다. 문항 수가
// 나중에 바뀌어도 이 상한이 자동으로 따라가서 #81류 사고(상한
// 하드코딩 → 문항 수 변경 시 정상 완주한 사용자가 결과를 못 받는 사고)가
// 재발하지 않는다.
function maxTasteMessages(): number {
  const axisCount = (resolveTopic("taste").axes ?? []).length;
  return axisCount * 2 * 2 + 10;
}

function isOversized(session: MapSession): boolean {
  if (!Array.isArray(session.messages)) return true;
  if (session.messages.length > maxTasteMessages()) return true;
  return session.messages.some((message) => typeof message.text !== "string" || message.text.length > MAX_INPUT_LENGTH);
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  let cacheStatus: "hit" | "miss" | "unknown" = "unknown";
  const logTiming = (outcome: string): void =>
    logGenerationRequest({ topic: "taste", requestStartedAt, cache: cacheStatus, outcome });

  if (!isTrustedRequestOrigin(request)) {
    logTiming("invalid_request");
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isRequestBody(body)) {
    logTiming("invalid_request");
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }
  const { session } = body;

  if (isOversized(session)) {
    logTiming("payload_too_large");
    return NextResponse.json(
      { blocked: true, reason: "payload_too_large", message: "답변 내용이 처리할 수 있는 범위를 넘어섰어요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  // 같은 답변으로 이미 만든 결과가 있으면 레이트리밋 예약(reserveGenerationSlot)
  // 자체를 건드리지 않고 바로 돌려준다 — 백그라운드 전환 후 재요청처럼
  // "같은 사람이 같은 답변으로 다시 요청"한 경우 슬롯을 소모하지 않는다.
  const cacheKey = computeGenerationCacheKey("taste", session);
  const cachedBeforeReservation = await getCachedGeneration<TasteResult>(cacheKey);
  if (cachedBeforeReservation) {
    cacheStatus = "hit";
    console.log("[generation-cache] hit, skip reservation");
    logTiming("cache_hit");
    return NextResponse.json({
      result: cachedBeforeReservation,
      signature: signResult(SIGNATURE_SCOPE, cachedBeforeReservation),
    } satisfies SuccessResponse);
  }
  cacheStatus = "miss";
  console.log("[generation-cache] miss, proceeding to generate");

  // 같은 답변으로 다른 요청이 이미 생성 중일 수 있다(새로고침·탭 중복·
  // 뒤로가기 왕복 등으로 재요청된 경우) — 마커를 원자적으로 먼저 걸어본다.
  // 이 요청이 마커를 얻으면 아래에서 정상적으로 생성을 담당하고, 못
  // 얻으면 다른 요청이 채울 캐시를 잠깐 기다린다(generation-cache.ts의
  // acquireGenerationMarker/waitForCachedGeneration 참고).
  const acquiredMarker = await acquireGenerationMarker(cacheKey);
  if (!acquiredMarker) {
    const waitStartedAt = Date.now();
    const cachedAfterWait = await waitForCachedGeneration<TasteResult>(cacheKey);
    const waitedMs = Date.now() - waitStartedAt;
    if (cachedAfterWait) {
      logGenerationMarker({ topic: "taste", outcome: "wait_hit", waitedMs });
      cacheStatus = "hit";
      logTiming("cache_hit_after_wait");
      return NextResponse.json({
        result: cachedAfterWait,
        signature: signResult(SIGNATURE_SCOPE, cachedAfterWait),
      } satisfies SuccessResponse);
    }
    // 최대 대기 시간(45초)을 넘겼다 — 계속 기다리게 두지 않고 이 요청이
    // 직접 생성한다. 마커를 얻은 적이 없으므로 아래 finally에서 release를
    // 부르지 않는다(다른 요청이 아직 들고 있는 마커를 지우면 안 된다).
    logGenerationMarker({ topic: "taste", outcome: "wait_timeout", waitedMs });
  } else {
    logGenerationMarker({ topic: "taste", outcome: "acquired", waitedMs: 0 });
  }

  try {
    // 남은 시간 예산이 생성 1회를 안전하게 마치기에 부족하면 시작도 하지
    // 않는다 — 어차피 결과를 못 보고 Vercel에 강제 종료돼 사용자가 빈
    // 504만 보게 될 확률이 높은 시도라면, 차라리 기존 502
    // generation_failed 응답을 바로 주는 편이 낫다(generation-cache.ts의
    // hasSufficientTimeBudgetForGeneration 참고 — 마커 대기를 거쳤어도
    // requestStartedAt 기준 남은 시간만 보므로 이 판단은 자동으로 맞다).
    if (!hasSufficientTimeBudgetForGeneration(requestStartedAt)) {
      logTiming("insufficient_time_budget");
      return NextResponse.json(
        { blocked: true, reason: "generation_failed", message: "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
        { status: 502 },
      );
    }

    const ip = getClientIp(request);
    // 이상형·나 소개·친구·일할 때의 나·진로와 같은 레이트리밋 예산을
    // 공유한다(엔드포인트만 분리, 안전장치는 그대로 재사용 —
    // engine/rate-limit.ts는 건드리지 않는다).
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
      logTiming(blockedReason);
      return NextResponse.json(
        { blocked: true, reason: blockedReason, message } satisfies BlockedResponse,
        { status: 429 },
      );
    }

    const { result, countsAsFailure } = await generateTasteResult(session);
    if (!result) {
      await releaseGenerationSlotOnFailure(ip, session.startedAt, countsAsFailure);
      logTiming("generation_failed");
      return NextResponse.json(
        { blocked: true, reason: "generation_failed", message: "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
        { status: 502 },
      );
    }

    await setCachedGeneration(cacheKey, result);

    logTiming("success");
    return NextResponse.json({ result, signature: signResult(SIGNATURE_SCOPE, result) } satisfies SuccessResponse);
  } finally {
    // acquiredMarker가 false면(마커를 못 얻어 대기하다 시간 초과로 여기
    // 들어온 경우) 이 요청은 마커를 가진 적이 없으므로 아무것도 지우지
    // 않는다 — 실제 소유자의 마커를 실수로 지우지 않기 위함이다.
    if (acquiredMarker) {
      await releaseGenerationMarker(cacheKey);
    }
  }
}

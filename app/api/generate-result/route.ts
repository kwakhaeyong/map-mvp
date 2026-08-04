import { NextRequest, NextResponse } from "next/server";
import { generateFinalResult, generateResultBlock } from "../../../src/map-decision-v1/engine/final-result-generator";
import { isReadyForResult } from "../../../src/map-decision-v1/engine/readiness";
import {
  MAX_INPUT_LENGTH,
  MAX_MESSAGES_PER_SESSION,
  getClientIp,
  isTrustedRequestOrigin,
  releaseGenerationSlotOnFailure,
  reserveGenerationSlot,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { careerBlockScope, signResult } from "../../../src/map-decision-v1/engine/result-signature";
import { FinalResult, MapSession, RESULT_BLOCK_KEYS, ResultBlockKey } from "../../../src/map-decision-v1/types";

type RequestBody = { session: MapSession; block?: ResultBlockKey };
type SuccessResponse = { result: FinalResult; blockSignatures: Partial<Record<ResultBlockKey, string | null>> };
type BlockSuccessResponse = { block: ResultBlockKey; value: unknown; signature: string | null };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isResultBlockKey(value: unknown): value is ResultBlockKey {
  return typeof value === "string" && (RESULT_BLOCK_KEYS as string[]).includes(value);
}

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  if (typeof candidate.session !== "object" || candidate.session === null) return false;
  return candidate.block === undefined || isResultBlockKey(candidate.block);
}

function isOversized(session: MapSession): boolean {
  if (!Array.isArray(session.messages)) return true;
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) return true;
  return session.messages.some((message) => typeof message.text !== "string" || message.text.length > MAX_INPUT_LENGTH);
}

export async function POST(request: NextRequest) {
  // curl 한 줄로 직접 때리는 기회주의적 남용을 막는다 — 위조는 가능하지만
  // 헤더 자체를 안 붙이는 가장 흔한 경우는 걸러진다.
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
  const { session, block } = body;

  if (isOversized(session)) {
    return NextResponse.json(
      { blocked: true, reason: "payload_too_large", message: "대화 내용이 처리할 수 있는 범위를 넘어섰어요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  if (!isReadyForResult(session)) {
    return NextResponse.json(
      { blocked: true, reason: "too_few_turns", message: "조금 더 이야기해주시면 결과가 더 정확해요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  // 세션/IP-하루/전체-하루 세 한도를 Redis 원자적 연산으로 먼저 "예약"한다
  // (reserveGenerationSlot 주석 참고) — 예약에 성공한 뒤 생성이 실패하면
  // releaseGenerationSlotOnFailure로 세션/IP 몫만 되돌린다.
  const reservation = await reserveGenerationSlot(ip, session.startedAt);
  if (!reservation.allowed) {
    const message =
      reservation.reason === "session_limit"
        ? "이 대화에서 결과를 만들 수 있는 횟수를 모두 사용했어요. 새 MAP을 시작해 주세요."
        : reservation.reason === "ip_daily_limit"
          ? "오늘 만들 수 있는 결과 수를 모두 사용했어요. 내일 다시 시도해 주세요."
          : reservation.reason === "global_daily_limit"
            ? "지금 이용자가 많아요. 잠시 후 다시 시도해 주세요."
            : reservation.reason === "unavailable"
              ? "지금은 결과를 만들 수 없어요. 잠시 후 다시 시도해 주세요."
              : "답변은 그대로 저장돼 있어요. 지금은 결과를 만들지 못했어요 — 잠시 후 다시 시도해 주세요.";
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

  if (block) {
    const { value, countsAsFailure } = await generateResultBlock(session, block);
    if (!value) {
      await releaseGenerationSlotOnFailure(ip, session.startedAt, countsAsFailure);
      return NextResponse.json(
        { blocked: true, reason: "generation_failed", message: "이 부분을 다시 만들지 못했어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
        { status: 502 },
      );
    }
    return NextResponse.json({ block, value, signature: signResult(careerBlockScope(block), value) } satisfies BlockSuccessResponse);
  }

  const { result, countsAsFailure } = await generateFinalResult(session);
  if (!result) {
    await releaseGenerationSlotOnFailure(ip, session.startedAt, countsAsFailure);
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 결과를 생성할 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  const blockSignatures: Partial<Record<ResultBlockKey, string | null>> = {};
  for (const key of RESULT_BLOCK_KEYS) {
    blockSignatures[key] = signResult(careerBlockScope(key), result[key]);
  }

  return NextResponse.json({ result, blockSignatures } satisfies SuccessResponse);
}

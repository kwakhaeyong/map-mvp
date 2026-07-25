import { NextRequest, NextResponse } from "next/server";
import { generateIdealTypeResult } from "../../../src/map-decision-v1/engine/ideal-type-generator";
import {
  MAX_INPUT_LENGTH,
  MAX_MESSAGES_PER_SESSION,
  getClientIp,
  registerGenerationAttempt,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { IdealTypeResult, MapSession } from "../../../src/map-decision-v1/types";

type RequestBody = { session: MapSession };
type SuccessResponse = { result: IdealTypeResult };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.session === "object" && candidate.session !== null;
}

function isOversized(session: MapSession): boolean {
  if (!Array.isArray(session.messages)) return true;
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) return true;
  return session.messages.some((message) => typeof message.text !== "string" || message.text.length > MAX_INPUT_LENGTH);
}

export async function POST(request: NextRequest) {
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

  const ip = getClientIp(request);
  // 진로의 generate-result와 같은 레이트리밋 예산을 공유한다(엔드포인트만
  // 분리, 안전장치는 그대로 재사용).
  const { allowed, reason } = registerGenerationAttempt(ip, session.startedAt);
  if (!allowed) {
    const message =
      reason === "session_limit"
        ? "이 카드에서 만들 수 있는 횟수를 모두 사용했어요. 새로 시작해 주세요."
        : "오늘 만들 수 있는 카드 수를 모두 사용했어요. 내일 다시 시도해 주세요.";
    return NextResponse.json(
      { blocked: true, reason: reason === "session_limit" ? "session_generation_limit" : "daily_generation_limit", message } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  const result = await generateIdealTypeResult(session);
  if (!result) {
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  return NextResponse.json({ result } satisfies SuccessResponse);
}

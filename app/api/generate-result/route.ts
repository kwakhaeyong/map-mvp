import { NextRequest, NextResponse } from "next/server";
import { generateFinalResult, generateResultBlock } from "../../../src/map-decision-v1/engine/final-result-generator";
import {
  MAX_INPUT_LENGTH,
  MAX_MESSAGES_PER_SESSION,
  getClientIp,
  registerGenerationAttempt,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { FinalResult, MapSession, ResultBlockKey } from "../../../src/map-decision-v1/types";

const MIN_USER_TURNS = 3;
const RESULT_BLOCK_KEYS: ResultBlockKey[] = ["factorMatrix", "scenarios", "timeline", "insights"];

type RequestBody = { session: MapSession; block?: ResultBlockKey };
type SuccessResponse = { result: FinalResult };
type BlockSuccessResponse = { block: ResultBlockKey; value: unknown };
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

  const userTurns = session.messages.filter((message) => message.role === "user").length;
  if (userTurns < MIN_USER_TURNS) {
    return NextResponse.json(
      { blocked: true, reason: "too_few_turns", message: "조금 더 이야기해주시면 결과가 더 정확해요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const { allowed, reason } = registerGenerationAttempt(ip, session.startedAt);
  if (!allowed) {
    const message =
      reason === "session_limit"
        ? "이 대화에서 결과를 만들 수 있는 횟수를 모두 사용했어요. 새 MAP을 시작해 주세요."
        : "오늘 만들 수 있는 결과 수를 모두 사용했어요. 내일 다시 시도해 주세요.";
    return NextResponse.json(
      { blocked: true, reason: reason === "session_limit" ? "session_generation_limit" : "daily_generation_limit", message } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  if (block) {
    const value = await generateResultBlock(session, block);
    if (!value) {
      return NextResponse.json(
        { blocked: true, reason: "generation_failed", message: "이 부분을 다시 만들지 못했어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
        { status: 502 },
      );
    }
    return NextResponse.json({ block, value } satisfies BlockSuccessResponse);
  }

  const result = await generateFinalResult(session);
  if (!result) {
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 결과를 생성할 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  return NextResponse.json({ result } satisfies SuccessResponse);
}

import { NextRequest, NextResponse } from "next/server";
import { generateIdealTypeResult } from "../../../src/map-decision-v1/engine/ideal-type-generator";
import {
  MAX_INPUT_LENGTH,
  checkGenerationAllowed,
  commitGenerationFailure,
  commitGenerationSuccess,
  getClientIp,
} from "../../../src/map-decision-v1/engine/rate-limit";
import { resolveTopic } from "../../../src/map-decision-v1/engine/topics";
import { IdealTypeResult, MapSession } from "../../../src/map-decision-v1/types";

type RequestBody = { session: MapSession };
type SuccessResponse = { result: IdealTypeResult };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.session === "object" && candidate.session !== null;
}

// rate-limit.ts의 MAX_MESSAGES_PER_SESSION(40)은 진로(career) 같은 자유
// 대화의 남용 방지용 상한이다 — 사용자가 얼마나 오래 채팅을 이어갈지
// 예측할 수 없으니 안전핀으로 40을 걸어둔 것. 그런데 이상형 퀴즈는 자유
// 대화가 아니라 우리가 만든 고정 문항 배열(topics.ts)을 그대로 밟는
// 구조라 메시지 개수가 사용자 입력이 아니라 문항 수로 이미 정해져
// 있다(문항마다 질문+답변 2개 + 마무리 질문 2개). 필수 문항이 12→30개로
// 늘면서 정상적으로 다 답한 사용자의 메시지도 60개를 넘게 됐는데, 자유
// 대화용 상한(40)을 그대로 재사용하고 있어서 정상 완주한 사용자가
// "답변 내용이 처리할 수 있는 범위를 넘어섰어요"로 결과를 아예 못 받는
// 사고가 났다. 숫자를 그냥 올리는 대신, 이 주제의 실제 axes 배열
// 길이에서 상한을 계산한다 — 문항 수가 다시 바뀌어도 이 상한이 자동으로
// 따라가서 같은 사고가 재발하지 않는다.
function maxIdealTypeMessages(): number {
  const axisCount = (resolveTopic("idealType").axes ?? []).length;
  // 문항당 질문+답변 2개가 정상 경로의 최소치다. 그런데 "이전" 버튼으로
  // 답을 바꿔도 이미 쌓인 메시지는 지워지지 않고 그대로 남는다
  // (TopicQuiz.tsx의 goBack은 quizStep만 되돌리고 messages는 그대로
  // 둔다) — 그래서 실제 메시지 수는 정상 경로보다 얼마든지 늘어날 수
  // 있다. 문항마다 한 번씩 되돌아가 다시 답해도(2배) 넉넉히 통과하도록
  // 여유를 두고, 마무리 질문 몫으로 10을 더한다.
  return axisCount * 2 * 2 + 10;
}

function isOversized(session: MapSession): boolean {
  if (!Array.isArray(session.messages)) return true;
  if (session.messages.length > maxIdealTypeMessages()) return true;
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
  //
  // 한도는 호출 "전"에 확인만 하고, 실제 차감(commitGenerationSuccess)은
  // 생성이 성공한 뒤에만 한다 — 생성이 실패했는데 사용자 몫이 깎이면
  // 안 되기 때문이다. 대신 실패에는 별도의 낮은 상한(failure_limit)이
  // 있어서, 항상 실패하는 입력으로 무제한 재시도하는 걸 막는다.
  const { allowed, reason } = checkGenerationAllowed(ip, session.startedAt);
  if (!allowed) {
    const message =
      reason === "session_limit"
        ? "이 카드에서 만들 수 있는 횟수를 모두 사용했어요. 새로 시작해 주세요."
        : reason === "daily_limit"
          ? "오늘 만들 수 있는 카드 수를 모두 사용했어요. 내일 다시 시도해 주세요."
          : "이 카드는 반복해서 만들지 못했어요. 잠시 후 다시 시도하거나 새로 시작해 주세요.";
    const blockedReason = reason === "session_limit" ? "session_generation_limit" : reason === "daily_limit" ? "daily_generation_limit" : "generation_failure_limit";
    return NextResponse.json(
      { blocked: true, reason: blockedReason, message } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  const result = await generateIdealTypeResult(session);
  if (!result) {
    commitGenerationFailure(session.startedAt);
    return NextResponse.json(
      { blocked: true, reason: "generation_failed", message: "지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 502 },
    );
  }

  commitGenerationSuccess(ip, session.startedAt);
  return NextResponse.json({ result } satisfies SuccessResponse);
}

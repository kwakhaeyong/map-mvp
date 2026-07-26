import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "../../../src/map-decision-v1/engine/rate-limit";
import { createShareId, isShareStoreConfigured, registerShareAttempt, saveShare } from "../../../src/map-decision-v1/engine/share-store";
import { validateSharePayload } from "../../../src/map-decision-v1/engine/share-validation";
import { resolveTopic } from "../../../src/map-decision-v1/engine/topics";

// resultLayoutId는 클라이언트가 보낸 값을 믿지 않고 topics.ts에서 직접
// 찾는다 — topicId는 브라우저가 보낸 값이라 조작될 수 있지만,
// resolveTopic()은 등록된 주제가 아니면 항상 기본 주제로 떨어지므로
// (topics.ts의 resolveTopic 참고) 여기서 추가 검증을 만들 필요가 없다.
type RequestBody = { topicId: string; result: unknown; quizDepth?: unknown };
type SuccessResponse = { id: string; url: string };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.topicId === "string" && "result" in candidate;
}

// 화면에 배지를 보여줄지만 결정하는 값이라 엄격한 검증까진 필요 없지만,
// 값이 이상하면 그냥 undefined(배지 없음)로 떨어지게 한다.
function normalizeQuizDepth(value: unknown): "quick" | "deep" | undefined {
  return value === "quick" || value === "deep" ? value : undefined;
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRequestBody(body)) {
    return NextResponse.json(
      { blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const validation = validateSharePayload(body.topicId, body.result);
  if (!validation.ok) {
    return NextResponse.json(
      { blocked: true, reason: validation.reason, message: "이 결과는 공유할 수 없는 형식이에요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  if (!isShareStoreConfigured()) {
    return NextResponse.json(
      { blocked: true, reason: "sharing_unavailable", message: "지금은 공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const attempt = await registerShareAttempt(ip);
  if (!attempt.allowed) {
    if (attempt.reason === "unavailable") {
      return NextResponse.json(
        { blocked: true, reason: "sharing_unavailable", message: "지금 공유 기능에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요." } satisfies BlockedResponse,
        { status: 503 },
      );
    }
    return NextResponse.json(
      { blocked: true, reason: "daily_share_limit", message: "오늘 만들 수 있는 공유 링크 수를 모두 사용했어요. 내일 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  const id = createShareId();
  const saved = await saveShare({
    id,
    topicId: body.topicId,
    resultLayoutId: resolveTopic(body.topicId).resultLayoutId,
    createdAt: new Date().toISOString(),
    result: body.result,
    quizDepth: normalizeQuizDepth(body.quizDepth),
  });

  if (!saved) {
    return NextResponse.json(
      { blocked: true, reason: "sharing_unavailable", message: "지금은 공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 503 },
    );
  }

  return NextResponse.json({ id, url: `/r/${id}` } satisfies SuccessResponse);
}

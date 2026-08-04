import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "../../../src/map-decision-v1/engine/rate-limit";
import { careerBlockScope, verifyResultSignature } from "../../../src/map-decision-v1/engine/result-signature";
import { createShareId, isShareStoreConfigured, registerShareAttempt, saveShare } from "../../../src/map-decision-v1/engine/share-store";
import { validateSharePayload } from "../../../src/map-decision-v1/engine/share-validation";
import { resolveTopic } from "../../../src/map-decision-v1/engine/topics";
import { RESULT_BLOCK_KEYS } from "../../../src/map-decision-v1/types";

// resultLayoutId는 클라이언트가 보낸 값을 믿지 않고 topics.ts에서 직접
// 찾는다 — topicId는 브라우저가 보낸 값이라 조작될 수 있지만,
// resolveTopic()은 등록된 주제가 아니면 항상 기본 주제로 떨어지므로
// (topics.ts의 resolveTopic 참고) 여기서 추가 검증을 만들 필요가 없다.
type RequestBody = { topicId: string; result: unknown; quizDepth?: unknown; signature?: unknown; blockSignatures?: unknown };
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

// "이 서버가 실제로 만든 결과인가"를 확인한다(engine/result-signature.ts) —
// share-validation.ts의 형태 검증은 그대로 유지하고, 이건 그 위에 얹는
// 출처 검증이다. 이상형·나소개는 결과 전체에 대한 서명 하나, 진로는
// 블록(factorMatrix/scenarios/timeline/insights)마다 독립된 서명이다 —
// 블록별로 재생성할 수 있어서(app/api/generate-result/route.ts) 블록
// 하나만 새로 만들어도 그 블록의 서명만 갱신하면 되게 했다.
function isResultSignatureValid(topicId: string, result: unknown, signature: unknown, blockSignatures: unknown): boolean {
  if (topicId === "career") {
    const record = result as Record<string, unknown>;
    const signatures = (blockSignatures ?? {}) as Record<string, unknown>;
    return RESULT_BLOCK_KEYS.every((key) => verifyResultSignature(careerBlockScope(key), record[key], signatures[key]));
  }
  // idealType/selfIntro: topicId 문자열 자체가 생성 라우트가 서명할 때
  // 쓴 scope와 정확히 같다(둘 다 "idealType"/"selfIntro" 리터럴).
  return verifyResultSignature(topicId, result, signature);
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

  // 형태는 맞아도 이 서버가 실제로 만든 결과라는 증거(서명)가 없거나
  // 일치하지 않으면 저장하지 않는다. share-validation.ts와 같은 실패
  // 문구를 그대로 쓴다 — 사용자 입장에서는 "이 결과는 공유할 수 없는
  // 형식"이라는 점에서 형태 검증 실패와 다르지 않다.
  if (!isResultSignatureValid(body.topicId, body.result, body.signature, body.blockSignatures)) {
    console.error(`[share] signature verification failed for topic=${body.topicId}`);
    return NextResponse.json(
      { blocked: true, reason: "invalid_shape", message: "이 결과는 공유할 수 없는 형식이에요." } satisfies BlockedResponse,
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
    // 생성 쪽 global_daily_limit("지금 이용자가 많아요...")과 같은 톤 —
    // 개인의 잘못이 아니라 서비스 전체가 붐빈다는 뉘앙스를 전달한다.
    if (attempt.reason === "global_daily_limit") {
      return NextResponse.json(
        { blocked: true, reason: "global_share_limit", message: "지금 이용자가 많아요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
        { status: 429 },
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

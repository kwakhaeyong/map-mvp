import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "../../../src/map-decision-v1/engine/rate-limit";
import { createShareId, isShareStoreConfigured, registerShareAttempt, saveShare } from "../../../src/map-decision-v1/engine/share-store";
import { validateSharePayload } from "../../../src/map-decision-v1/engine/share-validation";

// resultLayoutId는 지금 topicId와 1:1이라 그대로 topicId를 쓴다 — 진로 등
// 다른 주제를 지원할 때 topics.ts의 resultLayoutId를 그대로 넘겨받는
// 형태로 확장하면 된다. 지금은 이상형만 지원.
type RequestBody = { topicId: string; result: unknown };
type SuccessResponse = { id: string; url: string };
type BlockedResponse = { blocked: true; reason: string; message: string };

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.topicId === "string" && "result" in candidate;
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
  const { allowed } = await registerShareAttempt(ip);
  if (!allowed) {
    return NextResponse.json(
      { blocked: true, reason: "daily_share_limit", message: "오늘 만들 수 있는 공유 링크 수를 모두 사용했어요. 내일 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 429 },
    );
  }

  const id = createShareId();
  const saved = await saveShare({
    id,
    topicId: body.topicId,
    resultLayoutId: body.topicId,
    createdAt: new Date().toISOString(),
    result: body.result,
  });

  if (!saved) {
    return NextResponse.json(
      { blocked: true, reason: "sharing_unavailable", message: "지금은 공유 링크를 만들 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies BlockedResponse,
      { status: 503 },
    );
  }

  return NextResponse.json({ id, url: `/r/${id}` } satisfies SuccessResponse);
}

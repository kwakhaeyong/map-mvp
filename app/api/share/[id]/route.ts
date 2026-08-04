import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "../../../../src/map-decision-v1/engine/rate-limit";
import { deleteShare, getShare, registerShareDeleteAttempt } from "../../../../src/map-decision-v1/engine/share-store";
import { IdealTypeResult } from "../../../../src/map-decision-v1/types";

// 궁합 배너(CompatibilityBanner)가 친구(A)의 타이틀만 물어보는 용도.
// A의 결과 화면(/r/{id})을 열면 누구나 이미 타이틀을 볼 수 있으므로
// (card.png·본문 전부에 노출) 여기서 타이틀만 따로 내려줘도 새로운
// 정보 유출이 아니다 — 그래서 태그·자기성찰 등 다른 필드는 넣지 않고
// title 하나만 최소로 응답한다.
function isIdealTypeResult(value: unknown): value is IdealTypeResult {
  const r = value as Partial<IdealTypeResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  if (share.status !== "ok" || share.record.resultLayoutId !== "idealType" || !isIdealTypeResult(share.record.result)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ title: share.record.result.title });
}

type DeleteBlockedResponse = { blocked: true; reason: string; message: string };
type DeleteSuccessResponse = { deleted: true };

// 공유 링크를 아는 사람이 곧 그 데이터의 주인이라는 전제로, 별도 인증
// 없이 ID만으로 삭제한다(로그인이 없어 본인 확인 수단이 링크 소유뿐).
// 존재하지 않거나 이미 삭제된 ID에도 항상 같은 성공 응답을 돌려준다 —
// deleteShare()가 키 존재 여부와 무관하게 true를 돌려주므로, 존재
// 여부가 이 응답으로 새어나가지 않는다(레이트리밋에 걸린 경우만 다른
// 응답이 나가는데, 이건 시도한 사람의 IP 기준이지 ID의 존재 여부와는
// 무관하다).
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ip = getClientIp(request);
  const attempt = await registerShareDeleteAttempt(ip);
  if (!attempt.allowed) {
    if (attempt.reason === "unavailable") {
      return NextResponse.json(
        { blocked: true, reason: "sharing_unavailable", message: "지금 삭제 기능에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요." } satisfies DeleteBlockedResponse,
        { status: 503 },
      );
    }
    // 생성/공유 쪽 global_daily_limit과 같은 톤 — 개인 잘못이 아니라
    // 서비스 전체가 붐빈다는 뉘앙스를 전달한다.
    if (attempt.reason === "global_daily_limit") {
      return NextResponse.json(
        { blocked: true, reason: "global_share_delete_limit", message: "지금 이용자가 많아요. 잠시 후 다시 시도해 주세요." } satisfies DeleteBlockedResponse,
        { status: 429 },
      );
    }
    return NextResponse.json(
      { blocked: true, reason: "daily_share_delete_limit", message: "오늘 삭제를 너무 많이 시도했어요. 내일 다시 시도해 주세요." } satisfies DeleteBlockedResponse,
      { status: 429 },
    );
  }

  const deleted = await deleteShare(id);
  if (!deleted) {
    return NextResponse.json(
      { blocked: true, reason: "sharing_unavailable", message: "지금은 삭제할 수 없어요. 잠시 후 다시 시도해 주세요." } satisfies DeleteBlockedResponse,
      { status: 503 },
    );
  }

  return NextResponse.json({ deleted: true } satisfies DeleteSuccessResponse);
}

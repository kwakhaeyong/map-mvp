import { NextResponse } from "next/server";
import { getShare } from "../../../../src/map-decision-v1/engine/share-store";
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

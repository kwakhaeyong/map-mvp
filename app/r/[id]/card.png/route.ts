import { ImageResponse } from "next/og";
import { getShare } from "../../../../src/map-decision-v1/engine/share-store";
import { IdealTypeResult } from "../../../../src/map-decision-v1/types";
import { buildIdealTypeCardElement, CARD_HEIGHT, CARD_WIDTH, loadCardFonts, ReflectionSide } from "../../../../src/map-decision-v1/engine/ideal-type-card-image";

// 인스타 등에 저장해서 올릴 수 있는 "한 장 MAP" PNG. 어떤 metadata나
// opengraph-image 규칙에도 연결하지 않은 독립 라우트다(그러면 카톡/
// 인스타 링크 미리보기에 자동으로 끼어들어 "동적 OG"가 되어버린다) —
// 이 URL은 오직 사용자가 직접 저장 버튼을 눌렀을 때만 호출된다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isIdealTypeResult(value: unknown): value is IdealTypeResult {
  const r = value as Partial<IdealTypeResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.selfReflection === "object";
}

function isReflectionSide(value: string | null): value is ReflectionSide {
  return value === "offer" || value === "improve";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  if (share.status !== "ok" || share.record.resultLayoutId !== "idealType" || !isIdealTypeResult(share.record.result)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const sideParam = url.searchParams.get("reflection");
  const side: ReflectionSide = isReflectionSide(sideParam) ? sideParam : "offer";

  return new ImageResponse(buildIdealTypeCardElement(share.record.result, side), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadCardFonts(),
  });
}

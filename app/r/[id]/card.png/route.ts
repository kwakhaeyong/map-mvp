import { ImageResponse } from "next/og";
import { getShare } from "../../../../src/map-decision-v1/engine/share-store";
import { IdealTypeResult } from "../../../../src/map-decision-v1/types";
import { buildIdealTypeCardElement, CardTheme, CARD_HEIGHT, CARD_WIDTH, loadCardFonts } from "../../../../src/map-decision-v1/engine/ideal-type-card-image";

// 인스타 스토리에 올릴 수 있는 "한 장 MAP" PNG. 어떤 metadata나
// opengraph-image 규칙에도 연결하지 않은 독립 라우트다(그러면 카톡/
// 인스타 링크 미리보기에 자동으로 끼어들어 "동적 OG"가 되어버린다) —
// 이 URL은 오직 사용자가 직접 저장 버튼을 눌렀을 때만 호출된다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isIdealTypeResult(value: unknown): value is IdealTypeResult {
  const r = value as Partial<IdealTypeResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.selfReflection === "object";
}

function isCardTheme(value: string | null): value is CardTheme {
  return value === "purple" || value === "navy" || value === "colorBlock";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  if (share.status !== "ok" || share.record.resultLayoutId !== "idealType" || !isIdealTypeResult(share.record.result)) {
    return new Response("Not found", { status: 404 });
  }

  // 최종 테마는 아직 오너 승인 전이라 쿼리 파라미터로 3안을 전부 볼 수
  // 있게 해뒀다. 승인되면 이 기본값을 확정하고 파라미터 분기는 정리한다.
  const url = new URL(request.url);
  const themeParam = url.searchParams.get("theme");
  const theme: CardTheme = isCardTheme(themeParam) ? themeParam : "navy";

  // 같은 id+테마의 결과물은 항상 같다(공유된 결과는 수정할 수 없다) —
  // 그래서 캐시를 길게 걸어도 안전하다. 유효한 공유 id 없이는 satori/
  // resvg 렌더링까지 가지 않고 위에서 이미 404로 끝나지만, 실제 id를
  // 아는 사람이 이 주소를 반복 요청하면 그때마다 서버가 다시 그리는
  // 부담이 있었다 — CDN·브라우저가 캐시해두면 그 반복 요청이 렌더링까지
  // 가지 않는다.
  return new ImageResponse(buildIdealTypeCardElement(share.record.result, theme), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadCardFonts(),
    headers: { "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable" },
  });
}

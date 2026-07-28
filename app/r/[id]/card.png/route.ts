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

  // ★캐시 기간을 길게 주지 않는다. 공유 데이터는 제3자 정보 신고 등으로
  // 관리자가 Redis에서 직접 지워야 하는 경우가 있는데(개인정보 상담
  // 항목에도 명시된 사안), 삭제와 "캐시 비우기"를 자동으로 연결하는
  // 코드가 없다(수동으로 Vercel 캐시를 지워야 하는데, 급한 신고 대응
  // 상황에서 빠뜨리기 쉽다). 게다가 브라우저 캐시는 원격으로 지울
  // 방법이 아예 없다 — 통제 가능한 유일한 변수는 "처음에 얼마나 긴
  // 캐시 기간을 나눠주느냐"뿐이라, immutable 없이 짧은 max-age만
  // 준다. 그래도 같은 사람이 짧은 시간 안에 반복 요청하는 경우(카톡/
  // 인스타 인앱 브라우저의 중복 로드 등)에는 여전히 도움이 된다.
  return new ImageResponse(buildIdealTypeCardElement(share.record.result, theme), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadCardFonts(),
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}

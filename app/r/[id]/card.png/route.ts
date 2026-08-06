import { ImageResponse } from "next/og";
import { getShare } from "../../../../src/map-decision-v1/engine/share-store";
import { FriendshipResult, IdealTypeResult, SelfIntroResult, WorkResult } from "../../../../src/map-decision-v1/types";
import {
  buildIdealTypeCardElement,
  CardTheme,
  getCardDimensions,
  INVITATION_CARD_HEIGHT,
  INVITATION_CARD_WIDTH,
  loadCardFonts,
  loadInvitationFonts,
  optimizeCardPng,
} from "../../../../src/map-decision-v1/engine/ideal-type-card-image";
import { buildSelfIntroCardElement } from "../../../../src/map-decision-v1/engine/self-intro-card-image";
import { buildFriendshipCardElement } from "../../../../src/map-decision-v1/engine/friendship-card-image";
import { buildWorkCardElement } from "../../../../src/map-decision-v1/engine/work-card-image";

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

function isSelfIntroResult(value: unknown): value is SelfIntroResult {
  const r = value as Partial<SelfIntroResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.coreValues === "object";
}

function isFriendshipResult(value: unknown): value is FriendshipResult {
  const r = value as Partial<FriendshipResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.friendCriteria === "object";
}

function isWorkResult(value: unknown): value is WorkResult {
  const r = value as Partial<WorkResult> | undefined;
  return typeof r === "object" && r !== null && typeof r.title === "string" && typeof r.oneLiner === "string" && typeof r.workDrivers === "object";
}

function isCardTheme(value: string | null): value is CardTheme {
  return value === "purple" || value === "navy" || value === "colorBlock" || value === "invitation";
}

// ★캐시 기간을 길게 주지 않는다 — 공유 데이터는 제3자 정보 신고 등으로
// 관리자가 Redis에서 직접 지워야 하는 경우가 있는데(개인정보 상담
// 항목에도 명시된 사안), 삭제와 "캐시 비우기"를 자동으로 연결하는
// 코드가 없다(수동으로 Vercel 캐시를 지워야 하는데, 급한 신고 대응
// 상황에서 빠뜨리기 쉽다). 게다가 브라우저 캐시는 원격으로 지울
// 방법이 아예 없다 — 통제 가능한 유일한 변수는 "처음에 얼마나 긴
// 캐시 기간을 나눠주느냐"뿐이라, immutable 없이 짧은 max-age만
// 준다. 그래도 같은 사람이 짧은 시간 안에 반복 요청하는 경우(카톡/
// 인스타 인앱 브라우저의 중복 로드 등)에는 여전히 도움이 된다.
const IMAGE_CACHE_HEADERS = { "Content-Type": "image/png", "Cache-Control": "public, max-age=60, s-maxage=60" };

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const share = await getShare(id);
  if (share.status !== "ok") {
    return new Response("Not found", { status: 404 });
  }

  // 나 소개·성격, 친구·인간관계, 일할 때의 나는 초대장 컨셉 하나만
  // 지원한다(테마 파라미터 없음) — 이상형처럼 여러 테마를 지원할
  // 필요가 없었다.
  if (share.record.resultLayoutId === "selfIntro") {
    if (!isSelfIntroResult(share.record.result)) return new Response("Not found", { status: 404 });
    const response = new ImageResponse(buildSelfIntroCardElement(share.record.result), {
      width: INVITATION_CARD_WIDTH,
      height: INVITATION_CARD_HEIGHT,
      fonts: loadInvitationFonts(),
    });
    const optimized = await optimizeCardPng(Buffer.from(await response.arrayBuffer()));
    return new Response(optimized, { headers: IMAGE_CACHE_HEADERS });
  }

  if (share.record.resultLayoutId === "friendship") {
    if (!isFriendshipResult(share.record.result)) return new Response("Not found", { status: 404 });
    const response = new ImageResponse(buildFriendshipCardElement(share.record.result), {
      width: INVITATION_CARD_WIDTH,
      height: INVITATION_CARD_HEIGHT,
      fonts: loadInvitationFonts(),
    });
    const optimized = await optimizeCardPng(Buffer.from(await response.arrayBuffer()));
    return new Response(optimized, { headers: IMAGE_CACHE_HEADERS });
  }

  if (share.record.resultLayoutId === "work") {
    if (!isWorkResult(share.record.result)) return new Response("Not found", { status: 404 });
    const response = new ImageResponse(buildWorkCardElement(share.record.result), {
      width: INVITATION_CARD_WIDTH,
      height: INVITATION_CARD_HEIGHT,
      fonts: loadInvitationFonts(),
    });
    const optimized = await optimizeCardPng(Buffer.from(await response.arrayBuffer()));
    return new Response(optimized, { headers: IMAGE_CACHE_HEADERS });
  }

  if (share.record.resultLayoutId !== "idealType" || !isIdealTypeResult(share.record.result)) {
    return new Response("Not found", { status: 404 });
  }

  // 초대장 컨셉(invitation)이 기본 테마다. 예전 테마(purple/navy/
  // colorBlock)는 ?theme=으로 여전히 볼 수 있게 남겨뒀다.
  const url = new URL(request.url);
  const themeParam = url.searchParams.get("theme");
  const theme: CardTheme = isCardTheme(themeParam) ? themeParam : "invitation";

  const { width, height } = getCardDimensions(theme);
  const response = new ImageResponse(buildIdealTypeCardElement(share.record.result, theme), {
    width,
    height,
    fonts: theme === "invitation" ? loadInvitationFonts() : loadCardFonts(),
  });
  const optimized = await optimizeCardPng(Buffer.from(await response.arrayBuffer()));
  return new Response(optimized, { headers: IMAGE_CACHE_HEADERS });
}

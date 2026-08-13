import type { Metadata } from "next";
import { PersonalMagazineBetaClient } from "../dev/personal-magazine-beta/PersonalMagazineBetaClient";

// PERSONAL MAGAZINE PRIVATE BETA — PUBLIC ROUTE(2026-08, Round 6 RC).
// /dev/personal-magazine-beta는 개발 검증용(VERCEL_ENV==="production"에서
// notFound)이라 실제 지인 테스트에는 못 쓴다. 이 라우트는 그 반대 —
// "주소를 아는 사람만 접근하는" Private Beta 링크라서 프로덕션에서도
// 의도적으로 막지 않는다(§4). 다만 검색엔진 색인·메인 navigation
// 노출은 원치 않으므로 noindex/nofollow만 건다(app/r/[id]/page.tsx의
// 기존 관례와 동일한 방식).
//
// 화면 자체는 새로 만들지 않는다 — dev route와 완전히 같은
// PersonalMagazineBetaClient를 그대로 재사용해, 개발 검증 화면과 실제
// Private Beta 사용자가 보는 화면이 항상 같은 코드로 동작하게 한다(§5).
export const dynamic = "force-dynamic";

// SHARE OG FINAL FIX(2026-08) — route-level metadata는 root layout.tsx의
// title/description/openGraph/twitter를 완전히 덮어쓴다(Next.js
// metadata는 필드 단위로 병합되고, 하위 route가 top-level 필드를 채우면
// 그 필드는 상속되지 않는다). 그전까지 이 페이지가 title/openGraph를
// 지정하지 않아 root(MAP Decision)의 metadata를 그대로 물려받았고,
// 그게 카카오톡 등에서 /magazine 공유 시 기존 MAP 카드가 뜨던 원인이다.
// robots만 기존과 동일하게 유지한다 — 색인 정책은 이번 수정과 무관하다.
//
// 이미지는 새로 생성하지 않고 기존 taste-hero.png(실제 TASTE 챕터
// 오프닝에 쓰이는 asset)의 텍스트 없는 순수 사진 영역만 크롭해
// 재사용했다(public/magazine/og/personal-magazine-og-v1.png). 파일명에
// v1을 붙인 이유는 §7 카카오톡 캐시 회피 — 나중에 이미지를 바꿀 때도
// 기존 MAP OG 파일(og-share.png)처럼 같은 경로를 덮어쓰지 않고 v2 파일을
// 새로 만든다.
const MAGAZINE_OG_IMAGE = { url: "/magazine/og/personal-magazine-og-v1.png", width: 1200, height: 630 };
const MAGAZINE_TITLE = "PERSONAL MAGAZINE | 나를 한 권으로 만든다.";
// og:description/twitter:description은 원본 개행을 그대로 두면 일부
// 파서가 HTML 속성 안 개행 문자를 그대로 노출할 위험이 있어(카카오톡
// 등에서 "\n"처럼 보이거나 줄이 깨질 수 있음), 공백 하나로 이어
// 한 줄로 만든다 — 문구 자체는 바뀌지 않는다.
const MAGAZINE_DESCRIPTION = "몇 가지 선택을 따라가면 나의 취향과 장면이 한 권의 Magazine으로 편집됩니다.";

export const metadata: Metadata = {
  title: MAGAZINE_TITLE,
  description: MAGAZINE_DESCRIPTION,
  alternates: { canonical: "https://mapdecision.com/magazine" },
  openGraph: {
    type: "website",
    title: MAGAZINE_TITLE,
    description: MAGAZINE_DESCRIPTION,
    url: "https://mapdecision.com/magazine",
    siteName: "PERSONAL MAGAZINE",
    locale: "ko_KR",
    images: [MAGAZINE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: MAGAZINE_TITLE,
    description: MAGAZINE_DESCRIPTION,
    images: [MAGAZINE_OG_IMAGE.url],
  },
  robots: { index: false, follow: false },
};

export default function PersonalMagazinePage() {
  return <PersonalMagazineBetaClient />;
}

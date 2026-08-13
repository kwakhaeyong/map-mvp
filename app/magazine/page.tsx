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

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PersonalMagazinePage() {
  return <PersonalMagazineBetaClient />;
}

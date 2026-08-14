import { notFound } from "next/navigation";
import { PersonalMagazineFeedbackClient } from "./PersonalMagazineFeedbackClient";

// PRIVATE BETA FEEDBACK 분리(2026-08) — 제품 경험(Result/MY MAGAZINE)과
// Beta 조사(Feedback)를 완전히 분리한 독립 route. 다른 dev 라우트와
// 같은 이유로 NODE_ENV가 아니라 VERCEL_ENV로 판단한다(Vercel
// Preview에서는 열리고 Production에서만 막힌다) — personal-magazine-beta
// 자체가 아직 Preview 단계 prototype이라 이 화면도 같은 배포 모델을
// 따른다. 일반 서비스 navigation 어디에도 이 route로의 링크를 걸지
// 않는다 — Private Beta 5명에게 URL을 직접 전달할 예정이다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function PersonalMagazineFeedbackPage() {
  if (isBlocked()) notFound();

  return <PersonalMagazineFeedbackClient />;
}

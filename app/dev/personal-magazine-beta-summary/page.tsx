import { notFound } from "next/navigation";
import { BetaFeedbackSummaryClient } from "./BetaFeedbackSummaryClient";

// BETA FEEDBACK SUMMARY(2026-08, Round 6 RC §14) — Private Beta
// 테스트 종료 후 개발/운영 참고용으로 현재 localStorage에 남은
// R-D-C·저장·Continuation 상태를 한눈에 읽기 위한 DEV 전용 화면.
// 서버 DB·analytics 없이 "지금 이 브라우저"의 값만 그대로 읽는다 —
// 새 데이터를 만들거나 집계하지 않는다. 다른 dev route와 같은 이유로
// production에서는 막는다 — public 사용자 화면(/magazine)에는 이
// 라우트로 가는 링크가 전혀 없다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function BetaFeedbackSummaryPage() {
  if (isBlocked()) notFound();

  return <BetaFeedbackSummaryClient />;
}

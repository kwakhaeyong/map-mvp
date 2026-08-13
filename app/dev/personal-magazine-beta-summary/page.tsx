import { notFound } from "next/navigation";
import { getBetaCentralSummary } from "../../../src/data/personalMagazineBetaStore";
import { BetaFeedbackSummaryClient } from "./BetaFeedbackSummaryClient";
import { BetaCentralSummaryTable } from "./BetaCentralSummaryTable";

// BETA FEEDBACK SUMMARY(2026-08, Round 6 RC §14) — Private Beta
// 테스트 종료 후 개발/운영 참고용으로 현재 localStorage에 남은
// R-D-C·저장·Continuation 상태를 한눈에 읽기 위한 DEV 전용 화면.
// 다른 dev route와 같은 이유로 production에서는 막는다 — public
// 사용자 화면(/magazine)에는 이 라우트로 가는 링크가 전혀 없다.
//
// CENTRAL DATA COLLECTION(2026-08) — §9 요구대로 이 화면을 "중앙 데이터
// 기반"으로 확장했다. getBetaCentralSummary()는 Server Component인 이
// 파일 안에서만 호출된다 — 별도 public API로 전체 참가자 데이터를
// GET할 수 있는 endpoint를 만들지 않았다(§9 "인증 없는 public analytics
// endpoint 금지"). 이 페이지 자체가 이미 production에서 notFound로
// 막혀 있으므로, 서버 컴포넌트 안에서 직접 Redis를 읽는 것 자체가
// 그대로 접근 제어가 된다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default async function BetaFeedbackSummaryPage() {
  if (isBlocked()) notFound();

  const centralRows = await getBetaCentralSummary();

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <BetaCentralSummaryTable rows={centralRows} />
      <div className="mt-16 border-t border-dashed border-border-strong pt-14">
        <BetaFeedbackSummaryClient />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { formatReviewPersonaInputSummary, REVIEW_PERSONAS } from "../../../src/map-decision-v1/engine/review-fixtures";
import { ResultWowReviewClient } from "./ResultWowReviewClient";

// RESULT WOW 검증 전용 dev 페이지 — production에서는 404. 이유는
// app/api/review-taste-a/route.ts 주석 참고(NODE_ENV가 아니라 VERCEL_ENV로
// 판단해야 Vercel Preview에서는 열리고 Production에서만 막힌다).
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function ResultWowReviewPage() {
  if (isBlocked()) notFound();

  const persona = REVIEW_PERSONAS.A;
  const inputSummary = formatReviewPersonaInputSummary("A");

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text-primary sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.08em] text-text-muted">RESULT WOW · dev only</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.02em]">Persona A 재생성 리뷰</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">
            고정된 Persona A 입력({persona.theme})으로 지금 이 브랜치의 taste-generator를 그대로 실행합니다. 20문항을 다시
            입력하지 않고, 프롬프트를 바꿀 때마다 이 페이지에서 버튼만 누르면 됩니다.
          </p>
        </div>

        <details className="rounded-large border border-border bg-surface p-4 shadow-subtle">
          <summary className="cursor-pointer text-sm font-black">Persona A 입력 내용 보기</summary>
          <pre className="mt-3 whitespace-pre-wrap break-keep text-xs font-medium leading-6 text-text-secondary">{inputSummary}</pre>
        </details>

        <ResultWowReviewClient />
      </div>
    </main>
  );
}

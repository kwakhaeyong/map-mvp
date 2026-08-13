"use client";

import { useState } from "react";
import { getContinuationIntent } from "../../../src/data/continuationStorage";
import { getFeedback } from "../../../src/data/feedbackStorage";
import { getSavedTasteIssue, TASTE_ISSUE_ID } from "../../../src/data/tasteIssueStorage";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-muted">{label}</span>
      <span className="text-right text-sm font-bold text-text-primary">{value}</span>
    </div>
  );
}

// BETA FEEDBACK SUMMARY(Round 6 RC §14) — 지금 이 브라우저의
// localStorage 3개 key(issues/feedback/continuation)를 mount 시점에
// 한 번 읽어 그대로 보여준다. 서버 전송·집계·새 저장 없음 — 순수
// 읽기 전용이다.
export function BetaFeedbackSummaryClient() {
  const [issue] = useState(() => getSavedTasteIssue());
  const [feedback] = useState(() => getFeedback(TASTE_ISSUE_ID));
  const [continuation] = useState(() => getContinuationIntent());

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">DEV ONLY · NOT PUBLIC</p>
      <h1 className="mt-3 text-2xl font-black text-text-primary">THIS BROWSER'S LOCAL DATA</h1>
      <p className="mt-2 text-sm font-bold text-text-secondary">
        지금 이 브라우저의 localStorage 값만 그대로 읽습니다 — 위 CENTRAL BETA DATA(모든 참가자, 중앙 저장소)와는 별개입니다. 참고용으로 남겨둡니다.
      </p>

      <div className="mt-8">
        <Row label="Saved" value={issue ? "YES" : "NO"} />
        <Row label="Headline" value={issue ? issue.opening.headline.replace(/\n/g, " ") : "—"} />
        <Row label="Saved At" value={issue ? new Date(issue.createdAt).toLocaleString("ko-KR") : "—"} />
      </div>

      <div className="mt-8">
        <Row label="R (Resonance)" value={feedback ? String(feedback.resonance) : "—"} />
        <Row label="D (Desire)" value={feedback ? String(feedback.desire) : "—"} />
        <Row label="C (Continuation)" value={feedback ? String(feedback.continuation) : "—"} />
        <Row label="Most Like Me" value={feedback?.mostLikeMe ? feedback.mostLikeMe : "(비어 있음)"} />
        <Row label="Feedback Submitted At" value={feedback ? new Date(feedback.submittedAt).toLocaleString("ko-KR") : "—"} />
      </div>

      <div className="mt-8">
        <Row label="Next Chapter Selected" value={continuation ? continuation.selectedChapter.toUpperCase() : "—"} />
        <Row label="Selected At" value={continuation ? new Date(continuation.selectedAt).toLocaleString("ko-KR") : "—"} />
      </div>

      <p className="mt-10 text-xs font-bold leading-5 text-text-muted">
        Share 실행 여부는 여전히 이 브라우저의 localStorage에는 남지 않습니다(React state뿐). 다만 중앙 저장소에는 남습니다 — 위 CENTRAL BETA DATA 표의 Shared 열을 참고하세요.
      </p>
    </div>
  );
}

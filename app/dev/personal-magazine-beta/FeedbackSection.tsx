"use client";

import { useState } from "react";
import { getFeedback, saveFeedback, type FeedbackScore } from "../../../src/data/feedbackStorage";

// R-D-C FEEDBACK(2026-08, Private Beta Round 5) — §6 확정 카피 그대로.
// Ownership(SAVE/SHARE) 바로 다음, VIEW MY MAGAZINE 바로 앞에 이어지는
// 조용한 한 섹션으로 배치한다(§5 권장 순서: SAVE/SHARE → FEEDBACK →
// VIEW MY MAGAZINE). VIEW MY MAGAZINE CTA를 이 섹션 안으로 옮겨왔다 —
// Round 4에서는 OwnershipSection(SAVE 버튼 바로 아래)에 있었지만, 이번
// 라운드 브리프가 명시적으로 그 위치를 Feedback 다음으로 재배치하라고
// 요구했다.
//
// R/D/C 점수는 "말한 의향"이고 SAVE/SHARE/VIEW MY MAGAZINE/Next Chapter
// 선택은 "실제 행동"이다(§10) — 이 컴포넌트는 그 둘을 절대 서로
// 자동으로 채우거나 연결하지 않는다. VIEW MY MAGAZINE 노출 여부도
// Feedback 제출 여부가 아니라 오직 저장된 Issue 존재 여부(saved
// 행동)로만 결정한다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ScaleCaptions = Partial<Record<FeedbackScore, string>>;

function ScaleSelector({
  value,
  onChange,
  captions,
}: {
  value: FeedbackScore | null;
  onChange: (n: FeedbackScore) => void;
  captions: ScaleCaptions;
}) {
  const scale: FeedbackScore[] = [1, 2, 3, 4, 5];
  return (
    <div className="mt-5 grid grid-cols-5 gap-2">
      {scale.map((n) => {
        const selected = value === n;
        const caption = captions[n];
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cx(
              "flex min-h-16 flex-col items-center justify-start gap-1.5 border px-1 py-3 text-center transition-all duration-normal",
              selected ? "border-text-primary bg-text-primary text-background" : "border-border-strong text-text-primary"
            )}
          >
            <span className="font-serif text-base font-bold">{n}</span>
            {caption && (
              <span className={cx("text-[9px] font-bold leading-[1.25]", selected ? "text-background" : "text-text-muted")}>{caption}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FeedbackQuestion({
  eyebrow,
  question,
  value,
  onChange,
  captions,
}: {
  eyebrow: string;
  question: string;
  value: FeedbackScore | null;
  onChange: (n: FeedbackScore) => void;
  captions: ScaleCaptions;
}) {
  return (
    <div className="mx-auto mt-10 max-w-xs text-left">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p>
      <p className="mt-2 text-center text-base font-black leading-6 text-text-primary">{question}</p>
      <ScaleSelector value={value} onChange={onChange} captions={captions} />
    </div>
  );
}

export function FeedbackSection({
  issueId,
  savedIssueExists,
  onViewMyMagazine,
}: {
  issueId: string;
  // VIEW MY MAGAZINE 노출 조건(§4/§15 — SAVE 이후에만, Feedback 제출
  // 여부와 무관). 이 값은 부모(JourneyResult)가 실시간 SAVE 상태로
  // 들고 있다가 내려준다 — 이 컴포넌트가 mount 시점에 한 번만
  // localStorage를 읽으면, Feedback과 Ownership이 같은 순간에 함께
  // mount되는 이 화면 구조상 SAVE 버튼을 누르기 "전"의 값이 그대로
  // 굳어버린다(실제로 이 문제를 검증 중 발견해 prop으로 바꿨다).
  savedIssueExists: boolean;
  onViewMyMagazine: () => void;
}) {
  const [existing] = useState(() => getFeedback(issueId));
  const [resonance, setResonance] = useState<FeedbackScore | null>(() => existing?.resonance ?? null);
  const [desire, setDesire] = useState<FeedbackScore | null>(() => existing?.desire ?? null);
  const [continuation, setContinuation] = useState<FeedbackScore | null>(() => existing?.continuation ?? null);
  const [mostLikeMe, setMostLikeMe] = useState(existing?.mostLikeMe ?? "");
  const [submitted, setSubmitted] = useState(() => Boolean(existing));

  const canSubmit = resonance !== null && desire !== null && continuation !== null;

  function handleSubmit() {
    if (resonance === null || desire === null || continuation === null) return;
    saveFeedback(issueId, { resonance, desire, continuation, mostLikeMe });
    setSubmitted(true);
  }

  return (
    <section className="border-t border-dashed border-border-strong px-6 pb-20 pt-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">A QUICK NOTE</p>

      {submitted ? (
        <>
          <h2 className="mx-auto mt-4 text-2xl font-black tracking-[-0.02em] text-text-primary">THANK YOU.</h2>
          <p className="mx-auto mt-4 max-w-[22rem] text-sm font-bold leading-6 text-text-secondary">
            당신의 다음 Chapter를 더 잘 만들기 위해 참고할게요.
          </p>
        </>
      ) : (
        <>
          <p className="mx-auto mt-4 max-w-[22rem] text-sm font-bold leading-6 text-text-secondary">이 Magazine을 어떻게 느꼈는지 알려주세요.</p>

          <FeedbackQuestion
            eyebrow="R · RESONANCE"
            question="이 Magazine은 나를 얼마나 잘 표현했나요?"
            value={resonance}
            onChange={setResonance}
            captions={{ 1: "전혀 나 같지 않다", 3: "어느 정도 나 같다", 5: "정말 나 같다" }}
          />

          <FeedbackQuestion
            eyebrow="D · DESIRE"
            question="이 Magazine을 내 것으로 남겨두고 싶나요?"
            value={desire}
            onChange={setDesire}
            captions={{ 1: "전혀 그렇지 않다", 3: "어느 정도 그렇다", 5: "매우 그렇다" }}
          />

          <FeedbackQuestion
            eyebrow="C · CONTINUATION"
            question="다른 Chapter도 만들어보고 싶나요?"
            value={continuation}
            onChange={setContinuation}
            captions={{ 1: "전혀 그렇지 않다", 3: "어느 정도 그렇다", 5: "매우 그렇다" }}
          />

          <div className="mx-auto mt-10 max-w-xs text-left">
            <p className="text-center text-sm font-bold text-text-secondary">가장 나 같았던 부분이 있다면 알려주세요.</p>
            <textarea
              value={mostLikeMe}
              onChange={(e) => setMostLikeMe(e.target.value)}
              placeholder="한 줄이면 충분해요."
              rows={2}
              className="mt-3 w-full resize-none border border-border-strong bg-transparent px-3 py-2 text-center text-sm font-bold text-text-primary placeholder:text-text-muted"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cx(
              "mx-auto mt-10 flex h-12 w-full max-w-xs items-center justify-center px-8 text-sm font-black uppercase tracking-[0.04em] transition-all duration-normal",
              canSubmit ? "bg-text-primary text-background" : "cursor-not-allowed border border-border-strong text-text-muted"
            )}
          >
            SEND FEEDBACK
          </button>
        </>
      )}

      {savedIssueExists && (
        <button
          type="button"
          onClick={onViewMyMagazine}
          className="mx-auto mt-12 block text-sm font-black uppercase tracking-[0.04em] text-text-primary underline decoration-border-strong underline-offset-4"
        >
          VIEW MY MAGAZINE
        </button>
      )}
    </section>
  );
}

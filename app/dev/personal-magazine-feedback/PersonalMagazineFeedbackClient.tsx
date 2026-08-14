"use client";

import { useState } from "react";
import { getFeedback, saveFeedback, type FeedbackScore } from "../../../src/data/feedbackStorage";
import { sendBetaEvent } from "../../../src/data/personalMagazineBetaTelemetry";
import { TASTE_ISSUE_ID } from "../../../src/data/tasteIssueStorage";

// PRIVATE BETA FEEDBACK(2026-08) — Result에서 완전히 분리된 독립 조사
// 화면. §5 지시대로 기존 저장/전송 로직(feedbackStorage.ts/
// personalMagazineBetaTelemetry.ts)을 그대로 재사용한다 — 새 저장
// 방식을 만들지 않았다. issueId는 "첫 Issue"(TASTE, ISSUE 01)를
// 가리키는 기존 TASTE_ISSUE_ID를 그대로 쓴다 — 이 화면의 문구
// 자체가 "첫 Issue를 읽고 난 느낌"이라 새 상수를 만들 이유가 없다.
//
// 정성 질문 2개(§4) — 기존 자유의견 한 칸(mostLikeMe)은 그대로 두고,
// notLikeMe 필드 하나만 feedbackStorage.ts/personalMagazineBetaTelemetry.ts
// 양쪽에 추가해 저장/전송했다(완료 보고에 명시).

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

function TextNote({
  eyebrow,
  question,
  placeholder,
  value,
  onChange,
}: {
  eyebrow: string;
  question: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mx-auto mt-10 max-w-xs text-left">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">{eyebrow}</p>
      <p className="mt-2 text-center text-sm font-bold text-text-secondary">{question}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="mt-3 w-full resize-none border border-border-strong bg-transparent px-3 py-2 text-center text-sm font-bold text-text-primary placeholder:text-text-muted"
      />
    </div>
  );
}

export function PersonalMagazineFeedbackClient() {
  const [existing] = useState(() => getFeedback(TASTE_ISSUE_ID));
  const [resonance, setResonance] = useState<FeedbackScore | null>(() => existing?.resonance ?? null);
  const [desire, setDesire] = useState<FeedbackScore | null>(() => existing?.desire ?? null);
  const [continuation, setContinuation] = useState<FeedbackScore | null>(() => existing?.continuation ?? null);
  const [mostLikeMe, setMostLikeMe] = useState(existing?.mostLikeMe ?? "");
  const [notLikeMe, setNotLikeMe] = useState(existing?.notLikeMe ?? "");
  const [submitted, setSubmitted] = useState(() => Boolean(existing));

  const canSubmit = resonance !== null && desire !== null && continuation !== null;

  function handleSubmit() {
    if (resonance === null || desire === null || continuation === null) return;
    saveFeedback(TASTE_ISSUE_ID, {
      resonance,
      desire,
      continuation,
      mostLikeMe,
      notLikeMe,
    });
    sendBetaEvent(TASTE_ISSUE_ID, {
      event: "feedback_submitted",
      resonance,
      desire,
      continuation,
      mostLikeMe: mostLikeMe.trim() ? mostLikeMe.trim() : null,
      notLikeMe: notLikeMe.trim() ? notLikeMe.trim() : null,
    });
    setSubmitted(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-20 pt-14 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">PRIVATE BETA</p>

      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="text-2xl font-black tracking-[-0.02em] text-text-primary">THANK YOU.</h1>
          <p className="mx-auto mt-4 max-w-[22rem] text-sm font-bold leading-6 text-text-secondary">
            첫 Issue를 함께 읽어주셔서 감사합니다.
          </p>
          <a
            href="/dev/personal-magazine-beta?view=my-magazine"
            className="mx-auto mt-12 block text-sm font-black uppercase tracking-[0.04em] text-text-primary underline decoration-border-strong underline-offset-4"
          >
            MY MAGAZINE으로 돌아가기
          </a>
        </div>
      ) : (
        <>
          <h1 className="mt-5 whitespace-pre-line text-[1.75rem] font-black leading-[1.2] tracking-[-0.02em] text-text-primary">
            {"첫 Issue를 읽고 난 느낌을\n들려주세요."}
          </h1>
          <p className="mx-auto mt-4 max-w-[22rem] whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
            {"더 좋은 Personal Magazine을 만들기 위한\n짧은 기록입니다."}
          </p>

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
            question="다른 Issue도 만들어보고 싶나요?"
            value={continuation}
            onChange={setContinuation}
            captions={{ 1: "전혀 그렇지 않다", 3: "어느 정도 그렇다", 5: "매우 그렇다" }}
          />

          <TextNote
            eyebrow="MOST LIKE ME"
            question="가장 '나 같다'고 느낀 부분이 있었다면 알려주세요."
            placeholder="한 줄이면 충분해요."
            value={mostLikeMe}
            onChange={setMostLikeMe}
          />

          <TextNote
            eyebrow="NOT LIKE ME"
            question="가장 '나와 다르다'고 느낀 부분이 있었다면 알려주세요."
            placeholder="없었다면 비워두셔도 됩니다."
            value={notLikeMe}
            onChange={setNotLikeMe}
          />

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
    </div>
  );
}

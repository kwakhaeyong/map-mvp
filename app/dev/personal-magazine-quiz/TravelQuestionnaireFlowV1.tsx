"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { TRAVEL_QUESTIONS_V1, type TravelV1Option, type TravelV1Question, type TravelV1RawAnswers } from "../../../src/data/travelQuestionnaireV1";

// TRAVEL v1(ISSUE 02, 2026-08, PR #261 Round I) — TasteQuestionnaireFlowV3.tsx와
// 동일한 시각 언어(테두리/타이포/여백/버튼)를 그대로 재사용한다. §19 —
// 이미지 문항(T1/T4/T7/T11/T14)에 실제 사진 asset이 아직 없어
// EditorialImageFrame 플레이스홀더로 대체했다 — 이 상태로는 프로덕션
// merge가 불가하다(완료 보고에 명시).

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ImageChoiceCard({
  option,
  badge,
  selected,
  dimmed,
  onSelect,
}: {
  option: TravelV1Option;
  badge: "A" | "B";
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "flex flex-1 flex-col gap-3 border p-3 text-left transition-all duration-normal",
        selected ? "border-text-primary" : "border-border-strong",
        dimmed && "opacity-50"
      )}
    >
      <EditorialImageFrame ratio="4:5" label={`IMAGE ${badge}`} />
      <div className="flex flex-col gap-1.5">
        <span
          className={cx(
            "flex size-6 items-center justify-center border font-serif text-[11px] font-bold transition-all duration-normal",
            selected ? "border-text-primary bg-text-primary text-background" : "border-border-strong text-text-muted"
          )}
        >
          {badge}
        </span>
        <p className="whitespace-pre-line text-sm font-bold leading-5 text-text-primary">{option.label}</p>
      </div>
    </button>
  );
}

function ImageChoiceGroup({ question, selectedId, onSelect }: { question: TravelV1Question; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3 min-[430px]:flex-row">
      {question.options.map((option, index) => (
        <ImageChoiceCard
          key={option.id}
          option={option}
          badge={index === 0 ? "A" : "B"}
          selected={selectedId === option.id}
          dimmed={selectedId !== null && selectedId !== option.id}
          onSelect={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}

function TextChoiceCard({
  option,
  index,
  selected,
  dimmed,
  onSelect,
}: {
  option: TravelV1Option;
  index: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "flex flex-col gap-2 border p-4 text-left transition-all duration-normal",
        selected ? "border-text-primary" : "border-border-strong",
        dimmed && "opacity-50"
      )}
    >
      <span
        className={cx(
          "font-serif text-[11px] font-bold tracking-[0.06em] transition-all duration-normal",
          selected ? "text-text-primary" : "text-text-muted"
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="whitespace-pre-line text-base font-black leading-5 text-text-primary">{option.label}</p>
    </button>
  );
}

function TextChoiceGrid({ question, selectedId, onSelect }: { question: TravelV1Question; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {question.options.map((option, index) => (
        <TextChoiceCard
          key={option.id}
          option={option}
          index={index}
          selected={selectedId === option.id}
          dimmed={selectedId !== null && selectedId !== option.id}
          onSelect={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}

function QuestionShell({
  question,
  canGoBack,
  onBack,
  canGoNext,
  onNext,
  children,
}: {
  question: TravelV1Question;
  canGoBack: boolean;
  onBack: () => void;
  canGoNext: boolean;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-10">
      <div className="px-5 pt-6">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted underline decoration-border-strong underline-offset-4"
          >
            ← 이전 페이지
          </button>
        )}
        <div className={cx("flex items-center justify-between", canGoBack && "mt-3")}>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TRAVEL · {question.eyebrow}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            {question.qNumber} of {question.totalPages}
          </p>
        </div>
      </div>

      <h2 className="whitespace-pre-line px-5 pt-5 text-[1.75rem] font-black leading-[1.15] tracking-[-0.01em] text-text-primary">{question.prompt}</h2>

      <div className="mt-6 px-5">{children}</div>

      <div className="mt-6 px-5">
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={cx(
            "inline-flex h-11 items-center justify-center px-6 text-sm font-black uppercase tracking-[0.04em] transition-all duration-normal",
            canGoNext ? "bg-text-primary text-background" : "cursor-not-allowed border border-border-strong text-text-muted"
          )}
        >
          {question.qNumber >= question.totalPages ? "페이지 완성하기" : "다음 페이지"}
        </button>
      </div>
    </div>
  );
}

export function TravelQuestionnaireFlowV1({
  onComplete,
  onExitToIntro,
}: {
  onComplete: (answers: TravelV1RawAnswers) => void;
  onExitToIntro?: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<TravelV1RawAnswers>({});

  const currentQuestion = TRAVEL_QUESTIONS_V1[pageIndex];
  const selectedId = currentQuestion ? (answers[currentQuestion.id] ?? null) : null;
  const canGoNext = Boolean(selectedId);

  function handleSelect(question: TravelV1Question, optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  function handleBack() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    if (pageIndex + 1 >= TRAVEL_QUESTIONS_V1.length) {
      onComplete(answers);
      return;
    }
    setPageIndex((i) => i + 1);
  }

  if (!currentQuestion) return null;

  return (
    <QuestionShell
      question={currentQuestion}
      canGoBack={pageIndex > 0 || Boolean(onExitToIntro)}
      onBack={pageIndex > 0 ? handleBack : () => onExitToIntro?.()}
      canGoNext={canGoNext}
      onNext={handleNext}
    >
      {currentQuestion.kind === "image-2" && (
        <ImageChoiceGroup question={currentQuestion} selectedId={selectedId} onSelect={(id) => handleSelect(currentQuestion, id)} />
      )}
      {(currentQuestion.kind === "text-4" || currentQuestion.kind === "scenario-4") && (
        <TextChoiceGrid question={currentQuestion} selectedId={selectedId} onSelect={(id) => handleSelect(currentQuestion, id)} />
      )}
    </QuestionShell>
  );
}

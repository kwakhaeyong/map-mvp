"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { type PageSectionKey } from "../../../src/data/tasteAnalysis";
import {
  TASTE_QUESTIONS_V1,
  type MultiSelectQuestion,
  type QuickCutsQuestion,
  type QuickCutItem,
  type SceneChoiceQuestion,
  type SignatureChoiceQuestion,
  type TasteQuestion,
  type TasteQuestionOption,
  type TasteRawAnswer,
  type TasteRawAnswers,
} from "../../../src/data/tasteQuestionnaire";

// TASTE QUESTIONNAIRE v1(2026-08) — 6 PAGE 실제 답변 흐름(intro→question)
// 만 담당하는 재사용 컴포넌트. 완료(onComplete) 이후 무엇을 보여줄지는
// 이 파일이 정하지 않는다 — 호출하는 쪽(QuizV1Client.tsx의 dev debug
// 화면, TasteJourneyClient.tsx의 실제 Magazine Result)이 결정한다.
//
// 원래 QuizV1Client.tsx 안에 있던 interaction 컴포넌트/state를 그대로
// 옮긴 것이다 — 문구/선택지/signal은 전혀 건드리지 않았다.

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const TASTE_CHAPTER = { id: "taste", number: "02", title: "TASTE" };

const PAGE_SECTIONS: Array<{ key: PageSectionKey; label: string }> = [
  { key: "place", label: "PLACE" },
  { key: "object", label: "OBJECT" },
  { key: "detail", label: "DETAIL" },
  { key: "ritual", label: "RITUAL" },
];

// PAGE 01(SCENE)만 실제 이미지를 쓴다. 다른 페이지는 assetKey가 없다
// (priority/situation/multi-select는 이미지 슬롯 자체가 없고,
// signature-choice는 neutral placeholder를 쓴다 — 새 이미지 생성 없음).
function resolveAsset(assetKey?: string): MagazineVisualAsset | null {
  if (assetKey === "quiz.taste.q01.a") return magazineVisualAssets.quiz.taste.q01.a;
  if (assetKey === "quiz.taste.q01.b") return magazineVisualAssets.quiz.taste.q01.b;
  return null;
}

function isPageComplete(question: TasteQuestion, answer: TasteRawAnswer | undefined): boolean {
  if (!answer) return false;
  if (question.kind === "multi-select") return answer.selectedOptionIds.length === question.maxSelect;
  if (question.kind === "quick-cuts") return answer.selectedOptionIds.length === question.cuts.length;
  return answer.selectedOptionIds.length >= 1;
}

// ============================================================
// YourPageStatus
// ============================================================
export function YourPageStatus({ filled }: { filled: PageSectionKey[] }) {
  return (
    <div className="mt-10 border-t border-border px-5 pt-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">YOUR PAGE</p>
      <div className="mt-2 flex gap-2">
        {PAGE_SECTIONS.map((section) => {
          const isFilled = filled.includes(section.key);
          return (
            <span
              key={section.key}
              className={cx(
                "flex-1 border px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.04em] transition-all duration-normal",
                isFilled ? "border-text-primary bg-text-primary text-background" : "border-border-strong text-text-muted"
              )}
            >
              {section.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// QuizIntro
// ============================================================
function QuizIntro({ chapterNumber, chapterTitle, onStart }: { chapterNumber: string; chapterTitle: string; onStart: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">CHAPTER {chapterNumber}</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.02em] text-text-primary">{chapterTitle}</h1>
      <p className="mt-3 text-sm font-bold text-text-secondary">이 챕터를 만들 준비가 되면 시작하세요.</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex h-12 items-center justify-center border border-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-text-primary"
      >
        챕터 만들기 시작
      </button>
    </div>
  );
}

// ============================================================
// QuestionShell
// ============================================================
function QuestionShell({
  page,
  totalPages,
  prompt,
  helper,
  filled,
  canGoBack,
  onBack,
  canGoNext,
  onNext,
  children,
}: {
  page: number;
  totalPages: number;
  prompt: string;
  helper?: string;
  filled: PageSectionKey[];
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
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · PAGE IN PROGRESS</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            {page} of {totalPages}
          </p>
        </div>
      </div>

      <h2 className="whitespace-pre-line px-5 pt-5 text-[1.75rem] font-black leading-[1.15] tracking-[-0.01em] text-text-primary">{prompt}</h2>
      {helper && <p className="whitespace-pre-line px-5 pt-2 text-sm font-bold text-text-secondary">{helper}</p>}

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
          {page >= totalPages ? "페이지 완성하기" : "다음 페이지"}
        </button>
      </div>

      <YourPageStatus filled={filled} />
    </div>
  );
}

// ============================================================
// PAGE 01 — SceneChoice
// ============================================================
function SceneChoiceCard({
  option,
  badge,
  selected,
  dimmed,
  onSelect,
}: {
  option: TasteQuestionOption;
  badge: "A" | "B";
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const asset = resolveAsset(option.assetKey);
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
      {asset ? (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: asset.aspectRatio.replace(":", " / ") }}>
          <img src={asset.src} alt={asset.alt} className="size-full object-cover" style={{ objectPosition: asset.objectPositionMobile }} />
        </div>
      ) : (
        <EditorialImageFrame ratio="4:5" label={`IMAGE ${badge}`} />
      )}
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

function SceneChoiceGroup({
  question,
  selectedId,
  onSelect,
}: {
  question: SceneChoiceQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-[430px]:flex-row">
      {question.options.map((option, index) => (
        <SceneChoiceCard
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

// ============================================================
// PAGE 02 / 04 — TextChoiceGrid
// ============================================================
function TextChoiceCard({
  option,
  index,
  selected,
  dimmed,
  onSelect,
}: {
  option: TasteQuestionOption;
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
      {option.description && <p className="whitespace-pre-line text-xs font-bold leading-4 text-text-secondary">{option.description}</p>}
    </button>
  );
}

function TextChoiceGrid({
  options,
  selectedId,
  onSelect,
}: {
  options: TasteQuestionOption[];
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((option, index) => (
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

// ============================================================
// PAGE 03 — MultiSelectGrid
// ============================================================
function MultiSelectCard({
  option,
  index,
  selected,
  locked,
  onToggle,
}: {
  option: TasteQuestionOption;
  index: number;
  selected: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className={cx(
        "flex flex-col gap-2 border p-4 text-left transition-all duration-normal",
        selected ? "border-text-primary" : "border-border-strong",
        locked && "cursor-not-allowed opacity-40"
      )}
    >
      <span
        className={cx(
          "flex size-6 items-center justify-center border font-serif text-[11px] font-bold transition-all duration-normal",
          selected ? "border-text-primary bg-text-primary text-background" : "border-border-strong text-text-muted"
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="text-sm font-bold leading-5 text-text-primary">{option.label}</p>
    </button>
  );
}

function MultiSelectGrid({
  question,
  selectedIds,
  onToggle,
}: {
  question: MultiSelectQuestion;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
}) {
  const atLimit = selectedIds.length >= question.maxSelect;
  return (
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
      {question.options.map((option, index) => {
        const selected = selectedIds.includes(option.id);
        return (
          <MultiSelectCard
            key={option.id}
            option={option}
            index={index}
            selected={selected}
            locked={!selected && atLimit}
            onToggle={() => onToggle(option.id)}
          />
        );
      })}
    </div>
  );
}

// ============================================================
// PAGE 05 — QuickCutsList
// ============================================================
function QuickCutRow({
  cut,
  selectedOptionId,
  onSelect,
}: {
  cut: QuickCutItem;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div className="flex border border-border-strong">
      <button
        type="button"
        onClick={() => onSelect(cut.left.id)}
        className={cx(
          "flex-1 border-r border-border-strong px-3 py-4 text-center text-sm font-bold leading-5 transition-all duration-normal",
          selectedOptionId === cut.left.id ? "bg-text-primary text-background" : "text-text-primary"
        )}
      >
        {cut.left.label}
      </button>
      <button
        type="button"
        onClick={() => onSelect(cut.right.id)}
        className={cx(
          "flex-1 px-3 py-4 text-center text-sm font-bold leading-5 transition-all duration-normal",
          selectedOptionId === cut.right.id ? "bg-text-primary text-background" : "text-text-primary"
        )}
      >
        {cut.right.label}
      </button>
    </div>
  );
}

function QuickCutsList({
  question,
  selections,
  onSelect,
}: {
  question: QuickCutsQuestion;
  selections: Record<string, string>;
  onSelect: (cutId: string, optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {question.cuts.map((cut) => (
        <QuickCutRow key={cut.id} cut={cut} selectedOptionId={selections[cut.id]} onSelect={(optionId) => onSelect(cut.id, optionId)} />
      ))}
    </div>
  );
}

// ============================================================
// PAGE 06 — SignatureChoiceGroup
// ============================================================
function SignatureCard({
  option,
  selected,
  dimmed,
  onSelect,
}: {
  option: TasteQuestionOption;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "flex flex-1 flex-col gap-3 border p-4 text-left transition-all duration-normal",
        selected ? "border-text-primary" : "border-border-strong",
        dimmed && "opacity-50"
      )}
    >
      <EditorialImageFrame ratio="4:5" label={option.label} />
      <div className="flex flex-col gap-2">
        <span
          className={cx(
            "font-serif text-xs font-bold uppercase tracking-[0.14em] transition-all duration-normal",
            selected ? "text-text-primary" : "text-text-muted"
          )}
        >
          {option.label}
        </span>
        <p className="whitespace-pre-line text-sm font-bold leading-5 text-text-secondary">{option.description}</p>
      </div>
    </button>
  );
}

function SignatureChoiceGroup({
  question,
  selectedId,
  onSelect,
}: {
  question: SignatureChoiceQuestion;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-[430px]:flex-row">
      {question.options.map((option) => (
        <SignatureCard
          key={option.id}
          option={option}
          selected={selectedId === option.id}
          dimmed={selectedId !== null && selectedId !== option.id}
          onSelect={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// ROOT — intro → question 6 PAGE만 담당한다. 완료 시 onComplete(answers)
// 콜백만 호출하고, 그 다음 무엇을 보여줄지는 관여하지 않는다.
// ============================================================
type Stage = "intro" | "question";

export function TasteQuestionnaireFlow({ onComplete }: { onComplete: (answers: TasteRawAnswers) => void }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<TasteRawAnswers>({});
  const [quickCutSelections, setQuickCutSelections] = useState<Record<string, string>>({});

  const currentQuestion: TasteQuestion | undefined = TASTE_QUESTIONS_V1[pageIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const filledSections = Array.from(new Set(TASTE_QUESTIONS_V1.filter((q) => answers[q.id]).map((q) => q.section)));
  const canGoNext = currentQuestion ? isPageComplete(currentQuestion, currentAnswer) : false;

  function handleStart() {
    setStage("question");
    setPageIndex(0);
  }

  function handleBack() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    if (pageIndex + 1 >= TASTE_QUESTIONS_V1.length) {
      onComplete(answers);
      return;
    }
    setPageIndex((i) => i + 1);
  }

  function handleSingleSelect(question: TasteQuestion, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { questionId: question.id, interactionType: question.kind, selectedOptionIds: [optionId], timestamp: Date.now() },
    }));
  }

  function handleMultiToggle(question: MultiSelectQuestion, optionId: string) {
    setAnswers((prev) => {
      const current = prev[question.id]?.selectedOptionIds ?? [];
      let next: string[];
      if (current.includes(optionId)) {
        next = current.filter((id) => id !== optionId);
      } else if (current.length >= question.maxSelect) {
        return prev;
      } else {
        next = [...current, optionId];
      }
      return { ...prev, [question.id]: { questionId: question.id, interactionType: question.kind, selectedOptionIds: next, timestamp: Date.now() } };
    });
  }

  function handleCutSelect(question: QuickCutsQuestion, cutId: string, optionId: string) {
    const nextSelections = { ...quickCutSelections, [cutId]: optionId };
    setQuickCutSelections(nextSelections);
    const selectedOptionIds = question.cuts.map((cut) => nextSelections[cut.id]).filter((id): id is string => Boolean(id));
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { questionId: question.id, interactionType: question.kind, selectedOptionIds, timestamp: Date.now() },
    }));
  }

  if (stage === "intro") {
    return <QuizIntro chapterNumber={TASTE_CHAPTER.number} chapterTitle={TASTE_CHAPTER.title} onStart={handleStart} />;
  }

  if (!currentQuestion) return null;

  return (
    <QuestionShell
      page={currentQuestion.page}
      totalPages={currentQuestion.totalPages}
      prompt={currentQuestion.prompt}
      helper={currentQuestion.helper}
      filled={filledSections}
      canGoBack={pageIndex > 0}
      onBack={handleBack}
      canGoNext={canGoNext}
      onNext={handleNext}
    >
      {currentQuestion.kind === "scene-choice" && (
        <SceneChoiceGroup
          question={currentQuestion}
          selectedId={currentAnswer?.selectedOptionIds[0] ?? null}
          onSelect={(optionId) => handleSingleSelect(currentQuestion, optionId)}
        />
      )}
      {currentQuestion.kind === "priority-choice" && (
        <TextChoiceGrid
          options={currentQuestion.options}
          selectedId={currentAnswer?.selectedOptionIds[0] ?? null}
          onSelect={(optionId) => handleSingleSelect(currentQuestion, optionId)}
        />
      )}
      {currentQuestion.kind === "multi-select" && (
        <MultiSelectGrid
          question={currentQuestion}
          selectedIds={currentAnswer?.selectedOptionIds ?? []}
          onToggle={(optionId) => handleMultiToggle(currentQuestion, optionId)}
        />
      )}
      {currentQuestion.kind === "situation-choice" && (
        <TextChoiceGrid
          options={currentQuestion.options}
          selectedId={currentAnswer?.selectedOptionIds[0] ?? null}
          onSelect={(optionId) => handleSingleSelect(currentQuestion, optionId)}
        />
      )}
      {currentQuestion.kind === "quick-cuts" && (
        <QuickCutsList
          question={currentQuestion}
          selections={quickCutSelections}
          onSelect={(cutId, optionId) => handleCutSelect(currentQuestion, cutId, optionId)}
        />
      )}
      {currentQuestion.kind === "signature-choice" && (
        <SignatureChoiceGroup
          question={currentQuestion}
          selectedId={currentAnswer?.selectedOptionIds[0] ?? null}
          onSelect={(optionId) => handleSingleSelect(currentQuestion, optionId)}
        />
      )}
    </QuestionShell>
  );
}

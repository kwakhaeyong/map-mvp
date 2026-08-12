"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import type { MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";

// EDITORIAL QUIZ SKELETON(2026-08) — dev-only. 실제 문항·선택지·채점
// 로직은 없다 — 내일 Quiz UX를 설계할 때 바로 쓸 수 있는 구조(상태
// 모양 + 컴포넌트 분해)만 미리 준비해두는 것이 이번 라운드의 목적이다.
// 그래서 이 파일 안의 문항 텍스트·캡션은 전부 PLACEHOLDER로 표시했다.
//
// 사용자 정신모델은 "문제를 푼다"가 아니라 "내 Magazine을 만든다"다.
// 그래서 내부 개념도 test/personalityTest/assessment가 아니라
// chapter/choice/page/progress/issue를 중심으로 짰다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================
// 상태 모양 — 내일 실제 Quiz 컴포넌트가 그대로 가져다 쓸 수 있는 최소
// 상태다. 지금은 이 파일 안의 로컬 useState로만 데모한다.
// ============================================================
type ChoiceType = "visual" | "text";

type DemoQuestion = {
  id: string;
  type: ChoiceType;
  prompt: string; // PLACEHOLDER
  optionA: { label: string; asset?: MagazineVisualAsset | null };
  optionB: { label: string; asset?: MagazineVisualAsset | null };
};

const DEMO_CHAPTER = { id: "food", number: "03", title: "FOOD" };

// 실제 문항이 아니라 구조 검증용 자리표시자. 내일 실제 문항으로
// 교체한다.
const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "q1",
    type: "visual",
    prompt: "PLACEHOLDER — 이미지 기반 질문 자리",
    optionA: { label: "OPTION A", asset: null },
    optionB: { label: "OPTION B", asset: null },
  },
  {
    id: "q2",
    type: "text",
    prompt: "PLACEHOLDER — 텍스트 기반 질문 자리",
    optionA: { label: "TEXT OPTION A" },
    optionB: { label: "TEXT OPTION B" },
  },
  {
    id: "q3",
    type: "visual",
    prompt: "PLACEHOLDER — 이미지 기반 질문 자리",
    optionA: { label: "OPTION A", asset: null },
    optionB: { label: "OPTION B", asset: null },
  },
];

// ============================================================
// QuizProgress — page/progress 개념. "몇 번째 문제"가 아니라
// "몇 페이지째"로 표시한다.
// ============================================================
function QuizProgress({ current, total }: { current: number; total: number }) {
  const progress = total === 0 ? 0 : current / total;
  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
        <span>PAGE {current + 1} / {total}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="mt-2 h-1 w-full bg-tag-fill">
        <div className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// ============================================================
// QuizIntro — chapter 시작 화면.
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
// VisualChoice — 내일 가장 중요하게 볼 구조. IMAGE A vs IMAGE B.
// asset이 없으면(null/undefined) EditorialImageFrame 회색
// placeholder를 쓰고, asset이 오면(향후 registry 연결) 실제 이미지로
// 바로 교체될 수 있게 자리만 잡아둔다. 지금은 AI 이미지나 CSS
// illustration을 만들지 않는다.
// ============================================================
function VisualChoice({
  optionA,
  optionB,
  selected,
  onSelect,
}: {
  optionA: { label: string; asset?: MagazineVisualAsset | null };
  optionB: { label: string; asset?: MagazineVisualAsset | null };
  selected: "A" | "B" | null;
  onSelect: (choice: "A" | "B") => void;
}) {
  function renderOption(key: "A" | "B", option: { label: string; asset?: MagazineVisualAsset | null }) {
    const isSelected = selected === key;
    return (
      <button
        type="button"
        onClick={() => onSelect(key)}
        className={cx("flex flex-1 flex-col gap-2 border p-2 text-left", isSelected ? "border-text-primary" : "border-border-strong")}
      >
        {option.asset ? (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: option.asset.aspectRatio.replace(":", " / ") }}>
            <img src={option.asset.src} alt={option.asset.alt} className="size-full object-contain" />
          </div>
        ) : (
          <EditorialImageFrame ratio="4:5" label={`IMAGE ${key}`} />
        )}
        <span className="text-center text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary">{option.label}</span>
      </button>
    );
  }

  return (
    <div className="flex items-stretch gap-2 px-5">
      {renderOption("A", optionA)}
      <span className="flex items-center font-serif text-xs font-bold italic text-text-muted">VS</span>
      {renderOption("B", optionB)}
    </div>
  );
}

// ============================================================
// TextChoice — 이미지 없는 문항용. 텍스트 두 개.
// ============================================================
function TextChoice({
  optionA,
  optionB,
  selected,
  onSelect,
}: {
  optionA: { label: string };
  optionB: { label: string };
  selected: "A" | "B" | null;
  onSelect: (choice: "A" | "B") => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5">
      {(["A", "B"] as const).map((key) => {
        const option = key === "A" ? optionA : optionB;
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cx("border px-4 py-4 text-left text-sm font-bold", isSelected ? "border-text-primary text-text-primary" : "border-border-strong text-text-secondary")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// EditorialQuestion — prompt + (VisualChoice | TextChoice) 조합.
// ============================================================
function EditorialQuestion({
  question,
  selected,
  onSelect,
}: {
  question: DemoQuestion;
  selected: "A" | "B" | null;
  onSelect: (choice: "A" | "B") => void;
}) {
  return (
    <div className="flex flex-col gap-6 pb-10 pt-8">
      <p className="px-5 text-xl font-black leading-7 text-text-primary">{question.prompt}</p>
      {question.type === "visual" ? (
        <VisualChoice optionA={question.optionA} optionB={question.optionB} selected={selected} onSelect={onSelect} />
      ) : (
        <TextChoice optionA={question.optionA} optionB={question.optionB} selected={selected} onSelect={onSelect} />
      )}
    </div>
  );
}

// ============================================================
// EditorialProcessing — 문항 완료 후 편집 중임을 보여주는 중립
// placeholder. 화려한 로딩 애니메이션은 만들지 않는다. 카피와
// 애니메이션은 내일 결정한다 — 지금은 자리만 잡는다.
// ============================================================
function EditorialProcessing({ chapterTitle }: { chapterTitle: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">EDITORIAL PROCESSING</p>
      <p className="text-lg font-black text-text-primary">EDITING YOUR {chapterTitle}…</p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        <span className="size-1.5 animate-pulse bg-primary" style={{ animationDelay: "0ms" }} />
        <span className="size-1.5 animate-pulse bg-primary" style={{ animationDelay: "150ms" }} />
        <span className="size-1.5 animate-pulse bg-primary" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

// ============================================================
// QuizComplete — chapter 완성 화면. 다음 챕터로 넘어가는 구조만
// 개념적으로 보여준다(실제 라우팅/데이터는 없음).
// ============================================================
function QuizComplete({ chapterTitle, onRestart }: { chapterTitle: string; onRestart: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">CHAPTER COMPLETE</p>
      <p className="text-2xl font-black text-text-primary">{chapterTitle} 페이지가 만들어졌어요.</p>
      <p className="text-sm font-bold text-text-secondary">다음 챕터 구조(개념 자리) — 실제 연결은 내일.</p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-4 inline-flex h-11 items-center justify-center border border-border-strong px-6 text-sm font-bold uppercase tracking-[0.04em] text-text-secondary"
      >
        NEXT CHAPTER (placeholder)
      </button>
    </div>
  );
}

// ============================================================
// ROOT — chapter / questionIndex / totalQuestions / selectedChoice /
// progress 상태를 로컬로 데모한다.
// ============================================================
type Stage = "intro" | "question" | "processing" | "complete";

export function QuizSkeletonPrototype() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | null>(null);

  const chapter = DEMO_CHAPTER;
  const totalQuestions = DEMO_QUESTIONS.length;
  const progress = totalQuestions === 0 ? 0 : questionIndex / totalQuestions;

  function handleStart() {
    setStage("question");
    setQuestionIndex(0);
    setSelectedChoice(null);
  }

  function handleSelect(choice: "A" | "B") {
    setSelectedChoice(choice);
  }

  function handleNext() {
    if (questionIndex + 1 >= totalQuestions) {
      setStage("processing");
      // 실제 생성 API 없이, 스켈레톤 데모용으로 짧게 대기 후 완료 화면으로.
      window.setTimeout(() => setStage("complete"), 900);
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelectedChoice(null);
  }

  function handleRestart() {
    setStage("intro");
    setQuestionIndex(0);
    setSelectedChoice(null);
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — EDITORIAL QUIZ SKELETON (문항·채점 미구현 · 구조 검증용)
      </div>

      <div className="mx-auto max-w-md">
        {stage === "intro" && <QuizIntro chapterNumber={chapter.number} chapterTitle={chapter.title} onStart={handleStart} />}

        {stage === "question" && (
          <>
            <QuizProgress current={questionIndex} total={totalQuestions} />
            <p className="sr-only">progress: {Math.round(progress * 100)}%</p>
            <EditorialQuestion question={DEMO_QUESTIONS[questionIndex]} selected={selectedChoice} onSelect={handleSelect} />
            <div className="flex justify-end px-5 pb-10">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedChoice}
                className={cx(
                  "inline-flex h-11 items-center justify-center px-6 text-sm font-black uppercase tracking-[0.04em]",
                  selectedChoice ? "bg-text-primary text-background" : "bg-tag-fill text-text-muted"
                )}
              >
                다음 페이지
              </button>
            </div>
          </>
        )}

        {stage === "processing" && <EditorialProcessing chapterTitle={chapter.title} />}

        {stage === "complete" && <QuizComplete chapterTitle={chapter.title} onRestart={handleRestart} />}
      </div>
    </div>
  );
}

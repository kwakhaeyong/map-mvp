"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { TASTE_QUESTIONS_V3, type TasteV3Option, type TasteV3Question, type TasteV3RawAnswers } from "../../../src/data/tasteQuestionnaireV3";

// TASTE v3 — PRODUCT FREEZE §4/§16. 기존 TasteQuestionnaireFlow.tsx(v1/
// v2/v2.2 전용)는 전혀 건드리지 않는다 — v3는 완전히 새 컴포넌트로
// 만들어, 기존 flow가 쓰는 8축 signal 타입과 섞이지 않게 한다(§18
// migration/feature boundary 요구). 시각 언어(테두리/타이포/여백/버튼)는
// 기존 flow에서 그대로 가져왔다 — 새 디자인 시스템을 만들지 않았다.
//
// 이미지 문항(Q1/Q5/Q9/Q14)은 아직 실사 이미지가 없다 — 이번 라운드는
// 이미지 생성을 하지 않으므로(오너 지시 이력상 신규 asset은 별도 승인
// 필요), 기존 관례대로 EditorialImageFrame placeholder로 렌더링한다.
// Q15만 기존 PAGE06 실사 이미지를 그대로 재사용한다(FREEZE 명시).

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function resolveAsset(assetKey?: string): MagazineVisualAsset | null {
  if (assetKey === "quiz.taste.q06.a") return magazineVisualAssets.quiz.taste.q06.a;
  if (assetKey === "quiz.taste.q06.b") return magazineVisualAssets.quiz.taste.q06.b;
  return null;
}

// ============================================================
// image-2 — Q1/Q5/Q9/Q14/Q15
// ============================================================
function ImageChoiceCard({
  option,
  badge,
  selected,
  dimmed,
  onSelect,
}: {
  option: TasteV3Option;
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
        {option.description && <p className="whitespace-pre-line text-xs font-bold leading-4 text-text-secondary">{option.description}</p>}
      </div>
    </button>
  );
}

function ImageChoiceGroup({ question, selectedId, onSelect }: { question: TasteV3Question; selectedId: string | null; onSelect: (id: string) => void }) {
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

// ============================================================
// text-4 / scenario-4 — Q2/Q3/Q4/Q6/Q7/Q8/Q10/Q11/Q12/Q13
// ============================================================
function TextChoiceCard({
  option,
  index,
  selected,
  dimmed,
  onSelect,
}: {
  option: TasteV3Option;
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

function TextChoiceGrid({ question, selectedId, onSelect }: { question: TasteV3Question; selectedId: string | null; onSelect: (id: string) => void }) {
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

// ============================================================
// QuestionShell — 진행 표시는 "15문항 중 8개" 같은 부담스러운 큰
// progress UI를 피하고(§16), 기존 flow와 동일하게 조용한 텍스트로만
// 표기한다.
// ============================================================
function QuestionShell({
  question,
  canGoBack,
  onBack,
  canGoNext,
  onNext,
  children,
}: {
  question: TasteV3Question;
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
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · {question.eyebrow}</p>
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

// ============================================================
// ROOT — intro→question 15 PAGE만 담당한다(기존 TasteQuestionnaireFlow와
// 동일 책임 경계). onComplete 이후는 이 컴포넌트가 관여하지 않는다.
// ============================================================
export function TasteQuestionnaireFlowV3({
  onComplete,
  onExitToIntro,
}: {
  onComplete: (answers: TasteV3RawAnswers) => void;
  onExitToIntro?: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<TasteV3RawAnswers>({});

  const currentQuestion = TASTE_QUESTIONS_V3[pageIndex];
  const selectedId = currentQuestion ? (answers[currentQuestion.id] ?? null) : null;
  const canGoNext = Boolean(selectedId);

  function handleSelect(question: TasteV3Question, optionId: string) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  function handleBack() {
    setPageIndex((i) => Math.max(0, i - 1));
  }

  function handleNext() {
    if (pageIndex + 1 >= TASTE_QUESTIONS_V3.length) {
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

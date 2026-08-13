"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";

// EDITORIAL QUIZ UX(2026-08) — dev-only. TASTE 챕터의 첫 두 문항을
// 실제 UX로 완성한다(6문항 전체가 아니다). 검증 질문: Q1이 "장면을
// 고른다"였다면, 완전히 다른 interaction grammar를 쓰는 Q2("물건을
// 고른다")로 넘어가도 여전히 하나의 Magazine 제작 경험으로 이어지는가?
//
// 가장 중요한 원칙: 질문/선택지/진행률/YOUR PAGE 전부 HTML이다. 사진
// 위에 텍스트를 박아 넣은 합성 이미지를 쓰지 않는다 — IMAGE + INTERACTIVE
// UI 구조를 지킨다.
//
// 사용자 정신모델은 "문제를 푼다"가 아니라 "내 Magazine을 만든다"다.
// 화면 언어에서 TEST/ASSESSMENT/심리검사 대신 PAGE IN PROGRESS·YOUR
// PAGE·CHOICE·ISSUE·CHAPTER를 쓴다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TASTE_CHAPTER = { id: "taste", number: "02", title: "TASTE" };
const TOTAL_QUESTIONS = 6;

// YOUR PAGE에 표시되는 4개 영역. 실제 TASTE 챕터 히어로 이미지에 이미
// 박혀 있는 PLACE/OBJECT/DETAIL/RITUAL 4분할과 이름을 맞췄다.
type PageSectionKey = "place" | "object" | "detail" | "ritual";

const PAGE_SECTIONS: Array<{ key: PageSectionKey; label: string }> = [
  { key: "place", label: "PLACE" },
  { key: "object", label: "OBJECT" },
  { key: "detail", label: "DETAIL" },
  { key: "ritual", label: "RITUAL" },
];

// ============================================================
// 문항 데이터 모델 — Q3~Q6이 또 다른 interaction grammar를 쓰더라도
// union에 새 variant만 추가하면 되도록 설계했다. VisualChoice(장면
// 2개 중 하나)와 ObjectChoice(물건 4개 중 하나)는 이미 인터랙션
// 문법 자체가 다르므로 억지로 하나의 shape에 맞추지 않았다.
// ============================================================
type VisualChoiceOption = {
  id: string;
  key: "A" | "B";
  asset: MagazineVisualAsset | null;
  sentence: string;
};

type VisualChoiceQuestion = {
  kind: "visual-choice";
  id: string;
  pageSection: PageSectionKey;
  prompt: string;
  deck: string;
  confirmationText: string;
  options: [VisualChoiceOption, VisualChoiceOption];
};

type ObjectChoiceItem = {
  id: string;
  number: string; // "01" 같은 표시용 번호
  category: string; // "CAMERA" 같은 상위 분류 라벨
  title: string; // "오래된 필름카메라"
  description: string; // "시간과 장면을 기록하는 물건"
  asset: MagazineVisualAsset | null;
  // 향후 분석에 쓸 signal — 지금은 저장만 하고 로직에 쓰지 않는다.
  signals: string[];
};

type ObjectChoiceQuestion = {
  kind: "object-choice";
  id: string;
  pageSection: PageSectionKey;
  prompt: string;
  deck: string;
  confirmationText: string;
  items: ObjectChoiceItem[];
};

type QuizQuestion = VisualChoiceQuestion | ObjectChoiceQuestion;

// TASTE 1번 문항 — PLACE. "장면"을 고른다.
const TASTE_Q1: VisualChoiceQuestion = {
  kind: "visual-choice",
  id: "q1",
  pageSection: "place",
  prompt: "쉬는 오후,\n더 마음이 가는 장면은?",
  deck: "내 TASTE 지면에 더 가까운 장면을 선택해 주세요.",
  confirmationText: "첫 장면이 담겼습니다.",
  options: [
    {
      id: "cafe",
      key: "A",
      asset: magazineVisualAssets.quiz.taste.q01.a,
      sentence: "햇살이 드는 조용한 카페에서\n책과 커피를 즐긴다",
    },
    {
      id: "city",
      key: "B",
      asset: magazineVisualAssets.quiz.taste.q01.b,
      sentence: "사람들과 어울리며\n도시의 에너지를 느낀다",
    },
  ],
};

// TASTE 2번 문항 — OBJECT. "물건"을 고른다. 이번 라운드에는 실제
// 이미지가 없어 4장 전부 neutral placeholder를 쓴다(asset: null).
const TASTE_Q2: ObjectChoiceQuestion = {
  kind: "object-choice",
  id: "q2",
  pageSection: "object",
  prompt: "하나를 오래 곁에 둔다면?",
  deck: "내 취향을 가장 잘 닮은 물건을 하나 골라주세요.",
  confirmationText: "두 번째 취향이 담겼습니다.",
  items: [
    {
      id: "camera",
      number: "01",
      category: "CAMERA",
      title: "오래된 필름카메라",
      description: "시간과 장면을 기록하는 물건",
      asset: null,
      signals: ["analog", "memory", "record", "story"],
    },
    {
      id: "speaker",
      number: "02",
      category: "SPEAKER",
      title: "잘 만든 작은 스피커",
      description: "공간의 분위기를 바꾸는 물건",
      asset: null,
      signals: ["sensory", "music", "space", "experience"],
    },
    {
      id: "notebook",
      number: "03",
      category: "NOTEBOOK",
      title: "손때가 묻을수록 좋은 노트",
      description: "생각을 오래 남기는 물건",
      asset: null,
      signals: ["reflection", "writing", "private", "tactile"],
    },
    {
      id: "object",
      number: "04",
      category: "OBJECT",
      title: "형태가 아름다운 작은 오브제",
      description: "바라보는 것만으로 좋은 물건",
      asset: null,
      signals: ["form", "aesthetic", "curation", "visual"],
    },
  ],
};

const QUIZ_QUESTIONS: QuizQuestion[] = [TASTE_Q1, TASTE_Q2];

// ============================================================
// YourPageStatus — "Magazine이 채워지고 있다"는 진행감. 답변한
// 영역만 채워진 상태(active)로, 나머지는 빈 상태로 보인다.
// ============================================================
function YourPageStatus({ filled }: { filled: PageSectionKey[] }) {
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
// QuestionShell — Q1/Q2가 공유하는 껍데기(헤더·질문·YOUR PAGE·다음
// 버튼). 실제 선택 UI(children)는 문항마다 완전히 다른 컴포넌트를
// 꽂는다 — Q2를 Q1의 2-scene 구조에 억지로 맞추지 않기 위함이다.
// ============================================================
function QuestionShell({
  index,
  prompt,
  deck,
  filled,
  confirmed,
  confirmationText,
  onNext,
  children,
}: {
  index: number;
  prompt: string;
  deck: string;
  filled: PageSectionKey[];
  confirmed: boolean;
  confirmationText: string;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · PAGE IN PROGRESS</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
          {index + 1} of {TOTAL_QUESTIONS}
        </p>
      </div>

      <h2 className="whitespace-pre-line px-5 pt-5 text-[1.75rem] font-black leading-[1.15] tracking-[-0.01em] text-text-primary">{prompt}</h2>
      <p className="whitespace-pre-line px-5 pt-2 text-sm font-bold text-text-secondary">{deck}</p>

      <div className="mt-6 px-5">{children}</div>

      {confirmed && (
        <div className="mt-5 flex flex-col items-start gap-3 px-5">
          <p className="text-sm font-bold text-text-secondary">{confirmationText}</p>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-11 items-center justify-center bg-text-primary px-6 text-sm font-black uppercase tracking-[0.04em] text-background"
          >
            다음 페이지
          </button>
        </div>
      )}

      <YourPageStatus filled={filled} />
    </div>
  );
}

// ============================================================
// ChoiceCard — VisualChoice 전용. 사진 전체 + A/B 표식 + 문장까지
// 한 덩어리로 클릭 가능한 카드.
// ============================================================
function ChoiceCard({
  choiceKey,
  asset,
  sentence,
  selected,
  dimmed,
  onSelect,
}: {
  choiceKey: "A" | "B";
  asset: MagazineVisualAsset | null;
  sentence: string;
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
      {asset ? (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: asset.aspectRatio.replace(":", " / ") }}>
          <img src={asset.src} alt={asset.alt} className="size-full object-cover" style={{ objectPosition: asset.objectPositionMobile }} />
        </div>
      ) : (
        <EditorialImageFrame ratio="4:5" label={`IMAGE ${choiceKey}`} />
      )}
      <div className="flex flex-col gap-1.5">
        <span
          className={cx(
            "flex size-6 items-center justify-center border font-serif text-[11px] font-bold transition-all duration-normal",
            selected ? "border-text-primary bg-text-primary text-background" : "border-border-strong text-text-muted"
          )}
        >
          {choiceKey}
        </span>
        <p className="whitespace-pre-line text-sm font-bold leading-5 text-text-primary">{sentence}</p>
      </div>
    </button>
  );
}

// 375px에서는 세로 stack(부모가 flex-col), 430px부터는 부모가
// flex-row로 바뀌어 2열 비교가 된다 — 컴포넌트 자체는 모바일/데스크톱
// 동일하다.
function VisualChoiceGroup({
  question,
  selected,
  onSelect,
}: {
  question: VisualChoiceQuestion;
  selected: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 min-[430px]:flex-row">
      {question.options.map((option) => (
        <ChoiceCard
          key={option.id}
          choiceKey={option.key}
          asset={option.asset}
          sentence={option.sentence}
          selected={selected === option.id}
          dimmed={selected !== null && selected !== option.id}
          onSelect={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// ObjectCard / ObjectChoiceGrid — Q2 전용. VisualChoice와 완전히
// 다른 문법: A/B 2장 비교가 아니라 4개 중 하나를 고르는 큐레이션
// 방식이다. 번호+카테고리(eyebrow) → 물건 이름 → 한 줄 설명 순서로
// 정보 위계를 준다. 이번 라운드는 이미지가 없어 전부 neutral
// placeholder를 쓴다 — asset이 오면 ChoiceCard와 동일하게 실제
// 이미지로 바로 교체된다.
// ============================================================
function ObjectCard({
  item,
  selected,
  dimmed,
  onSelect,
}: {
  item: ObjectChoiceItem;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "flex flex-col gap-3 border p-3 text-left transition-all duration-normal",
        selected ? "border-text-primary" : "border-border-strong",
        dimmed && "opacity-50"
      )}
    >
      {item.asset ? (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: item.asset.aspectRatio.replace(":", " / ") }}>
          <img src={item.asset.src} alt={item.asset.alt} className="size-full object-cover" style={{ objectPosition: item.asset.objectPositionMobile }} />
        </div>
      ) : (
        <EditorialImageFrame ratio="4:5" label={`${item.number} ${item.category}`} labelSize="small" />
      )}
      <div className="flex flex-col gap-1">
        <span
          className={cx(
            "font-serif text-[11px] font-bold uppercase tracking-[0.06em] transition-all duration-normal",
            selected ? "text-text-primary" : "text-text-muted"
          )}
        >
          {item.number} {item.category}
        </span>
        <p className="text-sm font-bold leading-5 text-text-primary">{item.title}</p>
        <p className="text-xs font-bold leading-4 text-text-secondary">{item.description}</p>
      </div>
    </button>
  );
}

function ObjectChoiceGrid({
  question,
  selected,
  onSelect,
}: {
  question: ObjectChoiceQuestion;
  selected: string | null;
  onSelect: (itemId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2">
      {question.items.map((item) => (
        <ObjectCard
          key={item.id}
          item={item}
          selected={selected === item.id}
          dimmed={selected !== null && selected !== item.id}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// Question03Placeholder — 이번 라운드에서는 실제 3번 문항을 만들지
// 않는다. 흐름이 계속된다는 것만 보여주는 자리표시자.
// ============================================================
function Question03Placeholder({ filled }: { filled: PageSectionKey[] }) {
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · PAGE IN PROGRESS</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">3 of {TOTAL_QUESTIONS}</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">QUESTION 03</p>
        <p className="text-lg font-black text-text-primary">PLACEHOLDER</p>
        <p className="text-sm font-bold text-text-secondary">3~6번 문항은 이번 라운드에서 만들지 않았습니다.</p>
      </div>
      <YourPageStatus filled={filled} />
    </div>
  );
}

// ============================================================
// ROOT — answers는 문항 id별로 선택값을 들고 있어서, 나중에 Q1로
// 돌아가는 navigation을 붙이더라도 선택값이 그대로 유지된다.
// ============================================================
type Stage = "intro" | "question" | "q3placeholder";

export function QuizSkeletonPrototype() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = QUIZ_QUESTIONS[questionIndex];
  const filledSections = QUIZ_QUESTIONS.filter((q) => answers[q.id]).map((q) => q.pageSection);

  function handleStart() {
    setStage("question");
    setQuestionIndex(0);
  }

  function handleSelect(questionId: string, choiceId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  function handleNext() {
    if (questionIndex + 1 >= QUIZ_QUESTIONS.length) {
      setStage("q3placeholder");
      return;
    }
    setQuestionIndex((i) => i + 1);
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — EDITORIAL QUIZ UX (TASTE Q1·Q2만 실제 구현)
      </div>

      <div className="mx-auto max-w-md">
        {stage === "intro" && <QuizIntro chapterNumber={TASTE_CHAPTER.number} chapterTitle={TASTE_CHAPTER.title} onStart={handleStart} />}

        {stage === "question" && (
          <QuestionShell
            index={questionIndex}
            prompt={currentQuestion.prompt}
            deck={currentQuestion.deck}
            filled={filledSections}
            confirmed={Boolean(answers[currentQuestion.id])}
            confirmationText={currentQuestion.confirmationText}
            onNext={handleNext}
          >
            {currentQuestion.kind === "visual-choice" ? (
              <VisualChoiceGroup
                question={currentQuestion}
                selected={answers[currentQuestion.id] ?? null}
                onSelect={(optionId) => handleSelect(currentQuestion.id, optionId)}
              />
            ) : (
              <ObjectChoiceGrid
                question={currentQuestion}
                selected={answers[currentQuestion.id] ?? null}
                onSelect={(itemId) => handleSelect(currentQuestion.id, itemId)}
              />
            )}
          </QuestionShell>
        )}

        {stage === "q3placeholder" && <Question03Placeholder filled={filledSections} />}
      </div>
    </div>
  );
}

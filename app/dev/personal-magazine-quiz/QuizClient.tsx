"use client";

import { useState } from "react";
import { EditorialImageFrame } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";

// EDITORIAL QUIZ UX 1차 구현(2026-08) — dev-only. TASTE 챕터의 실제
// 첫 문항 하나만 완성한다(문항 6개 전체가 아니다). 검증 질문은 하나:
// "심리테스트를 푼다"가 아니라 "내 Magazine의 한 페이지를 만들어간다"고
// 느껴지는가?
//
// 가장 중요한 원칙: 질문/선택지/진행률/YOUR PAGE 전부 HTML이다. 사진
// 위에 텍스트를 박아 넣은 합성 이미지를 쓰지 않는다 — IMAGE + INTERACTIVE
// UI 구조를 지킨다. A/B 사진은 magazineVisualAssets.quiz.taste.q01에서
// 실제 이미지를 읽어온다(2026-08 라운드에 연결). 카드 프레임 비율을
// 이미지의 실제 비율(3:2)과 맞춰서 object-cover를 써도 잘리는 부분 없이
// 원본 전체가 보인다 — EditorialImageFrame은 asset이 비어 있을 때를
// 대비한 fallback으로 남겨둔다.
//
// 사용자 정신모델은 "문제를 푼다"가 아니라 "내 Magazine을 만든다"다.
// 화면 언어에서 TEST/ASSESSMENT/심리검사 대신 PAGE IN PROGRESS·YOUR
// PAGE·CHOICE·ISSUE·CHAPTER를 쓴다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TASTE_CHAPTER = { id: "taste", number: "02", title: "TASTE" };
const TOTAL_QUESTIONS = 6;

// YOUR PAGE에 표시되는 4개 영역. 첫 문항은 PLACE 성격이라 답변 즉시
// PLACE만 채워진다 — 실제 채점/분류 로직은 아직 없다.
const PAGE_SECTIONS = [
  { key: "place", label: "PLACE" },
  { key: "object", label: "OBJECT" },
  { key: "detail", label: "DETAIL" },
  { key: "mood", label: "MOOD" },
] as const;

// 실제 TASTE 1번 문항. 향후 문항이 늘어나면 이 상수를 배열로
// 확장하면 된다 — 지금은 1문항만 검증하므로 단일 객체로 둔다.
const TASTE_Q1 = {
  prompt: "쉬는 오후,\n더 마음이 가는 장면은?",
  deck: "내 TASTE 지면에 더 가까운 장면을 선택해 주세요.",
  optionA: {
    asset: magazineVisualAssets.quiz.taste.q01.a,
    sentence: "햇살이 드는 조용한 카페에서\n책과 커피를 즐긴다",
  },
  optionB: {
    asset: magazineVisualAssets.quiz.taste.q01.b,
    sentence: "사람들과 어울리며\n도시의 에너지를 느낀다",
  },
};

// ============================================================
// YourPageStatus — "Magazine이 채워지고 있다"는 진행감. 답변한
// 영역만 채워진 상태(active)로, 나머지는 빈 상태로 보인다.
// ============================================================
function YourPageStatus({ filled }: { filled: string[] }) {
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
// ChoiceCard — 사진 전체 + A/B 표식 + 문장까지 한 덩어리로 클릭
// 가능한 카드. 375px에서는 세로 stack(부모가 flex-col), 430px부터는
// 부모가 flex-row로 바뀌어 2열 비교가 된다 — 이 컴포넌트 자체는
// 모바일/데스크톱 동일하다(별도 desktop 전용 UI를 만들지 않는다).
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
  asset: (typeof TASTE_Q1.optionA)["asset"];
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

// ============================================================
// TasteQuestion01 — 실제로 완성된 첫 문항. 선택 즉시 다음으로
// 자동 이동하지 않는다 — 짧은 confirmation을 먼저 보여주고,
// NEXT를 눌러야 다음 상태로 넘어간다.
// ============================================================
function TasteQuestion01({
  selected,
  onSelect,
  onNext,
}: {
  selected: "A" | "B" | null;
  onSelect: (choice: "A" | "B") => void;
  onNext: () => void;
}) {
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · PAGE IN PROGRESS</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">1 of {TOTAL_QUESTIONS}</p>
      </div>

      <h2 className="whitespace-pre-line px-5 pt-5 text-[1.75rem] font-black leading-[1.15] tracking-[-0.01em] text-text-primary">
        {TASTE_Q1.prompt}
      </h2>
      <p className="px-5 pt-2 text-sm font-bold text-text-secondary">{TASTE_Q1.deck}</p>

      <div className="mt-6 flex flex-col gap-3 px-5 min-[430px]:flex-row">
        <ChoiceCard
          choiceKey="A"
          asset={TASTE_Q1.optionA.asset}
          sentence={TASTE_Q1.optionA.sentence}
          selected={selected === "A"}
          dimmed={selected === "B"}
          onSelect={() => onSelect("A")}
        />
        <ChoiceCard
          choiceKey="B"
          asset={TASTE_Q1.optionB.asset}
          sentence={TASTE_Q1.optionB.sentence}
          selected={selected === "B"}
          dimmed={selected === "A"}
          onSelect={() => onSelect("B")}
        />
      </div>

      {selected && (
        <div className="mt-5 flex flex-col items-start gap-3 px-5">
          <p className="text-sm font-bold text-text-secondary">첫 장면이 담겼습니다.</p>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-11 items-center justify-center bg-text-primary px-6 text-sm font-black uppercase tracking-[0.04em] text-background"
          >
            다음 페이지
          </button>
        </div>
      )}

      <YourPageStatus filled={selected ? ["place"] : []} />
    </div>
  );
}

// ============================================================
// Question02Placeholder — 이번 라운드에서는 실제 2번 문항을 만들지
// 않는다. 흐름이 계속된다는 것만 보여주는 자리표시자.
// ============================================================
function Question02Placeholder() {
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">TASTE · PAGE IN PROGRESS</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">2 of {TOTAL_QUESTIONS}</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">QUESTION 02</p>
        <p className="text-lg font-black text-text-primary">PLACEHOLDER</p>
        <p className="text-sm font-bold text-text-secondary">2~6번 문항은 이번 라운드에서 만들지 않았습니다.</p>
      </div>
      <YourPageStatus filled={["place"]} />
    </div>
  );
}

// ============================================================
// ROOT
// ============================================================
type Stage = "intro" | "q1" | "q2placeholder";

export function QuizSkeletonPrototype() {
  const [stage, setStage] = useState<Stage>("intro");
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | null>(null);

  function handleStart() {
    setStage("q1");
    setSelectedChoice(null);
  }

  function handleSelect(choice: "A" | "B") {
    setSelectedChoice(choice);
  }

  function handleNext() {
    setStage("q2placeholder");
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — EDITORIAL QUIZ UX 1차 구현 (TASTE 1문항만 실제 구현)
      </div>

      <div className="mx-auto max-w-md">
        {stage === "intro" && <QuizIntro chapterNumber={TASTE_CHAPTER.number} chapterTitle={TASTE_CHAPTER.title} onStart={handleStart} />}
        {stage === "q1" && <TasteQuestion01 selected={selectedChoice} onSelect={handleSelect} onNext={handleNext} />}
        {stage === "q2placeholder" && <Question02Placeholder />}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { mapTasteAnswersToSignalSources, type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { TASTE_QUESTIONS_V2_2 } from "../../../src/data/tasteQuestionnaireV22";
import { buildTasteMagazineNarrativeV23 } from "../../../src/data/tasteNarrativeV23";
import { TasteQuestionnaireFlow } from "../personal-magazine-quiz/TasteQuestionnaireFlow";
import { TasteMagazineResult } from "../personal-magazine-taste-result/TasteMagazineResult";

// PRIVATE BETA 0.9 ROUND 1(2026-08) — HOME → TASTE INTRO → 기존 TASTE
// JOURNEY(Questionnaire v2.2 + Narrative v2.3 Final/Opening Arbitration)
// 진입까지만 다루는 라운드. 엔진(Questionnaire/signal/relationship/
// Narrative/Result Art Direction)은 전부 동결 — 이 파일은 그 앞단
// 진입 경험(HOME/INTRO)과 최소한의 화면 전환 상태만 새로 만든다.
//
// buildTasteMagazineNarrativeV23()/TasteMagazineResult는 완주 시
// 도달하는 기존 Journey를 그대로 재사용한 것이다(§3 "기존 TASTE
// JOURNEY 진입") — 이번 라운드가 검증·스크린샷 대상으로 요구하는
// 범위는 HOME→INTRO→Q1까지이지만, onComplete가 반드시 어딘가로
// 이어져야 하는 공유 컴포넌트 구조라 완주 경로 자체는 기존 Journey
// 파이프라인(TasteJourneyClient.tsx와 동일 조합)을 그대로 연결해
// 두었다 — 새 Result 화면을 만들지 않았다.

type Stage = "home" | "intro" | "flow" | "editing" | "result";

// EDITING PRODUCTIZATION(2026-08, Round 2) — §3 확정 4개 processing line
// 그대로. 각 줄이 LINE_STAGGER_MS 간격으로 순서대로 나타난 뒤,
// READY_APPEAR_MS 시점에 "YOUR ISSUE IS READY."가 뜨고, 그로부터
// AUTO_ADVANCE_AFTER_READY_MS 뒤 Result로 자동 전환된다. §4가 요구한
// "약 2~4초, 10초 이상 artificial delay 금지"를 지키기 위해 실제
// 합계(READING_TO_READY_TOTAL_MS + AUTO_ADVANCE_AFTER_READY_MS)를
// 약 3.2초로 맞췄다 — 계산 자체는 이미 deterministic/local이라
// 즉시 끝나므로, 이 시간은 순수히 연출용 지연이다.
//
// CTA 없이 자동으로 Result로 넘어가는 방식을 선택했다 — §3이 제시한
// 두 방식(CTA 있음/자동 reveal) 중 "현재 Journey와 더 자연스러운
// 방식"을 고르라고 했는데, 기존 TasteJourneyClient.tsx의 EDITING
// 단계도 이미 CTA 없이 타이머로 자동 전환하는 방식이라 그 관례를
// 그대로 따랐다.
const PROCESSING_LINES = ["READING YOUR CHOICES", "FINDING CONNECTIONS", "EDITING YOUR STORY", "MAKING YOUR ISSUE"];
const LINE_STAGGER_MS = 550;
const READY_APPEAR_MS = LINE_STAGGER_MS * PROCESSING_LINES.length + 450; // 마지막 줄이 뜨고서 여유 0.45초 후 READY
const AUTO_ADVANCE_AFTER_READY_MS = 800;
const EDITING_TOTAL_MS = READY_APPEAR_MS + AUTO_ADVANCE_AFTER_READY_MS;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function HeroFrame({ asset, className }: { asset: MagazineVisualAsset; className?: string }) {
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <div className={cx("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={asset.src} alt={asset.alt} className="size-full object-cover" style={{ objectPosition: asset.objectPositionMobile }} />
    </div>
  );
}

// ============================================================
// HOME — §4/§5 확정 카피 그대로. TASTE Hero를 "미리보기"로 작게,
// 여백을 넉넉히 둬서 INTRO의 풀블리드 프레젠테이션과 구분한다.
// ============================================================
function Home({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-14 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>

      <h1 className="mt-5 whitespace-pre-line text-[2.25rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">나를 한 권으로 만든다.</h1>

      <p className="mt-4 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
        {"몇 가지 선택을 따라가면\n나의 취향과 장면이\n한 권의 Magazine으로 편집됩니다."}
      </p>

      <div className="relative mx-auto mt-8 w-full max-w-[16rem] overflow-hidden border border-border-strong">
        <HeroFrame asset={magazineVisualAssets.taste.hero} />
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 pt-10">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-12 w-full max-w-xs items-center justify-center bg-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-background"
        >
          MAKE MY FIRST ISSUE
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">ISSUE 01 · TASTE</p>
        <p className="font-serif text-xs italic text-text-muted">What you notice, keep, and come back to.</p>
      </div>
    </div>
  );
}

// ============================================================
// TASTE INTRO — §7/§8 확정 카피 그대로. Hero를 풀블리드로 크게 써서
// "이 챕터를 시작한다"는 느낌을 HOME의 미리보기 프레임과 구분한다.
// ============================================================
function TasteIntro({ onBegin, onBack }: { onBegin: () => void; onBack: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pb-10">
      <div className="px-5 pt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted underline decoration-border-strong underline-offset-4"
        >
          ← HOME
        </button>
      </div>

      <div className="mt-4">
        <HeroFrame asset={magazineVisualAssets.taste.hero} />
      </div>

      <div className="flex flex-col px-6 pt-8 text-center">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">YOUR FIRST CHAPTER</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.02em] text-text-primary">TASTE</h1>

        <p className="mt-5 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
          {"좋아하는 것은\n생각보다 많은 것을 말합니다.\n\n눈이 먼저 가는 장면,\n오래 두고 싶은 것,\n익숙함과 새로움 사이에서 하는 선택.\n\n몇 번의 선택을 지나\n당신의 TASTE를\n하나의 Magazine으로 편집합니다."}
        </p>

        <button
          type="button"
          onClick={onBegin}
          className="mt-8 inline-flex h-12 items-center justify-center self-center bg-text-primary px-10 text-sm font-black uppercase tracking-[0.04em] text-background"
        >
          BEGIN
        </button>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">About 3 minutes · No right answers</p>
      </div>
    </div>
  );
}

// ============================================================
// EDITING — §3 확정 카피 그대로. HOME/INTRO/Result와 같은 off-white
// 배경·typography를 재사용하고, SaaS spinner/progress circle/퍼센트
// 바 없이 opacity+translate만 쓰는 절제된 motion으로 4개 processing
// line을 순서대로 드러낸다(§5/§6). 새 라이브러리 도입 없음(순수
// useState/useEffect + Tailwind transition).
// ============================================================
function EditingTransition() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timers = PROCESSING_LINES.map((_, i) => setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), i * LINE_STAGGER_MS));
    timers.push(setTimeout(() => setReady(true), READY_APPEAR_MS));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>

      <h1 className="mt-5 text-3xl font-black leading-[1.15] tracking-[-0.02em] text-text-primary">
        EDITING
        <br />
        YOUR TASTE
      </h1>

      <p className="mt-4 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
        {"당신이 고른 장면과 선택 사이에서\n반복되는 취향과\n의외의 조합을 찾고 있습니다."}
      </p>

      <div className="mt-10 flex flex-col gap-3">
        {PROCESSING_LINES.map((line, i) => (
          <p
            key={line}
            className={cx(
              "text-[11px] font-bold uppercase tracking-[0.1em] transition-all duration-500 ease-out",
              i < visibleCount ? "translate-y-0 text-text-primary opacity-100" : "translate-y-1 text-text-muted opacity-0"
            )}
          >
            {line}
          </p>
        ))}
      </div>

      <p
        className={cx(
          "mt-8 text-sm font-black uppercase tracking-[0.04em] text-text-primary transition-all duration-500 ease-out",
          ready ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        )}
      >
        YOUR ISSUE IS READY.
      </p>
    </div>
  );
}

function JourneyResult({ answers }: { answers: TasteRawAnswers }) {
  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V2_2, answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrativeV23(result, sources);
  return <TasteMagazineResult narrative={narrative} result={result} hideDebugPanel />;
}

// ============================================================
// ROOT — 페이지 reload 없이 stage state만으로 HOME→INTRO→
// Questionnaire→Result를 이어준다(§6 "같은 route 내부 step state").
// V1/V2/V2.1/V2.2 toggle·narrative selector·debug label·"DEV
// PROTOTYPE" 배너·raw answers JSON·internal navigation — 전부 렌더링
//하지 않는다(§10). key={stage}로 TasteQuestionnaireFlow를 새로
// mount하기 때문에 HOME에서 다시 시작하면 이전 답변 state가 전혀
// 남지 않는다(§12 fresh session — 별도 persistence를 새로 만들지
// 않고 React state 초기화만으로 충족한다).
// ============================================================
export function PersonalMagazineBetaClient() {
  const [stage, setStage] = useState<Stage>("home");
  const [answers, setAnswers] = useState<TasteRawAnswers | null>(null);

  useEffect(() => {
    if (stage !== "editing") return;
    const timer = setTimeout(() => setStage("result"), EDITING_TOTAL_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  function handleRestart() {
    setAnswers(null);
    setStage("home");
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      {stage === "home" && <Home onStart={() => setStage("intro")} />}

      {stage === "intro" && <TasteIntro onBegin={() => setStage("flow")} onBack={handleRestart} />}

      {stage === "flow" && (
        <div className="mx-auto max-w-md">
          <TasteQuestionnaireFlow
            key="beta-flow"
            questions={TASTE_QUESTIONS_V2_2}
            startAtQuestion
            onComplete={(completedAnswers) => {
              setAnswers(completedAnswers);
              setStage("editing");
            }}
          />
        </div>
      )}

      {stage === "editing" && <EditingTransition />}

      {stage === "result" && answers && <JourneyResult answers={answers} />}
    </div>
  );
}

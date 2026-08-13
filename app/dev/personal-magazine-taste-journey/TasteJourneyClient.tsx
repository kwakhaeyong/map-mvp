"use client";

import { useEffect, useState } from "react";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, mapTasteAnswersToSignalSources, type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { buildTasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { TasteQuestionnaireFlow } from "../personal-magazine-quiz/TasteQuestionnaireFlow";
import { TasteMagazineResult } from "../personal-magazine-taste-result/TasteMagazineResult";

// TASTE END-TO-END JOURNEY(2026-08) — dev 전용. 한 사용자가 실제로
// TASTE INTRO → PAGE 01~06 → EDITING → MAGAZINE RESULT까지 한 번에
// 체험하는 화면. answers state는 이 컴포넌트 하나에서 처음부터 끝까지
// 유지된다 — Result는 mock profile이 아니라 방금 사용자가 고른 실제
// 답변으로 만들어진다.
//
//   TasteQuestionnaireFlow(intro→question, 재사용) → onComplete(answers)
//   → mapTasteAnswersToSignalSources() → analyzeTasteFromSources()
//   → buildTasteMagazineNarrative() → TasteMagazineResult(재사용)
//
// Questionnaire/Narrative/Result 컴포넌트는 전부 기존 것을 그대로
// import해서 쓴다 — 이 파일은 새 문항/카피/레이아웃을 만들지 않는다.

const EDITING_DURATION_MS = 1500;

function EditingTransition() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">TASTE</p>
      <p className="mt-3 text-lg font-black tracking-[-0.01em] text-text-primary">EDITING YOUR TASTE</p>
    </div>
  );
}

type JourneyStage = "flow" | "editing" | "result";

export function TasteJourneyClient() {
  const [stage, setStage] = useState<JourneyStage>("flow");
  const [finalAnswers, setFinalAnswers] = useState<TasteRawAnswers | null>(null);

  useEffect(() => {
    if (stage !== "editing") return;
    const timer = setTimeout(() => setStage("result"), EDITING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE END-TO-END JOURNEY (실제 답변 → 실제 Result)
      </div>

      {stage === "flow" && (
        <div className="mx-auto max-w-md">
          <TasteQuestionnaireFlow
            onComplete={(answers) => {
              setFinalAnswers(answers);
              setStage("editing");
            }}
          />
        </div>
      )}

      {stage === "editing" && <EditingTransition />}

      {stage === "result" && finalAnswers && <JourneyResult answers={finalAnswers} />}
    </div>
  );
}

function JourneyResult({ answers }: { answers: TasteRawAnswers }) {
  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V1, answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrative(result, sources);

  return <TasteMagazineResult narrative={narrative} result={result} />;
}

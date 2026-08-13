"use client";

import { useEffect, useState } from "react";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, mapTasteAnswersToSignalSources, type TasteQuestion, type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { TASTE_QUESTIONS_V2 } from "../../../src/data/tasteQuestionnaireV2";
import { TASTE_QUESTIONS_V2_2 } from "../../../src/data/tasteQuestionnaireV22";
import { buildTasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { buildTasteMagazineNarrativeV2 } from "../../../src/data/tasteNarrativeV2";
import { buildTasteMagazineNarrativeV22 } from "../../../src/data/tasteNarrativeV22";
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
//
// v2(TASTE Questionnaire v2 + Narrative v2, 2026-08) — v1은 삭제하지
// 않고 dev 비교용으로 그대로 둔다는 지시에 따라 QUESTIONNAIRE 버전과
// NARRATIVE 엔진 버전을 각각 독립적으로 토글할 수 있게 한다. 같은
// answers/sources로 v1/v2 Narrative를 둘 다 만들어볼 수 있어야
// "동일 답변 기준 V1 Result vs V2 Result 비교"(검증자료 요구사항)를
// questionnaire를 다시 풀지 않고도 확인할 수 있다.
//
// v2.2(2026-08) — buildTasteMagazineNarrativeV2()는 GPT의 v2.1 교정
// 지시를 그대로 반영해 이미 제자리에서 수정됐다(파일/함수명은 v2
// 그대로) — 그래서 버튼 라벨만 "V2.1"로 보여주고, 신규 v2.2 엔진
// (buildTasteMagazineNarrativeV22)을 세 번째 옵션으로 추가한다.

type QuestionnaireVersion = "v1" | "v2" | "v2.2";
type NarrativeVersion = "v1" | "v2" | "v2.2";

const QUESTIONNAIRE_VERSIONS: QuestionnaireVersion[] = ["v1", "v2", "v2.2"];
const NARRATIVE_VERSIONS: NarrativeVersion[] = ["v1", "v2", "v2.2"];
const VERSION_LABEL: Record<"v1" | "v2" | "v2.2", string> = { v1: "V1", v2: "V2.1", "v2.2": "V2.2" };

function questionsForVersion(version: QuestionnaireVersion): TasteQuestion[] {
  if (version === "v1") return TASTE_QUESTIONS_V1;
  if (version === "v2") return TASTE_QUESTIONS_V2;
  return TASTE_QUESTIONS_V2_2;
}

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
  const [questionnaireVersion, setQuestionnaireVersion] = useState<QuestionnaireVersion>("v2");
  const [narrativeVersion, setNarrativeVersion] = useState<NarrativeVersion>("v2");
  const [stage, setStage] = useState<JourneyStage>("flow");
  const [finalAnswers, setFinalAnswers] = useState<TasteRawAnswers | null>(null);
  const questions = questionsForVersion(questionnaireVersion);

  useEffect(() => {
    if (stage !== "editing") return;
    const timer = setTimeout(() => setStage("result"), EDITING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  function handleQuestionnaireVersionChange(next: QuestionnaireVersion) {
    setQuestionnaireVersion(next);
    setStage("flow");
    setFinalAnswers(null);
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE END-TO-END JOURNEY (실제 답변 → 실제 Result)
      </div>

      <div className="sticky top-[33px] z-40 flex flex-wrap items-center justify-center gap-4 border-b border-border-strong bg-background px-5 py-3">
        <div className="flex items-center gap-2" data-testid="questionnaire-version-toggle">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">QUESTIONNAIRE</span>
          {QUESTIONNAIRE_VERSIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleQuestionnaireVersionChange(v)}
              className={
                questionnaireVersion === v
                  ? "border border-text-primary bg-text-primary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-background"
                  : "border border-border-strong px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-text-secondary"
              }
            >
              {VERSION_LABEL[v]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2" data-testid="narrative-version-toggle">
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">NARRATIVE</span>
          {NARRATIVE_VERSIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setNarrativeVersion(v)}
              className={
                narrativeVersion === v
                  ? "border border-text-primary bg-text-primary px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-background"
                  : "border border-border-strong px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-text-secondary"
              }
            >
              {VERSION_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      {stage === "flow" && (
        <div className="mx-auto max-w-md">
          <TasteQuestionnaireFlow
            key={questionnaireVersion}
            questions={questions}
            onComplete={(answers) => {
              setFinalAnswers(answers);
              setStage("editing");
            }}
          />
        </div>
      )}

      {stage === "editing" && <EditingTransition />}

      {stage === "result" && finalAnswers && (
        <JourneyResult questions={questions} answers={finalAnswers} narrativeVersion={narrativeVersion} />
      )}
    </div>
  );
}

function JourneyResult({
  questions,
  answers,
  narrativeVersion,
}: {
  questions: TasteQuestion[];
  answers: TasteRawAnswers;
  narrativeVersion: NarrativeVersion;
}) {
  const sources = mapTasteAnswersToSignalSources(questions, answers);
  const result = analyzeTasteFromSources(sources);
  const narrative =
    narrativeVersion === "v1"
      ? buildTasteMagazineNarrative(result, sources)
      : narrativeVersion === "v2"
        ? buildTasteMagazineNarrativeV2(result, sources)
        : buildTasteMagazineNarrativeV22(result, sources);

  return <TasteMagazineResult narrative={narrative} result={result} />;
}

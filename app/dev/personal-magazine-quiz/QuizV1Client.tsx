"use client";

import { useState } from "react";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, mapTasteAnswersToSignalSources, type TasteQuestion, type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { TASTE_QUESTIONS_V2 } from "../../../src/data/tasteQuestionnaireV2";
import { TASTE_QUESTIONS_V2_2 } from "../../../src/data/tasteQuestionnaireV22";
import { TASTE_CHAPTER, TasteQuestionnaireFlow, YourPageStatus } from "./TasteQuestionnaireFlow";

// TASTE QUESTIONNAIRE(2026-08) — GPT가 검증 완료한 실제 6 PAGE
// Questionnaire를 렌더링하는 dev-only 화면. 실제 intro→question 흐름은
// TasteQuestionnaireFlow.tsx(재사용 컴포넌트)가 담당한다 — 이 파일은
// 완료 후 raw answers/signal sources/analyzeTasteFromSources() 결과를
// 그대로 보여주는 dev 확인 화면(CompletionDebugView)만 갖고 있다.
//
// Magazine Result 화면으로 자동 연결하지 않는다(이 라우트의 목적은
// 여전히 "구조 검증"이다 — 실제 답변 → Magazine Result 전체 흐름은
// /dev/personal-magazine-taste-journey에서 확인한다).
//
// v2(2026-08) — v1은 삭제하지 않고 dev 비교용으로 그대로 둔다는 지시에
// 따라 이 화면에 V1/V2 questionnaire 버전 토글을 추가한다.

type QuestionnaireVersion = "v1" | "v2" | "v2.2";

const QUESTIONNAIRE_VERSIONS: QuestionnaireVersion[] = ["v1", "v2", "v2.2"];

function questionsForVersion(version: QuestionnaireVersion): TasteQuestion[] {
  if (version === "v1") return TASTE_QUESTIONS_V1;
  if (version === "v2") return TASTE_QUESTIONS_V2;
  return TASTE_QUESTIONS_V2_2;
}

// ============================================================
// COMPLETE — 6 PAGE 완료 후 dev 확인 화면.
// ============================================================
function CompletionDebugView({ answers, questions }: { answers: TasteRawAnswers; questions: TasteQuestion[] }) {
  const sources = mapTasteAnswersToSignalSources(questions, answers);
  const result = analyzeTasteFromSources(sources);

  return (
    <div className="pb-16">
      <div className="flex flex-col items-center gap-2 px-6 pt-16 text-center">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
          CHAPTER {TASTE_CHAPTER.number} · {TASTE_CHAPTER.title}
        </p>
        <h1 className="text-3xl font-black leading-tight tracking-[-0.02em] text-text-primary">TASTE 페이지가 완성됐습니다.</h1>
        <p className="text-sm font-bold text-text-secondary">6개 PAGE가 모두 채워졌습니다. 실제 Magazine 문구는 다음 단계에서 만들어집니다.</p>
      </div>

      <YourPageStatus filled={["place", "object", "detail", "ritual"]} />

      <div className="mt-10 border-t border-dashed border-border-strong px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEV DATA · RAW ANSWERS</p>
        <pre className="mt-3 overflow-x-auto border border-border-strong bg-tag-fill p-3 text-[10px] leading-4 text-text-secondary">
          {JSON.stringify(answers, null, 2)}
        </pre>
      </div>

      <div className="mt-6 px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEV DATA · SIGNAL SOURCES ({sources.length})</p>
        <pre className="mt-3 overflow-x-auto border border-border-strong bg-tag-fill p-3 text-[10px] leading-4 text-text-secondary">
          {JSON.stringify(sources, null, 2)}
        </pre>
      </div>

      <div className="mt-6 px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEV DATA · ANALYSIS JSON (analyzeTasteFromSources)</p>
        <pre className="mt-3 overflow-x-auto border border-border-strong bg-tag-fill p-3 text-[10px] leading-4 text-text-secondary">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// ROOT
// ============================================================
type Stage = "flow" | "complete";

export function TasteQuestionnaireV1Client() {
  const [version, setVersion] = useState<QuestionnaireVersion>("v1");
  const [stage, setStage] = useState<Stage>("flow");
  const [finalAnswers, setFinalAnswers] = useState<TasteRawAnswers>({});
  const questions = questionsForVersion(version);

  function handleVersionChange(next: QuestionnaireVersion) {
    setVersion(next);
    setStage("flow");
    setFinalAnswers({});
  }

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE QUESTIONNAIRE (실제 6 PAGE 구현)
      </div>

      <div className="sticky top-[33px] z-40 flex justify-center gap-2 border-b border-border-strong bg-background px-5 py-3">
        {QUESTIONNAIRE_VERSIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleVersionChange(v)}
            className={
              version === v
                ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
            }
          >
            QUESTIONNAIRE {v.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-md">
        {stage === "flow" && (
          <TasteQuestionnaireFlow
            key={version}
            questions={questions}
            onComplete={(answers) => {
              setFinalAnswers(answers);
              setStage("complete");
            }}
          />
        )}
        {stage === "complete" && <CompletionDebugView answers={finalAnswers} questions={questions} />}
      </div>
    </div>
  );
}

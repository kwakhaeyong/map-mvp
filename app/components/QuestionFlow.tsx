"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMapProgress } from "../hooks/useMapProgress";
import { questionFlowQuestions } from "../lib/mapQuestions";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

export { questionFlowQuestions } from "../lib/mapQuestions";

export function QuestionFlow() {
  const router = useRouter();
  const {
    answersArray,
    currentStep,
    saveLabel,
    isRestored,
    updateAnswer,
    updateStep,
  } = useMapProgress(questionFlowQuestions.length);

  const currentQuestion = questionFlowQuestions[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === questionFlowQuestions.length - 1;
  const currentAnswer = answersArray[currentStep] ?? "";
  const canContinue = currentAnswer.trim().length > 0;

  const answeredCount = useMemo(
    () => answersArray.filter((answer) => answer.trim().length > 0).length,
    [answersArray],
  );

  function goPrevious() {
    updateStep(currentStep - 1);
  }

  function goNext() {
    if (!canContinue) return;

    if (isLast) {
      router.push("/result");
      return;
    }

    updateStep(currentStep + 1);
  }

  if (!isRestored) {
    return (
      <main className="min-h-screen bg-white px-5 py-5 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[42rem] flex-col justify-center">
          <div className="rounded-[2rem] bg-slate-50 p-8 text-center text-base font-black text-slate-400">
            저장된 MAP를 확인하고 있어요.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-5 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[42rem] flex-col justify-center">
        <div className="mb-6 rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-black text-white shadow-xl shadow-slate-200">
          답변 {answeredCount}개가 MAP로 정리되고 있어요
        </div>

        <div className="rounded-[2.5rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-4 shadow-2xl shadow-slate-100">
          <div className="rounded-[2rem] bg-white/80 p-5 backdrop-blur-xl sm:p-6">
            <ProgressBar current={currentStep + 1} total={questionFlowQuestions.length} />
            <div className="mt-6">
              <QuestionCard
                question={currentQuestion}
                value={currentAnswer}
                onChange={(value) => updateAnswer(currentStep, value)}
              />
            </div>
            <p className="mt-3 text-right text-xs font-bold text-slate-400" aria-live="polite">
              {saveLabel}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={goPrevious}
                disabled={isFirst}
                className="rounded-full border border-slate-200 px-5 py-4 text-base font-black text-slate-500 transition enabled:hover:border-slate-950 enabled:hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className="rounded-full bg-slate-950 px-5 py-4 text-base font-black text-white shadow-xl shadow-slate-200 transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLast ? "결과 보기" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

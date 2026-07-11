"use client";

import { useEffect, useState } from "react";
import { readMapProgress } from "../lib/mapProgressStorage";
import { createVisualMapResult, VisualMapResult } from "../lib/mapResult";
import { questionFlowQuestions } from "../lib/mapQuestions";
import { DecisionCard } from "./map/DecisionCard";
import { MapSummaryHeader } from "./map/MapSummaryHeader";
import { ResultActions } from "./map/ResultActions";
import { VisualMap } from "./map/VisualMap";

export function ResultCard() {
  const [result, setResult] = useState<VisualMapResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = readMapProgress(questionFlowQuestions.length);
    setResult(createVisualMapResult(saved));
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-white px-5 py-5 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[48rem] flex-col justify-center">
          <div className="rounded-[2rem] bg-slate-50 p-8 text-center text-base font-black text-slate-400">
            MAP를 그리고 있어요.
          </div>
        </section>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-screen bg-white px-5 py-5 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[42rem] flex-col justify-center">
          <article className="rounded-[2.5rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-4 shadow-2xl shadow-slate-100">
            <div className="rounded-[2rem] bg-white p-6 text-center shadow-xl shadow-white/80 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-400">Visual MAP</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                아직 MAP가 비어 있어요
              </h1>
              <p className="mt-4 text-lg font-bold leading-8 tracking-[-0.03em] text-slate-500">
                질문 플로우에서 답변을 입력하면 생각 지도가 만들어집니다.
              </p>
              <ResultActions />
            </div>
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white px-5 py-5 text-slate-950 sm:py-8">
      <section className="mx-auto grid w-full max-w-6xl gap-5 sm:gap-6">
        <MapSummaryHeader result={result} />
        <VisualMap result={result} />
        <DecisionCard result={result} />
        <ResultActions />
      </section>
    </main>
  );
}

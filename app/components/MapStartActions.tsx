"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapProgressData,
  clearMapProgress,
  mapProgressHasAnswers,
  readMapProgress,
} from "../lib/mapProgressStorage";
import { questionFlowQuestions } from "../lib/mapQuestions";

interface MapStartActionsProps {
  variant?: "hero" | "nav";
  startLabel?: string;
}

export function MapStartActions({ variant = "hero", startLabel = "MAP 시작하기" }: MapStartActionsProps) {
  const router = useRouter();
  const [savedProgress, setSavedProgress] = useState<MapProgressData | null>(null);
  const hasSavedProgress = mapProgressHasAnswers(savedProgress);

  useEffect(() => {
    setSavedProgress(readMapProgress(questionFlowQuestions.length));
  }, []);

  function startFresh() {
    if (hasSavedProgress) {
      const confirmed = window.confirm("기존에 작성 중인 내용이 삭제됩니다. 새로 시작하시겠습니까?");
      if (!confirmed) return;
    }

    clearMapProgress();
    setSavedProgress(null);
    router.push("/questions");
  }

  function continueProgress() {
    router.push("/questions");
  }

  if (variant === "nav") {
    return (
      <button type="button" onClick={hasSavedProgress ? continueProgress : startFresh} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
        {hasSavedProgress ? "이어서 하기" : startLabel}
      </button>
    );
  }

  if (hasSavedProgress) {
    return (
      <div className="rounded-[1.75rem] border border-rose-100 bg-white/85 p-3 shadow-2xl shadow-rose-100/70 backdrop-blur-xl sm:inline-flex sm:items-center sm:gap-3">
        <p className="px-2 pb-3 text-center text-sm font-black text-rose-500 sm:pb-0">
          작성 중인 MAP가 있습니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={continueProgress}
            className="rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-600 to-sky-500 px-6 py-3 text-base font-black text-white shadow-xl shadow-rose-100 transition hover:-translate-y-0.5"
          >
            이어서 하기
          </button>
          <button
            type="button"
            onClick={startFresh}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
          >
            새로 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startFresh}
      className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-600 to-sky-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-200 transition hover:-translate-y-1 sm:w-auto"
    >
      {startLabel}
    </button>
  );
}

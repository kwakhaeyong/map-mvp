"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapProgressData,
  clearMapProgress,
  createInitialMapProgress,
  readMapProgress,
  writeMapProgress,
} from "../lib/mapProgressStorage";

export function useMapProgress(totalQuestions: number) {
  const [progress, setProgress] = useState<MapProgressData>(() => createInitialMapProgress(totalQuestions));
  const [isRestored, setIsRestored] = useState(false);
  const [saveLabel, setSaveLabel] = useState("자동 저장 준비됨");

  useEffect(() => {
    const saved = readMapProgress(totalQuestions);
    if (saved) {
      setProgress(saved);
      setSaveLabel("이전 MAP를 불러왔어요");
    }
    setIsRestored(true);
  }, [totalQuestions]);

  const answersArray = useMemo(
    () => Array.from({ length: totalQuestions }, (_, index) => progress.answers[`q${index + 1}`] ?? ""),
    [progress.answers, totalQuestions],
  );

  const updateAnswer = useCallback((questionIndex: number, value: string) => {
    setProgress((previous) => {
      const next = {
        ...previous,
        answers: {
          ...previous.answers,
          [`q${questionIndex + 1}`]: value,
        },
        lastUpdatedAt: new Date().toISOString(),
      };
      writeMapProgress(next);
      setSaveLabel("자동 저장됨");
      return next;
    });
  }, []);

  const updateStep = useCallback((step: number) => {
    setProgress((previous) => {
      const next = {
        ...previous,
        currentStep: Math.min(Math.max(step, 0), totalQuestions - 1),
        lastUpdatedAt: new Date().toISOString(),
      };
      writeMapProgress(next);
      setSaveLabel("진행 위치 저장됨");
      return next;
    });
  }, [totalQuestions]);

  const resetProgress = useCallback(() => {
    clearMapProgress();
    const next = createInitialMapProgress(totalQuestions);
    setProgress(next);
    setSaveLabel("새 MAP를 시작했어요");
    writeMapProgress(next);
  }, [totalQuestions]);

  return {
    progress,
    answersArray,
    currentStep: progress.currentStep,
    saveLabel,
    isRestored,
    updateAnswer,
    updateStep,
    resetProgress,
  };
}

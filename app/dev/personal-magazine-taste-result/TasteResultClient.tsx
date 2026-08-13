"use client";

import { useState } from "react";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, TASTE_V1_MOCK_PROFILES, mapTasteAnswersToSignalSources } from "../../../src/data/tasteQuestionnaire";
import { buildTasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { TasteMagazineResult } from "./TasteMagazineResult";

// TASTE EDITORIAL RESULT INTEGRATION v1(2026-08) — dev 전용 mock profile
// 미리보기. 실제 Magazine 지면 렌더링은 TasteMagazineResult.tsx(재사용
// 컴포넌트)가 담당한다 — /dev/personal-magazine-taste-journey(실제 답변
// 기반 결과)도 동일 컴포넌트를 쓴다.
//
// QUESTIONNAIRE(raw answers) → ANALYSIS(analyzeTasteFromSources) →
// NARRATIVE(buildTasteMagazineNarrative) → TasteMagazineResult로 이어지는
// 전체 파이프라인을 그대로 사용한다.

export function TasteResultClient() {
  const [activeId, setActiveId] = useState(TASTE_V1_MOCK_PROFILES[0].id);
  const activeProfile = TASTE_V1_MOCK_PROFILES.find((p) => p.id === activeId) ?? TASTE_V1_MOCK_PROFILES[0];

  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V1, activeProfile.answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrative(result, sources);

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE EDITORIAL RESULT INTEGRATION (구조 검증용)
      </div>

      <div className="sticky top-[33px] z-40 flex flex-wrap gap-2 border-b border-border-strong bg-background px-5 py-3">
        {TASTE_V1_MOCK_PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setActiveId(profile.id)}
            className={
              activeId === profile.id
                ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
            }
          >
            {profile.label}
          </button>
        ))}
      </div>

      <TasteMagazineResult narrative={narrative} result={result} />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  TASTE_MOCK_PROFILES,
  TASTE_SIGNAL_KEYS,
  TASTE_SIGNAL_LABELS,
  analyzeTaste,
  analyzeTasteFromSources,
  type TasteAnalysisResult,
} from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, TASTE_V1_MOCK_PROFILES, mapTasteAnswersToSignalSources } from "../../../src/data/tasteQuestionnaire";

// TASTE ANALYSIS PREVIEW(2026-08) — dev-only 내부 확인 화면. 디자인을
// 고도화하지 않는다 — mock answers를 analyzeTaste()/analyzeTasteFromSources()에
// 넣었을 때 SIGNALS/CONFIDENCE/CORE TRAITS/CONTRADICTIONS/EDITORIAL
// KEYWORDS/NARRATIVE/PAGE PRIORITY/VISUAL DIRECTION이 어떻게 나오는지
// 개발자가 그대로 확인할 수 있는 debug 화면이다. Quiz UI는 이 화면과
// 무관하게 그대로 둔다.
//
// 두 세트를 탭으로 나눠 보여준다:
//   - PROTOTYPE(Q1/Q2): 이전 라운드부터 있던 3개 mock profile.
//   - V1(6 PAGE): TASTE QUESTIONNAIRE v1 실제 구현 이후 추가된 5개
//     mock profile(TASTE_V1_MOCK_PROFILES) — analyzeTasteFromSources()
//     경로를 그대로 검증한다.

const PAGE_SECTION_LABELS: Record<string, string> = {
  place: "PLACE",
  object: "OBJECT",
  detail: "DETAIL",
  ritual: "RITUAL",
};

function SignalBar({ value }: { value: number }) {
  const pct = Math.abs(value); // 0~100
  const isNegative = value < 0;
  return (
    <div className="relative h-2 w-full bg-tag-fill">
      <div
        className={isNegative ? "absolute right-1/2 h-full bg-text-primary" : "absolute left-1/2 h-full bg-text-primary"}
        style={{ width: `${pct / 2}%` }}
      />
      <div className="absolute left-1/2 h-full w-px bg-border-strong" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-strong px-5 py-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function ProfileView({
  label,
  description,
  answersLine,
  result,
}: {
  label: string;
  description: string;
  answersLine: string;
  result: TasteAnalysisResult;
}) {
  return (
    <div className="pb-16">
      <div className="px-5 pt-6">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{label}</p>
        <p className="mt-1 text-sm font-bold text-text-secondary">{description}</p>
        <p className="mt-1 text-[11px] font-bold text-text-muted">answers — {answersLine}</p>
      </div>

      <Section title="Signals">
        {TASTE_SIGNAL_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
              <span>{TASTE_SIGNAL_LABELS[key]}</span>
              <span>
                {result.signals[key] > 0 ? "+" : ""}
                {result.signals[key]} · confidence {result.confidence[key]}%
              </span>
            </div>
            <SignalBar value={result.signals[key]} />
          </div>
        ))}
      </Section>

      <Section title="Core Traits">
        {result.coreTraits.length === 0 && <p className="text-sm text-text-muted">(없음)</p>}
        {result.coreTraits.map((trait) => (
          <div key={trait.id} className="border border-border-strong p-3">
            <p className="text-sm font-black text-text-primary">
              {trait.label} <span className="font-serif text-xs font-bold text-text-muted">({trait.id}) · strength {trait.strength}</span>
            </p>
            <p className="mt-1 text-[11px] font-bold text-text-muted">evidence: {trait.evidence.join(", ")}</p>
          </div>
        ))}
      </Section>

      <Section title="Secondary Traits">
        {result.secondaryTraits.length === 0 && <p className="text-sm text-text-muted">(없음)</p>}
        {result.secondaryTraits.length > 0 && (
          <p className="text-sm font-bold text-text-secondary">{result.secondaryTraits.map((t) => t.label).join(" · ")}</p>
        )}
      </Section>

      <Section title="Contradictions">
        {result.contradictions.length === 0 && <p className="text-sm text-text-muted">(충돌 신호 없음)</p>}
        {result.contradictions.map((c) => (
          <div key={c.id} className="border border-text-primary p-3">
            <p className="text-sm font-black text-text-primary">
              {c.title} <span className="font-serif text-xs font-bold text-text-muted">(axis: {c.axis})</span>
            </p>
            <p className="mt-2 text-sm font-bold leading-5 text-text-secondary">{c.interpretation}</p>
            <p className="mt-2 text-[11px] font-bold text-text-muted">evidence: {c.evidence.join(", ")}</p>
          </div>
        ))}
      </Section>

      <Section title="Editorial Keywords">
        <p className="text-sm font-bold text-text-secondary">{result.editorialKeywords.join(" · ")}</p>
      </Section>

      <Section title="Narrative (Magazine Text)">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Headline</p>
          <p className="whitespace-pre-line text-xl font-black leading-tight text-text-primary">{result.narrative.headline}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Summary</p>
          <p className="text-sm font-bold leading-5 text-text-secondary">{result.narrative.summary}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Feature Analysis</p>
          <div className="mt-1 flex flex-col gap-2">
            {result.narrative.featureAnalysis.map((f) => (
              <div key={f.section}>
                <p className="text-xs font-black text-text-primary">{PAGE_SECTION_LABELS[f.section]}</p>
                <p className="text-sm font-bold leading-5 text-text-secondary">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
        {result.narrative.signatureInsight && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Signature Insight</p>
            <p className="text-sm font-black text-text-primary">{result.narrative.signatureInsight.title}</p>
            <p className="text-sm font-bold leading-5 text-text-secondary">{result.narrative.signatureInsight.text}</p>
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">Pull Quote</p>
          <p className="whitespace-pre-line font-serif text-lg font-medium italic leading-6 text-text-primary">{result.narrative.pullQuote}</p>
        </div>
      </Section>

      <Section title="Page Priority">
        <div className="flex gap-2">
          {result.pagePriority.map((p) => (
            <div key={p.section} className="flex-1 border border-border-strong p-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">{PAGE_SECTION_LABELS[p.section]}</p>
              <p className="text-lg font-black text-text-primary">{p.weight}%</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Visual Direction">
        <p className="text-sm font-bold text-text-secondary">mood: {result.visualDirection.mood.join(", ")}</p>
        <p className="text-sm font-bold text-text-secondary">density: {result.visualDirection.density}</p>
        <p className="text-sm font-bold text-text-secondary">warmth: {result.visualDirection.warmth}</p>
        <p className="text-sm font-bold text-text-secondary">imageStyle: {result.visualDirection.imageStyle.join(", ")}</p>
      </Section>
    </div>
  );
}

type Mode = "prototype" | "v1";

export function AnalysisPreviewClient() {
  const [mode, setMode] = useState<Mode>("v1");
  const [prototypeId, setPrototypeId] = useState(TASTE_MOCK_PROFILES[0].id);
  const [v1Id, setV1Id] = useState(TASTE_V1_MOCK_PROFILES[0].id);

  const activePrototype = TASTE_MOCK_PROFILES.find((p) => p.id === prototypeId) ?? TASTE_MOCK_PROFILES[0];
  const activeV1 = TASTE_V1_MOCK_PROFILES.find((p) => p.id === v1Id) ?? TASTE_V1_MOCK_PROFILES[0];

  const prototypeResult = analyzeTaste(activePrototype.answers);
  const v1Result = analyzeTasteFromSources(mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V1, activeV1.answers));

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE ANALYSIS PREVIEW (구조 검증용 · 디자인 미고도화)
      </div>

      <div className="sticky top-[33px] z-40 flex gap-2 border-b border-dashed border-border-strong bg-background px-5 py-2">
        {(["v1", "prototype"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={
              mode === m
                ? "border border-text-primary bg-text-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-background"
                : "border border-border-strong px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted"
            }
          >
            {m === "v1" ? "V1 · 6 PAGE (mapTasteAnswersToSignalSources)" : "PROTOTYPE · Q1/Q2"}
          </button>
        ))}
      </div>

      {mode === "v1" ? (
        <div className="sticky top-[65px] z-40 flex flex-wrap gap-2 border-b border-border-strong bg-background px-5 py-3">
          {TASTE_V1_MOCK_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setV1Id(profile.id)}
              className={
                v1Id === profile.id
                  ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                  : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
              }
            >
              {profile.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="sticky top-[65px] z-40 flex gap-2 border-b border-border-strong bg-background px-5 py-3">
          {TASTE_MOCK_PROFILES.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setPrototypeId(profile.id)}
              className={
                prototypeId === profile.id
                  ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                  : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
              }
            >
              {profile.id === "quiet-curator" ? "PROFILE A" : profile.id === "urban-explorer" ? "PROFILE B" : "PROFILE C"}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-lg">
        {mode === "v1" ? (
          <ProfileView
            label={activeV1.label}
            description={activeV1.description}
            answersLine={Object.values(activeV1.answers)
              .map((a) => `${a.questionId}: ${a.selectedOptionIds.join("+")}`)
              .join(" · ")}
            result={v1Result}
          />
        ) : (
          <ProfileView
            label={activePrototype.label}
            description={activePrototype.description}
            answersLine={`Q1: ${activePrototype.answers.q1} · Q2: ${activePrototype.answers.q2}`}
            result={prototypeResult}
          />
        )}
      </div>
    </div>
  );
}

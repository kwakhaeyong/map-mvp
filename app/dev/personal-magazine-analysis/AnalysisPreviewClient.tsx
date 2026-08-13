"use client";

import { useState } from "react";
import {
  TASTE_MOCK_PROFILES,
  TASTE_SIGNAL_KEYS,
  TASTE_SIGNAL_LABELS,
  analyzeTaste,
  type TasteMockProfile,
} from "../../../src/data/tasteAnalysis";

// TASTE ANALYSIS PREVIEW(2026-08) — dev-only 내부 확인 화면. 디자인을
// 고도화하지 않는다 — Q1/Q2 mock answers를 analyzeTaste()에 넣었을 때
// SIGNALS/CONFIDENCE/CORE TRAITS/CONTRADICTIONS/EDITORIAL KEYWORDS/
// NARRATIVE/PAGE PRIORITY/VISUAL DIRECTION이 어떻게 나오는지 개발자가
// 그대로 확인할 수 있는 debug 화면이다. Quiz UI(Q1/Q2)는 이 화면과
// 무관하게 그대로 둔다.

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

function ProfileView({ profile }: { profile: TasteMockProfile }) {
  const result = analyzeTaste(profile.answers);

  return (
    <div className="pb-16">
      <div className="px-5 pt-6">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{profile.label}</p>
        <p className="mt-1 text-sm font-bold text-text-secondary">{profile.description}</p>
        <p className="mt-1 text-[11px] font-bold text-text-muted">
          answers — Q1: {profile.answers.q1} · Q2: {profile.answers.q2}
        </p>
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

export function AnalysisPreviewClient() {
  const [activeId, setActiveId] = useState(TASTE_MOCK_PROFILES[0].id);
  const activeProfile = TASTE_MOCK_PROFILES.find((p) => p.id === activeId) ?? TASTE_MOCK_PROFILES[0];

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE ANALYSIS PREVIEW (구조 검증용 · 디자인 미고도화)
      </div>

      <div className="sticky top-[33px] z-40 flex gap-2 border-b border-border-strong bg-background px-5 py-3">
        {TASTE_MOCK_PROFILES.map((profile) => (
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
            {profile.id === "quiet-curator" ? "PROFILE A" : profile.id === "urban-explorer" ? "PROFILE B" : "PROFILE C"}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-lg">
        <ProfileView profile={activeProfile} />
      </div>
    </div>
  );
}

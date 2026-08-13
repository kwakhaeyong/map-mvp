"use client";

import { useState } from "react";
import { analyzeTasteFromSources } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, TASTE_V1_MOCK_PROFILES, mapTasteAnswersToSignalSources } from "../../../src/data/tasteQuestionnaire";
import { buildTasteMagazineNarrative } from "../../../src/data/tasteNarrative";

// TASTE NARRATIVE PREVIEW(2026-08) — dev-only 내부 확인 화면. 디자인
// 고도화 없음 — 5개 validation profile의 raw answers를
// analyzeTasteFromSources() → buildTasteMagazineNarrative()에 넣었을 때
// Opening/PLACE/OBJECT/DETAIL/RITUAL/Interesting Part/Pull Quote/
// Keywords/Evidence가 어떻게 나오는지 그대로 보여주는 debug 화면이다.
// 실제 TASTE Result 화면에는 아직 연결하지 않는다.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border-strong px-5 py-6">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function EvidenceList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-[11px] font-bold text-text-muted">(evidence 없음)</p>;
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item} className="text-[11px] font-bold text-text-muted">
          · {item}
        </li>
      ))}
    </ul>
  );
}

function ProfileView({ profileLabel, profileDescription }: { profileLabel: string; profileDescription: string }) {
  const profile = TASTE_V1_MOCK_PROFILES.find((p) => p.label === profileLabel) ?? TASTE_V1_MOCK_PROFILES[0];
  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V1, profile.answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrative(result, sources);

  return (
    <div className="pb-16">
      <div className="px-5 pt-6">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{profile.label}</p>
        <p className="mt-1 text-sm font-bold text-text-secondary">{profileDescription}</p>
      </div>

      <Section title="Opening">
        <p className="whitespace-pre-line text-2xl font-black leading-tight text-text-primary">{narrative.opening.headline}</p>
        <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.opening.summary}</p>
        <div className="mt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
          <EvidenceList items={narrative.evidence.headline} />
        </div>
      </Section>

      <Section title="Place">
        <p className="text-base font-black text-text-primary">{narrative.features.place.headline}</p>
        <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.features.place.body}</p>
        <div className="mt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
          <EvidenceList items={narrative.evidence.place} />
        </div>
      </Section>

      <Section title="Object">
        <p className="text-base font-black text-text-primary">{narrative.features.object.headline}</p>
        <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.features.object.body}</p>
        <div className="mt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
          <EvidenceList items={narrative.evidence.object} />
        </div>
      </Section>

      <Section title="Detail">
        <p className="text-base font-black text-text-primary">{narrative.features.detail.headline}</p>
        <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.features.detail.body}</p>
        <div className="mt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
          <EvidenceList items={narrative.evidence.detail} />
        </div>
      </Section>

      <Section title="Ritual">
        <p className="text-base font-black text-text-primary">{narrative.features.ritual.headline}</p>
        <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.features.ritual.body}</p>
        <div className="mt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
          <EvidenceList items={narrative.evidence.ritual} />
        </div>
      </Section>

      <Section title="Interesting Part">
        {narrative.interestingPart ? (
          <>
            <p className="whitespace-pre-line text-base font-black text-text-primary">{narrative.interestingPart.headline}</p>
            <p className="text-sm font-bold leading-5 text-text-secondary">{narrative.interestingPart.body}</p>
            <div className="mt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence</p>
              <EvidenceList items={narrative.evidence.interestingPart ?? []} />
            </div>
          </>
        ) : (
          <p className="text-sm font-bold text-text-muted">(이 profile에서는 생성되지 않음 — 강한 contradiction/pattern이 없음)</p>
        )}
      </Section>

      <Section title="Pull Quote">
        <p className="whitespace-pre-line font-serif text-lg font-medium italic leading-6 text-text-primary">{narrative.pullQuote}</p>
      </Section>

      <Section title="Keywords">
        <p className="text-sm font-bold text-text-secondary">{narrative.keywords.join(" · ")}</p>
      </Section>
    </div>
  );
}

export function NarrativePreviewClient() {
  const [activeLabel, setActiveLabel] = useState(TASTE_V1_MOCK_PROFILES[0].label);
  const activeProfile = TASTE_V1_MOCK_PROFILES.find((p) => p.label === activeLabel) ?? TASTE_V1_MOCK_PROFILES[0];

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — TASTE NARRATIVE PREVIEW (구조 검증용 · 디자인 미고도화)
      </div>

      <div className="sticky top-[33px] z-40 flex flex-wrap gap-2 border-b border-border-strong bg-background px-5 py-3">
        {TASTE_V1_MOCK_PROFILES.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => setActiveLabel(profile.label)}
            className={
              activeLabel === profile.label
                ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
            }
          >
            {profile.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-lg">
        <ProfileView profileLabel={activeProfile.label} profileDescription={activeProfile.description} />
      </div>
    </div>
  );
}

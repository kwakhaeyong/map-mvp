"use client";

import { useState } from "react";
import { analyzeTasteFromSources, type TasteAnalysisResult } from "../../../src/data/tasteAnalysis";
import { TASTE_QUESTIONS_V1, TASTE_V1_MOCK_PROFILES, mapTasteAnswersToSignalSources } from "../../../src/data/tasteQuestionnaire";
import { TASTE_QUESTIONS_V2, TASTE_V2_MOCK_PROFILES } from "../../../src/data/tasteQuestionnaireV2";
import { buildTasteMagazineNarrative, type TasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { buildTasteMagazineNarrativeV2, buildTasteObservationsV2 } from "../../../src/data/tasteNarrativeV2";

// TASTE NARRATIVE PREVIEW(2026-08) — dev-only 내부 확인 화면. 디자인
// 고도화 없음 — 5개 validation profile의 raw answers를
// analyzeTasteFromSources() → buildTasteMagazineNarrative()에 넣었을 때
// Opening/PLACE/OBJECT/DETAIL/RITUAL/Interesting Part/Pull Quote/
// Keywords/Evidence가 어떻게 나오는지 그대로 보여주는 debug 화면이다.
// 실제 TASTE Result 화면에는 아직 연결하지 않는다.
//
// v2(2026-08) — 같은 profile(id 기준 quiet-curator/urban-explorer/
// practical-editor/quiet-explorer/contradiction — v1 mock profile과
// v2 mock profile은 동일 signal 조합을 v2 옵션 id로 재구성한 것)을
// V1 엔진(buildTasteMagazineNarrative)과 V2 엔진
// (buildTasteMagazineNarrativeV2)에 각각 넣어 한 화면에 나란히
// 보여준다 — profile 선택은 하나로 공유하고, 두 엔진 결과를 위아래로
// 쌓아 바로 비교할 수 있게 한다.

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

function NarrativeSections({ narrative }: { narrative: TasteMagazineNarrative }) {
  return (
    <>
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
    </>
  );
}

// v2 전용 — observation 원자료. narrative headline에 쓰이지 않아도
// (예: §13 case F의 expression-low) matched된 observation은 여기서
// 확인할 수 있다.
function ObservationDebugList({ result, sources }: { result: TasteAnalysisResult; sources: ReturnType<typeof mapTasteAnswersToSignalSources> }) {
  const observations = buildTasteObservationsV2(result, sources);
  return (
    <Section title="Observations (v2 only, debug)">
      {observations.length === 0 ? (
        <p className="text-[11px] font-bold text-text-muted">(matched observation 없음)</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {observations.map((o) => (
            <li key={o.id} className="border border-dashed border-border-strong p-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
                {o.topic} · strength {o.strength.toFixed(2)}
              </p>
              <p className="mt-1 whitespace-pre-line text-[11px] font-bold text-text-secondary">{o.statement}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function V1EngineView({ profileId }: { profileId: string }) {
  const profile = TASTE_V1_MOCK_PROFILES.find((p) => p.id === profileId) ?? TASTE_V1_MOCK_PROFILES[0];
  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V1, profile.answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrative(result, sources);

  return (
    <div>
      <div className="bg-text-primary px-5 py-3">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-background">NARRATIVE ENGINE · V1</p>
      </div>
      <NarrativeSections narrative={narrative} />
    </div>
  );
}

function V2EngineView({ profileId }: { profileId: string }) {
  const profile = TASTE_V2_MOCK_PROFILES.find((p) => p.id === profileId) ?? TASTE_V2_MOCK_PROFILES[0];
  const sources = mapTasteAnswersToSignalSources(TASTE_QUESTIONS_V2, profile.answers);
  const result = analyzeTasteFromSources(sources);
  const narrative = buildTasteMagazineNarrativeV2(result, sources);

  return (
    <div>
      <div className="bg-primary px-5 py-3">
        <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-background">NARRATIVE ENGINE · V2</p>
      </div>
      <NarrativeSections narrative={narrative} />
      <ObservationDebugList result={result} sources={sources} />
    </div>
  );
}

export function NarrativePreviewClient() {
  const [activeProfileId, setActiveProfileId] = useState(TASTE_V1_MOCK_PROFILES[0].id);
  const activeProfile = TASTE_V1_MOCK_PROFILES.find((p) => p.id === activeProfileId) ?? TASTE_V1_MOCK_PROFILES[0];

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
            onClick={() => setActiveProfileId(profile.id)}
            className={
              activeProfileId === profile.id
                ? "border border-text-primary bg-text-primary px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-background"
                : "border border-border-strong px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-text-secondary"
            }
          >
            {profile.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-lg">
        <div className="px-5 pt-6">
          <p className="font-serif text-xs font-bold uppercase tracking-[0.14em] text-text-muted">{activeProfile.label}</p>
          <p className="mt-1 text-sm font-bold text-text-secondary">{activeProfile.description}</p>
          <p className="mt-3 text-[11px] font-bold text-text-muted">
            아래 V1/V2 두 블록은 같은 signal 조합(같은 profile)을 각각 다른 Narrative 엔진에 넣은 결과다 — profile은 하나만 고르고,
            엔진 결과를 위아래로 비교한다.
          </p>
        </div>

        <V1EngineView profileId={activeProfileId} />
        <div className="h-3 bg-tag-fill" />
        <V2EngineView profileId={activeProfileId} />
      </div>
    </div>
  );
}

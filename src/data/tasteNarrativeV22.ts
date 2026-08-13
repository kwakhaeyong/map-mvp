// TASTE NARRATIVE SYSTEM v2.2(2026-08) — v2.1의 구조·원칙(§D)을 그대로
// 유지하면서 GPT가 승인한 relationship 4개를 추가한다. v2.1의 6개
// relationship과 카피는 삭제/수정하지 않는다(§E) — tasteNarrativeV2.ts의
// RELATIONSHIP_DEFS_V21을 그대로 import해서 합친다.
//
// RAW ANSWERS → SIGNALS → OBSERVATIONS → RELATIONSHIPS/CONTRADICTIONS
// → EDITORIAL NARRATIVE (v2.1과 동일 파이프라인, §D)
//
// Opening 우선순위도 v2.1과 동일: A.strong contradiction → B.strong
// relationship → C/D.기존 승인 폴백(v1Base).

import { type SignalSource, type TasteAnalysisResult } from "./tasteAnalysis";
import { buildTasteMagazineNarrative, type TasteMagazineNarrative } from "./tasteNarrative";
import {
  RELATIONSHIP_DEFS_V21,
  hasStrongContradiction,
  matchStrongestRelationship,
  type RelationshipDef,
  type RelationshipMatch,
} from "./tasteNarrativeV2";

export { buildTasteObservationsV2, type TasteObservation } from "./tasteNarrativeV2";

// ============================================================
// 신규 RELATIONSHIP 4개 — §F 승인 카피 그대로. 발동 축(§G)은 "관련
// 방향의 signal + independent evidence"라는 문장으로만 주어져 정확한
// 축 2개를 Claude가 기존 signal 체계 안에서 판단해야 했다 — 각 판단
// 근거를 항목별로 남긴다(완료 보고 C번과 동일 내용).
// ============================================================
const RELATIONSHIP_DEFS_V22_NEW: RelationshipDef[] = [
  {
    id: "fast-heart-slow-hand",
    headline: "마음은 빨리 가지만,\n결정은 천천히 하는 사람.",
    interestingPart: {
      headline: "끌림을 믿지 않는 것이 아니라,\n확인하는 쪽에 가깝습니다.",
      body: "처음 보는 순간 마음이 가는 것은 빠른 편이지만, 실제로 내 것으로 정할 때는 한 번 더 생각합니다. 끌림을 믿지 않는 것이 아니라, 오래 남길 이유가 있는지 확인하는 쪽에 가깝습니다.",
    },
    pullQuote: "끌림은 빠르게, 결정은 천천히.",
    // 판단 근거: "빠른 attraction/first-impression"을 pace(HIGH)로,
    // "deliberate comparison/slow decision/high curation"을
    // curation(HIGH)으로 대응시켰다. pace 축은 기존 데이터에서 이미
    // "결정 속도"를 나타내는 축으로 쓰이고 있다(INSTINCT의
    // buy-if-lingers=pace+15/"빠르게 산다", wait-days=pace-10・
    // curation+10/"천천히 생각한다", compare=pace-5・curation+15/
    // "비교해서 고른다" — 전부 v1/v2/v2.2 공용 데이터). curation은
    // "신중한 선별"을 나타내는 축으로 이미 practical-editor/quiet-
    // curator profile에서 쓰인다. 다만 이 매핑은 GPT가 축 이름을
    // 직접 지정하지 않아 Claude가 기존 axis 의미에서 유추한 것 —
    // "DISCOVER FAST/CHOOSE SLOW"(novelty+attachment)와 컨셉이
    // 유사해 보일 수 있어 축을 의도적으로 다르게(pace+curation) 잡았다는
    // 점을 완료 보고에서 별도로 공유한다.
    axes: [
      { key: "pace", direction: "high" },
      { key: "curation", direction: "high" },
    ],
  },
  {
    id: "sensory-practical",
    headline: "감각은 예민하지만,\n선택은 꽤 현실적인 사람.",
    interestingPart: {
      headline: "예쁘다는 이유만으로 선택하지는 않습니다.",
      body: "분위기나 작은 차이를 잘 느끼지만, 예쁘다는 이유만으로 선택하지는 않습니다. 실제로 쓰기 좋은지, 오래 만족할지를 함께 보는 편입니다.",
    },
    pullQuote: "느끼는 건 섬세하게, 고르는 건 현실적으로.",
    // 판단 근거: "sensory/detail sensitivity"→sensory(HIGH), "functional/
    // practical/deliberate selection"→curation(HIGH). 이 축 조합은
    // v2.1의 BEAUTY/USE와 완전히 동일하다 — §H 충돌 검증 2번이 이
    // 충돌을 의도적으로 요구하고 있어 축을 다르게 바꾸지 않고 그대로
    // 두었다(다르게 바꾸면 이 충돌 자체를 회피하는 임의 결정이 된다).
    // 실제로 두 relationship이 동시에 matched되면 strength(축 신호
    // 크기 합)까지 완전히 같아 "스펙 미정 동률"이 발생한다 — 완료
    // 보고 E번에서 그대로 공개한다.
    axes: [
      { key: "sensory", direction: "high" },
      { key: "curation", direction: "high" },
    ],
  },
  {
    id: "familiar-social",
    headline: "새로운 곳보다,\n좋아하는 경험을 함께 반복하는 사람.",
    interestingPart: {
      headline: "반복이 지루하기보다 관계와 기억을 쌓는 방식에 가깝습니다.",
      body: "완전히 새로운 장소를 계속 찾기보다, 이미 좋아하는 곳을 사람과 다시 찾는 데서 만족을 느끼는 편입니다. 반복이 지루하기보다 관계와 기억을 쌓는 방식에 가깝습니다.",
    },
    pullQuote: "좋은 곳은, 좋은 사람과 다시.",
    // 판단 근거: "familiar/repeat preference"→novelty(LOW), "social/
    // shared experience preference"→socialDensity(HIGH). FAMILIAR/DEEP
    // (novelty LOW + attachment HIGH)과 novelty(LOW) 축 하나를 공유하지만
    // 두 번째 축(socialDensity vs attachment)이 달라 완전한 동률은
    // 아니다 — §H 충돌 검증 3번에서 실제 강도 비교 결과를 보고한다.
    axes: [
      { key: "novelty", direction: "low" },
      { key: "socialDensity", direction: "high" },
    ],
  },
  {
    id: "private-curious",
    headline: "새로운 것은 좋아하지만,\n취향을 굳이 보여주지는 않는 사람.",
    interestingPart: {
      headline: "발견은 열려 있어도 취향은 조금 더 개인적인 영역에 가깝습니다.",
      body: "새로운 장소와 경험에는 쉽게 호기심을 느끼지만, 그것을 적극적으로 드러내거나 설명해야 할 필요는 적게 느낍니다. 발견은 열려 있어도 취향은 조금 더 개인적인 영역에 가깝습니다.",
    },
    pullQuote: "새로운 건 좋아해도, 보여줄 필요는 없다.",
    // 판단 근거: "novelty/curiosity"→novelty(HIGH), "low expression/
    // private taste"→expression(LOW). DISCOVER FAST/CHOOSE SLOW(novelty
    // HIGH + attachment HIGH)와 novelty(HIGH) 축 하나를 공유한다 — §H
    // 충돌 검증 1번에서 실제 강도 비교 결과를 보고한다.
    axes: [
      { key: "novelty", direction: "high" },
      { key: "expression", direction: "low" },
    ],
  },
];

export const RELATIONSHIP_DEFS_V22: RelationshipDef[] = [...RELATIONSHIP_DEFS_V21, ...RELATIONSHIP_DEFS_V22_NEW];

export function matchStrongestRelationshipV22(result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatch | undefined {
  return matchStrongestRelationship(RELATIONSHIP_DEFS_V22, result, sources);
}

// 디버그/collision 검증용 — matched된 relationship 전부(1등만이 아니라)를
// strength 내림차순으로 반환한다. §H의 "동시에 strong으로 성립"하는
// 경우를 실제로 확인하기 위한 함수다.
export function matchAllRelationshipsV22(result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatch[] {
  return RELATIONSHIP_DEFS_V22.map((def) => {
    const directionOk = def.axes.every((axis) => {
      const value = result.signals[axis.key];
      return axis.direction === "high" ? value > 0 : value < 0;
    });
    if (!directionOk) return null;
    const pageSet = new Set<string>();
    for (const axis of def.axes) {
      for (const source of sources) {
        const value = source.signals[axis.key] ?? 0;
        if (axis.direction === "high" && value > 0) pageSet.add(source.questionId);
        if (axis.direction === "low" && value < 0) pageSet.add(source.questionId);
      }
    }
    if (pageSet.size < 2) return null;
    const strength = def.axes.reduce((sum, axis) => sum + Math.abs(result.signals[axis.key]), 0) / 200;
    return { def, strength, evidence: [] as string[] };
  })
    .filter((m): m is RelationshipMatch => m !== null)
    .sort((a, b) => b.strength - a.strength);
}

export function buildTasteMagazineNarrativeV22(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const v1Base = buildTasteMagazineNarrative(result, sources);

  // A. strong contradiction — v2.1과 동일 규칙, 최우선.
  if (hasStrongContradiction(result, sources)) {
    return v1Base;
  }

  // B. strong relationship — v2.1 6개 + v2.2 신규 4개를 합쳐서 비교한다.
  const relationship = matchStrongestRelationshipV22(result, sources);
  if (relationship) {
    const evidence: TasteMagazineNarrative["evidence"] = { ...v1Base.evidence, headline: relationship.evidence };
    return {
      opening: { headline: relationship.def.headline, summary: v1Base.opening.summary },
      features: v1Base.features,
      interestingPart: relationship.def.interestingPart,
      pullQuote: relationship.def.pullQuote,
      keywords: v1Base.keywords,
      evidence,
    };
  }

  // C/D. v2.1과 동일하게 새 headline 카피가 없어 v1Base 폴백으로 넘어간다.
  return v1Base;
}

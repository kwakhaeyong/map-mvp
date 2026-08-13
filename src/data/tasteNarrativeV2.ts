// TASTE NARRATIVE SYSTEM v2(2026-08) — GPT가 확정한 Narrative v2 Spec
// 구현. v1(tasteNarrative.ts)은 삭제하지 않고 "reference pattern"으로
// 그대로 둔다 — 이 파일은 v1 위에 새 pipeline을 얹는 별도 버전이다.
//
// v1과의 관계:
//   - PLACE/OBJECT/DETAIL/RITUAL feature 텍스트와 keywords는 v1의 기존
//     엔진(buildTasteMagazineNarrative)이 만든 결과를 그대로 재사용한다.
//     §9(FEATURE TEXT v2)가 요구하는 evidence 소스(scene/first-thing/
//     keep-two/instinct/quick-cuts/last-scene raw answer)는 v1의
//     SECTION_AXIS_WEIGHT 기반 채점이 signals/sources만 보고 동작하므로
//     v2 questionnaire의 signals를 그대로 넣기만 하면 별도 로직 없이
//     충족된다 — 이번에 새 feature 문구가 전달되지 않았으므로 새로
//     짓지 않는다(이 스코프 선택은 완료 보고에서 판단 근거로 공유한다).
//   - opening.headline / interestingPart / pullQuote만 아래
//     OBSERVATION → RELATIONSHIP pipeline으로 새로 판단한다.
//   - opening.summary는 v2용 새 문장이 전달되지 않아 v1Base의 summary를
//     그대로 쓴다.
//
// RAW ANSWERS → OBSERVATIONS → RELATIONSHIPS → CONTRADICTIONS/TENSIONS
// → EDITORIAL NARRATIVE (GPT Spec 3번)

import { type SignalSource, type TasteAnalysisResult, type TasteSignalKey } from "./tasteAnalysis";
import {
  FUNCTIONAL_PREFERENCE_ANSWER_IDS,
  buildTasteMagazineNarrative,
  type TasteMagazineNarrative,
  type TasteNarrativeFeature,
} from "./tasteNarrative";

// ============================================================
// 1. OBSERVATION — GPT Spec §4 타입 그대로.
// ============================================================
export type TasteObservation = {
  id: string;
  topic: "place" | "object" | "detail" | "ritual" | "expression" | "selection";
  statement: string;
  evidence: string[];
  strength: number;
};

// "신중하게 고른다"(deliberate purchase)는 신호 축이 아니라 raw answer
// 조건이다 — TASTE_QUESTIONS_V1/V2가 공유하는 INSTINCT 옵션 id
// (buy-if-lingers의 반대 selection) 그대로.
const DELIBERATE_PURCHASE_ANSWER_IDS = ["wait-days", "compare", "budget-limit"];

function axisEvidence(sources: SignalSource[], axes: TasteSignalKey[]): string[] {
  const seen = new Set<string>();
  const evidence: string[] = [];
  for (const source of sources) {
    const touches = axes.some((axis) => (source.signals[axis] ?? 0) !== 0);
    if (!touches) continue;
    const label = `${source.questionId}: ${source.answerId}`;
    if (seen.has(label)) continue;
    seen.add(label);
    evidence.push(label);
  }
  return evidence;
}

function answerEvidence(sources: SignalSource[], answerIds: string[]): string[] {
  return sources.filter((s) => answerIds.includes(s.answerId)).map((s) => `${s.questionId}: ${s.answerId}`);
}

type ObservationRule = {
  id: string;
  topic: TasteObservation["topic"];
  statement: string;
  evaluate: (result: TasteAnalysisResult, sources: SignalSource[]) => { matched: boolean; strength: number; evidence: string[] };
};

// §5 승인된 6개 observation 문장 그대로 — Claude가 새 의미를 짓지
// 않는다. topic 배정(place/object/detail/ritual/expression/selection)은
// §5가 문장별로 명시하지 않아 각 문장이 실제로 가리키는 축과 v1
// SECTION_AXIS_WEIGHT가 이미 쓰고 있는 축 가중치를 근거로 Claude가
// 판단한 것이다 — 완료 보고에서 공유한다.
const OBSERVATION_RULES: ObservationRule[] = [
  {
    id: "novelty-curious",
    topic: "ritual",
    statement: "새로운 장소와 처음 보는 것에 비교적 쉽게 호기심을 느낀다.",
    evaluate: (result, sources) => {
      const value = result.signals.novelty;
      return { matched: value >= 15, strength: Math.max(0, value) / 100, evidence: axisEvidence(sources, ["novelty"]) };
    },
  },
  {
    id: "attachment-deliberate",
    topic: "object",
    statement: "마음에 드는 것을 오래 두는 편이고,\n실제 선택에는 시간을 쓰는 편이다.",
    evaluate: (result, sources) => {
      const hasDeliberateAnswer = sources.some((s) => DELIBERATE_PURCHASE_ANSWER_IDS.includes(s.answerId));
      const value = result.signals.attachment;
      const matched = value >= 15 && hasDeliberateAnswer;
      return {
        matched,
        strength: matched ? Math.max(0, value) / 100 : 0,
        evidence: [...axisEvidence(sources, ["attachment"]), ...answerEvidence(sources, DELIBERATE_PURCHASE_ANSWER_IDS)],
      };
    },
  },
  {
    id: "sensory-attuned",
    topic: "detail",
    statement: "빛, 분위기, 작은 완성도의 차이를 비교적 빨리 알아차린다.",
    evaluate: (result, sources) => {
      const value = result.signals.sensory;
      return { matched: value >= 15, strength: Math.max(0, value) / 100, evidence: axisEvidence(sources, ["sensory"]) };
    },
  },
  {
    id: "expression-high",
    topic: "expression",
    statement: "좋았던 경험을 다른 사람과 나누는 것이 취향 경험의 일부다.",
    evaluate: (result, sources) => {
      const value = result.signals.expression;
      return { matched: value >= 15, strength: Math.max(0, value) / 100, evidence: axisEvidence(sources, ["expression"]) };
    },
  },
  {
    id: "expression-low",
    topic: "expression",
    statement: "좋아하는 것을 꼭 밖으로 표현해야 할 필요는 느끼지 않는다.",
    evaluate: (result, sources) => {
      const value = result.signals.expression;
      return { matched: value <= -15, strength: Math.max(0, -value) / 100, evidence: axisEvidence(sources, ["expression"]) };
    },
  },
  {
    id: "functional-curated",
    topic: "selection",
    statement: "보기 좋은 것뿐 아니라 실제 사용 경험과 완성도를 함께 본다.",
    evaluate: (result, sources) => {
      const hasFunctionalAnswer = sources.some((s) => FUNCTIONAL_PREFERENCE_ANSWER_IDS.includes(s.answerId));
      const value = result.signals.curation;
      const matched = hasFunctionalAnswer && value >= 15;
      return {
        matched,
        strength: matched ? Math.max(0, value) / 100 : 0,
        evidence: [...answerEvidence(sources, FUNCTIONAL_PREFERENCE_ANSWER_IDS), ...axisEvidence(sources, ["curation"])],
      };
    },
  },
];

// dev/debug 노출용 — 실제 headline에 쓰였는지와 무관하게, 임계값을
// 넘긴 observation을 전부 반환한다(§13 케이스 F처럼 relationship
// headline은 못 만들어도 개별 observation은 보여야 하는 경우를 위해).
export function buildTasteObservationsV2(result: TasteAnalysisResult, sources: SignalSource[]): TasteObservation[] {
  return OBSERVATION_RULES.map((rule) => {
    const { matched, strength, evidence } = rule.evaluate(result, sources);
    if (!matched) return null;
    return { id: rule.id, topic: rule.topic, statement: rule.statement, evidence, strength };
  }).filter((o): o is TasteObservation => o !== null);
}

// ============================================================
// 2. RELATIONSHIP — v2.1 CORRECTION(2026-08). GPT가 v2.0의 두 가지
// 문제를 지적해 교정한다:
//   (a) experience-share에 Claude가 임의로 정한 threshold(novelty≥10 &
//       expression≥10)가 있었다 — 삭제.
//   (b) 6개 relationship이 서로 다른 방식(신호 threshold, raw answer
//       조건, v1 카피를 빌려온 pullQuote/interestingPart 등)으로
//       구현돼 있었다 — 이번에 GPT가 6개 전부에 대해 완결된 카피를
//       내려줬고, 발동 조건도 하나의 규칙으로 통일하라고 지시했다.
//
// 통일된 기본 규칙(GPT 지시 2번): 관련 signal 축 2개의 "방향"이 모두
// 맞아야 하고(예: novelty 양수 + attachment 양수), 그 방향을 뒷받침하는
// evidence가 서로 다른 questionnaire page(=SignalSource.questionId,
// quick-cuts처럼 한 페이지에 cut이 여러 개여도 questionId는 하나라
// "페이지" 단위로 정확히 대응) 최소 2곳에서 나와야 한다. 문항 하나가
// 우연히 두 축 모두에 신호를 준 경우(예: PAGE 01 SCENE 하나가
// stimulus/socialDensity를 동시에 흔드는 경우) evidence page가 1개뿐이라
// 통과하지 못한다 — "한 문항 하나로 headline이 정해지지 않게" 하려는
// 목적 그대로다. 더 이상 threshold(≥15 같은 크기 기준)나 raw answer id
// 예외를 쓰지 않는다 — 방향(부호)과 페이지 수만 본다.
// ============================================================
export type RelationshipAxis = { key: TasteSignalKey; direction: "high" | "low" };

export type RelationshipDef = {
  id: string;
  headline: string;
  interestingPart?: TasteNarrativeFeature;
  pullQuote: string;
  axes: [RelationshipAxis, RelationshipAxis];
};

// §5(2026-08 GPT 승인 카피) 그대로 — headline/interestingPart/pullQuote
// 전부 이번에 완결된 문장으로 내려받아, 더 이상 v1 profile 카피를
// 빌려 쓰지 않는다. v2.2(tasteNarrativeV22.ts)가 이 6개를 그대로
// import해서 신규 relationship 4개와 합친다 — v2.1 카피는 삭제/수정
// 하지 않는다.
export const RELATIONSHIP_DEFS_V21: RelationshipDef[] = [
  {
    id: "discover-fast-choose-slow",
    headline: "새로운 것은 잘 발견하지만,\n내 것으로 남기는 기준은 꽤 까다로운 사람.",
    interestingPart: {
      headline: "새로운 경험에는 열려 있지만,\n모든 것을 내 것으로 만들지는 않습니다.",
      body: "처음 보는 장소나 새로운 장면에는 비교적 쉽게 호기심을 느끼면서도, 물건이나 취향을 실제로 내 것으로 정할 때는 한 번 더 생각합니다. 당신에게 '새롭다'와 '갖고 싶다'는 같은 말이 아닙니다.",
    },
    pullQuote: "발견은 빠르게, 선택은 천천히.",
    axes: [
      { key: "novelty", direction: "high" },
      { key: "attachment", direction: "high" },
    ],
  },
  {
    id: "quiet-curious",
    headline: "조용한 장면을 좋아하지만,\n새로운 것을 피하지는 않는 사람.",
    interestingPart: {
      headline: "편안함과 호기심은 반대편에 있지 않습니다.",
      body: "일상에서는 자극을 스스로 조절할 수 있는 환경에 마음이 가지만, 처음 보는 장소나 새로운 경험 앞에서는 생각보다 쉽게 움직입니다. 익숙함만을 원하는 사람이라기보다, 내 속도로 새로운 것을 만나고 싶은 쪽에 가깝습니다.",
    },
    pullQuote: "조용히 머물고, 가끔은 멀리 움직인다.",
    axes: [
      { key: "stimulus", direction: "low" },
      { key: "novelty", direction: "high" },
    ],
  },
  {
    id: "beauty-use",
    headline: "보기 좋은 것보다,\n오래 좋아할 이유가 있는 것을 고르는 사람.",
    interestingPart: {
      headline: "예쁜 것만으로는 조금 부족합니다.",
      body: "첫인상에 끌리더라도 실제로 쓰기 편한지, 시간이 지나도 만족할지까지 함께 보는 편입니다. 당신에게 좋은 디자인은 보고 끝나는 것이 아니라 쓰면서 더 좋아지는 것에 가깝습니다.",
    },
    pullQuote: "보기 좋은 것보다, 계속 좋은 것.",
    // "functional preference"(기능 선호)에 대응하는 signal 축으로
    // curation을 쓴다 — v1 PROFILE_SIGNAL_TARGET.practical-editor가
    // 이미 curation:1을 "기능/완성도 선호"의 대표 축으로 쓰고 있어
    // 그 대응을 그대로 따랐다(새 축 의미를 만들지 않았다).
    axes: [
      { key: "sensory", direction: "high" },
      { key: "curation", direction: "high" },
    ],
  },
  {
    id: "familiar-deep",
    headline: "새로움을 계속 찾기보다,\n좋아하는 것을 더 깊게 즐기는 사람.",
    // interestingPart: 기본 없음(GPT 지시 그대로 — 생략).
    pullQuote: "좋아하는 것은 다시 좋아해도 좋다.",
    axes: [
      { key: "novelty", direction: "low" },
      { key: "attachment", direction: "high" },
    ],
  },
  {
    id: "experience-share",
    headline: "좋은 것을 발견하면,\n혼자 간직하기보다 경험으로 이어가는 사람.",
    // interestingPart: 기본 없음(GPT 지시 그대로 — 생략).
    pullQuote: "좋은 경험은 나눌수록 선명해진다.",
    axes: [
      { key: "novelty", direction: "high" },
      { key: "expression", direction: "high" },
    ],
  },
  {
    id: "enjoy-together-keep-private",
    headline: "함께하는 건 좋아하지만,\n취향까지 설명하고 싶지는 않은 사람.",
    interestingPart: {
      headline: "사람을 좋아하는 것과 취향을 드러내는 것은 다른 일입니다.",
      body: "좋은 공간이나 경험을 누군가와 함께 즐기는 편이지만, 무엇을 좋아하는지 적극적으로 보여주거나 설명해야 할 필요까지 느끼지는 않습니다. 관계는 열려 있어도 취향은 조금 더 개인적인 영역으로 남겨두는 편입니다.",
    },
    pullQuote: "함께 즐기되, 취향은 내 방식대로.",
    axes: [
      { key: "socialDensity", direction: "high" },
      { key: "expression", direction: "low" },
    ],
  },
];

// v2.2(tasteNarrativeV22.ts)도 그대로 재사용할 수 있도록 export한다 —
// "관련 signal 축 2개의 방향이 맞고, 그 evidence가 서로 다른 page
// 최소 2곳에서 나와야 한다"는 규칙 자체를 다시 구현하지 않기 위함이다.
export function axisDirectionMatches(result: TasteAnalysisResult, axis: RelationshipAxis): boolean {
  const value = result.signals[axis.key];
  return axis.direction === "high" ? value > 0 : value < 0;
}

// 해당 축·방향에 실제로 신호를 보탠 source들의 questionId(=페이지) 집합.
export function axisEvidencePages(sources: SignalSource[], axis: RelationshipAxis): Set<string> {
  const pages = new Set<string>();
  for (const source of sources) {
    const value = source.signals[axis.key] ?? 0;
    if (axis.direction === "high" && value > 0) pages.add(source.questionId);
    if (axis.direction === "low" && value < 0) pages.add(source.questionId);
  }
  return pages;
}

export function axisEvidenceLabels(sources: SignalSource[], axis: RelationshipAxis): string[] {
  return sources
    .filter((s) => {
      const value = s.signals[axis.key] ?? 0;
      return axis.direction === "high" ? value > 0 : value < 0;
    })
    .map((s) => `${s.questionId}: ${s.answerId}`);
}

export type RelationshipMatch = { def: RelationshipDef; strength: number; evidence: string[] };

export function evaluateRelationship(def: RelationshipDef, result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatch | null {
  const directionOk = def.axes.every((axis) => axisDirectionMatches(result, axis));
  if (!directionOk) return null;

  const pageSet = new Set<string>();
  for (const axis of def.axes) for (const page of axisEvidencePages(sources, axis)) pageSet.add(page);
  if (pageSet.size < 2) return null;

  const strength = def.axes.reduce((sum, axis) => sum + Math.abs(result.signals[axis.key]), 0) / 200;
  const evidence = Array.from(new Set(def.axes.flatMap((axis) => axisEvidenceLabels(sources, axis))));
  return { def, strength, evidence };
}

// defs 배열을 파라미터로 받는다 — v2.1은 RELATIONSHIP_DEFS_V21만,
// v2.2는 여기에 신규 4개를 더한 배열을 넘긴다. 동시에 strong으로
// matched된 relationship이 여럿이면 strength(축 신호 크기 합) 기준으로
// 가장 강한 것을 고른다 — strength까지 동일하면(예: v2.2의 BEAUTY/USE
// vs SENSORY/PRACTICAL처럼 axes가 완전히 같은 경우) 배열에 먼저 나온
// def가 이긴다. 이 "동률 시 배열 순서" 규칙은 스펙이 우선순위를
// 명시하지 않은 상태에서 Claude가 정한 것이 아니라 Array.sort의
// stable-sort 특성을 그대로 노출한 것일 뿐이다 — 실제로 동률이
// 발생하면 완료 보고에서 "스펙 미정 상태"로 별도 보고한다.
export function matchStrongestRelationship(
  defs: RelationshipDef[],
  result: TasteAnalysisResult,
  sources: SignalSource[]
): RelationshipMatch | undefined {
  const matches = defs.map((def) => evaluateRelationship(def, result, sources)).filter((m): m is RelationshipMatch => m !== null);
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.strength - a.strength);
  return matches[0];
}

// ============================================================
// 3. TOP-LEVEL — v2.1 CORRECTION(2026-08). GPT 지시 3번의 우선순위를
// 그대로 구현한다:
//
//   A. strong contradiction/tension
//   B. strong relationship
//   C. repeated observation
//   D. single signal fallback
//
// A(strong contradiction) — "서로 다른 page에서 반대 방향 evidence가
// 최소 2개 이상"으로 제한한다는 지시를 그대로 따른다. v1 엔진
// (tasteAnalysis.ts detectContradictions)은 "같은 축에서 부호가
// 갈리는가"만 보고 페이지 다양성은 안 본다 — 그래서 여기서 별도로
// sources를 다시 훑어 해당 축의 양(+)/음(-) evidence가 서로 다른
// page에서 나왔는지 확인한다. 이 축은 stimulus/socialDensity로
// 한정했다 — v1Base(buildTasteMagazineNarrative)가 실제로 opening/
// interestingPart 우선순위를 주는 축이 이 두 개뿐이라서(v1
// CONTRADICTION_CORE_AXES), 다른 축(pace/curation/sensory/novelty)의
// contradiction을 "strong"으로 판정해도 v1Base 자체가 그걸 headline에
// 반영하지 않아 실제로는 아무 효과가 없기 때문이다 — v1 엔진(production
// 아님, 이번 라운드에서 손대지 않기로 한 기존 분석 로직)을 수정하지
// 않고 정직하게 맞춘 것이다.
//
// strong contradiction이면 v1Base를 통째로 쓴다(headline·
// interestingPart·pullQuote 전부) — "기존 승인된 CONTRADICTION headline
// 이 relationship에 덮이지 않아야 한다"는 지시 4번을 그대로 만족한다.
//
// B(strong relationship) — A가 아니면 위 RELATIONSHIP_DEFS 중 가장
// strength가 큰 것의 headline/interestingPart/pullQuote를 그대로 쓴다.
// interestingPart가 "기본 없음"인 relationship(familiar-deep,
// experience-share)이 이기면 interestingPart는 v1Base로 되돌리지 않고
// 그대로 생략한다 — v2.0에서 있었던 "헤드라인은 relationship인데
// interestingPart는 contradiction"처럼 서로 다른 tier가 섞이는 문제를
// 없애기 위해서다.
//
// C(repeated observation) / D(single signal fallback) — 이 두 단계에
// 쓸 새 headline 카피가 이번에도 전달되지 않았다. observation
// statement(§4/§5)는 debug 문장으로 설계된 것이라 그대로 headline
// 자리에 옮기는 것도 새 카피를 만드는 것과 같아서 하지 않았다. 그래서
// A/B에 모두 해당하지 않을 때는 v1Base(이미 다축 신호를 가중 비교하는
// fallback 엔진)로 그대로 넘어간다 — C와 D를 구분해서 구현하지 못한
// 것은 스펙 부족이라 임의로 채우지 않고 이렇게 보고한다.
// ============================================================
export const STRONG_CONTRADICTION_AXES: TasteSignalKey[] = ["stimulus", "socialDensity"];

// v2.2도 그대로 재사용한다(§D "v2.1의 기본 원칙 유지").
export function hasStrongContradiction(result: TasteAnalysisResult, sources: SignalSource[]): boolean {
  return result.contradictions.some((c) => {
    if (!STRONG_CONTRADICTION_AXES.includes(c.axis)) return false;
    const positivePages = new Set(sources.filter((s) => (s.signals[c.axis] ?? 0) > 0).map((s) => s.questionId));
    const negativePages = new Set(sources.filter((s) => (s.signals[c.axis] ?? 0) < 0).map((s) => s.questionId));
    if (positivePages.size === 0 || negativePages.size === 0) return false;
    const distinctPages = new Set([...positivePages, ...negativePages]);
    return distinctPages.size >= 2;
  });
}

export function buildTasteMagazineNarrativeV2(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const v1Base = buildTasteMagazineNarrative(result, sources);

  // A. strong contradiction — 최우선, v1Base를 통째로 쓴다.
  if (hasStrongContradiction(result, sources)) {
    return v1Base;
  }

  // B. strong relationship
  const relationship = matchStrongestRelationship(RELATIONSHIP_DEFS_V21, result, sources);
  if (relationship) {
    const evidence: TasteMagazineNarrative["evidence"] = { ...v1Base.evidence, headline: relationship.evidence };
    return {
      // summary는 v2.1용 새 문장이 전달되지 않아 v1Base의 summary를
      // 그대로 쓴다.
      opening: { headline: relationship.def.headline, summary: v1Base.opening.summary },
      features: v1Base.features,
      interestingPart: relationship.def.interestingPart,
      pullQuote: relationship.def.pullQuote,
      keywords: v1Base.keywords,
      evidence,
    };
  }

  // C/D. 새 headline 카피가 없어 v1Base 폴백으로 그대로 넘어간다.
  return v1Base;
}

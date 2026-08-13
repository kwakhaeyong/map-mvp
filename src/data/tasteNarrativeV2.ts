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

import { TASTE_SIGNAL_KEYS, type SignalSource, type TasteAnalysisResult, type TasteSignalKey } from "./tasteAnalysis";
import {
  FUNCTIONAL_PREFERENCE_ANSWER_IDS,
  NARRATIVE_COPY,
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
// 2. RELATIONSHIP — §6/§7. 단일 observation만으로 headline을 만들지
// 않는다(§8) — 아래 5개는 모두 신호 2개(또는 신호+raw answer)의
// 조합으로만 matched된다. §6이 예시로 든 4번째 조합("ENJOY TOGETHER /
// KEEP PRIVATE" — socialDensity 높음 + expression 낮음)은 §7에 승인된
// 카피가 전혀 없어 headline을 만들 수 있는 relationship으로 구현하지
// 않았다 — 새 카피를 짓지 않기 위한 선택이다. 그 축의 observation
// (expression-low)은 buildTasteObservationsV2()로는 계속 확인 가능하다.
// ============================================================
type RelationshipDef = {
  id: string;
  headline: string;
  interestingPart?: TasteNarrativeFeature;
  pullQuote?: string;
  evaluate: (result: TasteAnalysisResult, sources: SignalSource[]) => { matched: boolean; strength: number };
};

const RELATIONSHIP_DEFS: RelationshipDef[] = [
  {
    id: "discover-fast-choose-slow",
    headline: "새로운 것은 잘 발견하지만,\n내 것으로 남기는 기준은 꽤 까다로운 사람.",
    // interestingPart headline은 §7에 body 성격의 한 줄만 주어지고
    // headline은 따로 없다 — v1 quiet-explorer의 interestingPart
    // headline이 같은 "발견은 빠르고 소유는 신중함" 의미라서 이미
    // 승인된 그 headline을 그대로 빌려 쓰고, body만 이번에 새로 전달된
    // 문장을 쓴다(새 문장을 짓지 않고 기존 승인 headline + 신규 승인
    // body를 그대로 이어붙인 것 — 완료 보고에서 공유하는 판단 근거).
    interestingPart: {
      headline: NARRATIVE_COPY["quiet-explorer"].interestingPart?.headline ?? "",
      body: "새로운 경험에는 열려 있지만,\n모든 것을 내 것으로 만들지는 않습니다.",
    },
    pullQuote: "발견은 빠르게, 선택은 천천히.",
    evaluate: (result, sources) => {
      const hasDeliberateAnswer = sources.some((s) => DELIBERATE_PURCHASE_ANSWER_IDS.includes(s.answerId));
      const matched = result.signals.novelty >= 15 && (result.signals.attachment >= 15 || hasDeliberateAnswer);
      const strength = matched ? (Math.max(0, result.signals.novelty) + Math.max(0, result.signals.attachment)) / 200 : 0;
      return { matched, strength };
    },
  },
  {
    id: "quiet-curious",
    headline: "조용한 장면을 좋아하지만,\n새로운 것을 피하지는 않는 사람.",
    // interestingPart는 §7에 body 한 줄만 주어지고 headline이 없다.
    // 의미가 겹치는 기존 승인 headline을 찾지 못해 새로 짓지 않고
    // interestingPart 자체를 생략했다(§15 "새 result 카피 작성 금지").
    evaluate: (result) => {
      const matched = result.signals.stimulus <= -15 && result.signals.novelty >= 15;
      const strength = matched ? (Math.max(0, -result.signals.stimulus) + Math.max(0, result.signals.novelty)) / 200 : 0;
      return { matched, strength };
    },
  },
  {
    id: "beauty-use",
    headline: "보기 좋은 것보다,\n오래 좋아할 이유가 있는 것을 고르는 사람.",
    // pullQuote는 §7에 주어지지 않아 practical-editor의 이미 승인된
    // pullQuote(같은 "기능/완성도" 축 의미)를 그대로 빌려 쓴다.
    // interestingPart도 §7에 body 한 줄만 있어 quiet-curious와 같은
    // 이유로 생략했다.
    pullQuote: NARRATIVE_COPY["practical-editor"].pullQuote,
    evaluate: (result, sources) => {
      const hasFunctionalAnswer = sources.some((s) => FUNCTIONAL_PREFERENCE_ANSWER_IDS.includes(s.answerId));
      const matched = result.signals.sensory >= 15 && hasFunctionalAnswer;
      const strength = matched ? Math.max(0, result.signals.sensory) / 100 : 0;
      return { matched, strength };
    },
  },
  {
    id: "familiar-deep",
    headline: "새로움을 계속 찾기보다,\n좋아하는 것을 더 깊게 즐기는 사람.",
    // §7에 headline만 주어졌다 — interestingPart는 생략, pullQuote는
    // quiet-curator의 이미 승인된 pullQuote(같은 "적게 좋아해도 오래
    // 남는다" 축 의미)를 그대로 빌려 쓴다.
    pullQuote: NARRATIVE_COPY["quiet-curator"].pullQuote,
    evaluate: (result) => {
      const matched = result.signals.novelty <= -15 && result.signals.attachment >= 15;
      const strength = matched ? (Math.max(0, -result.signals.novelty) + Math.max(0, result.signals.attachment)) / 200 : 0;
      return { matched, strength };
    },
  },
  {
    id: "experience-share",
    headline: "좋은 것을 발견하면\n혼자 간직하기보다 경험으로 이어가는 사람.",
    // §7에 headline만 주어졌다 — pullQuote는 urban-explorer의 이미
    // 승인된 pullQuote(같은 "경험/공유" 축 의미)를 그대로 빌려 쓴다.
    // trigger 축(novelty+expression 동시 상승)은 §6에 구체적 수치가
    // 없어 Claude가 임의로 정한 임계값이다 — 완료 보고에서 공유한다.
    pullQuote: NARRATIVE_COPY["urban-explorer"].pullQuote,
    evaluate: (result) => {
      const matched = result.signals.novelty >= 10 && result.signals.expression >= 10;
      const strength = matched ? (Math.max(0, result.signals.novelty) + Math.max(0, result.signals.expression)) / 200 : 0;
      return { matched, strength };
    },
  },
];

function matchStrongestRelationship(result: TasteAnalysisResult, sources: SignalSource[]): RelationshipDef | undefined {
  const matches = RELATIONSHIP_DEFS.map((def) => ({ def, ...def.evaluate(result, sources) })).filter((m) => m.matched);
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.strength - a.strength);
  return matches[0].def;
}

// ============================================================
// 3. TOP-LEVEL — v1Base(feature/keyword 재사용) + Observation/
// Relationship pipeline(opening.headline/interestingPart/pullQuote)을
// 합성한다. §14: 기존 TasteMagazineResult가 그대로 받을 수 있도록
// TasteMagazineNarrative 타입을 그대로 반환한다(drop-in 교체).
//
// headline 우선순위(§8 "strong relationship 우선"): matched
// relationship이 있으면 그 headline을, 없으면 v1Base.opening.headline
// (이미 그 안에서 contradiction → trait → raw combination → signal
// strength 순으로 fallback 되어 있다)을 그대로 쓴다.
//
// interestingPart 우선순위(§10 "contradiction → 예상치 못한
// relationship → 강한 2-observation pattern → 생략"):
//   1) core axis(stimulus/socialDensity) contradiction이 실제로 있으면
//      v1Base.interestingPart를 그대로 쓴다 — v1 엔진이 이미 그 경우
//      contradiction 카피를 최우선으로 고르도록 되어 있다.
//   2) 아니면 matched relationship 자신의 interestingPart(있는 경우만).
//   3) 아니면 v1Base.interestingPart(quiet-explorer 패턴으로 이미
//      임계값을 넘겨 채워진 경우) 그대로 사용.
//   4) 전부 없으면 생략.
//
// 이 설계는 headline과 interestingPart가 서로 다른 근거(하나는
// relationship 우선, 하나는 contradiction 우선)에서 나올 수 있다는
// 뜻이다 — §8과 §10이 서로 다른 우선순위를 제시하고 있어 Claude가
// 문자 그대로 따로 구현한 결과이며, 완료 보고에서 공유하는 판단
// 근거다.
// ============================================================
const CONTRADICTION_CORE_AXES: TasteSignalKey[] = ["stimulus", "socialDensity"];

export function buildTasteMagazineNarrativeV2(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const v1Base = buildTasteMagazineNarrative(result, sources);
  const relationship = matchStrongestRelationship(result, sources);
  const hasCoreContradiction = result.contradictions.some((c) => CONTRADICTION_CORE_AXES.includes(c.axis));

  const headline = relationship?.headline ?? v1Base.opening.headline;
  // summary는 v2용 새 문장이 전달되지 않아 v1Base의 summary를 그대로
  // 쓴다(§15 "새 result 카피 작성 금지") — headline은 relationship
  // 것이고 summary는 v1Base 것일 수 있다는 점은 완료 보고에서 공유한다.
  const summary = v1Base.opening.summary;

  const interestingPart = hasCoreContradiction ? v1Base.interestingPart : (relationship?.interestingPart ?? v1Base.interestingPart);

  const pullQuote = relationship?.pullQuote ?? v1Base.pullQuote;

  return {
    opening: { headline, summary },
    features: v1Base.features,
    interestingPart,
    pullQuote,
    keywords: v1Base.keywords,
    evidence: v1Base.evidence,
  };
}

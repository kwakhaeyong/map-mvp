// TASTE NARRATIVE SYSTEM v2.3(2026-08) — "COLLISION RESOLUTION". v2.2
// (tasteNarrativeV22.ts)는 relationship이 여러 개 동시에 strong해도
// strength(신호 크기 합) 1등만 opening headline으로 쓰고 나머지는
// 전부 버리는 winner-takes-all 구조였다. 이번 지시는 그 구조를
// 없애고, 한 사람에게 여러 strong relationship이 있으면 그 정보를
// 최대한 살려서 보여주라는 것이다. Questionnaire v2.2는 이번에 손대지
// 않는다 — signal/옵션/문항은 전부 그대로, "여러 evidence를 어떻게
// 조합해서 문장으로 내보내는가"만 바꾼다.
//
// 이 파일이 하는 일 3가지(지시 1~4번):
//   1) winner-takes-all 제거 — matchAllRelationshipsV23()가 strong한
//      relationship을 전부 반환한다(1등만 고르지 않는다).
//   2) 출력 구조 재편 — Opening=1등(contradiction 또는 relationship),
//      Interesting Part=Opening과 다른 relationship 중 2등.
//      Feature(place/object/detail/ritual)는 이번에 새 카피가 오지
//      않아 v1Base 그대로 둔다(§ "완료 후" 보고에서 이 스코프 선택을
//      공유한다).
//   3) BEAUTY/USE와 SENSORY/PRACTICAL을 axis(신호 축)가 아니라 raw
//      answer(실제로 고른 선택지)로 구분한다 — 둘 다 sensory HIGH +
//      curation HIGH라는 같은 축 조합이라 v2.2까지는 이 둘이 강도까지
//      완전히 같은 동률이었다. 이번에 "well-made를 골랐는가" vs
//      "functional을 골랐는가"라는 실제 선택 기준으로 갈라서, 한
//      사람이 둘 다 고르면(pair-2=functional, pair-3=well-made) 두
//      relationship이 동시에 살아남을 수 있게 한다.
//   4) QUIET/CURIOUS·PRIVATE/CURIOUS는 손대지 않는다 — 이미 서로 다른
//      축 조합(stimulus low+novelty high vs expression low+novelty
//      high)이라 기존 axis+2-page 규칙 그대로 독립적으로 판정되고,
//      둘 다 strong이면 1)/2)의 일반 규칙(강한 쪽=opening, 나머지=
//      interesting part)에 자연스럽게 올라탄다.
//
// v2.1(RELATIONSHIP_DEFS_V21) / v2.2 신규 4개(RELATIONSHIP_DEFS_V22_NEW)의
// headline/interestingPart/pullQuote 카피는 전혀 건드리지 않는다(지시
// 7번) — tasteNarrativeV22.ts의 RELATIONSHIP_DEFS_V22(10개)를 그대로
// import해서 "어떻게 고르는가"만 다시 짠다.

import { type SignalSource, type TasteAnalysisResult } from "./tasteAnalysis";
import { buildTasteMagazineNarrative, type TasteMagazineNarrative } from "./tasteNarrative";
import {
  DELIBERATE_PURCHASE_ANSWER_IDS,
  axisDirectionMatches,
  axisEvidenceLabels,
  axisEvidencePages,
  evaluateRelationship,
  hasStrongContradiction,
  type RelationshipAxis,
  type RelationshipDef,
} from "./tasteNarrativeV2";
import { RELATIONSHIP_DEFS_V22 } from "./tasteNarrativeV22";

export { hasStrongContradiction } from "./tasteNarrativeV2";

// ============================================================
// 3번 — BEAUTY/USE vs SENSORY/PRACTICAL raw evidence 분리.
//
// 지시문 그대로:
//   BEAUTY/USE      = sensory/detail evidence AND well-made 계열 evidence
//                      AND(가능하면) deliberate purchase evidence
//   SENSORY/PRACTICAL = sensory/detail evidence AND "오래 써도 편한 것"/
//                      functional 계열 evidence AND(가능하면) deliberate
//                      purchase evidence
//
// "sensory/detail evidence"는 기존 관용(OBSERVATION_RULES의
// sensory-attuned observation, RELATIONSHIP_DEFS의 sensory 축)과 동일하게
// sensory 축이 양(+)인 evidence로 해석했다 — 새 개념을 만들지 않았다.
//
// "well-made 계열" / "functional 계열"은 v1 KEEP(PAGE 03)에서 유래한
// answer id를 그대로 쓴다 — v1/v2/v2.2가 전부 이 id를 공유한다
// (tasteQuestionnaireV22.ts PAGE 03 TRADE-OFF pair-3 b="well-made",
// pair-2 b="functional"). 새 answer id를 만들지 않았다.
//
// "가능하면 deliberate purchase evidence"는 지시문이 조건절 없이
// "가능하면"이라고만 적어 필수 조건으로 요구하지 않은 것으로 읽었다 —
// 있으면 evidence에 포함하되, 없다고 매칭이 실패하지는 않는다. 이
// 해석은 완료 보고에서 판단 근거로 공유한다.
//
// "한 문항 하나로 relationship이 정해지지 않는다"는 v2.1의 기존 원칙
// (§D)을 raw evidence 방식에도 그대로 적용한다 — sensory 양(+) evidence
// 페이지와 well-made/functional 선택 페이지를 합쳐 서로 다른 페이지가
// 최소 2곳이어야 매칭된다(PAGE 03 TRADE-OFF는 pair마다 독립 page로
// 취급되므로, well-made/functional 자신도 sensory에 기여하지만 그것만
// 으로는 페이지 수 1개라 통과하지 못한다).
// ============================================================
const SENSORY_HIGH_AXIS: RelationshipAxis = { key: "sensory", direction: "high" };

// def.id → "이 relationship을 구분짓는 실제 선택지 id". 축(§3의
// sensory+curation)이 같아도 이 answer id로 두 relationship을 갈라
// 놓는다.
const RAW_EVIDENCE_DISTINGUISHING_ANSWER: Record<string, string> = {
  "beauty-use": "well-made",
  "sensory-practical": "functional",
};

export type RelationshipMatchV23 = { def: RelationshipDef; strength: number; evidence: string[]; evidencePageCount: number };

function evaluateRawEvidenceRelationship(def: RelationshipDef, requiredAnswerId: string, result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatchV23 | null {
  if (!axisDirectionMatches(result, SENSORY_HIGH_AXIS)) return null;

  const distinguishingSources = sources.filter((s) => s.answerId === requiredAnswerId);
  if (distinguishingSources.length === 0) return null;

  const sensoryPages = axisEvidencePages(sources, SENSORY_HIGH_AXIS);
  const distinguishingPages = new Set(distinguishingSources.map((s) => s.questionId));
  const allPages = new Set([...sensoryPages, ...distinguishingPages]);
  if (allPages.size < 2) return null;

  const deliberateSources = sources.filter((s) => DELIBERATE_PURCHASE_ANSWER_IDS.includes(s.answerId));

  const strength = def.axes.reduce((sum, axis) => sum + Math.abs(result.signals[axis.key]), 0) / 200;
  const evidence = Array.from(
    new Set([
      ...axisEvidenceLabels(sources, SENSORY_HIGH_AXIS),
      ...distinguishingSources.map((s) => `${s.questionId}: ${s.answerId}`),
      ...deliberateSources.map((s) => `${s.questionId}: ${s.answerId}`),
    ])
  );

  return { def, strength, evidence, evidencePageCount: allPages.size };
}

function evaluateGenericRelationship(def: RelationshipDef, result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatchV23 | null {
  const base = evaluateRelationship(def, result, sources);
  if (!base) return null;
  const pageSet = new Set<string>();
  for (const axis of def.axes) for (const page of axisEvidencePages(sources, axis)) pageSet.add(page);
  return { def: base.def, strength: base.strength, evidence: base.evidence, evidencePageCount: pageSet.size };
}

// ============================================================
// 1번 — winner-takes-all 제거. strong한 relationship을 전부 반환한다.
//
// 정렬 기준(지시 9번 — 배열 순서/stable sort로 결정되지 않게):
//   1. strength(축 신호 크기 합) 내림차순 — 기존에도 쓰던 "설명력"
//      지표를 그대로 재사용한다(§2/§4의 "설명력이 높은 쪽").
//   2. evidencePageCount(이 relationship을 뒷받침하는 서로 다른 page
//      수) 내림차순 — "더 많은 서로 다른 문항이 독립적으로 같은
//      방향을 확인해줬다"는 것도 설명력의 일부로 본다. 새 개념이
//      아니라 이미 매칭 조건으로 쓰던 값을 정렬 키로도 쓰는 것뿐이다.
//   3. def.id 알파벳 순 — 1·2번까지 완전히 같을 때만 쓰는 최종
//      결정자다. RELATIONSHIP_DEFS_V22 배열에서 어떤 순서로 선언
//      됐는지와 무관한 값(문자열 자체)이라 "배열 선언 순서"가 결과를
//      결정하지 않는다. 다만 이 기준 자체도 임의성이 없다고는 할 수
//      없어 실제로 1·2번까지 동률인 사례가 나오면 완료 보고에서 그대로
//      공개한다.
// ============================================================
export function matchAllRelationshipsV23(result: TasteAnalysisResult, sources: SignalSource[]): RelationshipMatchV23[] {
  const matches = RELATIONSHIP_DEFS_V22.map((def) => {
    const requiredAnswerId = RAW_EVIDENCE_DISTINGUISHING_ANSWER[def.id];
    if (requiredAnswerId) return evaluateRawEvidenceRelationship(def, requiredAnswerId, result, sources);
    return evaluateGenericRelationship(def, result, sources);
  }).filter((m): m is RelationshipMatchV23 => m !== null);

  matches.sort((a, b) => {
    if (b.strength !== a.strength) return b.strength - a.strength;
    if (b.evidencePageCount !== a.evidencePageCount) return b.evidencePageCount - a.evidencePageCount;
    return a.def.id.localeCompare(b.def.id);
  });

  return matches;
}

// ============================================================
// 2번 — 출력 구조. Opening/Interesting Part.
//
//   A. strong contradiction — 지시 5번대로 Opening 우선권을 유지한다
//      (v2.1/v2.2와 동일하게 v1Base의 headline/summary를 그대로 쓴다).
//      Interesting Part는 matchAllRelationshipsV23()의 1등 relationship
//      (있으면)으로 채운다 — contradiction은 relationship 목록에
//      들어있지 않으므로 지시 6번("같은 relationship을 Opening과
//      Interesting Part에 중복 사용하지 않는다")과 자동으로 충돌하지
//      않는다.
//   B. strong contradiction이 아니면 — 1등 relationship이 Opening,
//      2등 relationship(있고 자기 자신과 다르면)이 Interesting Part.
//      relationship이 하나만 strong이면 Interesting Part는 비운다 —
//      6번 지시대로 "같은 relationship을 두 번 쓰지 않는다"를 그대로
//      따른 결과다(v2.1/v2.2는 1등 relationship 자신의 interestingPart를
//      재사용했지만, 이번 지시는 그 재사용 자체를 금지한다).
//   C/D. relationship이 하나도 strong하지 않으면 v1Base 그대로 — v2.1/
//      v2.2와 동일하게 이번에도 새 fallback 카피가 없어 손대지 않는다.
//
// Feature(place/object/detail/ritual)는 "남은 relationship evidence를
// 필요 시 활용"(지시 2번)이라고 돼 있지만, 이번에도 feature 문구
// 자체는 새로 전달되지 않았다 — 새 카피를 짓지 말라는 지시 7번과
// 충돌하지 않도록 이번 라운드에서는 손대지 않고 v1Base 그대로 둔다.
// 이 스코프 선택은 완료 보고에서 그대로 공유한다.
// ============================================================
export function buildTasteMagazineNarrativeV23(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const v1Base = buildTasteMagazineNarrative(result, sources);
  const matches = matchAllRelationshipsV23(result, sources);

  // A. strong contradiction — Opening 우선권 유지.
  if (hasStrongContradiction(result, sources)) {
    const top = matches[0];
    if (!top) return v1Base;

    const evidence: TasteMagazineNarrative["evidence"] = { ...v1Base.evidence };
    if (top.def.interestingPart) evidence.interestingPart = top.evidence;

    return {
      opening: { headline: v1Base.opening.headline, summary: v1Base.opening.summary },
      features: v1Base.features,
      interestingPart: top.def.interestingPart,
      pullQuote: v1Base.pullQuote,
      keywords: v1Base.keywords,
      evidence,
    };
  }

  // B. strong relationship — 1등=Opening, 2등(다른 relationship)=Interesting Part.
  const [first, second] = matches;
  if (!first) return v1Base;

  const evidence: TasteMagazineNarrative["evidence"] = { ...v1Base.evidence, headline: first.evidence };
  if (second && second.def.interestingPart) evidence.interestingPart = second.evidence;

  return {
    opening: { headline: first.def.headline, summary: v1Base.opening.summary },
    features: v1Base.features,
    interestingPart: second?.def.interestingPart,
    pullQuote: first.def.pullQuote,
    keywords: v1Base.keywords,
    evidence,
  };
}

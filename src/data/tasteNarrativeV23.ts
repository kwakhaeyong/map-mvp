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
//
// ------------------------------------------------------------
// "OPENING ARBITRATION" 추가 라운드(2026-08, 같은 파일/함수명 유지) —
// 위 winner-takes-all 제거 이후 20-profile 검증에서 "무엇을 발견했는가"
// 자체는 다층적이었지만 Opening headline 분포가 일부에 쏠리는 문제가
// 남았다. 이번 지시는 "새 relationship/기능 추가"가 아니라 "여러
// strong 후보 중 무엇을 Opening/Interesting Part로 보여줄지 고르는
// 방법"만 다시 짜는 것이다 — matchAllRelationshipsV23()의 strength/
// evidencePageCount 계산은 그대로 재사용하고, buildOpeningArbitration()
// 이하만 새로 추가했다. buildTasteMagazineNarrativeV23()라는 이름과
// 시그니처는 그대로 유지해 TasteJourneyClient.tsx의 기존 V2.3 토글이
// 코드 변경 없이 개선된 arbitration을 그대로 쓰게 했다(지시 "Narrative
// v2.5 같은 추가 버전 생성 금지"·"Continuation UI 개발 금지"에 따라
// 새 파일/새 토글을 만들지 않았다).

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
// "OPENING ARBITRATION" (2026-08 추가 라운드) — 위 matchAllRelationshipsV23()
// 까지는 "무엇이 strong한가"를 찾는 단계였다. 이 아래는 그 결과가
// 여러 개일 때 "그중 무엇을 Opening 문장으로 보여줄 것인가"를
// 결정하는 별도 단계다. 기존 signal/strength/evidence 계산은 전혀
// 새로 만들지 않고, 이미 있는 값들을 후보(OpeningCandidate)로 모아
// 우선순위 규칙으로 고르기만 한다.
//
// 후보 소스 3가지(지시 §3):
//   A. strong contradiction — v1Base가 이미 계산한 headline/evidence.
//   B. matched relationship — matchAllRelationshipsV23()의 결과.
//   C. v1Base fallback — 위 둘 다 없을 때만.
// ============================================================
export type OpeningCandidateSourceType = "contradiction" | "relationship" | "fallback";

export type OpeningCandidate = {
  sourceType: OpeningCandidateSourceType;
  sourceId: string;
  headline: string;
  pullQuote: string;
  interestingPart?: TasteMagazineNarrative["interestingPart"];
  evidence: string[];
  // strength는 contradiction/fallback에는 존재하지 않는다(§4① — 이
  // 둘은 strength 비교 대상이 아니라 우선권 게이트다). 리포트용으로만
  // -1을 채워 "비교 대상 아님"을 표시한다 — 실제 arbitration 비교
  // 로직(compareRelationshipCandidates)은 relationship 후보끼리만 쓴다.
  strength: number;
  evidencePageCount: number;
  evidenceAnswerCount: number;
  axisCount: number;
};

function pageIdFromEvidenceLabel(label: string): string {
  const idx = label.indexOf(": ");
  return idx === -1 ? label : label.slice(0, idx);
}

function pagesFromEvidence(evidence: string[]): Set<string> {
  return new Set(evidence.map(pageIdFromEvidenceLabel));
}

// §4④ deterministic tie-break — strength → evidencePageCount →
// evidenceAnswerCount → sourceId(알파벳, 배열 선언 순서와 무관). axisCount는
// §3에 나열된 후보 정보이지만 §4③이 "축 개수가 많다고 무조건 우선하지
// 않는다"고 명시해 비교 키에서 제외했다 — 리포트에만 노출한다.
function compareRelationshipCandidates(a: OpeningCandidate, b: OpeningCandidate): number {
  if (b.strength !== a.strength) return b.strength - a.strength;
  if (b.evidencePageCount !== a.evidencePageCount) return b.evidencePageCount - a.evidencePageCount;
  if (b.evidenceAnswerCount !== a.evidenceAnswerCount) return b.evidenceAnswerCount - a.evidenceAnswerCount;
  return a.sourceId.localeCompare(b.sourceId);
}

function relationshipMatchToCandidate(m: RelationshipMatchV23): OpeningCandidate {
  return {
    sourceType: "relationship",
    sourceId: m.def.id,
    headline: m.def.headline,
    pullQuote: m.def.pullQuote,
    interestingPart: m.def.interestingPart,
    evidence: m.evidence,
    strength: m.strength,
    evidencePageCount: m.evidencePageCount,
    evidenceAnswerCount: m.evidence.length,
    axisCount: m.def.axes.length,
  };
}

// Interesting Part 제외 규칙(지시 §6 "Opening과 사실상 동일한 이야기를
// 반복하는 경우는 제외") — 판별 가능한 기존 구조는 evidence page
// 집합뿐이라 그것으로 판단했다: 후보의 evidence page가 전부 Opening의
// evidence page에 이미 포함돼 있으면(새로운 근거를 하나도 더하지
// 못하면) "같은 이야기의 반복"으로 보고 제외한다. 반대로 축이 같아도
// (BEAUTY/USE·SENSORY/PRACTICAL처럼) 서로 다른 page/answer 근거로
// 성립한 경우는 여기 해당하지 않아 그대로 Interesting Part 후보가
// 될 수 있다 — v2.3의 §3 동시생존 동작을 깨지 않는다(지시 §6 마지막
// 문장 그대로).
function isRedundantWithOpening(candidate: OpeningCandidate, opening: OpeningCandidate): boolean {
  const candidatePages = pagesFromEvidence(candidate.evidence);
  if (candidatePages.size === 0) return false;
  const openingPages = pagesFromEvidence(opening.evidence);
  return Array.from(candidatePages).every((p) => openingPages.has(p));
}

export type OpeningArbitrationResult = {
  candidates: OpeningCandidate[]; // 검토된 전체 후보(리포트용) — contradiction/relationship 전부
  winner: OpeningCandidate;
  runnerUp?: OpeningCandidate;
  reason: string;
  interestingPartCandidate?: OpeningCandidate;
};

function describeReason(sortedRelationships: OpeningCandidate[], winnerIsContradiction: boolean): string {
  if (winnerIsContradiction) return "strong contradiction protection(§4①) — relationship strength와 무관하게 Opening 우선권 유지";
  if (sortedRelationships.length === 0) return "매칭된 relationship 없음 — v1Base fallback";
  if (sortedRelationships.length === 1) return "strong relationship 1개뿐 — arbitration 불필요, 그대로 채택(§8 Edge Case E)";
  const [winner, next] = sortedRelationships;
  if (winner.strength !== next.strength) return `strength 우위(${winner.strength.toFixed(3)} > ${next.strength.toFixed(3)})`;
  if (winner.evidencePageCount !== next.evidencePageCount) return `strength 동률 → evidencePageCount 우위(${winner.evidencePageCount} > ${next.evidencePageCount})`;
  if (winner.evidenceAnswerCount !== next.evidenceAnswerCount) return `strength·evidencePageCount 동률 → evidenceAnswerCount 우위(${winner.evidenceAnswerCount} > ${next.evidenceAnswerCount})`;
  return `strength·evidencePageCount·evidenceAnswerCount 전부 동률 → sourceId 알파벳 순 tie-break("${winner.sourceId}" < "${next.sourceId}")`;
}

export function buildOpeningArbitration(result: TasteAnalysisResult, sources: SignalSource[]): OpeningArbitrationResult {
  const v1Base = buildTasteMagazineNarrative(result, sources);
  const relationshipMatches = matchAllRelationshipsV23(result, sources);
  const relationshipCandidates = relationshipMatches.map(relationshipMatchToCandidate);
  const sortedRelationships = [...relationshipCandidates].sort(compareRelationshipCandidates);

  const strongContradiction = hasStrongContradiction(result, sources);
  const contradictionCandidate: OpeningCandidate | undefined = strongContradiction
    ? {
        sourceType: "contradiction",
        sourceId: `contradiction-${result.contradictions[0]?.axis ?? "unknown"}`,
        headline: v1Base.opening.headline,
        pullQuote: v1Base.pullQuote,
        interestingPart: undefined,
        evidence: v1Base.evidence.headline,
        strength: -1,
        evidencePageCount: pagesFromEvidence(v1Base.evidence.headline).size,
        evidenceAnswerCount: v1Base.evidence.headline.length,
        axisCount: 1,
      }
    : undefined;

  const fallbackCandidate: OpeningCandidate = {
    sourceType: "fallback",
    sourceId: "v1Base",
    headline: v1Base.opening.headline,
    pullQuote: v1Base.pullQuote,
    interestingPart: v1Base.interestingPart,
    evidence: v1Base.evidence.headline,
    strength: -1,
    evidencePageCount: pagesFromEvidence(v1Base.evidence.headline).size,
    evidenceAnswerCount: v1Base.evidence.headline.length,
    axisCount: 0,
  };

  // §4① strong contradiction protection — 존재하면 무조건 Opening.
  const winner = contradictionCandidate ?? sortedRelationships[0] ?? fallbackCandidate;
  const runnerUp = contradictionCandidate ? sortedRelationships[0] : winner.sourceType === "relationship" ? sortedRelationships[1] : undefined;
  const reason = describeReason(sortedRelationships, Boolean(contradictionCandidate));

  // Interesting Part — winner로 쓰인 relationship 자신은 제외하고,
  // 승인된 interestingPart 카피가 있고, winner와 evidence page가
  // 겹치기만 하지 않는(=새 근거를 더하는) 후보 중 가장 순위가 높은
  // 것을 쓴다(§6).
  const interestingPool = relationshipCandidates
    .filter((c) => !(winner.sourceType === "relationship" && c.sourceId === winner.sourceId))
    .filter((c) => Boolean(c.interestingPart))
    .filter((c) => !isRedundantWithOpening(c, winner))
    .sort(compareRelationshipCandidates);

  const candidates = contradictionCandidate ? [contradictionCandidate, ...relationshipCandidates] : relationshipCandidates;

  return {
    candidates,
    winner,
    runnerUp,
    reason,
    interestingPartCandidate: interestingPool[0],
  };
}

// ============================================================
// TOP-LEVEL — buildOpeningArbitration()의 winner/interestingPartCandidate를
// 그대로 TasteMagazineNarrative로 옮긴다. Feature(place/object/detail/
// ritual)는 이번에도 새 카피가 오지 않아 v1Base 그대로 둔다(지시
// "Magazine 디자인/카피 개선 금지"와 일치) — v2.3과 동일한 스코프
// 선택이다.
// ============================================================
export function buildTasteMagazineNarrativeV23(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const v1Base = buildTasteMagazineNarrative(result, sources);
  const { winner, interestingPartCandidate } = buildOpeningArbitration(result, sources);

  if (winner.sourceType === "fallback") return v1Base;

  const evidence: TasteMagazineNarrative["evidence"] = { ...v1Base.evidence, headline: winner.evidence };
  if (interestingPartCandidate) evidence.interestingPart = interestingPartCandidate.evidence;

  return {
    opening: { headline: winner.headline, summary: v1Base.opening.summary },
    features: v1Base.features,
    interestingPart: interestingPartCandidate?.interestingPart,
    pullQuote: winner.pullQuote,
    keywords: v1Base.keywords,
    evidence,
  };
}

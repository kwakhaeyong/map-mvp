// CROSS-ISSUE SUPPORT(2026-08, PR #261 Round I) — TASTE/TRAVEL 양쪽
// 화면(Result/My Magazine)에서 공통으로 필요한 "저장된 두 Issue로부터
// Cross-Issue candidate를 계산하는" 로직을 한 곳에 모았다. TASTE 계산
// 방식(extractV3Evidence/aggregateV3Axes)은 읽기 전용으로만 참조하고
// 절대 바꾸지 않는다(§1).
import { TASTE_QUESTIONS_V3, TASTE_V3_AXIS_KEYS, type TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { aggregateV3Axes, extractV3Evidence } from "./tasteEvidenceV3";
import { TRAVEL_QUESTIONS_V1, TRAVEL_V1_AXIS_KEYS, type TravelAxisKey, type TravelV1RawAnswers } from "./travelQuestionnaireV1";
import { aggregateTravelV1Axes, extractTravelV1Evidence } from "./travelEvidenceV1";
import { computeAllAxisMaxAbs, normalizeAxes } from "./axisNormalization";
import { computeCrossIssueCandidates, type CrossIssueCandidate } from "./travelCrossIssueV1";
import type { AnySavedTasteIssue } from "./tasteIssueStorage";

// §5 — TASTE/TRAVEL max-abs는 실제 문항 정의에서 기계적으로 계산한다
// (사람이 어림한 값 하드코딩 금지). 문항 수가 적어(15/14) 매 호출마다
// 다시 계산해도 비용이 미미하지만, 모듈 상수로 한 번만 계산해 재사용한다.
const TASTE_AXIS_MAX_ABS = computeAllAxisMaxAbs(TASTE_QUESTIONS_V3, TASTE_V3_AXIS_KEYS);
const TRAVEL_AXIS_MAX_ABS = computeAllAxisMaxAbs(TRAVEL_QUESTIONS_V1, TRAVEL_V1_AXIS_KEYS);

export type CrossIssueResult = { primary: CrossIssueCandidate | null; secondary: CrossIssueCandidate | null };

const NO_CANDIDATE: CrossIssueResult = { primary: null, secondary: null };

// §15 — TASTE가 없거나(legacy v2.2는 6축 체계가 아니라 호환 불가) 아직
// TRAVEL을 완료하지 않았으면 후보 없음(null)을 그대로 반환한다 — 호출부가
// 이 값을 보고 섹션 전체를 숨긴다. travelAnswers는 저장 여부와 무관하게
// (SAVE 전 미리보기 포함) 받을 수 있도록 raw answers만 받는다.
export function computeCrossIssueForSavedIssues(
  savedTaste: AnySavedTasteIssue | null,
  travelAnswers: TravelV1RawAnswers | null
): CrossIssueResult {
  if (!savedTaste || savedTaste.questionnaireVersion !== "v3" || !travelAnswers) return NO_CANDIDATE;

  const tasteEvidence = extractV3Evidence(savedTaste.answers);
  const tasteAggregate = aggregateV3Axes(tasteEvidence);
  const tasteScores = Object.fromEntries(TASTE_V3_AXIS_KEYS.map((k) => [k, tasteAggregate[k].score])) as Record<TasteV3AxisKey, number>;
  const tasteNormalized = normalizeAxes(tasteScores, TASTE_AXIS_MAX_ABS, TASTE_V3_AXIS_KEYS);

  const travelEvidence = extractTravelV1Evidence(travelAnswers);
  const travelAggregate = aggregateTravelV1Axes(travelEvidence);
  const travelScores = Object.fromEntries(TRAVEL_V1_AXIS_KEYS.map((k) => [k, travelAggregate[k].score])) as Record<TravelAxisKey, number>;
  const travelNormalized = normalizeAxes(travelScores, TRAVEL_AXIS_MAX_ABS, TRAVEL_V1_AXIS_KEYS);

  return computeCrossIssueCandidates(tasteNormalized, travelNormalized, tasteAggregate, travelAggregate);
}

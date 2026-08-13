// TASTE v3 — EVIDENCE MODEL(§5 PRODUCT FREEZE).
//
// LEVEL 1 — AXIS: 6개 해석축 합산 점수.
// LEVEL 2 — EVIDENCE: 사용자가 실제로 고른 구체적인 선택(evidenceTag/
//   evidenceLabel)을 점수로 뭉개지 않고 그대로 보존한다.
// LEVEL 3 — RELATIONSHIP/TENSION은 별도 파일(tasteRelationshipsV3.ts /
//   tasteTensionsV3.ts)에서 이 evidence를 입력으로 받아 계산한다.

import { TASTE_QUESTIONS_V3, TASTE_V3_AXIS_KEYS, type TasteV3AxisKey, type TasteV3Question, type TasteV3RawAnswers } from "./tasteQuestionnaireV3";

export type V3EvidenceItem = {
  questionId: string;
  qNumber: number;
  eyebrow: string;
  optionId: string;
  optionLabel: string;
  evidenceTag: string;
  evidenceLabel: string;
  axes: Partial<Record<TasteV3AxisKey, number>>;
};

// LEVEL 2 — evidence extraction. 답변이 비어 있으면(질문 스킵 등) 그
// 문항은 evidence 목록에서 빠진다 — 임의로 기본값을 채우지 않는다.
export function extractV3Evidence(answers: TasteV3RawAnswers, questions: TasteV3Question[] = TASTE_QUESTIONS_V3): V3EvidenceItem[] {
  const items: V3EvidenceItem[] = [];
  for (const question of questions) {
    const selectedId = answers[question.id];
    if (!selectedId) continue;
    const option = question.options.find((o) => o.id === selectedId);
    if (!option) continue;
    items.push({
      questionId: question.id,
      qNumber: question.qNumber,
      eyebrow: question.eyebrow,
      optionId: option.id,
      optionLabel: option.label.replace(/\n/g, " "),
      evidenceTag: option.evidenceTag,
      evidenceLabel: option.evidenceLabel,
      axes: option.axes,
    });
  }
  return items;
}

export type V3AxisAggregate = Record<TasteV3AxisKey, { score: number; evidence: V3EvidenceItem[] }>;

// LEVEL 1 — axis 합산. 축마다 그 축에 실제로 기여한 evidence만 모아둔다
// (합산 점수뿐 아니라 "어떤 질문이 이 축을 만들었는가"를 항상 함께
// 들고 있어야 Relationship/Tension이 "서로 다른 질문 2곳 이상"이라는
// evidence page 조건을 검증할 수 있다).
export function aggregateV3Axes(evidence: V3EvidenceItem[]): V3AxisAggregate {
  const aggregate = Object.fromEntries(TASTE_V3_AXIS_KEYS.map((key) => [key, { score: 0, evidence: [] as V3EvidenceItem[] }])) as V3AxisAggregate;
  for (const item of evidence) {
    for (const key of TASTE_V3_AXIS_KEYS) {
      const value = item.axes[key];
      if (!value) continue;
      aggregate[key].score += value;
      aggregate[key].evidence.push(item);
    }
  }
  return aggregate;
}

export function findEvidenceByQ(evidence: V3EvidenceItem[], qNumber: number): V3EvidenceItem | undefined {
  return evidence.find((e) => e.qNumber === qNumber);
}

export function evidencePageCount(items: V3EvidenceItem[]): number {
  return new Set(items.map((e) => e.questionId)).size;
}

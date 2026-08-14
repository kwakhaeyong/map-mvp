// TRAVEL v1 — EVIDENCE MODEL. tasteEvidenceV3.ts와 동일한 3-level
// 구조(axis 합산 / evidence 보존 / relationship-tension은 여기서
// 다루지 않음)를 그대로 따르되, 기존 파일(FREEZE)은 한 글자도
// 건드리지 않기 위해 독립 파일로 새로 작성했다.

import { TRAVEL_QUESTIONS_V1, TRAVEL_V1_AXIS_KEYS, type TravelAxisKey, type TravelV1Question, type TravelV1RawAnswers } from "./travelQuestionnaireV1";

export type TravelV1EvidenceItem = {
  questionId: string;
  qNumber: number;
  eyebrow: string;
  optionId: string;
  optionLabel: string;
  evidenceTag: string;
  evidenceLabel: string;
  axes: Partial<Record<TravelAxisKey, number>>;
};

export function extractTravelV1Evidence(answers: TravelV1RawAnswers, questions: TravelV1Question[] = TRAVEL_QUESTIONS_V1): TravelV1EvidenceItem[] {
  const items: TravelV1EvidenceItem[] = [];
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

export type TravelV1AxisAggregate = Record<TravelAxisKey, { score: number; evidence: TravelV1EvidenceItem[] }>;

export function aggregateTravelV1Axes(evidence: TravelV1EvidenceItem[]): TravelV1AxisAggregate {
  const aggregate = Object.fromEntries(TRAVEL_V1_AXIS_KEYS.map((key) => [key, { score: 0, evidence: [] as TravelV1EvidenceItem[] }])) as TravelV1AxisAggregate;
  for (const item of evidence) {
    for (const key of TRAVEL_V1_AXIS_KEYS) {
      const value = item.axes[key];
      if (!value) continue;
      aggregate[key].score += value;
      aggregate[key].evidence.push(item);
    }
  }
  return aggregate;
}

export function findTravelEvidenceByQ(evidence: TravelV1EvidenceItem[], qNumber: number): TravelV1EvidenceItem | undefined {
  return evidence.find((e) => e.qNumber === qNumber);
}

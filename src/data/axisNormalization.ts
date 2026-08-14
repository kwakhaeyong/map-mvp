// AXIS NORMALIZATION(2026-08, PR #261 Round I §5) — TASTE와 TRAVEL의
// raw axis score를 서로 비교 가능한 하나의 domain(-1.0~+1.0)으로
// 변환한다. TASTE 쪽 max-abs는 사람이 어림한 값을 하드코딩하지 않고,
// 실제 tasteQuestionnaireV3.ts 문항 정의에서 기계적으로 계산한다
// (§5 명시 요구) — 이 파일은 그 계산에 필요한 최소 shape만 요구하는
// 제네릭 헬퍼라, TASTE/TRAVEL 양쪽 questionnaire 타입을 그대로 넣어
// 재사용할 수 있다.
//
// 방법: 축 하나의 이론적 최댓값은 "문항마다 그 축에 가장 크게
// 기여하는 옵션을 골랐다면 나올 수 있었던 점수의 합"이다(실제 한
// 사용자가 모든 문항에서 동시에 그 값을 달성할 수 있다는 뜻은
// 아니다 — 어디까지나 정규화의 분모로 쓰는 보수적 상한이다). 문항이
// 그 축에 전혀 기여하지 않으면 0으로 취급해 합산에서 빠진다.

type MinimalOption<AxisKey extends string> = { axes: Partial<Record<AxisKey, number>> };
type MinimalQuestion<AxisKey extends string> = { options: MinimalOption<AxisKey>[] };

export function computeAxisMaxAbs<AxisKey extends string>(questions: MinimalQuestion<AxisKey>[], axis: AxisKey): number {
  let total = 0;
  for (const question of questions) {
    let maxAbsForQuestion = 0;
    for (const option of question.options) {
      const value = option.axes[axis];
      if (value === undefined) continue;
      maxAbsForQuestion = Math.max(maxAbsForQuestion, Math.abs(value));
    }
    total += maxAbsForQuestion;
  }
  return total;
}

export function computeAllAxisMaxAbs<AxisKey extends string>(questions: MinimalQuestion<AxisKey>[], axisKeys: AxisKey[]): Record<AxisKey, number> {
  return Object.fromEntries(axisKeys.map((axis) => [axis, computeAxisMaxAbs(questions, axis)])) as Record<AxisKey, number>;
}

// score(raw) → normalized(-1.0~+1.0). maxAbs가 0이면(축에 기여하는
// 문항이 없는 비정상 상태) 0으로 안전하게 처리한다.
export function normalizeScore(score: number, maxAbs: number): number {
  if (maxAbs <= 0) return 0;
  const value = score / maxAbs;
  return Math.max(-1, Math.min(1, value));
}

export function normalizeAxes<AxisKey extends string>(
  scores: Record<AxisKey, number>,
  maxAbsByAxis: Record<AxisKey, number>,
  axisKeys: AxisKey[]
): Record<AxisKey, number> {
  return Object.fromEntries(axisKeys.map((axis) => [axis, normalizeScore(scores[axis], maxAbsByAxis[axis])])) as Record<AxisKey, number>;
}

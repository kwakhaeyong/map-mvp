// TASTE v3 — §7 CONTRADICTION/TENSION(T1~T5), PRODUCT FREEZE 그대로.
//
// FREEZE는 T1~T5를 "축 방향 충돌"이 아니라 구체적인 질문 조합(예:
// "Q1/Q9 → 익숙 + Q7/Q15 → 새로움")으로 정의했다 — 그래서 이 파일은
// 범용 axis-direction 매칭이 아니라 FREEZE가 지정한 정확한 evidenceTag
// 조합을 그대로 predicate로 구현한다. 임의로 다른 문항 조합으로
// 바꾸지 않았다.

import type { V3EvidenceItem } from "./tasteEvidenceV3";

export type V3TensionDef = {
  id: string; // T1..T5
  label: string;
  headline: string;
  interestingPartBody: string;
  pullQuote: string;
  /** 매칭에 성공했을 때 관련 evidence를 골라내는 함수(있으면 인용 문장 조합에 쓴다). */
  match: (byQ: Map<number, string>) => boolean;
  relatedQNumbers: number[];
};

function selected(byQ: Map<number, string>, qNumber: number, ...optionIds: string[]): boolean {
  const v = byQ.get(qNumber);
  return v !== undefined && optionIds.includes(v);
}

export const TENSION_DEFS_V3: V3TensionDef[] = [
  {
    id: "t1-familiar-space-new-place",
    label: "T1",
    headline: "돌아갈 곳이 분명해서,\n더 멀리 가볼 수 있는 취향.",
    interestingPartBody:
      "머무는 공간과 테이블은 손에 익고 밀도 있는 쪽이 편안하면서도, 정작 낯선 동네나 하루 앞에서는 새로운 쪽으로 망설임 없이 향합니다. 안정된 자기 공간이 있다는 것이 오히려 더 멀리 나가볼 수 있는 이유가 되는 편입니다.",
    pullQuote: "돌아갈 곳이 있어서, 더 멀리 갈 수 있다.",
    relatedQNumbers: [1, 9, 7, 15],
    match: (byQ) => {
      const familiar = selected(byQ, 1, "contained-lived-in") || selected(byQ, 9, "visible-life");
      const seeksNew = selected(byQ, 7, "intuitive-discovery", "deliberate-novelty") || selected(byQ, 15, "somewhere-new");
      return familiar && seeksNew;
    },
  },
  {
    id: "t2-sensitive-not-visible",
    label: "T2",
    headline: "많이 보지만,\n많이 보여주지는 않는 취향.",
    interestingPartBody:
      "재료와 질감, 사람의 흔적 같은 작은 디테일에는 누구보다 먼저 반응하면서도, 정작 자신의 취향이 겉으로 드러나는 일은 드뭅니다. 섬세하게 감지하는 것과 적극적으로 표현하는 것이 당신에게는 같은 회로로 이어져 있지 않습니다.",
    pullQuote: "감각은 예민하게, 표현은 조용하게.",
    relatedQNumbers: [2, 5, 11],
    match: (byQ) => {
      const detailSensitive = selected(byQ, 2, "material-texture") || selected(byQ, 5, "human-trace");
      const privateTaste = selected(byQ, 11, "private-taste");
      return detailSensitive && privateTaste;
    },
  },
  {
    id: "t3-fast-discovery-slow-choice",
    label: "T3",
    headline: "발견은 빠르고,\n결정은 느린 취향.",
    interestingPartBody:
      "처음 가는 동네에서는 걷다가 눈에 들어오는 곳으로 망설임 없이 들어가지만, 마음에 든 물건 앞에서는 며칠을 두고 다시 생각합니다. 새로운 것을 만나는 속도와 그것을 내 것으로 정하는 속도는, 당신에게는 전혀 다른 두 개의 시계로 움직입니다.",
    pullQuote: "발견은 빠르게, 결정은 천천히.",
    relatedQNumbers: [7, 8],
    match: (byQ) => selected(byQ, 7, "intuitive-discovery") && selected(byQ, 8, "slow-desire-validation", "comparative-search"),
  },
  {
    id: "t4-share-but-keep-autonomy",
    label: "T4",
    headline: "좋은 건 나누되,\n모든 시간을 함께 쓰지는 않는 취향.",
    interestingPartBody:
      "정말 마음에 드는 것을 발견하면 가까운 사람들과 나누는 편이지만, 그 사람과 하루를 함께 보낼 때도 각자의 시간을 조금은 남겨두고 싶어 합니다. 나누고 싶은 마음과 혼자 있는 시간이 필요한 마음은 서로 부딪히지 않고, 같은 사람 안에서 번갈아 나타납니다.",
    pullQuote: "나누되, 전부를 내주지는 않는다.",
    relatedQNumbers: [6, 12],
    match: (byQ) => selected(byQ, 6, "active-sharing", "selective-sharing") && selected(byQ, 12, "parallel-intimacy"),
  },
  {
    id: "t5-keep-long-seek-new",
    label: "T5",
    headline: "오래 두는 것과,\n새로 찾는 것을 함께 즐기는 취향.",
    interestingPartBody:
      "물건 하나는 흔적이 쌓이도록 오래 곁에 두고 싶어하면서도, 한번 유명해진 것 앞에서는 미련 없이 다른 새로운 것을 다시 찾아 나섭니다. 오래 두는 것과 새로 발견하는 것은 당신에게 서로 다른 층에서 따로 움직이는, 둘 다 진짜인 취향입니다.",
    pullQuote: "곁에 두는 것과 다시 찾는 것은, 다른 이야기다.",
    relatedQNumbers: [3, 13],
    match: (byQ) => selected(byQ, 3, "patina", "practical-intimacy") && selected(byQ, 13, "novelty-migration"),
  },
];

export type V3TensionMatch = { def: V3TensionDef; evidence: V3EvidenceItem[] };

export function matchAllV3Tensions(evidence: V3EvidenceItem[]): V3TensionMatch[] {
  const byQ = new Map(evidence.map((e) => [e.qNumber, e.optionId]));
  const matches: V3TensionMatch[] = [];
  for (const def of TENSION_DEFS_V3) {
    if (!def.match(byQ)) continue;
    const related = evidence.filter((e) => def.relatedQNumbers.includes(e.qNumber));
    matches.push({ def, evidence: related });
  }
  return matches;
}

// TRAVEL v1 — NARRATIVE(ISSUE 02, 2026-08, PR #261 Round I 구현).
//
// tasteNarrativeV3.ts와 같은 원칙(§Round I "TASTE 계산 방식은 건드리지
// 않는다")을 지키기 위해 완전히 독립된 새 파일로 작성했다. 다만 TASTE가
// 4차례 라운드에 걸쳐 쌓은 3층 깊이(interpretation→meaning→stakes)와
// Relationship/Tension 14종까지는 이번 라운드 범위에 넣지 않았다 —
// TRAVEL은 이번이 첫 구현이라 "탄탄한 1차 완성"을 목표로 axis별
// interpretation 1층 + 실제 evidence 인용 + Cross-Issue(별도 엔진)로
// 승부한다. 이 스코프 축소는 완료 보고에 명시한다.
//
// 구조(§16 요구): Opening → THE WAY YOU LEAVE(PLANNING) → THE WAY YOU
// MOVE(DEPTH/LOCALITY/COMFORT 중 가장 강한 축) → THE WAY YOU CONNECT
// (SOCIAL/MEMORY 중 가장 강한 축) → THE INTERESTING PART(가장 강한
// 두 축의 조합) → Ending. TASTE×TRAVEL 섹션은 이 narrative가 아니라
// travelCrossIssueV1.ts의 별도 결과를 Result 컴포넌트가 조건부로
// 붙인다(§14 "후보 없으면 섹션 전체 숨김"이 narrative 레벨이 아니라
// 렌더 레벨에서 처리돼야 하므로).

import { TRAVEL_V1_AXIS_KEYS, type TravelAxisKey, type TravelV1RawAnswers } from "./travelQuestionnaireV1";
import { aggregateTravelV1Axes, extractTravelV1Evidence, type TravelV1AxisAggregate, type TravelV1EvidenceItem } from "./travelEvidenceV1";

export type TravelMagazineNarrativeV1 = {
  opening: { headline: string; summary: string };
  theWayYouLeave: { headline: string; body: string; axisLabel: string; axis: TravelAxisKey };
  theWayYouMove: { headline: string; body: string; axisLabel: string; axis: TravelAxisKey };
  theWayYouConnect: { headline: string; body: string; axisLabel: string; axis: TravelAxisKey };
  interestingPart: { headline: string; body: string };
  ending: { body: string; pullQuote: string };
  keywords: string[];
  pullQuote: string;
  debug: {
    axes: Record<TravelAxisKey, number>;
    axisRanking: TravelAxisKey[];
  };
};

const AXIS_LABEL_KO: Record<TravelAxisKey, string> = {
  planning: "떠나기 전 마음을 정하는 방식",
  comfort: "낯선 곳에서 몸이 편안함을 찾는 방식",
  depth: "장소에 머무는 깊이",
  locality: "그 도시를 대하는 태도",
  social: "낯선 사람과 거리를 두는 방식",
  memory: "순간을 붙잡는 방식",
};

const AXIS_INTERPRETATION: Record<TravelAxisKey, { positive: string; negative: string }> = {
  planning: {
    positive: "당신에게 여행은 미리 그려둔 그림을 실제로 확인하는 과정에 가깝습니다. 계획이 촘촘할수록 오히려 그 안에서 더 자유롭게 움직일 수 있다고 느낍니다.",
    negative: "당신에게 여행은 그림을 미리 그리지 않아야 비로소 시작되는 것에 가깝습니다. 정해둔 것이 적을수록, 그 자리에서 진짜로 원하는 것을 고를 수 있습니다.",
  },
  comfort: {
    positive: "당신에게 편안함은 여행의 배경이 아니라 조건입니다. 몸이 편해야 그다음의 낯섦도 즐길 여유가 생긴다고 믿습니다.",
    negative: "당신에게 여행의 값어치는 편안함으로 매겨지지 않습니다. 조금 불편해도 그 장소, 그 흐름을 그대로 지나는 쪽을 택합니다.",
  },
  depth: {
    positive: "당신에게 여행은 넓이가 아니라 깊이로 기억됩니다. 한 곳에 오래 머물수록 그 장소가 비로소 자기 것이 된다고 느낍니다.",
    negative: "당신에게 여행은 얼마나 많은 장면을 모았는가로 채워집니다. 한곳에 오래 머무는 것보다, 다음 장면으로 넘어가는 순간에 더 마음이 움직입니다.",
  },
  locality: {
    positive: "당신에게 진짜 여행은 안내판이 없는 곳에서 시작됩니다. 그 도시가 관광객이 아니라 그곳에 사는 사람에게 보여주는 얼굴을 보고 싶어합니다.",
    negative: "당신에게 여행은 이미 검증된 좋음을 따라가는 일에 가깝습니다. 낯선 곳을 헤매는 것보다, 확실히 좋다고 알려진 곳을 확인하는 쪽이 더 든든합니다.",
  },
  social: {
    positive: "당신에게 여행은 사람과 함께 만들어야 완성되는 경험입니다. 낯선 이와의 짧은 대화 하나가 그날의 여행을 완전히 바꿔놓기도 합니다.",
    negative: "당신에게 여행은 혼자일 때 가장 온전해집니다. 함께 있는 시간도 나쁘지 않지만, 혼자 걷는 시간이 있어야 그 장소가 비로소 자기 것이 됩니다.",
  },
  memory: {
    positive: "당신에게 순간은 남겨야 비로소 완성됩니다. 사진과 글로 그 장면을 붙잡아야, 그 여행이 끝나지 않고 계속 남아있다고 느낍니다.",
    negative: "당신에게 순간은 그 자리에서 이미 완성됩니다. 굳이 사진으로 남기지 않아도, 그 장면은 몸에 남아 있다고 믿습니다.",
  },
};

const ENDING_INSIGHT: Record<TravelAxisKey, { positive: string; negative: string }> = {
  planning: {
    positive: "당신의 여행은 계획을 줄이는 데서 나아지지 않습니다. 계획을 세우되, 그중 하나는 일부러 비워두는 자리를 만들 때 더 선명해집니다.",
    negative: "당신의 여행은 더 많이 정해두는 데서 나아지지 않습니다. 가장 중요한 것 하나만 미리 정해두고 나머지는 열어둘 때 더 선명해집니다.",
  },
  comfort: {
    positive: "당신의 여행은 불편을 참는 데서 나아지지 않습니다. 편안함을 지키는 자리를 분명히 남겨둘 때 나머지 시간이 더 자유로워집니다.",
    negative: "당신의 여행은 더 좋은 숙소를 고르는 데서 나아지지 않습니다. 어디까지 불편함을 감수할지 스스로 아는 선을 알 때 더 선명해집니다.",
  },
  depth: {
    positive: "당신의 여행은 더 많은 도시를 넣는 데서 나아지지 않습니다. 이미 좋아하는 한 곳에 하루를 더 남겨둘 때 더 깊어집니다.",
    negative: "당신의 여행은 한곳에 오래 머무는 데서 나아지지 않습니다. 장면과 장면 사이를 잇는 리듬을 스스로 아는 데서 더 선명해집니다.",
  },
  locality: {
    positive: "당신의 여행은 더 숨은 곳을 찾는 데서 나아지지 않습니다. 그 동네의 하루 흐름에 몸을 맞춰볼 때 더 깊어집니다.",
    negative: "당신의 여행은 검증된 곳을 늘리는 데서 나아지지 않습니다. 그중 하나를 골라 조금 더 오래 머물러볼 때 새로운 것이 보입니다.",
  },
  social: {
    positive: "당신의 여행은 더 많은 사람을 만나는 데서 나아지지 않습니다. 그중 한 사람과 조금 더 깊은 대화를 나눌 때 더 선명해집니다.",
    negative: "당신의 여행은 사람을 피하는 데서 나아지지 않습니다. 혼자 있는 시간을 지키되, 아주 가끔은 그 문을 열어둘 때 더 선명해집니다.",
  },
  memory: {
    positive: "당신의 여행은 더 많이 기록하는 데서 나아지지 않습니다. 그중 하나만 골라 오래 다시 꺼내볼 때 더 선명해집니다.",
    negative: "당신의 여행은 기록을 늘리는 데서 나아지지 않습니다. 유독 오래 남는 장면 하나만은 짧게라도 남겨둘 때 더 선명해집니다.",
  },
};

function stripTrailingPunct(text: string): string {
  return text.trim().replace(/[.!?]+$/, "");
}
function sceneList(phrases: string[]): string {
  return phrases.map(stripTrailingPunct).join(", ") + ".";
}
function pickByIndex<T>(pool: T[], seed: number): T {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

const SCENE_LINK = [
  "이 장면들 사이에는 뚜렷한 결이 있습니다.",
  "두 순간이 다르게 보여도 같은 마음에서 나옵니다.",
  "겉모습은 달라도 같은 곳을 향합니다.",
  "이런 장면 앞에서 마음이 움직이는 방향은 한결같습니다.",
];
const SCENE_LINK_SINGLE = ["이 장면 하나만으로도 충분히 짐작됩니다.", "망설임 없이 이쪽으로 마음이 갑니다.", "다른 설명이 필요 없을 만큼 분명합니다."];

function strongestEvidenceForAxis(aggregate: TravelV1AxisAggregate, axis: TravelAxisKey): TravelV1EvidenceItem[] {
  return [...aggregate[axis].evidence].sort((a, b) => Math.abs(b.axes[axis] ?? 0) - Math.abs(a.axes[axis] ?? 0));
}

function rankAxes(aggregate: TravelV1AxisAggregate): TravelAxisKey[] {
  return [...TRAVEL_V1_AXIS_KEYS].sort((a, b) => Math.abs(aggregate[b].score) - Math.abs(aggregate[a].score));
}

function buildTravelSection(
  axis: TravelAxisKey,
  headline: string,
  aggregate: TravelV1AxisAggregate,
  seed: number
): { headline: string; body: string; axisLabel: string; axis: TravelAxisKey } {
  const axisLabel = AXIS_LABEL_KO[axis];
  const sorted = strongestEvidenceForAxis(aggregate, axis);
  const anchor = sorted[0];
  const direction = aggregate[axis].score >= 0 ? "positive" : "negative";
  if (!anchor) {
    return { headline, body: "여기서는 어느 한쪽으로 뚜렷하게 기울지 않고 고르게 나뉩니다.", axisLabel, axis };
  }
  const supporting = sorted.find((e) => e.questionId !== anchor.questionId);
  const personalScene = supporting ? sceneList([anchor.optionLabel, supporting.optionLabel]) : sceneList([anchor.optionLabel]);
  const bridge = supporting ? pickByIndex(SCENE_LINK, seed) : pickByIndex(SCENE_LINK_SINGLE, seed);
  const body = [personalScene, bridge, AXIS_INTERPRETATION[axis][direction]].filter(Boolean).join(" ");
  return { headline, body, axisLabel, axis };
}

const OPENING_HOOK = [
  "이 장면 하나에도 이미 많은 것이 담겨 있습니다.",
  "낯선 환경 앞에서, 당신의 선택 방식은 이미 하나의 결을 그리고 있었습니다.",
  "복잡한 설명이 필요 없을 만큼, 방향은 뚜렷합니다.",
];

function buildOpening(aggregate: TravelV1AxisAggregate, axisRanking: TravelAxisKey[]): { headline: string; summary: string } {
  const topAxis = axisRanking[0];
  const top = strongestEvidenceForAxis(aggregate, topAxis)[0];
  const direction = aggregate[topAxis].score >= 0 ? "positive" : "negative";
  const headlineByAxis: Record<TravelAxisKey, { positive: string; negative: string }> = {
    planning: { positive: "지도를 먼저 그리고,\n그 안에서 자유로워지는 사람.", negative: "아무것도 정하지 않아야,\n비로소 시작되는 사람." },
    comfort: { positive: "편안함이 있어야,\n낯섦도 즐길 수 있는 사람.", negative: "불편함도 여행의 일부로\n그대로 지나는 사람." },
    depth: { positive: "넓이가 아니라\n깊이로 남는 여행.", negative: "한곳에 머무르기보다,\n다음 장면으로 향하는 사람." },
    locality: { positive: "안내판이 없는 곳에서\n진짜 여행이 시작되는 사람.", negative: "이미 검증된 좋음을\n따라가는 사람." },
    social: { positive: "낯선 이와의 대화가\n여행을 완성하는 사람.", negative: "혼자일 때\n비로소 온전해지는 사람." },
    memory: { positive: "남겨야 비로소\n완성되는 순간.", negative: "남기지 않아도\n이미 충분한 순간." },
  };
  return {
    headline: headlineByAxis[topAxis][direction],
    summary: top
      ? [sceneList([top.optionLabel]), pickByIndex(OPENING_HOOK, top.qNumber)].filter(Boolean).join(" ")
      : "여러 선택이 하나의 결로 이어집니다.",
  };
}

const FALLBACK_INTERESTING_HEADLINES = ["가장 강하게 남은 건,\n어느 한쪽이 아니라 그 사이였습니다.", "정답을 정해두지 않아도,\n방향은 이미 뚜렷했습니다."];

function buildInterestingPart(aggregate: TravelV1AxisAggregate, axisRanking: TravelAxisKey[]): { headline: string; body: string } {
  const a = axisRanking[0];
  const b = axisRanking[1];
  const evA = strongestEvidenceForAxis(aggregate, a)[0];
  const evB = strongestEvidenceForAxis(aggregate, b)[0];
  const scene = [evA, evB].filter((e): e is TravelV1EvidenceItem => Boolean(e)).map((e) => e.optionLabel);
  const headline = pickByIndex(FALLBACK_INTERESTING_HEADLINES, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 0));
  const labelA = AXIS_LABEL_KO[a];
  const labelB = AXIS_LABEL_KO[b];
  const directionA = aggregate[a].score >= 0 ? "positive" : "negative";
  const directionB = aggregate[b].score >= 0 ? "positive" : "negative";
  const body = [
    scene.length > 0 ? sceneList(scene) : "",
    `${labelA}과 ${labelB}이 이렇게 다른 크기로 나타났다는 것은, 이 둘을 애초에 같은 무게로 쓰고 있지 않다는 뜻입니다.`,
    `그래서 ${AXIS_INTERPRETATION[a][directionA]} 그런데 동시에, ${AXIS_INTERPRETATION[b][directionB]}`,
  ]
    .filter(Boolean)
    .join(" ");
  return { headline, body };
}

function buildEnding(openingHeadline: string, axis1: TravelAxisKey, aggregate: TravelV1AxisAggregate): { body: string; pullQuote: string } {
  const callback = openingHeadline.replace(/\n/g, " ");
  const cleanCallback = stripTrailingPunct(callback);
  const direction1 = aggregate[axis1].score >= 0 ? "positive" : "negative";
  const body = [`"${cleanCallback}"라는 첫 장면으로 돌아가 보면, ${AXIS_LABEL_KO[axis1]}은 이 여행 전체를 관통하고 있었습니다.`, ENDING_INSIGHT[axis1][direction1]]
    .filter(Boolean)
    .join(" ");
  return { body, pullQuote: callback };
}

const MOVE_CANDIDATES: TravelAxisKey[] = ["depth", "locality", "comfort"];
const CONNECT_CANDIDATES: TravelAxisKey[] = ["social", "memory"];

function strongestAmong(aggregate: TravelV1AxisAggregate, candidates: TravelAxisKey[]): TravelAxisKey {
  return [...candidates].sort((a, b) => Math.abs(aggregate[b].score) - Math.abs(aggregate[a].score))[0];
}

export function buildTravelMagazineNarrativeV1(answers: TravelV1RawAnswers): TravelMagazineNarrativeV1 {
  const evidence = extractTravelV1Evidence(answers);
  const aggregate = aggregateTravelV1Axes(evidence);
  const axisRanking = rankAxes(aggregate);

  const opening = buildOpening(aggregate, axisRanking);

  const theWayYouLeave = buildTravelSection("planning", "떠나는 방식", aggregate, 3);
  const moveAxis = strongestAmong(aggregate, MOVE_CANDIDATES);
  const theWayYouMove = buildTravelSection(moveAxis, "움직이는 방식", aggregate, moveAxis.length + 5);
  const connectAxis = strongestAmong(aggregate, CONNECT_CANDIDATES);
  const theWayYouConnect = buildTravelSection(connectAxis, "연결되는 방식", aggregate, connectAxis.length + 7);

  const interestingPart = buildInterestingPart(aggregate, axisRanking);
  const ending = buildEnding(opening.headline, axisRanking[0], aggregate);

  const keywords = Array.from(new Set(evidence.slice(0, 6).map((e) => e.eyebrow)));
  const axesRecord = Object.fromEntries(TRAVEL_V1_AXIS_KEYS.map((k) => [k, aggregate[k].score])) as Record<TravelAxisKey, number>;

  return {
    opening,
    theWayYouLeave,
    theWayYouMove,
    theWayYouConnect,
    interestingPart,
    ending,
    keywords,
    pullQuote: ending.pullQuote,
    debug: { axes: axesRecord, axisRanking },
  };
}

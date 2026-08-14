// TRAVEL QUESTIONNAIRE v1 — ISSUE 02(2026-08, PR #261 Round I 구현, Round J
// spec recovery로 문항 원문 교체).
//
// Round I에서는 "압축 과정에서 원문이 유실됐다"는 이유로 문항을 새로
// 썼으나, Round J에서 세션 원본 transcript(JSONL)를 직접 열어 실제
// 승인된 Round G 초안 + Round H 수정사항을 복구했다 — 지금 이 파일은
// 그 복구된 원문을 그대로 옮긴 것이다(Q1~Q14 전부, 임의 개선 없음).
// 복구 과정에서 발견한 것: 이전 Round I 요약이 Q3 D 옵션의 부호를
// 잘못 전달했다(+15로 기억했으나 실제 승인 원문은 −15). 이번 파일은
// 그 오류를 포함해 전부 원본 그대로 복구했다.
//
// evidenceTag는 travel.<axis>.<slug> 컨벤션(Q13만 travel.combo.<slug>).
// weak=±5/medium=±10~-5/strong=±15 — TASTE와 동일 관례를 그대로 썼다.

export type TravelAxisKey = "planning" | "comfort" | "depth" | "locality" | "social" | "memory";

export const TRAVEL_V1_AXIS_KEYS: TravelAxisKey[] = ["planning", "comfort", "depth", "locality", "social", "memory"];

export const TRAVEL_V1_AXIS_LABELS: Record<TravelAxisKey, string> = {
  planning: "PLANNING",
  comfort: "COMFORT",
  depth: "DEPTH",
  locality: "LOCALITY",
  social: "SOCIAL",
  memory: "MEMORY",
};

// Expansion = TASTE에 대응하는 축이 없다(여행이라는 낯선 환경에서만
// 드러나는 새 정보). Context-retest = TASTE의 특정 축과 "쌍"을 이루는
// 축으로, raw score 자체보다 TASTE 쌍과의 normalized delta가 진짜
// Cross-Issue 신호다(travelCrossIssueV1.ts에서 사용).
export type TravelAxisKind = "expansion" | "context-retest";

export const TRAVEL_V1_AXIS_KIND: Record<TravelAxisKey, TravelAxisKind> = {
  planning: "expansion",
  depth: "expansion",
  locality: "expansion",
  comfort: "context-retest", // TASTE의 SPACE와 쌍
  social: "context-retest", // TASTE의 RELATION과 쌍
  memory: "context-retest", // TASTE의 EXPRESSION과 쌍
};

// context-retest 축이 어떤 TASTE 축과 쌍을 이루는지 — Cross-Issue
// Engine이 이 맵으로 "같은 성향이 다른 맥락(취향 vs 낯선 환경)에서도
// 유지되는가/달라지는가"를 판정한다.
export const TRAVEL_TASTE_TWIN_AXIS: Partial<Record<TravelAxisKey, "space" | "sensory" | "rhythm" | "relation" | "exploration" | "expression">> = {
  comfort: "space",
  social: "relation",
  memory: "expression",
};

export type TravelV1AxisContribution = Partial<Record<TravelAxisKey, number>>;

export type TravelV1Option = {
  id: string;
  label: string;
  evidenceTag: string;
  evidenceLabel: string;
  axes: TravelV1AxisContribution;
};

export type TravelV1InteractionKind = "image-2" | "text-2" | "text-4" | "scenario-4";

export type TravelV1Question = {
  id: string; // "t1".."t14"
  qNumber: number;
  eyebrow: string;
  page: number;
  totalPages: number;
  kind: TravelV1InteractionKind;
  prompt: string;
  primaryAxis: TravelAxisKey;
  secondaryAxes: TravelAxisKey[];
  options: TravelV1Option[];
};

export const TRAVEL_V1_TOTAL_PAGES = 14;

// Q1 — THE ITINERARY(image-2, PLANNING)
export const TRAVEL_V1_Q1: TravelV1Question = {
  id: "t1",
  qNumber: 1,
  eyebrow: "THE ITINERARY",
  page: 1,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "출발 전 내 여행 계획에\n더 가까운 쪽은?",
  primaryAxis: "planning",
  secondaryAxes: [],
  options: [
    {
      id: "structure-first",
      label: "시간과 동선이\n미리 짜여진 일정표",
      evidenceTag: "travel.planning.structure-first",
      evidenceLabel: "시간과 동선이 미리 짜여진 일정표를 골랐다",
      axes: { planning: 15 },
    },
    {
      id: "open-frame",
      label: "첫 목적지만 있고\n나머지는 비어 있는 일정표",
      evidenceTag: "travel.planning.open-frame",
      evidenceLabel: "첫 목적지만 있고 나머지는 비어 있는 일정표를 골랐다",
      axes: { planning: -15 },
    },
  ],
};

// Q2 — BEFORE YOU GO(text-4, PLANNING)
export const TRAVEL_V1_Q2: TravelV1Question = {
  id: "t2",
  qNumber: 2,
  eyebrow: "BEFORE YOU GO",
  page: 2,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "출발 1~2주 전,\n나에게 더 가까운 모습은?",
  primaryAxis: "planning",
  secondaryAxes: [],
  options: [
    {
      id: "fully-booked",
      label: "숙소·교통·주요 일정을 거의 다 예약해둔다",
      evidenceTag: "travel.planning.fully-booked",
      evidenceLabel: "숙소·교통·주요 일정을 거의 다 예약해둔다고 했다",
      axes: { planning: 15 },
    },
    {
      id: "anchor-only",
      label: "숙소만 예약하고 나머지는 현지에서 정한다",
      evidenceTag: "travel.planning.anchor-only",
      evidenceLabel: "숙소만 예약하고 나머지는 현지에서 정한다고 했다",
      axes: { planning: 5 },
    },
    {
      id: "wishlist-only",
      label: "가고 싶은 곳 목록만 적어두고 예약은 최소한으로 한다",
      evidenceTag: "travel.planning.wishlist-only",
      evidenceLabel: "가고 싶은 곳 목록만 적어두고 예약은 최소한으로 한다고 했다",
      axes: { planning: -10 },
    },
    {
      id: "minimal-prep",
      label: "짐을 싸는 정도까지만 준비하고 나머지는 도착해서 생각한다",
      evidenceTag: "travel.planning.minimal-prep",
      evidenceLabel: "짐을 싸는 정도까지만 준비하고 나머지는 도착해서 생각한다고 했다",
      axes: { planning: -15 },
    },
  ],
};

// Q3 — WHEN PLANS SLIP(scenario-4, COMFORT 단독 · Round H 수정 반영)
export const TRAVEL_V1_Q3: TravelV1Question = {
  id: "t3",
  qNumber: 3,
  eyebrow: "WHEN PLANS SLIP",
  page: 3,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "예약한 숙소가 생각과 달랐을 때,\n더 가까운 모습은?",
  primaryAxis: "comfort",
  secondaryAxes: [],
  options: [
    {
      id: "accept-as-is",
      label: "그 상태 그대로 받아들이고 여행을 이어간다",
      evidenceTag: "travel.comfort.accept-as-is",
      evidenceLabel: "그 상태 그대로 받아들이고 여행을 이어간다고 했다",
      axes: { comfort: 15 },
    },
    {
      id: "adjust-in-place",
      label: "조금 불편해도 요청해서 조정한 뒤 그 자리에서 적응한다",
      evidenceTag: "travel.comfort.adjust-in-place",
      evidenceLabel: "조금 불편해도 요청해서 조정한 뒤 그 자리에서 적응한다고 했다",
      axes: { comfort: 5 },
    },
    {
      id: "switch-lodging",
      label: "다른 숙소를 새로 찾아 예약을 바꾼다",
      evidenceTag: "travel.comfort.switch-lodging",
      evidenceLabel: "다른 숙소를 새로 찾아 예약을 바꾼다고 했다",
      axes: { comfort: -10 },
    },
    {
      id: "prioritize-comfort",
      label: "불편한 부분이 계속 신경 쓰이면,\n여행 흐름을 바꾸더라도 더 편한 곳으로 옮긴다",
      evidenceTag: "travel.comfort.prioritize-comfort",
      evidenceLabel: "불편한 부분이 계속 신경 쓰이면 여행 흐름을 바꾸더라도 더 편한 곳으로 옮긴다고 했다",
      axes: { comfort: -15 },
    },
  ],
};

// Q4 — WHERE YOU STAY(image-2, COMFORT)
export const TRAVEL_V1_Q4: TravelV1Question = {
  id: "t4",
  qNumber: 4,
  eyebrow: "WHERE YOU STAY",
  page: 4,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "여행 중 묵고 싶은 숙소는?",
  primaryAxis: "comfort",
  secondaryAxes: [],
  options: [
    {
      id: "predictable-stay",
      label: "정돈되고\n예측 가능한 느낌의 숙소",
      evidenceTag: "travel.comfort.predictable-stay",
      evidenceLabel: "정돈되고 예측 가능한 느낌의 숙소에 묵고 싶다고 했다",
      axes: { comfort: -15 },
    },
    {
      id: "local-texture-stay",
      label: "현지 느낌이 강하고\n조금 낯선 숙소",
      evidenceTag: "travel.comfort.local-texture-stay",
      evidenceLabel: "현지 느낌이 강하고 조금 낯선 숙소에 묵고 싶다고 했다",
      axes: { comfort: 15 },
    },
  ],
};

// Q5 — FIVE DAYS(scenario-4, DEPTH)
export const TRAVEL_V1_Q5: TravelV1Question = {
  id: "t5",
  qNumber: 5,
  eyebrow: "FIVE DAYS",
  page: 5,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "5일간 여행할 수 있다면,\n더 가까운 방식은?",
  primaryAxis: "depth",
  secondaryAxes: [],
  options: [
    {
      id: "single-city",
      label: "한 도시에 5일을 다 쓴다",
      evidenceTag: "travel.depth.single-city",
      evidenceLabel: "한 도시에 5일을 다 쓴다고 했다",
      axes: { depth: 15 },
    },
    {
      id: "two-cities",
      label: "두 도시로 나눠서 각각 좀 더 머문다",
      evidenceTag: "travel.depth.two-cities",
      evidenceLabel: "두 도시로 나눠서 각각 좀 더 머문다고 했다",
      axes: { depth: 5 },
    },
    {
      id: "multi-city",
      label: "세 도시 이상을 돌며 넓게 본다",
      evidenceTag: "travel.depth.multi-city",
      evidenceLabel: "세 도시 이상을 돌며 넓게 본다고 했다",
      axes: { depth: -10 },
    },
    {
      id: "daily-move",
      label: "매일 다른 지역으로 옮겨 다닌다",
      evidenceTag: "travel.depth.daily-move",
      evidenceLabel: "매일 다른 지역으로 옮겨 다닌다고 했다",
      axes: { depth: -15 },
    },
  ],
};

// Q6 — A PLACE YOU LOVED(text-2, DEPTH)
export const TRAVEL_V1_Q6: TravelV1Question = {
  id: "t6",
  qNumber: 6,
  eyebrow: "A PLACE YOU LOVED",
  page: 6,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-2",
  prompt: "정말 마음에 드는 장소를 만났을 때,\n더 가까운 행동은?",
  primaryAxis: "depth",
  secondaryAxes: [],
  options: [
    {
      id: "stay-longer",
      label: "그 자리에 더 머물거나 계획을 바꿔 다시 찾아간다",
      evidenceTag: "travel.depth.stay-longer",
      evidenceLabel: "그 자리에 더 머물거나 계획을 바꿔 다시 찾아간다고 했다",
      axes: { depth: 15 },
    },
    {
      id: "keep-moving",
      label: "마음에 담아두고 원래 계획대로 다음 장소로 이동한다",
      evidenceTag: "travel.depth.keep-moving",
      evidenceLabel: "마음에 담아두고 원래 계획대로 다음 장소로 이동한다고 했다",
      axes: { depth: -15 },
    },
  ],
};

// Q7 — THE WALK(image-2, LOCALITY · "가장 중요한 visual question")
export const TRAVEL_V1_Q7: TravelV1Question = {
  id: "t7",
  qNumber: 7,
  eyebrow: "THE WALK",
  page: 7,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "같은 도시를 걷는다면,\n더 끌리는 장면은?",
  primaryAxis: "locality",
  secondaryAxes: [],
  options: [
    {
      id: "landmark-route",
      label: "지도 위에 표시된\n대표 명소로 이어지는 길",
      evidenceTag: "travel.locality.landmark-route",
      evidenceLabel: "지도 위에 표시된 대표 명소로 이어지는 길에 끌린다고 했다",
      axes: { locality: -15 },
    },
    {
      id: "everyday-route",
      label: "정해두지 않고\n걷다가 마주친 생활 골목",
      evidenceTag: "travel.locality.everyday-route",
      evidenceLabel: "정해두지 않고 걷다가 마주친 생활 골목에 끌린다고 했다",
      axes: { locality: 15 },
    },
  ],
};

// Q8 — WHAT YOU EAT(text-4, LOCALITY · Round H 수정 반영)
export const TRAVEL_V1_Q8: TravelV1Question = {
  id: "t8",
  qNumber: 8,
  eyebrow: "WHAT YOU EAT",
  page: 8,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행지에서 무엇을 먹을지 정할 때,\n더 가까운 방식은?",
  primaryAxis: "locality",
  secondaryAxes: [],
  options: [
    {
      id: "local-daily-spot",
      label: "주변을 걷다가 동네 사람들이 자주 들어가는 곳을 고른다",
      evidenceTag: "travel.locality.local-daily-spot",
      evidenceLabel: "주변을 걷다가 동네 사람들이 자주 들어가는 곳을 고른다고 했다",
      axes: { locality: 15 },
    },
    {
      id: "local-referral",
      label: "만난 현지인이나 숙소 주인에게 그 자리에서 추천받는다",
      evidenceTag: "travel.locality.local-referral",
      evidenceLabel: "만난 현지인이나 숙소 주인에게 그 자리에서 추천받는다고 했다",
      axes: { locality: 10 },
    },
    {
      id: "curated-list",
      label: "여행 전 저장해둔, 후기 좋은 곳을 찾아간다",
      evidenceTag: "travel.locality.curated-list",
      evidenceLabel: "여행 전 저장해둔, 후기 좋은 곳을 찾아간다고 했다",
      axes: { locality: -5 },
    },
    {
      id: "familiar-menu",
      label: "익숙한 메뉴가 있는 곳을 우선 찾는다",
      evidenceTag: "travel.locality.familiar-menu",
      evidenceLabel: "익숙한 메뉴가 있는 곳을 우선 찾는다고 했다",
      axes: { locality: -15 },
    },
  ],
};

// Q9 — THE STRANGER NEXT TO YOU(scenario-4, SOCIAL · 반응형)
export const TRAVEL_V1_Q9: TravelV1Question = {
  id: "t9",
  qNumber: 9,
  eyebrow: "THE STRANGER NEXT TO YOU",
  page: 9,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "혼자 여행 중 옆자리 사람이\n자연스럽게 말을 걸었을 때,\n더 가까운 모습은?",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "brief-reply",
      label: "짧게 답하고 다시 내 생각이나 풍경으로 돌아간다",
      evidenceTag: "travel.social.brief-reply",
      evidenceLabel: "짧게 답하고 다시 내 생각이나 풍경으로 돌아간다고 했다",
      axes: { social: -15 },
    },
    {
      id: "light-exchange",
      label: "몇 마디 가볍게 주고받고 자연스럽게 마무리한다",
      evidenceTag: "travel.social.light-exchange",
      evidenceLabel: "몇 마디 가볍게 주고받고 자연스럽게 마무리한다고 했다",
      axes: { social: -5 },
    },
    {
      id: "extend-conversation",
      label: "대화가 이어지도록 질문을 몇 개 더 건넨다",
      evidenceTag: "travel.social.extend-conversation",
      evidenceLabel: "대화가 이어지도록 질문을 몇 개 더 건넨다고 했다",
      axes: { social: 10 },
    },
    {
      id: "lead-conversation",
      label: "여행 얘기를 더 나누고 싶어서 먼저 다음 이야기를 꺼낸다",
      evidenceTag: "travel.social.lead-conversation",
      evidenceLabel: "여행 얘기를 더 나누고 싶어서 먼저 다음 이야기를 꺼낸다고 했다",
      axes: { social: 15 },
    },
  ],
};

// Q10 — MAKING CONNECTIONS(text-4, SOCIAL · 설계형 · Round H 수정 반영)
export const TRAVEL_V1_Q10: TravelV1Question = {
  id: "t10",
  qNumber: 10,
  eyebrow: "MAKING CONNECTIONS",
  page: 10,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행 중 새로운 사람과 연결될 때,\n나에게 더 가까운 모습은?",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "initiate-connection",
      label: "내가 먼저 말을 걸거나 함께할 계기를 만드는 편이다",
      evidenceTag: "travel.social.initiate-connection",
      evidenceLabel: "내가 먼저 말을 걸거나 함께할 계기를 만드는 편이라고 했다",
      axes: { social: 15 },
    },
    {
      id: "open-first-step",
      label: "자연스럽게 대화할 상황이 생기면 먼저 한두 마디를 건넨다",
      evidenceTag: "travel.social.open-first-step",
      evidenceLabel: "자연스럽게 대화할 상황이 생기면 먼저 한두 마디를 건넨다고 했다",
      axes: { social: 5 },
    },
    {
      id: "respond-only",
      label: "상대가 먼저 다가오면 대화하지만, 내가 계기를 만들지는 않는다",
      evidenceTag: "travel.social.respond-only",
      evidenceLabel: "상대가 먼저 다가오면 대화하지만 내가 계기를 만들지는 않는다고 했다",
      axes: { social: -5 },
    },
    {
      id: "keep-own-circle",
      label: "새로운 연결보다 원래 함께 온 사람이나 혼자 보내는 시간을 택한다",
      evidenceTag: "travel.social.keep-own-circle",
      evidenceLabel: "새로운 연결보다 원래 함께 온 사람이나 혼자 보내는 시간을 택한다고 했다",
      axes: { social: -15 },
    },
  ],
};

// Q11 — THE MOMENT(image-2, MEMORY)
export const TRAVEL_V1_Q11: TravelV1Question = {
  id: "t11",
  qNumber: 11,
  eyebrow: "THE MOMENT",
  page: 11,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "인상 깊은 장면 앞에 섰을 때,\n더 가까운 모습은?",
  primaryAxis: "memory",
  secondaryAxes: [],
  options: [
    {
      id: "capture-in-the-moment",
      label: "카메라나 노트를 꺼내\n그 장면을 기록하는 손",
      evidenceTag: "travel.memory.capture-in-the-moment",
      evidenceLabel: "카메라나 노트를 꺼내 그 장면을 기록하는 손을 골랐다",
      axes: { memory: 15 },
    },
    {
      id: "stay-in-the-moment",
      label: "아무것도 들지 않고\n그 장면을 눈으로 바라보는 뒷모습",
      evidenceTag: "travel.memory.stay-in-the-moment",
      evidenceLabel: "아무것도 들지 않고 그 장면을 눈으로 바라보는 뒷모습을 골랐다",
      axes: { memory: -15 },
    },
  ],
};

// Q12 — AFTER YOU'RE BACK(text-4, MEMORY)
export const TRAVEL_V1_Q12: TravelV1Question = {
  id: "t12",
  qNumber: 12,
  eyebrow: "AFTER YOU'RE BACK",
  page: 12,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행에서 돌아온 뒤,\n기록을 대하는 방식은?",
  primaryAxis: "memory",
  secondaryAxes: [],
  options: [
    {
      id: "curate-afterward",
      label: "사진·메모를 다시 정리해서 앨범이나 글로 남긴다",
      evidenceTag: "travel.memory.curate-afterward",
      evidenceLabel: "사진·메모를 다시 정리해서 앨범이나 글로 남긴다고 했다",
      axes: { memory: 15 },
    },
    {
      id: "occasional-revisit",
      label: "가끔 사진첩을 넘겨보며 그때를 떠올린다",
      evidenceTag: "travel.memory.occasional-revisit",
      evidenceLabel: "가끔 사진첩을 넘겨보며 그때를 떠올린다고 했다",
      axes: { memory: 5 },
    },
    {
      id: "impression-only",
      label: "기록은 거의 안 보고, 기억나는 장면 몇 개로 남아있다",
      evidenceTag: "travel.memory.impression-only",
      evidenceLabel: "기록은 거의 안 보고 기억나는 장면 몇 개로 남아있다고 했다",
      axes: { memory: -10 },
    },
    {
      id: "no-record",
      label: "사진조차 거의 찍지 않아서, 그 여행은 인상으로만 남는다",
      evidenceTag: "travel.memory.no-record",
      evidenceLabel: "사진조차 거의 찍지 않아서 그 여행은 인상으로만 남는다고 했다",
      axes: { memory: -15 },
    },
  ],
};

// Q13 — WHEN IT FALLS APART(scenario-4, PLANNING × COMFORT · 유일한 의도적 연결)
export const TRAVEL_V1_Q13: TravelV1Question = {
  id: "t13",
  qNumber: 13,
  eyebrow: "WHEN IT FALLS APART",
  page: 13,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "여행 중 계획이 틀어졌을 때\n(예약이 취소되거나 예정된 장소가 문을 닫았을 때),\n더 가까운 모습은?",
  primaryAxis: "planning",
  secondaryAxes: ["comfort"],
  options: [
    {
      id: "rebuild-plan",
      label: "바로 대안을 몇 가지 찾아서 다시 일정을 짠다",
      evidenceTag: "travel.combo.rebuild-plan",
      evidenceLabel: "바로 대안을 몇 가지 찾아서 다시 일정을 짠다고 했다",
      axes: { planning: 15, comfort: -5 },
    },
    {
      id: "improvise",
      label: "일단 그 자리에서 즉흥적으로 다음을 정한다",
      evidenceTag: "travel.combo.improvise",
      evidenceLabel: "일단 그 자리에서 즉흥적으로 다음을 정한다고 했다",
      axes: { planning: -10, comfort: 10 },
    },
    {
      id: "near-original",
      label: "잠깐 당황하지만 결국 원래 계획과 비슷한 대안을 찾는다",
      evidenceTag: "travel.combo.near-original",
      evidenceLabel: "잠깐 당황하지만 결국 원래 계획과 비슷한 대안을 찾는다고 했다",
      axes: { planning: 5, comfort: -10 },
    },
    {
      id: "embrace-detour",
      label: "오히려 잘됐다 싶어서 원래 없던 곳을 가본다",
      evidenceTag: "travel.combo.embrace-detour",
      evidenceLabel: "오히려 잘됐다 싶어서 원래 없던 곳을 가본다고 했다",
      axes: { planning: -15, comfort: 15 },
    },
  ],
};

// Q14 — THE LAST NIGHT(image-2, SOCIAL — emotional closing · Round H 수정 반영)
export const TRAVEL_V1_Q14: TravelV1Question = {
  id: "t14",
  qNumber: 14,
  eyebrow: "THE LAST NIGHT",
  page: 14,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "여행의 마지막 밤,\n더 자연스러운 장면은?",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "shared-reflection",
      label: "오늘 있었던 일을 누군가와\n나누며 하루를 마무리한다",
      evidenceTag: "travel.closing.shared-reflection",
      evidenceLabel: "오늘 있었던 일을 누군가와 나누며 하루를 마무리한다고 했다",
      axes: { social: 5 },
    },
    {
      id: "solo-reflection",
      label: "혼자 걸으며 이번 여행의\n장면들을 천천히 정리한다",
      evidenceTag: "travel.closing.solo-reflection",
      evidenceLabel: "혼자 걸으며 이번 여행의 장면들을 천천히 정리한다고 했다",
      axes: { social: -5 },
    },
  ],
};

export const TRAVEL_QUESTIONS_V1: TravelV1Question[] = [
  TRAVEL_V1_Q1,
  TRAVEL_V1_Q2,
  TRAVEL_V1_Q3,
  TRAVEL_V1_Q4,
  TRAVEL_V1_Q5,
  TRAVEL_V1_Q6,
  TRAVEL_V1_Q7,
  TRAVEL_V1_Q8,
  TRAVEL_V1_Q9,
  TRAVEL_V1_Q10,
  TRAVEL_V1_Q11,
  TRAVEL_V1_Q12,
  TRAVEL_V1_Q13,
  TRAVEL_V1_Q14,
];

export type TravelV1RawAnswers = Record<string, string>;

// §21 요구 — 실제 구현 코드로 재시뮬레이션하기 위한 8개 mock profile
// (A-H), 복구된 원문의 option id 기준으로 재작성. archetypes: A=철저한
// 계획가, B=즉흥 방랑자, C=깊이 파는 정착형, D=명소 수집형, E=사교적
// 확장형, F=혼자를 지키는 관찰자, G=기록하는 아카이비스트, H=약하고
// 뒤섞인(신호 없음 검증용) 프로필.
export type TravelV1MockProfile = { id: string; label: string; description: string; answers: TravelV1RawAnswers };

export const TRAVEL_V1_MOCK_PROFILES: TravelV1MockProfile[] = [
  {
    id: "a-meticulous-planner",
    label: "A — METICULOUS PLANNER",
    description: "촘촘한 계획 / 예측가능한 편안함 / 명소 중심 / 낮은 사교성 / 적극적 기록",
    answers: {
      t1: "structure-first",
      t2: "fully-booked",
      t3: "switch-lodging",
      t4: "predictable-stay",
      t5: "two-cities",
      t6: "keep-moving",
      t7: "landmark-route",
      t8: "curated-list",
      t9: "light-exchange",
      t10: "respond-only",
      t11: "capture-in-the-moment",
      t12: "curate-afterward",
      t13: "rebuild-plan",
      t14: "solo-reflection",
    },
  },
  {
    id: "b-improvising-wanderer",
    label: "B — IMPROVISING WANDERER",
    description: "즉흥 / 낯선 곳 감수 / 로컬 지향 / 사교적 확장 / 기록 안 함",
    answers: {
      t1: "open-frame",
      t2: "minimal-prep",
      t3: "accept-as-is",
      t4: "local-texture-stay",
      t5: "daily-move",
      t6: "keep-moving",
      t7: "everyday-route",
      t8: "local-daily-spot",
      t9: "lead-conversation",
      t10: "initiate-connection",
      t11: "stay-in-the-moment",
      t12: "no-record",
      t13: "embrace-detour",
      t14: "shared-reflection",
    },
  },
  {
    id: "c-deep-settler",
    label: "C — DEEP SETTLER",
    description: "적당한 계획 / 낯선 곳 감수 / 로컬 지향 / 낮은 사교성 / 조용한 기록",
    answers: {
      t1: "structure-first",
      t2: "anchor-only",
      t3: "adjust-in-place",
      t4: "local-texture-stay",
      t5: "single-city",
      t6: "stay-longer",
      t7: "everyday-route",
      t8: "local-referral",
      t9: "brief-reply",
      t10: "keep-own-circle",
      t11: "stay-in-the-moment",
      t12: "occasional-revisit",
      t13: "near-original",
      t14: "solo-reflection",
    },
  },
  {
    id: "d-landmark-collector",
    label: "D — LANDMARK COLLECTOR",
    description: "강한 계획 / 예측가능한 편안함 / 명소 중심 / 낮은 사교성 / 적극적 공유",
    answers: {
      t1: "structure-first",
      t2: "fully-booked",
      t3: "switch-lodging",
      t4: "predictable-stay",
      t5: "multi-city",
      t6: "keep-moving",
      t7: "landmark-route",
      t8: "familiar-menu",
      t9: "light-exchange",
      t10: "respond-only",
      t11: "capture-in-the-moment",
      t12: "curate-afterward",
      t13: "rebuild-plan",
      t14: "shared-reflection",
    },
  },
  {
    id: "e-social-expander",
    label: "E — SOCIAL EXPANDER",
    description: "즉흥 / 낯선 곳 감수 / 로컬 지향 / 강한 사교성 / 적극적 공유",
    answers: {
      t1: "open-frame",
      t2: "wishlist-only",
      t3: "accept-as-is",
      t4: "local-texture-stay",
      t5: "multi-city",
      t6: "stay-longer",
      t7: "everyday-route",
      t8: "local-daily-spot",
      t9: "extend-conversation",
      t10: "initiate-connection",
      t11: "capture-in-the-moment",
      t12: "curate-afterward",
      t13: "embrace-detour",
      t14: "shared-reflection",
    },
  },
  {
    id: "f-solitary-observer",
    label: "F — SOLITARY OBSERVER",
    description: "적당한 계획 / 편안함 중립 / 로컬 지향 / 강한 비사교성 / 기록 안 함",
    answers: {
      t1: "structure-first",
      t2: "anchor-only",
      t3: "adjust-in-place",
      t4: "local-texture-stay",
      t5: "single-city",
      t6: "stay-longer",
      t7: "everyday-route",
      t8: "local-referral",
      t9: "brief-reply",
      t10: "keep-own-circle",
      t11: "stay-in-the-moment",
      t12: "impression-only",
      t13: "near-original",
      t14: "solo-reflection",
    },
  },
  {
    id: "g-archivist",
    label: "G — ARCHIVIST",
    description: "적당한 계획 / 편안함 혼합 / 로컬-명소 혼합 / 낮은 사교성 / 강한 기록",
    answers: {
      t1: "structure-first",
      t2: "anchor-only",
      t3: "switch-lodging",
      t4: "predictable-stay",
      t5: "two-cities",
      t6: "stay-longer",
      t7: "landmark-route",
      t8: "local-referral",
      t9: "light-exchange",
      t10: "open-first-step",
      t11: "capture-in-the-moment",
      t12: "curate-afterward",
      t13: "near-original",
      t14: "shared-reflection",
    },
  },
  {
    id: "h-mixed-weak-signal",
    label: "H — MIXED / WEAK SIGNAL",
    description: "모든 축에서 중립에 가깝게 섞인, Cross-Issue 미노출 검증용 프로필",
    answers: {
      t1: "structure-first",
      t2: "anchor-only",
      t3: "adjust-in-place",
      t4: "predictable-stay",
      t5: "two-cities",
      t6: "keep-moving",
      t7: "landmark-route",
      t8: "curated-list",
      t9: "light-exchange",
      t10: "open-first-step",
      t11: "stay-in-the-moment",
      t12: "occasional-revisit",
      t13: "near-original",
      t14: "shared-reflection",
    },
  },
];

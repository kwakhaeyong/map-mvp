// TRAVEL QUESTIONNAIRE v1 — ISSUE 02(2026-08, PR #261 Round I 구현).
//
// 이 파일의 문항 문구/선택지는 이전 설계 라운드(Architecture/
// Questionnaire Design/Final Spec)의 승인된 "구조"(축 6개·역할·
// 이미지 문항 개수=5·Q3/COMFORT-only·Q7=가장 중요한 visual
// question·Q8=LOCALITY 재조정·Q9/Q10 reactive/proactive 분리·
// Q13=PLANNING×COMFORT 유일한 보강 문항·Q14=emotional closing,
// SOCIAL ±5)는 그대로 따르되, **문항의 정확한 원문**은 이번 압축
// 과정에서 보존되지 않아 이 라운드에서 새로 썼다 — 이전 라운드에서
// "승인받은 원문 그대로"가 아니다. 구조/축 배정/점수 스펙만
// 승계했고, 실제 문장은 이번에 새로 작성한 것이므로 owner 재검토가
// 필요하다(완료 보고에 명시).
//
// TASTE(tasteQuestionnaireV3.ts)와 동일한 관례: weak=±5/medium=±10/
// strong=±15, evidenceTag/evidenceLabel 쌍, primaryAxis/secondaryAxes.
// evidenceTag는 travel.<axis>.<slug> 컨벤션을 따른다.

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

export type TravelV1InteractionKind = "image-2" | "text-4" | "scenario-4";

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

export const TRAVEL_V1_Q1: TravelV1Question = {
  id: "t1",
  qNumber: 1,
  eyebrow: "BEFORE YOU GO",
  page: 1,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "여행을 앞두고 있습니다.\n당신에게 더 가까운 장면은?",
  primaryAxis: "planning",
  secondaryAxes: [],
  options: [
    {
      id: "detailed-itinerary",
      label: "몇 주 전부터 동선과 시간을\n촘촘히 정리한 다이어리와 지도",
      evidenceTag: "travel.planning.detailed-itinerary",
      evidenceLabel: "몇 주 전부터 동선과 시간을 촘촘히 정리해둔다고 했다",
      axes: { planning: 15 },
    },
    {
      id: "unplanned-arrival",
      label: "짐만 꾸려두고,\n도착해서 마음 가는 대로 움직일 준비",
      evidenceTag: "travel.planning.unplanned-arrival",
      evidenceLabel: "짐만 꾸려두고 도착해서 마음 가는 대로 움직인다고 했다",
      axes: { planning: -15 },
    },
  ],
};

export const TRAVEL_V1_Q2: TravelV1Question = {
  id: "t2",
  qNumber: 2,
  eyebrow: "WHEN PLANS BREAK",
  page: 2,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행 중 일정이 틀어졌을 때\n당신에게 가장 가까운 반응은?",
  primaryAxis: "planning",
  secondaryAxes: [],
  options: [
    {
      id: "replan-immediately",
      label: "그 자리에서 바로 대안을 찾아 계획을 다시 짠다",
      evidenceTag: "travel.planning.replan-immediately",
      evidenceLabel: "그 자리에서 바로 대안을 찾아 계획을 다시 짠다고 했다",
      axes: { planning: 10 },
    },
    {
      id: "restore-original",
      label: "원래 계획에 최대한 가깝게 되돌리려 애쓴다",
      evidenceTag: "travel.planning.restore-original",
      evidenceLabel: "원래 계획에 최대한 가깝게 되돌리려 한다고 했다",
      axes: { planning: 15 },
    },
    {
      id: "let-it-flow",
      label: "틀어진 대로 흘러가 보며 다음을 본다",
      evidenceTag: "travel.planning.let-it-flow",
      evidenceLabel: "틀어진 대로 흘러가 보며 다음을 본다고 했다",
      axes: { planning: -15 },
    },
    {
      id: "pause-and-ask",
      label: "잠깐 멈춰서 지금 뭘 하고 싶은지부터 다시 묻는다",
      evidenceTag: "travel.planning.pause-and-ask",
      evidenceLabel: "잠깐 멈춰서 지금 뭘 하고 싶은지부터 다시 묻는다고 했다",
      axes: { planning: -10 },
    },
  ],
};

// COMFORT-only(§Round H 수정 반영) — PLANNING 오염 없이 편안함 축만
// 측정한다. D는 이전 라운드에서 확정된 문구를 그대로 재사용했다.
export const TRAVEL_V1_Q3: TravelV1Question = {
  id: "t3",
  qNumber: 3,
  eyebrow: "AN UNCOMFORTABLE ROOM",
  page: 3,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "숙소에 도착했는데\n생각보다 불편한 부분이 있습니다.",
  primaryAxis: "comfort",
  secondaryAxes: [],
  options: [
    {
      id: "stay-unbothered",
      label: "크게 개의치 않고 원래 계획대로 계속 머문다",
      evidenceTag: "travel.comfort.stay-unbothered",
      evidenceLabel: "크게 개의치 않고 원래 계획대로 계속 머문다고 했다",
      axes: { comfort: -15 },
    },
    {
      id: "tolerate-briefly",
      label: "아쉽지만 어차피 잠깐이니 그냥 참고 지낸다",
      evidenceTag: "travel.comfort.tolerate-briefly",
      evidenceLabel: "아쉽지만 잠깐이니 참고 지낸다고 했다",
      axes: { comfort: -10 },
    },
    {
      id: "self-adjust",
      label: "작은 것들을 스스로 조정해서 조금 더 편하게 만든다",
      evidenceTag: "travel.comfort.self-adjust",
      evidenceLabel: "작은 것들을 스스로 조정해서 더 편하게 만든다고 했다",
      axes: { comfort: 5 },
    },
    {
      id: "change-place",
      label: "불편한 부분이 계속 신경 쓰이면,\n여행 흐름을 바꾸더라도 더 편한 곳으로 옮긴다",
      evidenceTag: "travel.comfort.change-place",
      evidenceLabel: "불편한 부분이 계속 신경 쓰이면 여행 흐름을 바꾸더라도 더 편한 곳으로 옮긴다고 했다",
      axes: { comfort: 15 },
    },
  ],
};

export const TRAVEL_V1_Q4: TravelV1Question = {
  id: "t4",
  qNumber: 4,
  eyebrow: "WHERE YOU STAY",
  page: 4,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "다음 중 더 끌리는\n숙소의 모습은?",
  primaryAxis: "comfort",
  secondaryAxes: ["locality"],
  options: [
    {
      id: "clean-hotel",
      label: "군더더기 없이 깔끔하고\n편의시설이 잘 갖춰진 호텔 방",
      evidenceTag: "travel.comfort.clean-hotel",
      evidenceLabel: "깔끔하고 편의시설이 잘 갖춰진 호텔 방에 끌린다고 했다",
      axes: { comfort: 15, locality: -5 },
    },
    {
      id: "lived-in-guesthouse",
      label: "다소 낡았지만 그 동네 사람들이\n실제로 사는 것 같은 게스트하우스",
      evidenceTag: "travel.comfort.lived-in-guesthouse",
      evidenceLabel: "낡았지만 동네 사람들이 실제로 사는 것 같은 게스트하우스에 끌린다고 했다",
      axes: { comfort: -15, locality: 5 },
    },
  ],
};

export const TRAVEL_V1_Q5: TravelV1Question = {
  id: "t5",
  qNumber: 5,
  eyebrow: "THREE NIGHTS, FOUR DAYS",
  page: 5,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "3박 4일의 여행,\n어떤 방식이 더 당신답습니까?",
  primaryAxis: "depth",
  secondaryAxes: [],
  options: [
    {
      id: "one-city-deep",
      label: "한 도시에 계속 머물며 같은 골목을 여러 번 걷는다",
      evidenceTag: "travel.depth.one-city-deep",
      evidenceLabel: "한 도시에 머물며 같은 골목을 여러 번 걷는다고 했다",
      axes: { depth: 15 },
    },
    {
      id: "city-per-day",
      label: "매일 다른 도시로 옮겨 다니며 최대한 많이 본다",
      evidenceTag: "travel.depth.city-per-day",
      evidenceLabel: "매일 다른 도시로 옮겨 다니며 최대한 많이 본다고 했다",
      axes: { depth: -15 },
    },
    {
      id: "two-city-split",
      label: "두 도시 정도로 나눠 각각 이틀씩 머문다",
      evidenceTag: "travel.depth.two-city-split",
      evidenceLabel: "두 도시로 나눠 각각 이틀씩 머문다고 했다",
      axes: { depth: 5 },
    },
    {
      id: "half-half",
      label: "일정을 반으로 나눠 절반은 이동, 절반은 정착",
      evidenceTag: "travel.depth.half-half",
      evidenceLabel: "일정을 반으로 나눠 절반은 이동, 절반은 정착한다고 했다",
      axes: { depth: -5 },
    },
  ],
};

export const TRAVEL_V1_Q6: TravelV1Question = {
  id: "t6",
  qNumber: 6,
  eyebrow: "WHAT STAYS WITH YOU",
  page: 6,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "좋았던 여행을 떠올리면,\n무엇이 가장 먼저 생각납니까?",
  primaryAxis: "depth",
  secondaryAxes: [],
  options: [
    {
      id: "sum-of-scenes",
      label: "매일 다르게 펼쳐졌던 장면들의 총합",
      evidenceTag: "travel.depth.sum-of-scenes",
      evidenceLabel: "매일 다르게 펼쳐졌던 장면들의 총합이 떠오른다고 했다",
      axes: { depth: -15 },
    },
    {
      id: "details-of-one-place",
      label: "한 장소에서 며칠을 보내며 알게 된 디테일",
      evidenceTag: "travel.depth.details-of-one-place",
      evidenceLabel: "한 장소에서 며칠을 보내며 알게 된 디테일이 떠오른다고 했다",
      axes: { depth: 15 },
    },
    {
      id: "few-intense-moments",
      label: "몇 개의 강렬했던 순간들",
      evidenceTag: "travel.depth.few-intense-moments",
      evidenceLabel: "몇 개의 강렬했던 순간들이 떠오른다고 했다",
      axes: { depth: -5 },
    },
    {
      id: "repeated-daily-rhythm",
      label: "그곳에서 반복했던 사소한 하루의 리듬",
      evidenceTag: "travel.depth.repeated-daily-rhythm",
      evidenceLabel: "그곳에서 반복했던 사소한 하루의 리듬이 떠오른다고 했다",
      axes: { depth: 10 },
    },
  ],
};

// LOCALITY의 "가장 중요한 visual question" — 목적지의 아름다움이
// 아니라 "동선의 종류"(계획된 대표 동선 vs 우연히 발견한 골목)로
// 선택을 가른다.
export const TRAVEL_V1_Q7: TravelV1Question = {
  id: "t7",
  qNumber: 7,
  eyebrow: "ONE FREE DAY",
  page: 7,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "낯선 도시에서 하루가 주어졌습니다.\n당신의 발걸음은 어디로 향합니까?",
  primaryAxis: "locality",
  secondaryAxes: [],
  options: [
    {
      id: "landmark-route",
      label: "미리 찾아둔 대표 명소들을\n순서대로 도는 동선",
      evidenceTag: "travel.locality.landmark-route",
      evidenceLabel: "미리 찾아둔 대표 명소들을 순서대로 도는 동선을 골랐다",
      axes: { locality: -15 },
    },
    {
      id: "wandering-alley",
      label: "정해진 곳 없이 걷다가\n우연히 발견한 골목",
      evidenceTag: "travel.locality.wandering-alley",
      evidenceLabel: "정해진 곳 없이 걷다가 우연히 발견한 골목을 골랐다",
      axes: { locality: 15 },
    },
  ],
};

// LOCALITY 재조정(§Round H) — A가 "정답"처럼 읽히지 않도록 중립적
// 관찰 문장으로만 서술한다.
export const TRAVEL_V1_Q8: TravelV1Question = {
  id: "t8",
  qNumber: 8,
  eyebrow: "WHERE YOU EAT",
  page: 8,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행지에서 밥을 먹을 때\n당신에게 가장 가까운 모습은?",
  primaryAxis: "locality",
  secondaryAxes: [],
  options: [
    {
      id: "hidden-local-spot",
      label: "동네 사람들이 실제로 줄 서는,\n검색에 잘 안 나오는 식당을 찾아본다",
      evidenceTag: "travel.locality.hidden-local-spot",
      evidenceLabel: "동네 사람들이 실제로 줄 서는, 검색에 잘 안 나오는 식당을 찾아본다고 했다",
      axes: { locality: 15 },
    },
    {
      id: "local-leaning",
      label: "현지인이 많이 가는 곳이면 좋겠지만,\n너무 헤매지는 않는다",
      evidenceTag: "travel.locality.local-leaning",
      evidenceLabel: "현지인이 많이 가는 곳이면 좋지만 너무 헤매지는 않는다고 했다",
      axes: { locality: 10 },
    },
    {
      id: "verified-and-safe",
      label: "평이 좋고 검증된 곳이면 충분하다",
      evidenceTag: "travel.locality.verified-and-safe",
      evidenceLabel: "평이 좋고 검증된 곳이면 충분하다고 했다",
      axes: { locality: -5 },
    },
    {
      id: "familiar-style",
      label: "익숙한 프랜차이즈나\n익히 아는 스타일의 음식이 더 안심된다",
      evidenceTag: "travel.locality.familiar-style",
      evidenceLabel: "익숙한 프랜차이즈나 익히 아는 스타일의 음식이 더 안심된다고 했다",
      axes: { locality: -15 },
    },
  ],
};

// SOCIAL(reactive) — 상대가 먼저 접근했을 때 얼마나 확장하는가.
export const TRAVEL_V1_Q9: TravelV1Question = {
  id: "t9",
  qNumber: 9,
  eyebrow: "A STRANGER SPEAKS FIRST",
  page: 9,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "숙소나 여행지에서 낯선 사람이\n먼저 말을 걸어옵니다.",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "welcome-and-extend",
      label: "반갑게 대화를 이어가고, 잘 맞으면 함께 시간을 보낸다",
      evidenceTag: "travel.social.welcome-and-extend",
      evidenceLabel: "반갑게 대화를 이어가고 잘 맞으면 함께 시간을 보낸다고 했다",
      axes: { social: 15 },
    },
    {
      id: "polite-and-return",
      label: "짧게 예의 있게 대화하고 각자의 여행으로 돌아간다",
      evidenceTag: "travel.social.polite-and-return",
      evidenceLabel: "짧게 예의 있게 대화하고 각자의 여행으로 돌아간다고 했다",
      axes: { social: -5 },
    },
    {
      id: "end-quickly",
      label: "가능하면 대화를 짧게 끝내고 혼자만의 시간으로 돌아간다",
      evidenceTag: "travel.social.end-quickly",
      evidenceLabel: "가능하면 대화를 짧게 끝내고 혼자만의 시간으로 돌아간다고 했다",
      axes: { social: -15 },
    },
    {
      id: "grateful-but-cautious",
      label: "먼저 다가온 것은 고맙지만, 이어지는 대화는 상황을 봐서 정한다",
      evidenceTag: "travel.social.grateful-but-cautious",
      evidenceLabel: "먼저 다가온 것은 고맙지만 이어지는 대화는 상황을 봐서 정한다고 했다",
      axes: { social: 5 },
    },
  ],
};

// SOCIAL(proactive) — 내가 먼저 관계를 시작하는가. Q9(반응)와 역할을
// 겹치지 않게, "혼자만의 시간이 길어졌을 때"라는 다른 상황을 쓴다.
export const TRAVEL_V1_Q10: TravelV1Question = {
  id: "t10",
  qNumber: 10,
  eyebrow: "DAYS ALONE",
  page: 10,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행 중 혼자만의 시간이\n며칠째 이어지고 있습니다.",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "seek-someone-out",
      label: "숙소 라운지나 투어에서 먼저 말을 걸어볼 사람을 찾는다",
      evidenceTag: "travel.social.seek-someone-out",
      evidenceLabel: "먼저 말을 걸어볼 사람을 적극적으로 찾는다고 했다",
      axes: { social: 15 },
    },
    {
      id: "open-if-chance",
      label: "혼자는 편하지만, 기회가 보이면 먼저 다가가 보는 편이다",
      evidenceTag: "travel.social.open-if-chance",
      evidenceLabel: "혼자는 편하지만 기회가 보이면 먼저 다가가 본다고 했다",
      axes: { social: 10 },
    },
    {
      id: "not-really-missing-it",
      label: "혼자인 시간이 딱히 아쉽지 않아 먼저 나서지는 않는다",
      evidenceTag: "travel.social.not-really-missing-it",
      evidenceLabel: "혼자인 시간이 아쉽지 않아 먼저 나서지 않는다고 했다",
      axes: { social: -10 },
    },
    {
      id: "protect-the-solitude",
      label: "오히려 이 시간을 지키고 싶어 사람을 피하게 된다",
      evidenceTag: "travel.social.protect-the-solitude",
      evidenceLabel: "오히려 이 시간을 지키고 싶어 사람을 피하게 된다고 했다",
      axes: { social: -15 },
    },
  ],
};

export const TRAVEL_V1_Q11: TravelV1Question = {
  id: "t11",
  qNumber: 11,
  eyebrow: "A SCENE THAT STOPS YOU",
  page: 11,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "여행 중 마음을 사로잡는 장면을 만났습니다.\n당신의 손은 무엇을 합니까?",
  primaryAxis: "memory",
  secondaryAxes: [],
  options: [
    {
      id: "capture-and-note",
      label: "바로 카메라를 들어\n사진과 함께 그 순간의 메모를 남긴다",
      evidenceTag: "travel.memory.capture-and-note",
      evidenceLabel: "바로 사진과 함께 그 순간의 메모를 남긴다고 했다",
      axes: { memory: 15 },
    },
    {
      id: "watch-without-camera",
      label: "카메라 없이\n눈으로만 충분히 담아둔다",
      evidenceTag: "travel.memory.watch-without-camera",
      evidenceLabel: "카메라 없이 눈으로만 충분히 담아둔다고 했다",
      axes: { memory: -15 },
    },
  ],
};

export const TRAVEL_V1_Q12: TravelV1Question = {
  id: "t12",
  qNumber: 12,
  eyebrow: "AFTER YOU'RE BACK",
  page: 12,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행에서 돌아온 뒤,\n당신에게 가장 가까운 모습은?",
  primaryAxis: "memory",
  secondaryAxes: [],
  options: [
    {
      id: "publish-and-share",
      label: "사진과 글을 정리해서 누군가에게 보여주거나 SNS에 남긴다",
      evidenceTag: "travel.memory.publish-and-share",
      evidenceLabel: "사진과 글을 정리해서 SNS에 남기거나 보여준다고 했다",
      axes: { memory: 15 },
    },
    {
      id: "show-a-few",
      label: "친한 몇 명에게만 사진 몇 장을 보여준다",
      evidenceTag: "travel.memory.show-a-few",
      evidenceLabel: "친한 몇 명에게만 사진 몇 장을 보여준다고 했다",
      axes: { memory: 5 },
    },
    {
      id: "leave-it-unopened",
      label: "사진은 폰 안에 그대로 두고 거의 다시 보지 않는다",
      evidenceTag: "travel.memory.leave-it-unopened",
      evidenceLabel: "사진은 폰 안에 그대로 두고 거의 다시 보지 않는다고 했다",
      axes: { memory: -10 },
    },
    {
      id: "memory-is-enough",
      label: "따로 기록하지 않아도, 그 기억만으로 충분하다고 느낀다",
      evidenceTag: "travel.memory.memory-is-enough",
      evidenceLabel: "따로 기록하지 않아도 그 기억만으로 충분하다고 느낀다고 했다",
      axes: { memory: -15 },
    },
  ],
};

// PLANNING × COMFORT 유일한 보강 문항 — 다른 12문항이 각 축을 독립
// 측정하는 것과 달리, 이 문항만 "지쳤을 때 계획과 편안함 중 무엇을
// 먼저 놓는가"로 두 축을 동시에 다룬다.
export const TRAVEL_V1_Q13: TravelV1Question = {
  id: "t13",
  qNumber: 13,
  eyebrow: "WHEN YOU'RE TIRED",
  page: 13,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "text-4",
  prompt: "여행 셋째 날, 예상보다 몸이 지쳤습니다.\n당신에게 가장 가까운 선택은?",
  primaryAxis: "planning",
  secondaryAxes: ["comfort"],
  options: [
    {
      id: "keep-plan-rest-more",
      label: "원래 계획한 일정은 그대로 두고, 쉬는 시간만 조금 늘린다",
      evidenceTag: "travel.planning.keep-plan-rest-more",
      evidenceLabel: "원래 계획은 그대로 두고 쉬는 시간만 조금 늘린다고 했다",
      axes: { planning: 10, comfort: -5 },
    },
    {
      id: "cut-plan-in-half",
      label: "일정을 즉석에서 절반으로 줄이고 편한 곳에서 쉰다",
      evidenceTag: "travel.planning.cut-plan-in-half",
      evidenceLabel: "일정을 즉석에서 절반으로 줄이고 편한 곳에서 쉰다고 했다",
      axes: { planning: -10, comfort: 10 },
    },
    {
      id: "reorder-not-remove",
      label: "계획은 유지하되, 컨디션에 맞춰 순서만 바꾼다",
      evidenceTag: "travel.planning.reorder-not-remove",
      evidenceLabel: "계획은 유지하되 컨디션에 맞춰 순서만 바꾼다고 했다",
      axes: { planning: 5, comfort: 5 },
    },
    {
      id: "drop-plan-entirely",
      label: "그날은 계획을 다 접어두고 몸이 원하는 대로 움직인다",
      evidenceTag: "travel.planning.drop-plan-entirely",
      evidenceLabel: "그날은 계획을 다 접어두고 몸이 원하는 대로 움직인다고 했다",
      axes: { planning: -15, comfort: 5 },
    },
  ],
};

// EMOTIONAL CLOSING — SOCIAL을 강하게 재측정하지 않고(±5) 감정적
// evidence 한 장을 남기는 목적. TASTE Q15의 "집으로 돌아감 vs
// 새로운 곳" 프레임을 반복하지 않는다.
export const TRAVEL_V1_Q14: TravelV1Question = {
  id: "t14",
  qNumber: 14,
  eyebrow: "THE LAST NIGHT",
  page: 14,
  totalPages: TRAVEL_V1_TOTAL_PAGES,
  kind: "image-2",
  prompt: "여행의 마지막 밤,\n가장 마음에 남는 장면을 하나만 고른다면?",
  primaryAxis: "social",
  secondaryAxes: [],
  options: [
    {
      id: "final-conversation",
      label: "함께 여행한 사람과\n나눈 마지막 대화",
      evidenceTag: "travel.social.final-conversation",
      evidenceLabel: "함께 여행한 사람과 나눈 마지막 대화가 가장 마음에 남는다고 했다",
      axes: { social: 5 },
    },
    {
      id: "walking-alone-at-night",
      label: "혼자 걸으며 조용히 정리한\n하루의 마지막 순간",
      evidenceTag: "travel.social.walking-alone-at-night",
      evidenceLabel: "혼자 걸으며 조용히 정리한 하루의 마지막 순간이 가장 마음에 남는다고 했다",
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
// (A-H). archetypes: A=철저한 계획가, B=즉흥 방랑자, C=깊이 파는
// 정착형, D=명소 수집형, E=사교적 확장형, F=혼자를 지키는 관찰자,
// G=기록하는 아카이비스트, H=약하고 뒤섞인(신호 없음 검증용) 프로필.
export type TravelV1MockProfile = { id: string; label: string; description: string; answers: TravelV1RawAnswers };

export const TRAVEL_V1_MOCK_PROFILES: TravelV1MockProfile[] = [
  {
    id: "a-meticulous-planner",
    label: "A — METICULOUS PLANNER",
    description: "촘촘한 계획 / 편안함 우선 / 명소 중심 / 사교적이지 않음 / 적극적 기록",
    answers: {
      t1: "detailed-itinerary",
      t2: "restore-original",
      t3: "change-place",
      t4: "clean-hotel",
      t5: "two-city-split",
      t6: "sum-of-scenes",
      t7: "landmark-route",
      t8: "verified-and-safe",
      t9: "polite-and-return",
      t10: "not-really-missing-it",
      t11: "capture-and-note",
      t12: "publish-and-share",
      t13: "keep-plan-rest-more",
      t14: "walking-alone-at-night",
    },
  },
  {
    id: "b-improvising-wanderer",
    label: "B — IMPROVISING WANDERER",
    description: "즉흥 / 불편 감수 / 로컬 지향 / 사교적 확장 / 기록 안 함",
    answers: {
      t1: "unplanned-arrival",
      t2: "let-it-flow",
      t3: "stay-unbothered",
      t4: "lived-in-guesthouse",
      t5: "city-per-day",
      t6: "sum-of-scenes",
      t7: "wandering-alley",
      t8: "hidden-local-spot",
      t9: "welcome-and-extend",
      t10: "seek-someone-out",
      t11: "watch-without-camera",
      t12: "memory-is-enough",
      t13: "drop-plan-entirely",
      t14: "final-conversation",
    },
  },
  {
    id: "c-deep-settler",
    label: "C — DEEP SETTLER",
    description: "적당한 계획 / 편안함 우선 / 로컬 지향 / 낮은 사교성 / 조용한 기록",
    answers: {
      t1: "detailed-itinerary",
      t2: "pause-and-ask",
      t3: "tolerate-briefly",
      t4: "lived-in-guesthouse",
      t5: "one-city-deep",
      t6: "details-of-one-place",
      t7: "wandering-alley",
      t8: "local-leaning",
      t9: "end-quickly",
      t10: "protect-the-solitude",
      t11: "watch-without-camera",
      t12: "show-a-few",
      t13: "reorder-not-remove",
      t14: "walking-alone-at-night",
    },
  },
  {
    id: "d-landmark-collector",
    label: "D — LANDMARK COLLECTOR",
    description: "강한 계획 / 편안함 우선 / 명소 중심 / 낮은 사교성 / 적극적 공유",
    answers: {
      t1: "detailed-itinerary",
      t2: "restore-original",
      t3: "change-place",
      t4: "clean-hotel",
      t5: "city-per-day",
      t6: "sum-of-scenes",
      t7: "landmark-route",
      t8: "familiar-style",
      t9: "polite-and-return",
      t10: "not-really-missing-it",
      t11: "capture-and-note",
      t12: "publish-and-share",
      t13: "keep-plan-rest-more",
      t14: "final-conversation",
    },
  },
  {
    id: "e-social-expander",
    label: "E — SOCIAL EXPANDER",
    description: "즉흥 / 불편 감수 / 로컬 지향 / 강한 사교성 / 적극적 공유",
    answers: {
      t1: "unplanned-arrival",
      t2: "let-it-flow",
      t3: "stay-unbothered",
      t4: "lived-in-guesthouse",
      t5: "city-per-day",
      t6: "few-intense-moments",
      t7: "wandering-alley",
      t8: "hidden-local-spot",
      t9: "welcome-and-extend",
      t10: "seek-someone-out",
      t11: "capture-and-note",
      t12: "publish-and-share",
      t13: "drop-plan-entirely",
      t14: "final-conversation",
    },
  },
  {
    id: "f-solitary-observer",
    label: "F — SOLITARY OBSERVER",
    description: "적당한 계획 / 편안함 중립 / 로컬 지향 / 강한 비사교성 / 기록 안 함",
    answers: {
      t1: "detailed-itinerary",
      t2: "pause-and-ask",
      t3: "self-adjust",
      t4: "lived-in-guesthouse",
      t5: "one-city-deep",
      t6: "details-of-one-place",
      t7: "wandering-alley",
      t8: "local-leaning",
      t9: "end-quickly",
      t10: "protect-the-solitude",
      t11: "watch-without-camera",
      t12: "leave-it-unopened",
      t13: "reorder-not-remove",
      t14: "walking-alone-at-night",
    },
  },
  {
    id: "g-archivist",
    label: "G — ARCHIVIST",
    description: "적당한 계획 / 편안함 우선 / 로컬-명소 혼합 / 낮은 사교성 / 강한 기록",
    answers: {
      t1: "detailed-itinerary",
      t2: "replan-immediately",
      t3: "tolerate-briefly",
      t4: "clean-hotel",
      t5: "two-city-split",
      t6: "details-of-one-place",
      t7: "landmark-route",
      t8: "local-leaning",
      t9: "grateful-but-cautious",
      t10: "open-if-chance",
      t11: "capture-and-note",
      t12: "publish-and-share",
      t13: "reorder-not-remove",
      t14: "final-conversation",
    },
  },
  {
    id: "h-mixed-weak-signal",
    label: "H — MIXED / WEAK SIGNAL",
    description: "모든 축에서 중립에 가깝게 섞인, Cross-Issue 미노출 검증용 프로필",
    answers: {
      t1: "detailed-itinerary",
      t2: "pause-and-ask",
      t3: "self-adjust",
      t4: "clean-hotel",
      t5: "two-city-split",
      t6: "few-intense-moments",
      t7: "landmark-route",
      t8: "verified-and-safe",
      t9: "grateful-but-cautious",
      t10: "open-if-chance",
      t11: "watch-without-camera",
      t12: "show-a-few",
      t13: "reorder-not-remove",
      t14: "final-conversation",
    },
  },
];

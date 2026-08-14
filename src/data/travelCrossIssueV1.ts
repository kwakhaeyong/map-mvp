// CROSS-ISSUE ENGINE v1(2026-08, PR #261 Round I §6~§13 구현, Round J
// §4~§9에서 14/14 Matrix로 확장).
//
// TASTE × TRAVEL을 나란히 놓고 "이전에는 볼 수 없었던 해석"을
// 만드는 유일한 엔진. 결정론적(non-ML) 규칙 기반이며, 사용자에게
// 보이는 모든 문장은 (pairId, insightType, tasteDirection,
// travelDirection) 조합별로 손으로 쓴 카피뱅크(COPY_BANK)에서만
// 나온다 — tasteNarrativeV3.ts의 BEHAVIOR_SCENE/PRACTICAL_CONSEQUENCE와
// 동일한 원칙이다. 계산된 조합에 맞는 카피가 없으면, generic 문장으로
// 대체하지 않고 그 후보를 그냥 버린다.
//
// Round J 변경사항:
// - Matrix는 승인된 14개 pair 전부를 CROSS_ISSUE_MATRIX_META에 등록한다
//   (§4 "14개 존재"). 다만 "Matrix 존재"와 "모든 polarity 조합에 카피
//   존재"는 다른 문제라, COPY_BANK는 편집 품질 기준을 통과하는
//   조합에만 채웠다(§5) — 14개 pair 전부 최소 1개 이상의 변형은
//   갖췄다(§6).
// - COMFORT 축 극성이 questionnaire 복구 과정에서 바로잡혔다: COMFORT+
//   는 "불편함/낯섦을 그대로 받아들인다"(travel.comfort.accept-as-is,
//   local-texture-stay), COMFORT−는 "예측 가능한 편안함을 적극적으로
//   확보한다"(prioritize-comfort, predictable-stay)다. 이전 라운드의
//   SPACE×COMFORT 카피는 이 극성 기준으로 다시 썼다.
// - HIDDEN_RULE은 EXPLORATION×PLANNING(exploration+/planning+) 한
//   곳에만 남겼다 — 나머지 13개 pair는 CONTEXT_SHIFT/CONTRAST/
//   REINFORCEMENT로, "5조건 중 하나라도 부족하면 다운그레이드"
//   원칙을 그대로 지켰다(§8, 완료 보고에 다운그레이드 사례 명시).

import type { TasteV3AxisKey } from "./tasteQuestionnaireV3";
import type { V3AxisAggregate } from "./tasteEvidenceV3";
import type { TravelAxisKey } from "./travelQuestionnaireV1";
import type { TravelV1AxisAggregate } from "./travelEvidenceV1";

export type InsightType = "HIDDEN_RULE" | "CONTEXT_SHIFT" | "CONTRAST" | "REINFORCEMENT";
export type CrossIssueConfidence = "HIGH" | "MEDIUM" | "LOW";
type Direction = "positive" | "negative";

export type CrossIssueEvidenceRef = { source: "taste" | "travel"; label: string };

export type CrossIssueCandidate = {
  pairId: string;
  type: InsightType;
  confidence: CrossIssueConfidence;
  tasteAxis: TasteV3AxisKey;
  tasteDirection: Direction;
  travelAxis: TravelAxisKey;
  travelDirection: Direction;
  directEvidence: CrossIssueEvidenceRef[];
  editorialHeadline: string;
  editorialBody: string;
};

type CopyEntry = { type: InsightType; headline: string; body: string };

function key(pairId: string, tasteDir: Direction, travelDir: Direction): string {
  return `${pairId}:${tasteDir}:${travelDir}`;
}

// ============================================================
// MATRIX — 승인된 14개 pair 전부 등록(§4). allowedTypes/minConfidence는
// "이 pair에서 계산상 나올 수 있는 type"의 상한선이지, 실제 사용을
// 강제하지 않는다 — 실제로 어떤 type이 쓰이는지는 COPY_BANK에 등록된
// 조합으로만 결정된다.
// ============================================================
export type CrossIssueMatrixRow = {
  pairId: string;
  tasteAxis: TasteV3AxisKey;
  travelAxis: TravelAxisKey;
  allowedTypes: InsightType[];
  minConfidence: CrossIssueConfidence;
  primaryEvidenceQuestions: { taste: string; travel: string };
};

export const CROSS_ISSUE_MATRIX_META: CrossIssueMatrixRow[] = [
  { pairId: "spacexcomfort", tasteAxis: "space", travelAxis: "comfort", allowedTypes: ["REINFORCEMENT", "CONTEXT_SHIFT", "CONTRAST"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q1,Q9", travel: "TRAVEL Q3,Q4" } },
  { pairId: "explorationxplanning", tasteAxis: "exploration", travelAxis: "planning", allowedTypes: ["HIDDEN_RULE", "CONTEXT_SHIFT", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q3,Q7,Q15", travel: "TRAVEL Q1,Q2" } },
  { pairId: "explorationxcomfort", tasteAxis: "exploration", travelAxis: "comfort", allowedTypes: ["REINFORCEMENT", "CONTEXT_SHIFT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q3,Q7", travel: "TRAVEL Q3,Q4" } },
  { pairId: "explorationxdepth", tasteAxis: "exploration", travelAxis: "depth", allowedTypes: ["CONTRAST", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q3,Q13", travel: "TRAVEL Q5,Q6" } },
  { pairId: "relationxsocial", tasteAxis: "relation", travelAxis: "social", allowedTypes: ["HIDDEN_RULE", "CONTEXT_SHIFT", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q4,Q6,Q12", travel: "TRAVEL Q9,Q10" } },
  { pairId: "expressionxmemory", tasteAxis: "expression", travelAxis: "memory", allowedTypes: ["HIDDEN_RULE", "REINFORCEMENT", "CONTEXT_SHIFT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q6,Q11", travel: "TRAVEL Q11,Q12" } },
  { pairId: "expressionxlocality", tasteAxis: "expression", travelAxis: "locality", allowedTypes: ["CONTRAST", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q6,Q13", travel: "TRAVEL Q7,Q8" } },
  { pairId: "rhythmxplanning", tasteAxis: "rhythm", travelAxis: "planning", allowedTypes: ["CONTEXT_SHIFT", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q8,Q10", travel: "TRAVEL Q1,Q13" } },
  { pairId: "rhythmxdepth", tasteAxis: "rhythm", travelAxis: "depth", allowedTypes: ["REINFORCEMENT", "CONTRAST"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q4,Q10", travel: "TRAVEL Q5,Q6" } },
  { pairId: "sensoryxlocality", tasteAxis: "sensory", travelAxis: "locality", allowedTypes: ["REINFORCEMENT", "CONTEXT_SHIFT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q2,Q5", travel: "TRAVEL Q7,Q8" } },
  { pairId: "spacexdepth", tasteAxis: "space", travelAxis: "depth", allowedTypes: ["REINFORCEMENT", "CONTRAST"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q1,Q9", travel: "TRAVEL Q5,Q6" } },
  { pairId: "relationxmemory", tasteAxis: "relation", travelAxis: "memory", allowedTypes: ["CONTRAST", "REINFORCEMENT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q6,Q12", travel: "TRAVEL Q11,Q12" } },
  { pairId: "sensoryxcomfort", tasteAxis: "sensory", travelAxis: "comfort", allowedTypes: ["REINFORCEMENT", "CONTEXT_SHIFT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q2,Q5", travel: "TRAVEL Q3,Q4" } },
  { pairId: "spacexlocality", tasteAxis: "space", travelAxis: "locality", allowedTypes: ["REINFORCEMENT", "CONTEXT_SHIFT"], minConfidence: "MEDIUM", primaryEvidenceQuestions: { taste: "TASTE Q1,Q9", travel: "TRAVEL Q7,Q8" } },
];

// ============================================================
// COPY BANK — pairId별로 편집 품질 기준을 통과하는 조합에만 원고를
// 채운다. 14개 pair 전부 최소 1개 변형은 있지만, 어떤 pair는 2개
// 방향 조합까지만 다뤘다(§5 "일부만 존재 가능").
// ============================================================
const COPY_BANK: Record<string, CopyEntry> = {
  // --- 1. SPACE × COMFORT (twin) ---
  [key("spacexcomfort", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "당신에게 좋은 공간은 완벽함이 아니라 흔적으로 확인됩니다 —\n낯선 방 앞에서도 마찬가지입니다.",
    body: "정돈된 넓은 곳보다 손에 익은 좁은 자리에서 마음이 먼저 놓인다고 했습니다. 그래서인지 숙소가 생각과 달라도 굳이 바꾸지 않고 그 상태 그대로 여행을 이어갑니다. 공간을 판단하는 기준이 '얼마나 잘 정돈됐는가'가 아니라 '얼마나 빨리 스며들 수 있는가'라는 것은, 익숙한 방에서도 낯선 방에서도 똑같이 적용되는 규칙입니다.",
  },
  [key("spacexcomfort", "negative", "negative")]: {
    type: "CONTEXT_SHIFT",
    headline: "손때 묻은 공간이 편한 것과, 여행에서 편안함을 지키려는 것은\n서로 다른 데서 옵니다.",
    body: "당신은 평소 정돈된 넓은 곳보다 밀도 있고 익숙한 공간에서 마음이 놓인다고 했습니다. 하지만 여행 중 숙소가 생각과 다르면 그 상태를 받아들이기보다, 여행 흐름을 바꿔서라도 더 편한 곳으로 옮기는 쪽을 택했습니다. 일상의 편안함은 '얼마나 익숙한가'로 정해지지만, 여행의 편안함은 '얼마나 예측 가능한가'로 정해집니다 — 당신에게는 서로 다른 두 개의 기준입니다.",
  },

  // --- 2. EXPLORATION × PLANNING (예시 GOOD case) ---
  [key("explorationxplanning", "positive", "positive")]: {
    type: "HIDDEN_RULE",
    headline: "새로움을 좋아하는 것과 즉흥적인 것은,\n당신에게 같은 말이 아닙니다.",
    body: "안전한 길보다 낯선 쪽으로 먼저 손이 가면서도, 여행을 앞두고는 동선과 시간을 미리 촘촘히 짜둡니다. 낯선 것에 먼저 끌리지만, 그 낯섦을 준비 없이 마주하고 싶어하지는 않습니다. 계획은 새로움을 막는 장치가 아니라, 그 낯섦을 온전히 즐기기 위해 미리 만들어두는 발판에 가깝습니다.",
  },
  [key("explorationxplanning", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "이미 아는 좋음을 지키려는 마음은,\n여행을 준비하는 방식에도 그대로 있습니다.",
    body: "새로움보다 이미 확인된 좋음을 놓치지 않으려는 쪽이라고 했습니다. 여행을 앞두고도 시간과 동선이 미리 짜여진 일정표를 준비해, 낯선 상황에 덜 부딪히는 쪽을 택합니다. 검증된 것을 신뢰하는 태도가 무엇을 고를 때든, 어떻게 떠날 준비를 하든 한결같이 나타납니다.",
  },

  // --- 3. EXPLORATION × COMFORT ---
  [key("explorationxcomfort", "positive", "positive")]: {
    type: "REINFORCEMENT",
    headline: "'어떻게 될지 모른다'는 사실 자체가\n당신에게는 걸림돌이 아닙니다.",
    body: "이미 아는 것을 반복하기보다 확인되지 않은 쪽에서 더 큰 자극을 느낀다고 했습니다. 낯선 숙소가 기대와 다르게 나와도 그 상태를 그대로 받아들이고 여행을 이어가는 것도 같은 자리에서 나온 선택입니다. 대부분의 사람에게 '예상과 다르다'는 건 문제지만, 당신에게는 그 예측 불가능함이 애초에 이유였던 셈입니다.",
  },

  // --- 4. EXPLORATION × DEPTH ---
  [key("explorationxdepth", "positive", "positive")]: {
    type: "CONTRAST",
    headline: "새로움을 좇는 사람이 한 도시에\n닷새를 다 쓰는 이유가 있습니다.",
    body: "낯선 것 앞에서 망설이지 않는 사람이라면 여러 도시를 훑고 다닐 거라 짐작하기 쉽지만, 당신은 한 도시에 닷새를 다 씁니다. 언뜻 어긋나 보이지만, 당신에게 새로움은 얼마나 많은 곳을 스쳤는가가 아니라 한 곳에서 얼마나 다른 결을 더 발견했는가로 정해집니다. 넓게 훑는 새로움보다, 깊이 파고드는 새로움 쪽에 가깝습니다.",
  },

  // --- 5. RELATION × SOCIAL (twin) ---
  [key("relationxsocial", "negative", "negative")]: {
    type: "REINFORCEMENT",
    headline: "관계가 채워주지 못하는 자리는,\n여행지에서도 여전히 혼자만의 몫입니다.",
    body: "당신은 평소 사람들과 함께 있는 시간보다 혼자 채워지는 시간이 필요하다고 했습니다. 여행 중 옆자리 사람이 말을 걸어와도 짧게 답하고 다시 풍경으로 돌아갑니다. 낯선 도시라는 새로운 무대에서도 당신을 채우는 건 새로운 사람이 아니라, 여전히 혼자 있는 시간 쪽입니다.",
  },
  [key("relationxsocial", "negative", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "평소엔 혼자가 편하지만,\n낯선 곳에서는 먼저 다가가는 쪽이 됩니다.",
    body: "당신은 평소 혼자 있는 시간이 있어야 다시 채워진다고 했습니다. 하지만 여행 중에는 내가 먼저 말을 걸거나 함께할 계기를 만드는 편이고, 옆자리 사람이 말을 걸면 대화가 이어지도록 질문을 더 건넵니다. 익숙한 관계에서는 거리를 두면서도, 낯선 환경에서는 오히려 그 거리를 먼저 좁히는 사람입니다 — 관계를 여는 기준이 '누구인가'가 아니라 '어디인가'에 있는 편에 가깝습니다.",
  },

  // --- 6. EXPRESSION × MEMORY (twin) ---
  [key("expressionxmemory", "positive", "positive")]: {
    type: "REINFORCEMENT",
    headline: "느낀 것을 밖으로 흘려보내는 태도는,\n여행에서도 그대로 이어집니다.",
    body: "당신은 평소 좋은 것을 발견하면 그 감정을 안에 담아두지 못하고 밖으로 표현하는 편이라고 했습니다. 여행에서도 인상 깊은 장면 앞에 서면 카메라나 노트를 꺼내 그 장면을 기록하고, 돌아온 뒤에는 다시 정리해 앨범이나 글로 남깁니다. 표현은 당신에게 취향이 아니라 습관에 가깝습니다 — 무엇을 보든, 어디에 있든 반복되는 태도입니다.",
  },
  [key("expressionxmemory", "negative", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "평소엔 감정을 안에만 두지만,\n여행에서는 기록으로 남깁니다.",
    body: "당신은 평소 좋아하는 것을 발견해도 굳이 알리지 않고 지나가는 경우가 많다고 했습니다. 그런데 여행에서는 인상 깊은 장면 앞에 서면 카메라나 노트를 꺼내 그 순간을 기록하고, 돌아온 뒤에도 다시 정리해 남겨둡니다. 일상의 취향은 혼자만 알아도 충분하지만, 여행이라는 낯선 시간만큼은 기록으로 붙잡아두고 싶어하는 쪽입니다.",
  },

  // --- 7. EXPRESSION × LOCALITY ---
  [key("expressionxlocality", "positive", "negative")]: {
    type: "CONTRAST",
    headline: "좋아하는 것을 적극적으로 드러내는 사람이\n여행지에서는 검증된 곳을 택합니다.",
    body: "마음에 드는 것을 발견하면 사진이나 말로 그 순간을 바로 남기고 알리는 편이라고 했습니다. 그런데 여행지에서 먹을 곳을 정할 때는 낯선 골목보다 익숙한 메뉴가 있는 곳을 우선 찾습니다. 표현하고 싶은 순간과 실패해도 되는 순간은 당신에게 다른 자리에 있습니다 — 보여줄 순간은 확실한 것에서, 나머지는 안전한 것에서 나옵니다.",
  },

  // --- 8. RHYTHM × PLANNING ---
  [key("rhythmxplanning", "positive", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "마음이 움직인 순간을 놓치지 않는 사람이,\n여행 앞에서는 미리 다 정해둡니다.",
    body: "머뭇거림 없이 움직이는 쪽이 더 자연스러운 속도라고 했습니다. 그런데 여행을 준비할 때는 시간과 동선이 미리 짜여진 일정표를 원합니다. 즉흥적으로 움직이는 힘은 일상의 리듬에서는 강하게 작동하지만, 미지의 땅 앞에서는 오히려 구조를 먼저 세우는 쪽으로 방향을 바꿉니다.",
  },

  // --- 9. RHYTHM × DEPTH ---
  [key("rhythmxdepth", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "서두르지 않는 것이 게으름이 아니듯,\n오래 머무는 것도 미련이 아닙니다.",
    body: "시간을 들일수록 오히려 마음이 편안해지는 쪽이라고 했습니다. 여행에서도 여러 도시를 옮겨 다니기보다 한 도시에 닷새를 다 씁니다. 둘 다 '빨리 다음으로 넘어가지 않는다'는 하나의 습관에서 나온 선택이지만, 일상에서는 신중함으로, 여행에서는 애착으로 다르게 보일 뿐입니다.",
  },

  // --- 10. SENSORY × LOCALITY ---
  [key("sensoryxlocality", "positive", "positive")]: {
    type: "REINFORCEMENT",
    headline: "당신의 시선이 먼저 향하는 곳은\n정돈된 자리가 아니라 낡아가는 자리입니다.",
    body: "완벽한 상태보다 시간이 만든 표면에 더 오래 눈이 머문다고 했습니다. 여행에서 걷는 길도 다르지 않습니다 — 지도 위 대표 명소보다, 정해두지 않고 걷다가 마주친 생활 골목 쪽으로 발이 향합니다. 매끈한 완성보다 실제로 쓰이며 낡아가는 것에 끌리는 눈은, 물건 앞이든 도시의 골목이든 같은 자리를 찾아냅니다.",
  },

  // --- 11. SPACE × DEPTH ---
  [key("spacexdepth", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "여러 곳에 걸치기보다 한 곳에 깊이 뿌리내리는 쪽이\n당신답습니다.",
    body: "크기보다 밀도로, 손에 익은 좁은 자리에서 마음이 먼저 놓인다고 했습니다. 여행에서도 여러 도시로 나누기보다 한 도시에 닷새를 다 쓰는 쪽을 택했습니다. 넓게 걸치는 것보다 좁게 파고드는 쪽을 택하는 습관은, 방 안에서든 도시 안에서든 같은 모양으로 반복됩니다.",
  },

  // --- 12. RELATION × MEMORY ---
  [key("relationxmemory", "positive", "negative")]: {
    type: "CONTRAST",
    headline: "함께해야 완성된다고 느끼는 사람이\n여행은 기록으로 남기지 않습니다.",
    body: "혼자보다 함께일 때 더 선명해지고, 좋은 순간은 나눠야 완성된다고 느낀다고 했습니다. 그런데 여행에서는 사진조차 거의 찍지 않아 그 여행이 인상으로만 남습니다. 당신에게 순간을 완성하는 것은 기록이 아니라 그 자리에 함께 있던 사람입니다 — 사람이 곁에 있었다면, 따로 붙잡아두지 않아도 이미 충분합니다.",
  },

  // --- 13. SENSORY × COMFORT ---
  // HIDDEN_RULE 5조건(§9) 중 "단순 axis polarity만으로 설명되지 않는
  // 관계"를 통과하지 못해 REINFORCEMENT로 다운그레이드했다 — sensory+
  // (흔적을 좋아함)와 comfort+(불편함을 그대로 받아들임)는 "결점에
  // 관대하다"는 하나의 극성으로 바로 설명되는 관계라, 상위 원리를
  // 새로 요구하는 HIDDEN_RULE 조건에 맞지 않는다.
  [key("sensoryxcomfort", "positive", "positive")]: {
    type: "REINFORCEMENT",
    headline: "흠집을 밀어내지 않는 눈은,\n낯선 불편함 앞에서도 그대로입니다.",
    body: "완벽한 상태보다 시간이 지나간 흔적을 더 오래 들여다보는 편이라고 했습니다. 숙소가 기대와 달라도 그 상태 그대로 받아들이고 이어가는 선택도 다르지 않은 눈에서 나옵니다. 결점을 결점으로만 보지 않는 태도가, 물건을 고를 때도 낯선 방 안에서도 똑같이 작동합니다.",
  },

  // --- 14. SPACE × LOCALITY ---
  [key("spacexlocality", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "완성된 것보다 삶의 흔적을 신뢰하는 눈은,\n여행지를 고르는 방식에도 있습니다.",
    body: "당신은 정돈된 넓은 공간보다 손때 묻은 물건들이 놓인 자리에서 마음이 놓인다고 했습니다. 여행에서도 지도 위 대표 명소보다, 정해두지 않고 걷다가 마주친 생활 골목 쪽에 마음이 갑니다. 두 대답 모두 같은 눈으로 세상을 봅니다 — 보여주기 위해 만들어진 것보다, 실제로 쓰이고 있는 것을 더 믿는 눈입니다.",
  },
};

const TYPE_PRIORITY: Record<InsightType, number> = { HIDDEN_RULE: 0, CONTEXT_SHIFT: 1, CONTRAST: 2, REINFORCEMENT: 3 };

// §10 — HIGH/MEDIUM/LOW 결정론적 규칙. LOW는 절대 화면에 노출하지
// 않는다 — computeCandidates가 LOW를 아예 후보 목록에서 제외한다.
const HIGH_THRESHOLD = 0.6;
const MEDIUM_THRESHOLD = 0.35;

function directionOf(score: number): Direction {
  return score >= 0 ? "positive" : "negative";
}

function computeConfidence(tasteAbs: number, travelAbs: number): CrossIssueConfidence {
  if (tasteAbs >= HIGH_THRESHOLD && travelAbs >= HIGH_THRESHOLD) return "HIGH";
  if ((tasteAbs >= HIGH_THRESHOLD && travelAbs >= MEDIUM_THRESHOLD) || (travelAbs >= HIGH_THRESHOLD && tasteAbs >= MEDIUM_THRESHOLD)) return "MEDIUM";
  return "LOW";
}

export function computeCrossIssueCandidates(
  tasteNormalized: Record<TasteV3AxisKey, number>,
  travelNormalized: Record<TravelAxisKey, number>,
  tasteAggregate: V3AxisAggregate,
  travelAggregate: TravelV1AxisAggregate
): { primary: CrossIssueCandidate | null; secondary: CrossIssueCandidate | null; allCandidates: CrossIssueCandidate[] } {
  const candidates: CrossIssueCandidate[] = [];

  for (const row of CROSS_ISSUE_MATRIX_META) {
    const { pairId, tasteAxis, travelAxis } = row;
    const tasteScore = tasteNormalized[tasteAxis];
    const travelScore = travelNormalized[travelAxis];
    const tasteDirection = directionOf(tasteScore);
    const travelDirection = directionOf(travelScore);
    const entry = COPY_BANK[key(pairId, tasteDirection, travelDirection)];
    if (!entry) continue; // 이 방향 조합에 대한 손글씨 카피가 없으면 후보에서 제외(§ 억지 생성 금지)

    const tasteHasEvidence = tasteAggregate[tasteAxis].evidence.length > 0;
    const travelHasEvidence = travelAggregate[travelAxis].evidence.length > 0;
    if (!tasteHasEvidence || !travelHasEvidence) continue; // §10 "evidence both sides" 요구

    const confidence = computeConfidence(Math.abs(tasteScore), Math.abs(travelScore));
    if (confidence === "LOW") continue;

    const tasteEv = [...tasteAggregate[tasteAxis].evidence].sort((a, b) => Math.abs(b.axes[tasteAxis] ?? 0) - Math.abs(a.axes[tasteAxis] ?? 0))[0];
    const travelEv = [...travelAggregate[travelAxis].evidence].sort((a, b) => Math.abs(b.axes[travelAxis] ?? 0) - Math.abs(a.axes[travelAxis] ?? 0))[0];

    candidates.push({
      pairId,
      type: entry.type,
      confidence,
      tasteAxis,
      tasteDirection,
      travelAxis,
      travelDirection,
      directEvidence: [
        ...(tasteEv ? [{ source: "taste" as const, label: tasteEv.evidenceLabel }] : []),
        ...(travelEv ? [{ source: "travel" as const, label: travelEv.evidenceLabel }] : []),
      ],
      editorialHeadline: entry.headline,
      editorialBody: entry.body,
    });
  }

  // §11 랭킹 — type priority → confidence(HIGH>MEDIUM) → 두 축 |score| 합.
  candidates.sort((a, b) => {
    if (TYPE_PRIORITY[a.type] !== TYPE_PRIORITY[b.type]) return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (a.confidence !== b.confidence) return a.confidence === "HIGH" ? -1 : 1;
    const strengthA = Math.abs(tasteNormalized[a.tasteAxis]) + Math.abs(travelNormalized[a.travelAxis]);
    const strengthB = Math.abs(tasteNormalized[b.tasteAxis]) + Math.abs(travelNormalized[b.travelAxis]);
    return strengthB - strengthA;
  });

  const primary = candidates[0] ?? null;
  // §12 — secondary는 primary와 다른 pairId, LOW가 아닌 것만.
  const secondary = candidates.find((c) => c !== primary && c.pairId !== primary?.pairId && c.confidence !== "LOW") ?? null;

  return { primary, secondary, allCandidates: candidates };
}

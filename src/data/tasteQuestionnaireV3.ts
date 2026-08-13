// TASTE QUESTIONNAIRE v3 — PRODUCT FREEZE(2026-08, 오너+GPT 확정).
//
// 이 파일의 질문 문구/선택지 문구/문항 순서/축(Primary/Secondary)은
// 오너가 전달한 PRODUCT FREEZE 문서를 그대로 옮긴 것이다 — Claude가
// 임의로 질문/선택지/순서/축을 바꾸지 않았다.
//
// 단, 각 옵션의 "실제 숫자 signal 값"은 PRODUCT FREEZE에 없다(FREEZE는
// 정성적 evidence 문구만 규정한다: 예 "patina / attachment"). 이 숫자화는
// Claude가 이번 구현 라운드에서 맡은 "정성적 스펙 → 코드 구현" 작업이며,
// 기존 v1/v2 시스템과 동일한 관례(weak=±5 / medium=±10 / strong=±15)를
// 그대로 따랐다. 정확한 값은 GPT 검토가 필요하다 — 방향(부호)은 FREEZE의
// evidence 문구에서 직접 유도했고, 크기만 Claude의 구현 판단이다.
//
// SPACE/SENSORY 축의 극성(+/-) 정의(구현 판단, FREEZE 본문에 숫자가 없어
// Claude가 방향을 고정했다):
//   SPACE+   = 개방적·정돈된·시야가 트인 공간
//   SPACE-   = 밀도 높은·손때 묻은·머문 흔적이 있는 공간
//   SENSORY+ = 질감·흔적·유기적인 것에 끌리는 감각(raw/organic)
//   SENSORY- = 정제되고 군더더기 없는 것에 끌리는 감각(refined/precise)
//   RHYTHM+  = 빠르고 즉흥적인 리듬 / RHYTHM- = 느리고 몰입하는 리듬
//   RELATION+ = 함께/공유 지향 / RELATION- = 혼자/독립 지향
//   EXPLORATION+ = 새로움 지향 / EXPLORATION- = 익숙함 지향
//   EXPRESSION+  = 밖으로 드러내는 표현 / EXPRESSION- = 조용히 소유하는 표현

export type TasteV3AxisKey = "space" | "sensory" | "rhythm" | "relation" | "exploration" | "expression";

export const TASTE_V3_AXIS_KEYS: TasteV3AxisKey[] = ["space", "sensory", "rhythm", "relation", "exploration", "expression"];

export const TASTE_V3_AXIS_LABELS: Record<TasteV3AxisKey, string> = {
  space: "SPACE",
  sensory: "SENSORY",
  rhythm: "RHYTHM",
  relation: "RELATION",
  exploration: "EXPLORATION",
  expression: "EXPRESSION",
};

export type V3AxisContribution = Partial<Record<TasteV3AxisKey, number>>;

export type TasteV3Option = {
  id: string;
  label: string;
  /** Q1/Q5/Q9/Q14/Q15의 이미지 캡션 문구(FREEZE 원문 A/B 아래 설명). */
  description?: string;
  /** FREEZE가 준 영문 evidence 라벨(예: "patina / attachment") — 내부 slug. */
  evidenceTag: string;
  /** Narrative 문장에 인용할 한국어 evidence 구절(Claude 작성, 선택 내용을 그대로 지시). */
  evidenceLabel: string;
  axes: V3AxisContribution;
  assetKey?: string;
};

export type TasteV3InteractionKind = "image-2" | "text-4" | "scenario-4";

export type TasteV3Question = {
  id: string; // "q1".."q15"
  qNumber: number;
  eyebrow: string; // "THE PLACE" 등 FREEZE의 문항 제목
  page: number;
  totalPages: number;
  kind: TasteV3InteractionKind;
  prompt: string;
  primaryAxis: TasteV3AxisKey;
  secondaryAxes: TasteV3AxisKey[];
  narrativeUse: string;
  options: TasteV3Option[];
};

export const TASTE_V3_TOTAL_PAGES = 15;

// ============================================================
// Q1 — THE PLACE
// ============================================================
export const TASTE_V3_Q1: TasteV3Question = {
  id: "q1",
  qNumber: 1,
  eyebrow: "THE PLACE",
  page: 1,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "image-2",
  prompt: "잠깐 머물 곳을 고른다면?",
  primaryAxis: "space",
  secondaryAxes: ["sensory"],
  narrativeUse: "SCENE + SPACE",
  options: [
    {
      id: "contained-lived-in",
      label: "빛이 부드럽게 들어오고,\n손때 묻은 물건들이 놓인 작은 공간",
      evidenceTag: "contained / lived-in / layered / warm familiarity",
      evidenceLabel: "빛이 부드럽게 들어오는, 손때 묻은 물건들이 놓인 작은 공간을 골랐다",
      axes: { space: -15, sensory: 10 },
    },
    {
      id: "open-ordered",
      label: "시야가 트이고,\n선과 면이 정돈된 넓은 공간",
      evidenceTag: "open / ordered / visually quiet / spatial clarity",
      evidenceLabel: "시야가 트이고 선과 면이 정돈된 넓은 공간을 골랐다",
      axes: { space: 15, sensory: -10 },
    },
  ],
};

// ============================================================
// Q2 — FIRST NOTICE
// ============================================================
export const TASTE_V3_Q2: TasteV3Question = {
  id: "q2",
  qNumber: 2,
  eyebrow: "FIRST NOTICE",
  page: 2,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "처음 들어간 공간에서\n가장 먼저 눈에 들어오는 것은?",
  primaryAxis: "sensory",
  secondaryAxes: ["space", "relation"],
  narrativeUse: "SENSORY",
  options: [
    {
      id: "light-and-color",
      label: "빛과 색",
      evidenceTag: "visual-tone sensitivity",
      evidenceLabel: "빛과 색을 가장 먼저 본다고 했다",
      axes: { sensory: 15, space: 5 },
    },
    {
      id: "furniture-layout",
      label: "가구와 물건의 배치",
      evidenceTag: "spatial-structure sensitivity",
      evidenceLabel: "가구와 물건의 배치를 가장 먼저 본다고 했다",
      axes: { sensory: 10, space: 10 },
    },
    {
      id: "material-texture",
      label: "재료와 질감",
      evidenceTag: "material-detail sensitivity",
      evidenceLabel: "재료와 질감을 가장 먼저 본다고 했다",
      axes: { sensory: 15, space: -5 },
    },
    {
      id: "people-atmosphere",
      label: "그 공간에 있는 사람들의 분위기",
      evidenceTag: "social-atmosphere sensitivity",
      evidenceLabel: "공간에 있는 사람들의 분위기를 가장 먼저 본다고 했다",
      axes: { relation: 15, sensory: 5 },
    },
  ],
};

// ============================================================
// Q3 — AN OBJECT
// ============================================================
export const TASTE_V3_Q3: TasteV3Question = {
  id: "q3",
  qNumber: 3,
  eyebrow: "AN OBJECT",
  page: 3,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "오래 곁에 둘 물건이라면\n무엇에 가장 마음이 갑니까?",
  primaryAxis: "sensory",
  secondaryAxes: ["exploration", "expression"],
  narrativeUse: "FEATURE + SENSORY",
  options: [
    {
      id: "patina",
      label: "시간이 지나며 흔적이 생기는 것",
      evidenceTag: "patina / attachment",
      evidenceLabel: "시간이 지나며 흔적이 생기는 물건에 마음이 간다고 했다",
      axes: { sensory: 15, exploration: -10, expression: -5 },
    },
    {
      id: "formal-refinement",
      label: "형태가 단정하고 완성도가 높은 것",
      evidenceTag: "formal refinement",
      evidenceLabel: "형태가 단정하고 완성도 높은 물건에 마음이 간다고 했다",
      axes: { sensory: -15, expression: 5 },
    },
    {
      id: "novelty-distinctive",
      label: "조금 낯설어 계속 눈이 가는 것",
      evidenceTag: "novelty / distinctiveness",
      evidenceLabel: "조금 낯설어 계속 눈이 가는 물건에 마음이 간다고 했다",
      axes: { exploration: 15, sensory: 5, expression: 10 },
    },
    {
      id: "practical-intimacy",
      label: "쓰임이 분명하고 손에 잘 맞는 것",
      evidenceTag: "practical intimacy",
      evidenceLabel: "쓰임이 분명하고 손에 잘 맞는 물건에 마음이 간다고 했다",
      axes: { sensory: -5, expression: -10 },
    },
  ],
};

// ============================================================
// Q4 — FREE AFTERNOON
// ============================================================
export const TASTE_V3_Q4: TasteV3Question = {
  id: "q4",
  qNumber: 4,
  eyebrow: "FREE AFTERNOON",
  page: 4,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "아무 약속도 없는 토요일 오후.\n가장 자연스러운 장면은?",
  primaryAxis: "rhythm",
  secondaryAxes: ["exploration", "relation"],
  narrativeUse: "RHYTHM & RELATION",
  options: [
    {
      id: "stay-depth",
      label: "좋아하는 장소에서 오래 머문다",
      evidenceTag: "stay / depth",
      evidenceLabel: "좋아하는 장소에서 오래 머문다고 했다",
      axes: { rhythm: -15, exploration: -10 },
    },
    {
      id: "wandering-discovery",
      label: "목적 없이 동네를 걷다가 끌리는 곳에 들어간다",
      evidenceTag: "wandering discovery",
      evidenceLabel: "목적 없이 걷다가 끌리는 곳에 들어간다고 했다",
      axes: { exploration: 15, rhythm: 5 },
    },
    {
      id: "private-immersion",
      label: "미뤄둔 영화·책·음악을 꺼낸다",
      evidenceTag: "private immersion",
      evidenceLabel: "미뤄둔 영화·책·음악을 혼자 꺼내본다고 했다",
      axes: { rhythm: -10, relation: -15 },
    },
    {
      id: "shared-activation",
      label: "누군가에게 연락해 같이 뭔가 한다",
      evidenceTag: "shared activation",
      evidenceLabel: "누군가에게 연락해 같이 뭔가 한다고 했다",
      axes: { relation: 15, rhythm: 10 },
    },
  ],
};

// ============================================================
// Q5 — DETAIL
// ============================================================
export const TASTE_V3_Q5: TasteV3Question = {
  id: "q5",
  qNumber: 5,
  eyebrow: "DETAIL",
  page: 5,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "image-2",
  prompt: "둘 중 더 오래 보고 싶은 장면은?",
  primaryAxis: "sensory",
  secondaryAxes: ["expression"],
  narrativeUse: "SENSORY + INTERESTING PART",
  options: [
    {
      id: "human-trace",
      label: "완벽하게 정리되지는 않았지만\n사람의 흔적이 남아 있는 장면",
      evidenceTag: "human trace / imperfection tolerance",
      evidenceLabel: "완벽히 정리되진 않았지만 사람의 흔적이 남은 장면을 더 오래 보고 싶다고 했다",
      axes: { sensory: 15, expression: -5 },
    },
    {
      id: "precision-restraint",
      label: "불필요한 것이 거의 없고\n선과 비율이 정확한 장면",
      evidenceTag: "precision / visual restraint",
      evidenceLabel: "불필요한 것이 없고 선과 비율이 정확한 장면을 더 오래 보고 싶다고 했다",
      axes: { sensory: -15, expression: 5 },
    },
  ],
};

// ============================================================
// Q6 — SOMETHING GOOD
// ============================================================
export const TASTE_V3_Q6: TasteV3Question = {
  id: "q6",
  qNumber: 6,
  eyebrow: "SOMETHING GOOD",
  page: 6,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "정말 마음에 드는 곳이나 물건을 발견했습니다.\n그다음 행동에 가장 가까운 것은?",
  primaryAxis: "relation",
  secondaryAxes: ["expression"],
  narrativeUse: "RELATION + EXPRESSION",
  options: [
    {
      id: "active-sharing",
      label: "사진이나 링크를 바로 누군가에게 보낸다",
      evidenceTag: "active sharing",
      evidenceLabel: "사진이나 링크를 바로 누군가에게 보낸다고 했다",
      axes: { relation: 15, expression: 15 },
    },
    {
      id: "selective-sharing",
      label: "몇 명에게만 조용히 알려준다",
      evidenceTag: "selective sharing",
      evidenceLabel: "몇 명에게만 조용히 알려준다고 했다",
      axes: { relation: 5, expression: 5 },
    },
    {
      id: "private-possession",
      label: "일단 나만 알고 다시 찾아간다",
      evidenceTag: "private possession",
      evidenceLabel: "일단 나만 알고 다시 찾아간다고 했다",
      axes: { relation: -15, expression: -15 },
    },
    {
      id: "archival-expression",
      label: "어디엔가 저장하거나 기록해둔다",
      evidenceTag: "archival expression",
      evidenceLabel: "어디엔가 저장하거나 기록해둔다고 했다",
      axes: { expression: 10, relation: -5 },
    },
  ],
};

// ============================================================
// Q7 — NEW PLACE
// ============================================================
export const TASTE_V3_Q7: TasteV3Question = {
  id: "q7",
  qNumber: 7,
  eyebrow: "NEW PLACE",
  page: 7,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "처음 가는 동네에서 한 시간이 남았습니다.",
  primaryAxis: "exploration",
  secondaryAxes: ["rhythm"],
  narrativeUse: "EXPLORATION",
  options: [
    {
      id: "curated-familiarity",
      label: "미리 저장해둔 곳으로 간다",
      evidenceTag: "curated familiarity",
      evidenceLabel: "미리 저장해둔 곳으로 간다고 했다",
      axes: { exploration: -15, rhythm: 5 },
    },
    {
      id: "researched-exploration",
      label: "평이 좋은 곳 몇 군데를 비교해 고른다",
      evidenceTag: "researched exploration",
      evidenceLabel: "평이 좋은 곳 몇 군데를 비교해 고른다고 했다",
      axes: { exploration: 5, rhythm: -15 },
    },
    {
      id: "intuitive-discovery",
      label: "걷다가 눈에 들어오는 곳으로 들어간다",
      evidenceTag: "intuitive discovery",
      evidenceLabel: "걷다가 눈에 들어오는 곳으로 들어간다고 했다",
      axes: { exploration: 15, rhythm: 10 },
    },
    {
      id: "deliberate-novelty",
      label: "일부러 평소라면 안 갈 것 같은 곳을 골라본다",
      evidenceTag: "deliberate novelty",
      evidenceLabel: "일부러 평소라면 안 갈 것 같은 곳을 골라본다고 했다",
      axes: { exploration: 15, rhythm: -5 },
    },
  ],
};

// ============================================================
// Q8 — CHOOSING WELL
// FREEZE가 PRIMARY를 EXPLORATION으로 명시했다(evidence 문구만 보면
// RHYTHM이 더 자연스러워 보이지만, §23 지시대로 FREEZE 축 배정을 임의로
// 바꾸지 않고 그대로 구현했다 — 최종 보고 P/Q에 그대로 남긴다).
// ============================================================
export const TASTE_V3_Q8: TasteV3Question = {
  id: "q8",
  qNumber: 8,
  eyebrow: "CHOOSING WELL",
  page: 8,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "마음에 드는 물건을 발견했을 때\n구매하기 전 당신에게 더 가까운 모습은?",
  primaryAxis: "exploration",
  secondaryAxes: ["rhythm"],
  narrativeUse: "EXPLORATION + INTERESTING PART",
  options: [
    {
      id: "fast-commitment",
      label: "마음에 들면 비교적 빨리 결정한다",
      evidenceTag: "fast commitment",
      evidenceLabel: "마음에 들면 비교적 빨리 결정한다고 했다",
      axes: { rhythm: 15, exploration: 5 },
    },
    {
      id: "comparative-search",
      label: "비슷한 것들을 몇 개 더 찾아본다",
      evidenceTag: "comparative search",
      evidenceLabel: "비슷한 것들을 몇 개 더 찾아본다고 했다",
      axes: { rhythm: -10, exploration: 10 },
    },
    {
      id: "slow-desire-validation",
      label: "며칠 두고 계속 생각나는지 본다",
      evidenceTag: "slow desire validation",
      evidenceLabel: "며칠을 두고 계속 생각나는지 본다고 했다",
      axes: { rhythm: -15, exploration: -5 },
    },
    {
      id: "selective-differentiation",
      label: "지금 가진 것과 정말 다른지 따져본다",
      evidenceTag: "selective differentiation",
      evidenceLabel: "지금 가진 것과 정말 다른지 따져본다고 했다",
      axes: { exploration: 15, rhythm: -10 },
    },
  ],
};

// ============================================================
// Q9 — YOUR TABLE
// ============================================================
export const TASTE_V3_Q9: TasteV3Question = {
  id: "q9",
  qNumber: 9,
  eyebrow: "YOUR TABLE",
  page: 9,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "image-2",
  prompt: "내가 자주 쓰는 테이블이라면\n어느 쪽이 더 편합니까?",
  primaryAxis: "space",
  secondaryAxes: ["expression"],
  narrativeUse: "SPACE + EXPRESSION",
  options: [
    {
      id: "visible-life",
      label: "지금 쓰는 것들이 어느 정도 보이는 테이블",
      evidenceTag: "visible life / accessible layers",
      evidenceLabel: "지금 쓰는 것들이 어느 정도 보이는 테이블이 편하다고 했다",
      axes: { space: -15, expression: 10 },
    },
    {
      id: "controlled-field",
      label: "사용하지 않는 것은 대부분 치워진 테이블",
      evidenceTag: "controlled field / reduced noise",
      evidenceLabel: "쓰지 않는 것은 대부분 치워진 테이블이 편하다고 했다",
      axes: { space: 15, expression: -10 },
    },
  ],
};

// ============================================================
// Q10 — A GOOD DAY
// ============================================================
export const TASTE_V3_Q10: TasteV3Question = {
  id: "q10",
  qNumber: 10,
  eyebrow: "A GOOD DAY",
  page: 10,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "하루를 잘 보냈다고 느끼게 하는 것은?",
  primaryAxis: "rhythm",
  secondaryAxes: ["exploration", "relation"],
  narrativeUse: "RHYTHM & RELATION",
  options: [
    {
      id: "completion-rhythm",
      label: "계획했던 일을 거의 해냈을 때",
      evidenceTag: "completion rhythm",
      evidenceLabel: "계획했던 일을 거의 해냈을 때 하루를 잘 보냈다고 느낀다고 했다",
      axes: { rhythm: 15, exploration: -5 },
    },
    {
      id: "serendipity",
      label: "예상하지 못한 좋은 장면을 만났을 때",
      evidenceTag: "serendipity",
      evidenceLabel: "예상하지 못한 좋은 장면을 만났을 때 하루를 잘 보냈다고 느낀다고 했다",
      axes: { exploration: 15, rhythm: 5 },
    },
    {
      id: "depth-rhythm",
      label: "한 가지를 충분히 오래 즐겼을 때",
      evidenceTag: "depth rhythm",
      evidenceLabel: "한 가지를 충분히 오래 즐겼을 때 하루를 잘 보냈다고 느낀다고 했다",
      axes: { rhythm: -15, exploration: -10 },
    },
    {
      id: "relational-fulfilment",
      label: "좋아하는 사람과 좋은 시간을 보냈을 때",
      evidenceTag: "relational fulfilment",
      evidenceLabel: "좋아하는 사람과 좋은 시간을 보냈을 때 하루를 잘 보냈다고 느낀다고 했다",
      axes: { relation: 15, rhythm: -5 },
    },
  ],
};

// ============================================================
// Q11 — YOUR TASTE, VISIBLE
// ============================================================
export const TASTE_V3_Q11: TasteV3Question = {
  id: "q11",
  qNumber: 11,
  eyebrow: "YOUR TASTE, VISIBLE",
  page: 11,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "당신의 취향은 보통 어디에서 가장 잘 드러납니까?",
  primaryAxis: "expression",
  secondaryAxes: ["space"],
  narrativeUse: "EXPRESSION",
  options: [
    {
      id: "wearable-expression",
      label: "옷과 내가 들고 다니는 것",
      evidenceTag: "wearable expression",
      evidenceLabel: "취향이 옷과 소지품에서 가장 잘 드러난다고 했다",
      axes: { expression: 15 },
    },
    {
      id: "environmental-expression",
      label: "집이나 책상 같은 공간",
      evidenceTag: "environmental expression",
      evidenceLabel: "취향이 집이나 책상 같은 공간에서 가장 잘 드러난다고 했다",
      axes: { expression: 10, space: -10 },
    },
    {
      id: "archival-expression-taste",
      label: "사진·메모·저장 목록 같은 기록",
      evidenceTag: "archival expression",
      evidenceLabel: "취향이 사진·메모·저장 목록 같은 기록에서 가장 잘 드러난다고 했다",
      axes: { expression: 10 },
    },
    {
      id: "private-taste",
      label: "겉으로는 생각보다 잘 드러나지 않는다",
      evidenceTag: "private taste",
      evidenceLabel: "취향이 겉으로는 생각보다 잘 드러나지 않는다고 했다",
      axes: { expression: -15 },
    },
  ],
};

// ============================================================
// Q12 — WITH SOMEONE
// ============================================================
export const TASTE_V3_Q12: TasteV3Question = {
  id: "q12",
  qNumber: 12,
  eyebrow: "WITH SOMEONE",
  page: 12,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "scenario-4",
  prompt: "누군가와 하루를 함께 보낼 때\n더 편한 방식은?",
  primaryAxis: "relation",
  secondaryAxes: ["rhythm"],
  narrativeUse: "RELATION + RHYTHM",
  options: [
    {
      id: "coordinated-relation",
      label: "어디 갈지 어느 정도 정해두는 편",
      evidenceTag: "coordinated relation",
      evidenceLabel: "어디 갈지 어느 정도 정해두는 편이 편하다고 했다",
      axes: { relation: 10, rhythm: -10 },
    },
    {
      id: "loose-coordination",
      label: "한두 곳만 정하고 나머지는 그때 결정",
      evidenceTag: "loose coordination",
      evidenceLabel: "한두 곳만 정하고 나머지는 그때 결정하는 편이 편하다고 했다",
      axes: { relation: 10, rhythm: 5 },
    },
    {
      id: "shared-spontaneity",
      label: "만나서 기분 따라 움직이는 편",
      evidenceTag: "shared spontaneity",
      evidenceLabel: "만나서 기분 따라 움직이는 편이 편하다고 했다",
      axes: { relation: 15, rhythm: 15 },
    },
    {
      id: "parallel-intimacy",
      label: "같이 있어도 각자 하고 싶은 시간을 조금 갖는 편",
      evidenceTag: "parallel intimacy / autonomy",
      evidenceLabel: "같이 있어도 각자 하고 싶은 시간을 조금 갖는 편이 편하다고 했다",
      axes: { relation: 5 },
    },
  ],
};

// ============================================================
// Q13 — WHEN EVERYONE LIKES IT
// ============================================================
export const TASTE_V3_Q13: TasteV3Question = {
  id: "q13",
  qNumber: 13,
  eyebrow: "WHEN EVERYONE LIKES IT",
  page: 13,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "text-4",
  prompt: "내가 좋아하던 것이 갑자기 아주 유명해졌습니다.",
  primaryAxis: "expression",
  secondaryAxes: ["exploration"],
  narrativeUse: "EXPRESSION + INTERESTING PART",
  options: [
    {
      id: "shared-validation",
      label: "사람들이 알아보는 게 반갑다",
      evidenceTag: "shared validation",
      evidenceLabel: "사람들이 알아보는 게 반갑다고 했다",
      axes: { expression: 15 },
    },
    {
      id: "distinctiveness-sensitivity",
      label: "좋긴 하지만 조금 흥미가 줄어든다",
      evidenceTag: "distinctiveness sensitivity",
      evidenceLabel: "좋긴 하지만 조금 흥미가 줄어든다고 했다",
      axes: { expression: -10, exploration: 5 },
    },
    {
      id: "internally-anchored",
      label: "유명해졌는지는 별로 중요하지 않다",
      evidenceTag: "internally anchored preference",
      evidenceLabel: "유명해졌는지는 별로 중요하지 않다고 했다",
      axes: { expression: -5, exploration: -5 },
    },
    {
      id: "novelty-migration",
      label: "다른 새로운 것을 다시 찾아보고 싶어진다",
      evidenceTag: "novelty migration",
      evidenceLabel: "다른 새로운 것을 다시 찾아보고 싶어진다고 했다",
      axes: { exploration: 15, expression: -5 },
    },
  ],
};

// ============================================================
// Q14 — KEEP OR CHANGE
// ============================================================
export const TASTE_V3_Q14: TasteV3Question = {
  id: "q14",
  qNumber: 14,
  eyebrow: "KEEP OR CHANGE",
  page: 14,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "image-2",
  prompt: "오래 좋아해온 장소가 있습니다.\n어느 변화가 더 마음에 듭니까?",
  primaryAxis: "space",
  secondaryAxes: ["exploration"],
  narrativeUse: "SPACE × EXPLORATION RELATIONSHIP",
  options: [
    {
      id: "continuity-with-evolution",
      label: "익숙한 분위기는 남겨두고\n조금씩 달라지는 것",
      evidenceTag: "continuity with evolution",
      evidenceLabel: "익숙한 분위기는 남겨두고 조금씩 달라지는 쪽이 더 마음에 든다고 했다",
      axes: { space: -10, exploration: 5 },
    },
    {
      id: "transformation-appetite",
      label: "전혀 다른 모습으로\n새롭게 바뀌는 것",
      evidenceTag: "transformation appetite",
      evidenceLabel: "전혀 다른 모습으로 새롭게 바뀌는 쪽이 더 마음에 든다고 했다",
      axes: { exploration: 15, space: 5 },
    },
  ],
};

// ============================================================
// Q15 — YOUR DAY (기존 PAGE06 실사 이미지 재사용, FREEZE 명시)
// ============================================================
export const TASTE_V3_Q15: TasteV3Question = {
  id: "q15",
  qNumber: 15,
  eyebrow: "YOUR DAY",
  page: 15,
  totalPages: TASTE_V3_TOTAL_PAGES,
  kind: "image-2",
  prompt: "하루가 조금 비었습니다.\n지금 더 끌리는 쪽은?",
  primaryAxis: "exploration",
  secondaryAxes: ["space", "rhythm"],
  narrativeUse: "ENDING + EXPLORATION",
  options: [
    {
      id: "back-to-my-place",
      label: "BACK TO MY PLACE",
      description: "익숙한 곳으로 돌아가\n내 방식대로 시간을 보낸다.",
      evidenceTag: "restorative familiarity",
      evidenceLabel: "익숙한 곳으로 돌아가 내 방식대로 시간을 보내는 쪽을 골랐다",
      axes: { exploration: -15, space: -10, rhythm: -5 },
      assetKey: "quiz.taste.q06.a",
    },
    {
      id: "somewhere-new",
      label: "SOMEWHERE NEW",
      description: "아직 모르는 곳으로 가서\n새로운 장면을 하나 만든다.",
      evidenceTag: "experiential novelty",
      evidenceLabel: "아직 모르는 곳으로 가서 새로운 장면을 만드는 쪽을 골랐다",
      axes: { exploration: 15, space: 10, rhythm: 5 },
      assetKey: "quiz.taste.q06.b",
    },
  ],
};

export const TASTE_QUESTIONS_V3: TasteV3Question[] = [
  TASTE_V3_Q1,
  TASTE_V3_Q2,
  TASTE_V3_Q3,
  TASTE_V3_Q4,
  TASTE_V3_Q5,
  TASTE_V3_Q6,
  TASTE_V3_Q7,
  TASTE_V3_Q8,
  TASTE_V3_Q9,
  TASTE_V3_Q10,
  TASTE_V3_Q11,
  TASTE_V3_Q12,
  TASTE_V3_Q13,
  TASTE_V3_Q14,
  TASTE_V3_Q15,
];

export type TasteV3RawAnswers = Record<string, string>; // questionId -> selected optionId

// ============================================================
// §13 REQUIRED — 5개 공식 mock profile. 각 답변은 FREEZE의 프로필
// 설명(예: "익숙한 공간 / 디테일 민감 / 혼자 몰입 / 선택적 공유 /
// 느린 선택 / private expression")과 일치하도록 Claude가 골랐다.
// ============================================================
export type TasteV3MockProfile = { id: string; label: string; description: string; answers: TasteV3RawAnswers };

export const TASTE_V3_MOCK_PROFILES: TasteV3MockProfile[] = [
  {
    id: "p1-quiet-curator",
    label: "P1 — QUIET CURATOR",
    description: "익숙한 공간 / 디테일 민감 / 혼자 몰입 / 선택적 공유 / 느린 선택 / private expression",
    answers: {
      q1: "contained-lived-in",
      q2: "material-texture",
      q3: "patina",
      q4: "private-immersion",
      q5: "human-trace",
      q6: "selective-sharing",
      q7: "curated-familiarity",
      q8: "slow-desire-validation",
      q9: "visible-life",
      q10: "depth-rhythm",
      q11: "private-taste",
      q12: "parallel-intimacy",
      q13: "internally-anchored",
      q14: "continuity-with-evolution",
      q15: "back-to-my-place",
    },
  },
  {
    id: "p2-social-explorer",
    label: "P2 — SOCIAL EXPLORER",
    description: "열린 공간 / 사람 분위기 / 즉흥 탐색 / 적극 공유 / 빠른 선택 / visible expression",
    answers: {
      q1: "open-ordered",
      q2: "people-atmosphere",
      q3: "novelty-distinctive",
      q4: "shared-activation",
      q5: "human-trace",
      q6: "active-sharing",
      q7: "intuitive-discovery",
      q8: "fast-commitment",
      q9: "visible-life",
      q10: "serendipity",
      q11: "wearable-expression",
      q12: "shared-spontaneity",
      q13: "shared-validation",
      q14: "transformation-appetite",
      q15: "somewhere-new",
    },
  },
  {
    id: "p3-structured-minimalist",
    label: "P3 — STRUCTURED MINIMALIST",
    description: "정돈 공간 / 배치 우선 / 계획적 리듬 / 비교 후 선택 / 내적 기준 강함",
    answers: {
      q1: "open-ordered",
      q2: "furniture-layout",
      q3: "formal-refinement",
      q4: "stay-depth",
      q5: "precision-restraint",
      q6: "archival-expression",
      q7: "curated-familiarity",
      q8: "comparative-search",
      q9: "controlled-field",
      q10: "completion-rhythm",
      q11: "private-taste",
      q12: "coordinated-relation",
      q13: "internally-anchored",
      q14: "continuity-with-evolution",
      q15: "back-to-my-place",
    },
  },
  {
    id: "p4-private-discoverer",
    label: "P4 — PRIVATE DISCOVERER",
    description: "새로운 장소 적극 탐색 / 감각 민감 / 공유 적음 / 기록형 표현 / 선택은 신중",
    answers: {
      q1: "contained-lived-in",
      q2: "material-texture",
      q3: "novelty-distinctive",
      q4: "wandering-discovery",
      q5: "human-trace",
      q6: "archival-expression",
      q7: "deliberate-novelty",
      q8: "slow-desire-validation",
      q9: "visible-life",
      q10: "serendipity",
      q11: "archival-expression-taste",
      q12: "parallel-intimacy",
      q13: "novelty-migration",
      q14: "transformation-appetite",
      q15: "somewhere-new",
    },
  },
  {
    id: "p5-warm-regular",
    label: "P5 — WARM REGULAR",
    description: "익숙한 장소 / 사람의 흔적 / 관계 중심 / 오래 머무름 / 새로움보다 continuity",
    answers: {
      q1: "contained-lived-in",
      q2: "people-atmosphere",
      q3: "patina",
      q4: "stay-depth",
      q5: "human-trace",
      q6: "selective-sharing",
      q7: "curated-familiarity",
      q8: "slow-desire-validation",
      q9: "visible-life",
      q10: "relational-fulfilment",
      q11: "environmental-expression",
      q12: "coordinated-relation",
      q13: "internally-anchored",
      q14: "continuity-with-evolution",
      q15: "back-to-my-place",
    },
  },
];

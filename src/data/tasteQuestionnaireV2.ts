// TASTE QUESTIONNAIRE v2(2026-08) — GPT가 확정한 v2 Spec 구현.
//
// v1(src/data/tasteQuestionnaire.ts)은 삭제하지 않고 dev 비교용으로
// 그대로 둔다 — 이 파일은 v1과 나란히 존재하는 별도 버전이다.
//
// PAGE 01(SCENE)/PAGE 04(INSTINCT)는 v1과 동일한 문구·signal을 그대로
// 재사용한다("기존 질문/선택지/signal 그대로 유지" 지시). PAGE 02/03/06은
// 문구가 바뀌었지만, 각 선택지가 가리키는 의미(그리고 그에 따른 signal
// 값)는 v1의 대응 옵션과 동일하게 유지했다 — v1_SIGNAL_SOURCES/
// TASTE_QUESTIONS_V1의 기존 옵션에서 signals를 그대로 가져왔을 뿐 새
// 값을 만들지 않았다. PAGE 05는 heading/helper 문구만 v2 확정 문구로
// 바뀌고 4개 cut 구조/signal은 v1과 동일하다.

import { Q1_SIGNAL_SOURCES, type PageSectionKey } from "./tasteAnalysis";
import {
  TASTE_V1_PAGE_02_WHAT_MATTERS,
  TASTE_V1_PAGE_03_KEEP,
  TASTE_V1_PAGE_04_INSTINCT,
  TASTE_V1_PAGE_05_QUICK_CUTS,
  TASTE_V1_PAGE_06_YOUR_DAY,
  type MultiSelectQuestion,
  type PriorityChoiceQuestion,
  type QuickCutsQuestion,
  type SceneChoiceQuestion,
  type SignatureChoiceQuestion,
  type SituationChoiceQuestion,
  type TasteQuestion,
  type TasteRawAnswer,
  type TasteRawAnswers,
} from "./tasteQuestionnaire";

// ============================================================
// 0. VERSION / METADATA
// ============================================================
export const TASTE_QUESTIONNAIRE_V2_VERSION = "v2";

export const TASTE_QUESTIONNAIRE_V2_METADATA = {
  id: "taste",
  version: TASTE_QUESTIONNAIRE_V2_VERSION,
  estimatedMinutes: 2,
  pages: 6,
};

export const TASTE_V2_PAGE_SECTION_MAP: Record<number, PageSectionKey> = {
  1: "place",
  2: "place",
  3: "object",
  4: "object",
  5: "detail",
  6: "ritual",
};

// ============================================================
// PAGE 01 — SCENE. "기존 실제 이미지 2장과 기존 signal mapping 유지"
// — v1 PAGE 01과 완전히 동일(문구·이미지·signal 전부 재사용).
// ============================================================
export const TASTE_V2_PAGE_01_SCENE: SceneChoiceQuestion = {
  kind: "scene-choice",
  id: "scene",
  page: 1,
  totalPages: TASTE_QUESTIONNAIRE_V2_METADATA.pages,
  section: TASTE_V2_PAGE_SECTION_MAP[1],
  prompt: "쉬는 오후,\n더 마음이 가는 장면은?",
  helper: "생각하기보다 먼저 마음이 가는 쪽.",
  options: [
    {
      id: "window-afternoon",
      label: "창가에 앉아\n책이나 커피와 시간을 보내는 오후",
      assetKey: "quiz.taste.q01.a",
      signals: Q1_SIGNAL_SOURCES.cafe.signals,
    },
    {
      id: "city-evening",
      label: "사람과 불빛이 있는\n도시의 저녁을 즐기는 시간",
      assetKey: "quiz.taste.q01.b",
      signals: Q1_SIGNAL_SOURCES.city.signals,
    },
  ],
};

// ============================================================
// PAGE 02 — FIRST THING(priority-choice). v1 WHAT MATTERS의 4개
// 옵션과 1:1 대응 — signal은 그대로, 문구만 v2 확정 문구.
//   빛 → light-mood
//   작은 것들 → objects-detail
//   사람과 소리 → people-sound
//   자리 → structure-use
// ============================================================
const V1_WHAT_MATTERS_BY_ID = Object.fromEntries(TASTE_V1_PAGE_02_WHAT_MATTERS.options.map((o) => [o.id, o]));

export const TASTE_V2_PAGE_02_FIRST_THING: PriorityChoiceQuestion = {
  kind: "priority-choice",
  id: "first-thing",
  page: 2,
  totalPages: TASTE_QUESTIONNAIRE_V2_METADATA.pages,
  section: TASTE_V2_PAGE_SECTION_MAP[2],
  prompt: "처음 가본 공간.\n나도 모르게 먼저 보게 되는 건?",
  options: [
    {
      id: "light",
      label: "빛",
      description: "창으로 들어오는 빛, 조명의 온도",
      signals: V1_WHAT_MATTERS_BY_ID["light-mood"].signals,
      semanticTags: V1_WHAT_MATTERS_BY_ID["light-mood"].semanticTags,
    },
    {
      id: "small-things",
      label: "작은 것들",
      description: "가구, 컵, 포스터, 책 같은 디테일",
      signals: V1_WHAT_MATTERS_BY_ID["objects-detail"].signals,
    },
    {
      id: "people-sound",
      label: "사람과 소리",
      description: "누가 있고 어떤 소리가 흐르는지",
      signals: V1_WHAT_MATTERS_BY_ID["people-sound"].signals,
    },
    {
      id: "seat",
      label: "자리",
      description: "어디에 앉고 어떻게 머물 수 있는지",
      signals: V1_WHAT_MATTERS_BY_ID["structure-use"].signals,
    },
  ],
};

// ============================================================
// PAGE 03 — KEEP TWO(multi-select, 정확히 2개). v1 KEEP의 6개
// 옵션과 1:1 대응 — signal은 그대로, 문구만 v2 확정 문구.
//   오래 봐도 질리지 않는 것 → timeless
//   남들과 조금 다른 것 → different
//   실제로 자주 쓰게 되는 것 → functional
//   이야기가 생기는 것 → storied
//   첫눈에 마음이 가는 것 → instant-pull
//   작은 부분까지 잘 만든 것 → well-made
// ============================================================
const V1_KEEP_BY_ID = Object.fromEntries(TASTE_V1_PAGE_03_KEEP.options.map((o) => [o.id, o]));

export const TASTE_V2_PAGE_03_KEEP_TWO: MultiSelectQuestion = {
  kind: "multi-select",
  id: "keep-two",
  page: 3,
  totalPages: TASTE_QUESTIONNAIRE_V2_METADATA.pages,
  section: TASTE_V2_PAGE_SECTION_MAP[3],
  prompt: "결국 내 곁에 남는 건\n대체로 이런 것들입니다.\n\n두 가지만 골라본다면?",
  minSelect: 2,
  maxSelect: 2,
  options: [
    { id: "timeless", label: "오래 봐도 질리지 않는 것", signals: V1_KEEP_BY_ID["timeless"].signals },
    { id: "different", label: "남들과 조금 다른 것", signals: V1_KEEP_BY_ID["different"].signals },
    { id: "frequently-used", label: "실제로 자주 쓰게 되는 것", signals: V1_KEEP_BY_ID["functional"].signals },
    { id: "storied", label: "이야기가 생기는 것", signals: V1_KEEP_BY_ID["storied"].signals },
    { id: "first-glance", label: "첫눈에 마음이 가는 것", signals: V1_KEEP_BY_ID["instant-pull"].signals },
    { id: "well-made", label: "작은 부분까지 잘 만든 것", signals: V1_KEEP_BY_ID["well-made"].signals },
  ],
};

// ============================================================
// PAGE 04 — INSTINCT. "기존 질문/선택지/signal 그대로 유지" — v1과
// 완전히 동일.
// ============================================================
export const TASTE_V2_PAGE_04_INSTINCT: SituationChoiceQuestion = {
  ...TASTE_V1_PAGE_04_INSTINCT,
  id: "instinct", // v1과 동일 id(질문 자체가 동일하므로 유지)
};

// ============================================================
// PAGE 05 — QUICK CUTS. heading/helper만 v2 확정 문구, cut 구조/signal
// 은 v1과 동일.
// ============================================================
export const TASTE_V2_PAGE_05_QUICK_CUTS: QuickCutsQuestion = {
  ...TASTE_V1_PAGE_05_QUICK_CUTS,
  id: "quick-cuts",
  prompt: "A FEW QUICK THINGS",
  helper: "생각하지 말고,\n지금 조금 더 가까운 쪽.",
};

// ============================================================
// PAGE 06 — LAST SCENE(signature-choice). closing line은 GPT가 준
// 문구를 description 안에 그대로 이어붙인다(별도 타입 추가 없이 기존
// TasteQuestionOption.description을 그대로 쓴다 — description은 이미
// whitespace-pre-line으로 렌더링되므로 줄바꿈이 그대로 보존된다).
// signal은 v1 familiar-day/discover-day를 그대로 재사용.
// 실제 이미지는 아직 없어 v1과 동일하게 neutral placeholder를 쓴다
// (assetKey 없음).
// ============================================================
const V1_YOUR_DAY_BY_ID = Object.fromEntries(TASTE_V1_PAGE_06_YOUR_DAY.options.map((o) => [o.id, o]));

export const TASTE_V2_PAGE_06_LAST_SCENE: SignatureChoiceQuestion = {
  kind: "signature-choice",
  id: "last-scene",
  page: 6,
  totalPages: TASTE_QUESTIONNAIRE_V2_METADATA.pages,
  section: TASTE_V2_PAGE_SECTION_MAP[6],
  prompt: "마지막으로 한 장면만 고른다면.\n오늘 더 살아보고 싶은 하루는?",
  options: [
    {
      id: "back-to-my-place",
      label: "BACK TO MY PLACE",
      description:
        "좋아하는 동네.\n이미 알고 있는 카페.\n늘 걷던 길.\n\n그런데 이상하게\n오늘도 좋을 것 같은 하루.\n\n좋아하는 것을 다시 좋아하는 하루.",
      signals: V1_YOUR_DAY_BY_ID["familiar-day"].signals,
    },
    {
      id: "somewhere-new",
      label: "SOMEWHERE NEW",
      description:
        "처음 가보는 동네.\n저장만 해두었던 장소.\n\n걷다가 계획에 없던 곳에\n들어가 보는 하루.\n\n아직 모르는 것을 발견하는 하루.",
      signals: V1_YOUR_DAY_BY_ID["discover-day"].signals,
    },
  ],
};

export const TASTE_QUESTIONS_V2: TasteQuestion[] = [
  TASTE_V2_PAGE_01_SCENE,
  TASTE_V2_PAGE_02_FIRST_THING,
  TASTE_V2_PAGE_03_KEEP_TWO,
  TASTE_V2_PAGE_04_INSTINCT,
  TASTE_V2_PAGE_05_QUICK_CUTS,
  TASTE_V2_PAGE_06_LAST_SCENE,
];

// ============================================================
// VALIDATION FIXTURES — v1의 5개 reference profile과 동일한 signal
// 조합이 나오도록, v2 옵션 id로 다시 표현한 것(비교 목적).
// ============================================================
export type TasteV2MockProfile = {
  id: string;
  label: string;
  description: string;
  answers: TasteRawAnswers;
};

function rawAnswer(question: TasteQuestion, selectedOptionIds: string[]): TasteRawAnswer {
  return { questionId: question.id, interactionType: question.kind, selectedOptionIds };
}

export const TASTE_V2_MOCK_PROFILES: TasteV2MockProfile[] = [
  {
    id: "quiet-curator",
    label: "QUIET CURATOR",
    description: "v1 QUIET CURATOR와 동일 signal 조합(v2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V2_PAGE_01_SCENE, ["window-afternoon"]),
      "first-thing": rawAnswer(TASTE_V2_PAGE_02_FIRST_THING, ["small-things"]),
      "keep-two": rawAnswer(TASTE_V2_PAGE_03_KEEP_TWO, ["timeless", "well-made"]),
      instinct: rawAnswer(TASTE_V2_PAGE_04_INSTINCT, ["wait-days"]),
      "quick-cuts": rawAnswer(TASTE_V2_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "mood-matters"]),
      "last-scene": rawAnswer(TASTE_V2_PAGE_06_LAST_SCENE, ["back-to-my-place"]),
    },
  },
  {
    id: "urban-explorer",
    label: "URBAN EXPLORER",
    description: "v1 URBAN EXPLORER와 동일 signal 조합(v2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V2_PAGE_01_SCENE, ["city-evening"]),
      "first-thing": rawAnswer(TASTE_V2_PAGE_02_FIRST_THING, ["people-sound"]),
      "keep-two": rawAnswer(TASTE_V2_PAGE_03_KEEP_TWO, ["different", "first-glance"]),
      instinct: rawAnswer(TASTE_V2_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V2_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V2_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
  {
    id: "practical-editor",
    label: "PRACTICAL EDITOR",
    description: "v1 PRACTICAL EDITOR와 동일 signal 조합(v2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V2_PAGE_01_SCENE, ["window-afternoon"]),
      "first-thing": rawAnswer(TASTE_V2_PAGE_02_FIRST_THING, ["seat"]),
      "keep-two": rawAnswer(TASTE_V2_PAGE_03_KEEP_TWO, ["frequently-used", "timeless"]),
      instinct: rawAnswer(TASTE_V2_PAGE_04_INSTINCT, ["budget-limit"]),
      "quick-cuts": rawAnswer(TASTE_V2_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V2_PAGE_06_LAST_SCENE, ["back-to-my-place"]),
    },
  },
  {
    id: "quiet-explorer",
    label: "QUIET EXPLORER",
    description: "v1 QUIET EXPLORER와 동일 signal 조합(v2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V2_PAGE_01_SCENE, ["window-afternoon"]),
      "first-thing": rawAnswer(TASTE_V2_PAGE_02_FIRST_THING, ["light"]),
      "keep-two": rawAnswer(TASTE_V2_PAGE_03_KEEP_TWO, ["different", "storied"]),
      instinct: rawAnswer(TASTE_V2_PAGE_04_INSTINCT, ["compare"]),
      "quick-cuts": rawAnswer(TASTE_V2_PAGE_05_QUICK_CUTS, ["new-place", "keep-long", "keep-private", "mood-matters"]),
      "last-scene": rawAnswer(TASTE_V2_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
  {
    id: "contradiction",
    label: "CONTRADICTION",
    description: "v1 CONTRADICTION과 동일 signal 조합(v2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V2_PAGE_01_SCENE, ["window-afternoon"]),
      "first-thing": rawAnswer(TASTE_V2_PAGE_02_FIRST_THING, ["people-sound"]),
      "keep-two": rawAnswer(TASTE_V2_PAGE_03_KEEP_TWO, ["different", "first-glance"]),
      instinct: rawAnswer(TASTE_V2_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V2_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V2_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
];

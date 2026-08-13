// TASTE QUESTIONNAIRE v2.2(2026-08) — GPT가 20-user stress test에서 확인한
// v2의 두 가지 문제(PAGE 02 분석력 부족, PAGE 03 positive-choice/Barnum
// 위험)를 정밀 보정한 버전. v1/v2는 삭제하지 않고 dev 비교용으로 그대로
// 둔다 — 이 파일은 v1/v2와 나란히 존재하는 별도 버전이다.
//
// PAGE 01(SCENE)/04(INSTINCT)/05(QUICK CUTS)/06(LAST SCENE)는 v2와 완전히
// 동일하다(변경 금지 지시) — v2 데이터를 그대로 재export한다.
// PAGE 02(FIRST NOTICE)는 문구만 바뀌고, 각 선택지가 가리키는 의미는
// v2 PAGE 02(FIRST THING)의 대응 옵션에서 signals를 그대로 가져왔다.
// PAGE 03(TRADE-OFF)은 interaction 자체가 KEEP TWO(정확히 2개 선택)에서
// A/B 중 하나를 고르는 pair 3개로 바뀌었지만, 6개 옵션 각각의 signals는
// v1 KEEP(PAGE 03)의 대응 옵션에서 그대로 가져왔다 — 새 숫자를 만들지
// 않았다.

import type { PageSectionKey } from "./tasteAnalysis";
import {
  TASTE_V2_PAGE_01_SCENE,
  TASTE_V2_PAGE_04_INSTINCT,
  TASTE_V2_PAGE_05_QUICK_CUTS,
  TASTE_V2_PAGE_06_LAST_SCENE,
  TASTE_V2_PAGE_SECTION_MAP,
  TASTE_QUESTIONNAIRE_V2_METADATA,
} from "./tasteQuestionnaireV2";
import {
  TASTE_V1_PAGE_02_WHAT_MATTERS,
  TASTE_V1_PAGE_03_KEEP,
  type PriorityChoiceQuestion,
  type SceneChoiceQuestion,
  type SituationChoiceQuestion,
  type QuickCutsQuestion,
  type SignatureChoiceQuestion,
  type TasteQuestion,
  type TasteQuestionOption,
  type TasteRawAnswer,
  type TasteRawAnswers,
  type TradeOffQuestion,
} from "./tasteQuestionnaire";

// ============================================================
// 0. VERSION / METADATA
// ============================================================
export const TASTE_QUESTIONNAIRE_V22_VERSION = "v2.2";

export const TASTE_QUESTIONNAIRE_V22_METADATA = {
  id: "taste",
  version: TASTE_QUESTIONNAIRE_V22_VERSION,
  estimatedMinutes: TASTE_QUESTIONNAIRE_V2_METADATA.estimatedMinutes,
  pages: TASTE_QUESTIONNAIRE_V2_METADATA.pages,
};

export const TASTE_V22_PAGE_SECTION_MAP: Record<number, PageSectionKey> = TASTE_V2_PAGE_SECTION_MAP;

// PAGE 01 — SCENE. "변경 금지" 지시 — v2를 그대로 재사용한다.
export const TASTE_V22_PAGE_01_SCENE: SceneChoiceQuestion = TASTE_V2_PAGE_01_SCENE;

// ------------------------------------------------------------
// PAGE 02 — FIRST NOTICE(priority-choice). v2 WHAT MATTERS/FIRST THING
// 대응 옵션에서 signals를 그대로 가져왔다 — light-mood/objects-detail/
// people-sound/structure-use(v1 TASTE_V1_PAGE_02_WHAT_MATTERS)와 1:1
// 대응된다.
// ------------------------------------------------------------
const V1_WHAT_MATTERS_BY_ID: Record<string, TasteQuestionOption> = Object.fromEntries(
  TASTE_V1_PAGE_02_WHAT_MATTERS.options.map((o: TasteQuestionOption) => [o.id, o])
);

export const TASTE_V22_PAGE_02_FIRST_NOTICE: PriorityChoiceQuestion = {
  kind: "priority-choice",
  id: "first-notice",
  page: 2,
  totalPages: TASTE_QUESTIONNAIRE_V22_METADATA.pages,
  section: TASTE_V22_PAGE_SECTION_MAP[2],
  prompt: "처음 가본 공간에서,\n가장 먼저 '좋다'고 느끼게 되는 건?",
  options: [
    {
      id: "light-and-air",
      label: "빛과 공기",
      description: "밝기, 색감, 온도 같은 분위기",
      signals: V1_WHAT_MATTERS_BY_ID["light-mood"].signals,
      semanticTags: V1_WHAT_MATTERS_BY_ID["light-mood"].semanticTags,
    },
    {
      id: "small-detail",
      label: "작은 디테일",
      description: "컵, 의자, 책, 소재 같은 것들",
      signals: V1_WHAT_MATTERS_BY_ID["objects-detail"].signals,
    },
    {
      id: "people-and-sound",
      label: "사람과 소리",
      description: "누가 있고 어떤 분위기가 흐르는지",
      signals: V1_WHAT_MATTERS_BY_ID["people-sound"].signals,
    },
    {
      id: "way-of-staying",
      label: "머무는 방식",
      description: "앉는 자리, 동선, 편안함",
      signals: V1_WHAT_MATTERS_BY_ID["structure-use"].signals,
    },
  ],
};

// ------------------------------------------------------------
// PAGE 03 — TRADE-OFF(trade-off, pair 3개 전부 선택). 6개 옵션 각각의
// signals는 v1 KEEP(PAGE 03)의 대응 옵션에서 그대로 가져왔다:
//   PAIR 1  A=timeless          B=instant-pull
//   PAIR 2  A=different         B=functional
//   PAIR 3  A=storied           B=well-made
// (지시문의 "timeless 계열/novelty·impulse 관련/distinctive 계열/
// functional·familiar 관련/story·attachment 관련/well-made·curation
// 관련"이라는 6개 힌트와 1:1로 대응된다 — v1 KEEP의 6개 옵션을 정확히
// 한 번씩만 사용해 3개 pair로 재구성한 것이라고 해석했다. instant-pull/
// functional은 라벨 문구가 완전히 동일하지는 않아(예: v1 "지금 보는
// 순간 마음이 가는 것" vs 이번 "처음 보는 순간 강하게 끌리는 것") 이
// 대응이 GPT의 의도와 정확히 같은지는 확인이 필요하다는 판단 근거를
// 완료 보고에서 공유한다.)
// ------------------------------------------------------------
const V1_KEEP_BY_ID: Record<string, TasteQuestionOption> = Object.fromEntries(
  TASTE_V1_PAGE_03_KEEP.options.map((o: TasteQuestionOption) => [o.id, o])
);

export const TASTE_V22_PAGE_03_TRADE_OFF: TradeOffQuestion = {
  kind: "trade-off",
  id: "trade-off",
  page: 3,
  totalPages: TASTE_QUESTIONNAIRE_V22_METADATA.pages,
  section: TASTE_V22_PAGE_SECTION_MAP[3],
  prompt: "둘 다 좋지만,\n하나만 고른다면?",
  pairs: [
    {
      id: "pair-1",
      a: { id: "timeless", label: "오래 봐도 질리지 않는 것", signals: V1_KEEP_BY_ID["timeless"].signals },
      b: { id: "instant-pull", label: "처음 보는 순간 강하게 끌리는 것", signals: V1_KEEP_BY_ID["instant-pull"].signals },
    },
    {
      id: "pair-2",
      a: { id: "different", label: "남들과 조금 다른 것", signals: V1_KEEP_BY_ID["different"].signals },
      b: { id: "functional", label: "오래 써도 편한 것", signals: V1_KEEP_BY_ID["functional"].signals },
    },
    {
      id: "pair-3",
      a: { id: "storied", label: "이야기가 생기는 것", signals: V1_KEEP_BY_ID["storied"].signals },
      b: { id: "well-made", label: "작은 부분까지 잘 만든 것", signals: V1_KEEP_BY_ID["well-made"].signals },
    },
  ],
};

// PAGE 04 — INSTINCT. "변경 금지" 지시 — v2를 그대로 재사용한다.
export const TASTE_V22_PAGE_04_INSTINCT: SituationChoiceQuestion = { ...TASTE_V2_PAGE_04_INSTINCT, page: 4 };

// PAGE 05 — QUICK CUTS. "변경 금지" 지시 — v2를 그대로 재사용한다.
export const TASTE_V22_PAGE_05_QUICK_CUTS: QuickCutsQuestion = { ...TASTE_V2_PAGE_05_QUICK_CUTS, page: 5 };

// PAGE 06 — LAST SCENE. "변경 금지" 지시 — v2를 그대로 재사용한다.
export const TASTE_V22_PAGE_06_LAST_SCENE: SignatureChoiceQuestion = { ...TASTE_V2_PAGE_06_LAST_SCENE, page: 6 };

export const TASTE_QUESTIONS_V2_2: TasteQuestion[] = [
  TASTE_V22_PAGE_01_SCENE,
  TASTE_V22_PAGE_02_FIRST_NOTICE,
  TASTE_V22_PAGE_03_TRADE_OFF,
  TASTE_V22_PAGE_04_INSTINCT,
  TASTE_V22_PAGE_05_QUICK_CUTS,
  TASTE_V22_PAGE_06_LAST_SCENE,
];

// ============================================================
// VALIDATION FIXTURES — v1/v2 5개 reference profile과 동일한 signal
// 조합을 v2.2 옵션 id로 재구성한 것.
// ============================================================
export type TasteV22MockProfile = { id: string; label: string; description: string; answers: TasteRawAnswers };

function rawAnswer(question: TasteQuestion, selectedOptionIds: string[]): TasteRawAnswer {
  return { questionId: question.id, interactionType: question.kind, selectedOptionIds };
}

export const TASTE_V22_MOCK_PROFILES: TasteV22MockProfile[] = [
  {
    id: "quiet-curator",
    label: "QUIET CURATOR",
    description: "v1/v2 QUIET CURATOR와 동일 signal 조합(v2.2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V22_PAGE_01_SCENE, ["window-afternoon"]),
      "first-notice": rawAnswer(TASTE_V22_PAGE_02_FIRST_NOTICE, ["small-detail"]),
      "trade-off": rawAnswer(TASTE_V22_PAGE_03_TRADE_OFF, ["timeless", "functional", "well-made"]),
      instinct: rawAnswer(TASTE_V22_PAGE_04_INSTINCT, ["wait-days"]),
      "quick-cuts": rawAnswer(TASTE_V22_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "mood-matters"]),
      "last-scene": rawAnswer(TASTE_V22_PAGE_06_LAST_SCENE, ["back-to-my-place"]),
    },
  },
  {
    id: "urban-explorer",
    label: "URBAN EXPLORER",
    description: "v1/v2 URBAN EXPLORER와 동일 signal 조합(v2.2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V22_PAGE_01_SCENE, ["city-evening"]),
      "first-notice": rawAnswer(TASTE_V22_PAGE_02_FIRST_NOTICE, ["people-and-sound"]),
      "trade-off": rawAnswer(TASTE_V22_PAGE_03_TRADE_OFF, ["instant-pull", "different", "well-made"]),
      instinct: rawAnswer(TASTE_V22_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V22_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V22_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
  {
    id: "practical-editor",
    label: "PRACTICAL EDITOR",
    description: "v1/v2 PRACTICAL EDITOR와 동일 signal 조합(v2.2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V22_PAGE_01_SCENE, ["window-afternoon"]),
      "first-notice": rawAnswer(TASTE_V22_PAGE_02_FIRST_NOTICE, ["way-of-staying"]),
      "trade-off": rawAnswer(TASTE_V22_PAGE_03_TRADE_OFF, ["timeless", "functional", "well-made"]),
      instinct: rawAnswer(TASTE_V22_PAGE_04_INSTINCT, ["budget-limit"]),
      "quick-cuts": rawAnswer(TASTE_V22_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V22_PAGE_06_LAST_SCENE, ["back-to-my-place"]),
    },
  },
  {
    id: "quiet-explorer",
    label: "QUIET EXPLORER",
    description: "v1/v2 QUIET EXPLORER와 동일 signal 조합(v2.2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V22_PAGE_01_SCENE, ["window-afternoon"]),
      "first-notice": rawAnswer(TASTE_V22_PAGE_02_FIRST_NOTICE, ["light-and-air"]),
      "trade-off": rawAnswer(TASTE_V22_PAGE_03_TRADE_OFF, ["timeless", "different", "storied"]),
      instinct: rawAnswer(TASTE_V22_PAGE_04_INSTINCT, ["compare"]),
      "quick-cuts": rawAnswer(TASTE_V22_PAGE_05_QUICK_CUTS, ["new-place", "keep-long", "keep-private", "mood-matters"]),
      "last-scene": rawAnswer(TASTE_V22_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
  {
    id: "contradiction",
    label: "CONTRADICTION",
    description: "v1/v2 CONTRADICTION과 동일 signal 조합(v2.2 옵션 id로 재구성).",
    answers: {
      scene: rawAnswer(TASTE_V22_PAGE_01_SCENE, ["window-afternoon"]),
      "first-notice": rawAnswer(TASTE_V22_PAGE_02_FIRST_NOTICE, ["people-and-sound"]),
      "trade-off": rawAnswer(TASTE_V22_PAGE_03_TRADE_OFF, ["instant-pull", "different", "well-made"]),
      instinct: rawAnswer(TASTE_V22_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V22_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "last-scene": rawAnswer(TASTE_V22_PAGE_06_LAST_SCENE, ["somewhere-new"]),
    },
  },
];

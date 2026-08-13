// TASTE QUESTIONNAIRE SPEC ARCHITECTURE(2026-08) — dev 전용 데이터/타입
// 레이어.
//
// 역할 분리:
//   - 질문/선택지 문구, 분석 카피, signal 가중치는 GPT가 확정해서
//     전달한다.
//   - Claude Code는 그 확정된 Spec을 코드로 "구현"하는 역할만 맡는다
//     (state 관리 / data model / interaction component / routing /
//     asset 연결 / 반응형 / 테스트 / quality gate).
//
// 이 파일 두 부분으로 구성된다:
//   1) TASTE_Q1_V1_PROTOTYPE / TASTE_Q2_V1_PROTOTYPE / 관련 타입 —
//      이전 라운드에서 QuizClient.tsx의 초기 프로토타입(Q1/Q2만) 문구를
//      그대로 옮겨 표현한 것. 지금은 실제 사용자 플로우에 쓰이지 않고
//      dev 참고용으로만 남아 있다(QuizClient.tsx의 TASTE_Q1/TASTE_Q2와
//      마찬가지로 보존).
//   2) TASTE_QUESTIONS_V1 — GPT가 검증 완료해 전달한 TASTE Questionnaire
//      v1의 실제 6 PAGE 문항. 문구/선택지/signal 가중치는 전부 전달받은
//      Spec을 그대로 옮겨 적었을 뿐, 새로 쓰거나 값을 조정하지 않았다.
//      실제 /dev/personal-magazine-quiz 화면은 이 데이터로 렌더링된다.

import {
  Q1_SIGNAL_SOURCES,
  Q2_SIGNAL_SOURCES,
  type PageSectionKey,
  type SignalContribution,
  type SignalSource,
} from "./tasteAnalysis";

// ============================================================
// 0. VERSION / METADATA
// ============================================================
export const TASTE_QUESTIONNAIRE_VERSION = "v1";

export type TasteQuestionnaireMetadata = {
  id: string;
  version: string;
  estimatedMinutes: number;
  pages: number;
};

export const TASTE_QUESTIONNAIRE_METADATA: TasteQuestionnaireMetadata = {
  id: "taste",
  version: TASTE_QUESTIONNAIRE_VERSION,
  estimatedMinutes: 2,
  pages: 6,
};

// PAGE 번호 → YOUR PAGE의 PLACE/OBJECT/DETAIL/RITUAL 매핑. GPT Spec
// 문서의 "PAGE 01~02 → PLACE, 03~04 → OBJECT, 05 → DETAIL, 06 → RITUAL"을
// 그대로 옮긴 config다. 향후 Narrative/Editorial System에서 이 표만
// 바꾸면 매핑을 조정할 수 있도록 컴포넌트 코드에 하드코딩하지 않는다.
export const TASTE_V1_PAGE_SECTION_MAP: Record<number, PageSectionKey> = {
  1: "place",
  2: "place",
  3: "object",
  4: "object",
  5: "detail",
  6: "ritual",
};

// ============================================================
// 1. INTERACTION KIND
// ============================================================
export type TasteInteractionKind =
  | "scene-choice" // PAGE 01 — 장면 2개 중 하나
  | "object-choice" // 프로토타입 Q2(물건 4개 중 하나) — v1 실제 플로우에서는 사용하지 않음(dev 참고용)
  | "priority-choice" // PAGE 02 — 여러 개 중 하나(가장 크게 작용하는 것)
  | "multi-select" // PAGE 03 — 정확히 2개 선택
  | "situation-choice" // PAGE 04 — 상황 기반 선택
  | "scale" // 아직 v1에서 쓰이지 않음(향후 GPT Spec 대기)
  | "quick-cuts" // PAGE 05 — 연속된 이지선다 4개
  | "signature-choice"; // PAGE 06 — 마무리 상징적 선택

// ============================================================
// 2. 공통 옵션 / 문항 shell
// ============================================================
export type TasteQuestionOption = {
  id: string;
  label: string;
  description?: string;
  assetKey?: string;
  signals?: SignalContribution;
  semanticTags?: string[];
};

export type BaseTasteQuestion = {
  id: string;
  page: number;
  totalPages: number;
  section: PageSectionKey;
  prompt: string;
  helper?: string;
  analysisSignals?: unknown;
};

// ============================================================
// 3. 문항 discriminated union
// ============================================================
export type SceneChoiceQuestion = BaseTasteQuestion & {
  kind: "scene-choice";
  options: [TasteQuestionOption, TasteQuestionOption];
};

export type ObjectChoiceQuestion = BaseTasteQuestion & {
  kind: "object-choice";
  options: TasteQuestionOption[];
};

export type PriorityChoiceQuestion = BaseTasteQuestion & {
  kind: "priority-choice";
  options: TasteQuestionOption[];
};

export type MultiSelectQuestion = BaseTasteQuestion & {
  kind: "multi-select";
  options: TasteQuestionOption[];
  minSelect: number;
  maxSelect: number;
};

export type SituationChoiceQuestion = BaseTasteQuestion & {
  kind: "situation-choice";
  options: TasteQuestionOption[];
};

export type ScaleQuestion = BaseTasteQuestion & {
  kind: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
};

// QUICK CUTS 한 페이지는 독립된 이지선다 여러 개(cut)로 이루어진다.
// cut 하나하나가 그 자체로 개별 raw answer/signal source가 된다.
export type QuickCutItem = {
  id: string;
  left: TasteQuestionOption;
  right: TasteQuestionOption;
};

export type QuickCutsQuestion = BaseTasteQuestion & {
  kind: "quick-cuts";
  cuts: QuickCutItem[];
};

export type SignatureChoiceQuestion = BaseTasteQuestion & {
  kind: "signature-choice";
  options: TasteQuestionOption[];
};

export type TasteQuestion =
  | SceneChoiceQuestion
  | ObjectChoiceQuestion
  | PriorityChoiceQuestion
  | MultiSelectQuestion
  | SituationChoiceQuestion
  | ScaleQuestion
  | QuickCutsQuestion
  | SignatureChoiceQuestion;

// ============================================================
// 4. PROTOTYPE(이전 라운드 참고용) — QuizClient.tsx의 TASTE_Q1/TASTE_Q2와
// 동일한 문구/가중치를 새 구조로 표현한 것. v1 실제 플로우에서는 쓰이지
// 않는다(TASTE_QUESTIONS_V1을 쓴다). 삭제하지 않고 dev 참고용으로 둔다.
// ============================================================
export const TASTE_Q1_V1_PROTOTYPE: SceneChoiceQuestion = {
  kind: "scene-choice",
  id: "q1",
  page: 1,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: "place",
  prompt: "쉬는 오후,\n더 마음이 가는 장면은?",
  helper: "내 TASTE 지면에 더 가까운 장면을 선택해 주세요.",
  options: [
    {
      id: "cafe",
      label: "햇살이 드는 조용한 카페에서\n책과 커피를 즐긴다",
      assetKey: "quiz.taste.q01.a",
      signals: Q1_SIGNAL_SOURCES.cafe.signals,
      semanticTags: Q1_SIGNAL_SOURCES.cafe.semanticTags,
    },
    {
      id: "city",
      label: "사람들과 어울리며\n도시의 에너지를 느낀다",
      assetKey: "quiz.taste.q01.b",
      signals: Q1_SIGNAL_SOURCES.city.signals,
      semanticTags: Q1_SIGNAL_SOURCES.city.semanticTags,
    },
  ],
};

export const TASTE_Q2_V1_PROTOTYPE: ObjectChoiceQuestion = {
  kind: "object-choice",
  id: "q2",
  page: 2,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: "object",
  prompt: "하나를 오래 곁에 둔다면?",
  helper: "내 취향을 가장 잘 닮은 물건을 하나 골라주세요.",
  options: [
    {
      id: "camera",
      label: "오래된 필름카메라",
      description: "시간과 장면을 기록하는 물건",
      signals: Q2_SIGNAL_SOURCES.camera.signals,
      semanticTags: Q2_SIGNAL_SOURCES.camera.semanticTags,
    },
    {
      id: "speaker",
      label: "잘 만든 작은 스피커",
      description: "공간의 분위기를 바꾸는 물건",
      signals: Q2_SIGNAL_SOURCES.speaker.signals,
      semanticTags: Q2_SIGNAL_SOURCES.speaker.semanticTags,
    },
    {
      id: "notebook",
      label: "손때가 묻을수록 좋은 노트",
      description: "생각을 오래 남기는 물건",
      signals: Q2_SIGNAL_SOURCES.notebook.signals,
      semanticTags: Q2_SIGNAL_SOURCES.notebook.semanticTags,
    },
    {
      id: "object",
      label: "형태가 아름다운 작은 오브제",
      description: "바라보는 것만으로 좋은 물건",
      signals: Q2_SIGNAL_SOURCES.object.signals,
      semanticTags: Q2_SIGNAL_SOURCES.object.semanticTags,
    },
  ],
};

export const TASTE_QUESTIONS_V1_PROTOTYPE: TasteQuestion[] = [TASTE_Q1_V1_PROTOTYPE, TASTE_Q2_V1_PROTOTYPE];

// ============================================================
// 5. TASTE QUESTIONNAIRE v1 — GPT 검증 완료 Spec 실제 구현.
// 문구/선택지/signal 값은 전달받은 Spec을 그대로 옮겼다. 새로 짓거나
// 값을 조정하지 않았다.
// ============================================================

// ------------------------------------------------------------
// PAGE 01 — SCENE (scene-choice)
// 현재 실제 이미지 2장(taste-quiz-01-a.png / taste-quiz-01-b.png)을
// 그대로 사용한다 — 이미지 재생성/재가공 없음.
// ------------------------------------------------------------
export const TASTE_V1_PAGE_01_SCENE: SceneChoiceQuestion = {
  kind: "scene-choice",
  id: "scene",
  page: 1,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[1],
  prompt: "쉬는 오후,\n더 마음이 가는 장면은?",
  helper: "생각하기보다 먼저 마음이 가는 쪽을 골라주세요.",
  options: [
    {
      id: "window-afternoon",
      label: "창가에 앉아\n책이나 커피와 시간을 보내는 오후",
      assetKey: "quiz.taste.q01.a",
      signals: { stimulus: -15, socialDensity: -10, pace: -10, sensory: 5 },
    },
    {
      id: "city-evening",
      label: "사람과 불빛이 있는\n도시의 저녁을 즐기는 시간",
      assetKey: "quiz.taste.q01.b",
      signals: { stimulus: 15, socialDensity: 15, pace: 10, novelty: 5 },
    },
  ],
};

// ------------------------------------------------------------
// PAGE 02 — WHAT MATTERS (priority-choice)
// ------------------------------------------------------------
export const TASTE_V1_PAGE_02_WHAT_MATTERS: PriorityChoiceQuestion = {
  kind: "priority-choice",
  id: "what-matters",
  page: 2,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[2],
  prompt: "좋은 공간이라고 느낄 때,\n가장 크게 작용하는 것은?",
  helper: "하나만 고른다면.",
  options: [
    {
      id: "light-mood",
      label: "빛과 분위기",
      description: "햇빛, 조명, 색감처럼\n공간 전체를 만드는 느낌",
      signals: { sensory: 15, stimulus: -5 },
      semanticTags: ["atmosphere", "light", "mood", "sensory"],
    },
    {
      id: "objects-detail",
      label: "물건과 디테일",
      description: "가구, 그릇, 포스터처럼\n눈에 걸리는 작은 것들",
      signals: { sensory: 15, curation: 10 },
    },
    {
      id: "people-sound",
      label: "사람과 소리",
      description: "누가 있고\n어떤 음악과 에너지가 흐르는지",
      signals: { socialDensity: 15, stimulus: 10 },
    },
    {
      id: "structure-use",
      label: "구조와 쓰임",
      description: "자리가 어떻게 놓여 있고\n얼마나 편하게 쓸 수 있는지",
      signals: { sensory: -5, curation: 10, pace: -5 },
    },
  ],
};

// ------------------------------------------------------------
// PAGE 03 — KEEP (multi-select, 정확히 2개)
// PAGE 03의 2개 선택 조합 자체가 향후 Narrative Engine의 분석
// 대상이다 — signal로 합산한 뒤에도 raw answer(선택된 2개 id, 선택
// 순서 포함)를 그대로 보존한다(아래 6번 ADAPTER/RAW ANSWER 참고).
// ------------------------------------------------------------
export const TASTE_V1_PAGE_03_KEEP: MultiSelectQuestion = {
  kind: "multi-select",
  id: "keep",
  page: 3,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[3],
  prompt: "마음에 드는 것을 고를 때,\n놓치기 어려운 기준 두 가지는?",
  helper: "딱 두 개만 골라주세요.",
  minSelect: 2,
  maxSelect: 2,
  options: [
    { id: "timeless", label: "오래 봐도 질리지 않는 것", signals: { attachment: 15, curation: 10, novelty: -5 } },
    { id: "different", label: "남들과 조금 다른 것", signals: { novelty: 15, expression: 10 } },
    { id: "functional", label: "쓰임이 분명한 것", signals: { curation: 10, sensory: -5 } },
    { id: "storied", label: "이야기가 있는 것", signals: { attachment: 15, sensory: 5 } },
    { id: "instant-pull", label: "지금 보는 순간 마음이 가는 것", signals: { novelty: 10, attachment: -5, pace: 10 } },
    { id: "well-made", label: "작은 부분까지 잘 만들어진 것", signals: { curation: 15, sensory: 10 } },
  ],
};

// ------------------------------------------------------------
// PAGE 04 — INSTINCT (situation-choice)
// ------------------------------------------------------------
export const TASTE_V1_PAGE_04_INSTINCT: SituationChoiceQuestion = {
  kind: "situation-choice",
  id: "instinct",
  page: 4,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[4],
  prompt: "정말 마음에 드는 물건을 발견했습니다.\n그런데 생각했던 것보다 조금 비쌉니다.",
  helper: "나는 보통...",
  options: [
    { id: "buy-if-lingers", label: "계속 생각날 것 같으면 산다.", signals: { pace: 15, attachment: 5 } },
    { id: "wait-days", label: "일단 돌아서서 며칠 더 생각한다.", signals: { pace: -10, curation: 10 } },
    { id: "compare", label: "비슷한 것들을 더 찾아보고 비교한다.", signals: { curation: 15, novelty: 5, pace: -5 } },
    {
      id: "budget-limit",
      label: "마음에 들어도\n내가 정한 가격을 넘으면 지나간다.",
      signals: { curation: 10, novelty: -5, sensory: -5 },
    },
  ],
};

// ------------------------------------------------------------
// PAGE 05 — QUICK CUTS (quick-cuts, 4개 전부 선택)
// 중립값 없음 — 각 cut은 반드시 둘 중 하나를 고른다.
// ------------------------------------------------------------
export const TASTE_V1_PAGE_05_QUICK_CUTS: QuickCutsQuestion = {
  kind: "quick-cuts",
  id: "quick-cuts",
  page: 5,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[5],
  prompt: "A FEW QUICK THINGS",
  helper: "생각하지 말고,\n조금 더 가까운 쪽.",
  cuts: [
    {
      id: "cut01",
      left: { id: "new-place", label: "새로 생긴 곳", signals: { novelty: 15 } },
      right: { id: "usual-place", label: "늘 가던 곳", signals: { novelty: -15, attachment: 5 } },
    },
    {
      id: "cut02",
      left: { id: "keep-long", label: "마음에 들면 오래 쓴다", signals: { attachment: 15, curation: 5 } },
      right: { id: "swap-fun", label: "새로운 걸로 바꾸는 재미가 있다", signals: { attachment: -10, novelty: 10 } },
    },
    {
      id: "cut03",
      left: { id: "share-it", label: "좋았던 건 누군가에게 알려주고 싶다", signals: { expression: 15, socialDensity: 5 } },
      right: { id: "keep-private", label: "나만 알고 있어도 좋다", signals: { expression: -15, socialDensity: -5 } },
    },
    {
      id: "cut04",
      left: { id: "mood-matters", label: "작은 분위기 차이가 꽤 중요하다", signals: { sensory: 15 } },
      right: { id: "overall-enough", label: "전체적으로 괜찮으면 충분하다", signals: { sensory: -15 } },
    },
  ],
};

// ------------------------------------------------------------
// PAGE 06 — YOUR DAY (signature-choice)
// 실제 Editorial Photography는 GPT가 이후 별도로 생성한다 — 지금은
// assetKey 없이 neutral placeholder를 쓴다(이미지/일러스트 생성 없음).
// ------------------------------------------------------------
export const TASTE_V1_PAGE_06_YOUR_DAY: SignatureChoiceQuestion = {
  kind: "signature-choice",
  id: "your-day",
  page: 6,
  totalPages: TASTE_QUESTIONNAIRE_METADATA.pages,
  section: TASTE_V1_PAGE_SECTION_MAP[6],
  prompt: "하루가 통째로 비었습니다.\n지금 더 마음이 가는 하루는?",
  options: [
    {
      id: "familiar-day",
      label: "FAMILIAR",
      description:
        "좋아하는 동네.\n이미 알고 있는 카페.\n늘 걷던 길.\n\n마음에 드는 곳 몇 군데를\n천천히 다시 찾는 하루.",
      signals: { novelty: -15, attachment: 10, pace: -10 },
    },
    {
      id: "discover-day",
      label: "DISCOVER",
      description:
        "처음 가보는 동네.\n지도에 저장해뒀던 장소.\n\n계획을 조금 비워두고\n걷다가 새로운 것을 발견하는 하루.",
      signals: { novelty: 15, attachment: -5, pace: 5 },
    },
  ],
};

export const TASTE_QUESTIONS_V1: TasteQuestion[] = [
  TASTE_V1_PAGE_01_SCENE,
  TASTE_V1_PAGE_02_WHAT_MATTERS,
  TASTE_V1_PAGE_03_KEEP,
  TASTE_V1_PAGE_04_INSTINCT,
  TASTE_V1_PAGE_05_QUICK_CUTS,
  TASTE_V1_PAGE_06_YOUR_DAY,
];

// ============================================================
// 6. INTERACTION REGISTRY
// ============================================================
export type TasteInteractionStatus = {
  kind: TasteInteractionKind;
  implemented: boolean;
  note: string;
};

export const TASTE_INTERACTION_REGISTRY: Record<TasteInteractionKind, TasteInteractionStatus> = {
  "scene-choice": { kind: "scene-choice", implemented: true, note: "PAGE 01(SCENE)에서 실제 사용 중." },
  "object-choice": {
    kind: "object-choice",
    implemented: true,
    note: "이전 프로토타입 Q2에서 구현됨. v1 실제 플로우에서는 쓰이지 않고 dev 참고용으로만 남아 있음.",
  },
  "priority-choice": { kind: "priority-choice", implemented: true, note: "PAGE 02(WHAT MATTERS)에서 실제 사용 중." },
  "multi-select": { kind: "multi-select", implemented: true, note: "PAGE 03(KEEP)에서 실제 사용 중 — 정확히 2개 선택." },
  "situation-choice": { kind: "situation-choice", implemented: true, note: "PAGE 04(INSTINCT)에서 실제 사용 중." },
  scale: { kind: "scale", implemented: false, note: "v1에서 사용하지 않음 — GPT Spec 대기." },
  "quick-cuts": { kind: "quick-cuts", implemented: true, note: "PAGE 05(QUICK CUTS)에서 실제 사용 중 — 4개 전부 선택." },
  "signature-choice": { kind: "signature-choice", implemented: true, note: "PAGE 06(YOUR DAY)에서 실제 사용 중." },
};

// ============================================================
// 7. RAW ANSWER — signal로 변환한 뒤에도 사용자의 실제 선택을 지우지
// 않는다. selectedOptionIds는 선택 순서를 그대로 보존한다 —
// PAGE 03(2개 조합)과 PAGE 05(cut 4개 각각의 선택)를 재구성하는 데
// 그대로 쓰인다.
// ============================================================
export type TasteRawAnswer = {
  questionId: string;
  interactionType: TasteInteractionKind;
  selectedOptionIds: string[];
  timestamp?: number;
};

export type TasteRawAnswers = Record<string, TasteRawAnswer>;

// ============================================================
// 8. ANALYSIS ADAPTER — TasteRawAnswers → SignalSource[]
// (tasteAnalysis.ts의 analyzeTasteFromSources() 입력 형식)
//
// 여기 있는 함수는 "이 질문에서 어떤 옵션이 선택됐는가"를 raw answer의
// selectedOptionIds에서 그대로 찾아오는 것만 한다 — 어떤 축에 몇 점을
// 주는지는 옵션에 이미 붙어 있는 signals 값을 그대로 옮길 뿐, 새로운
// 매핑 규칙을 만들지 않는다.
// ============================================================
function collectOptionPool(question: TasteQuestion): TasteQuestionOption[] {
  if (question.kind === "quick-cuts") {
    return question.cuts.flatMap((cut) => [cut.left, cut.right]);
  }
  if (question.kind === "scale") return [];
  return question.options;
}

function optionToSignalSource(question: TasteQuestion, option: TasteQuestionOption): SignalSource | null {
  if (!option.signals) return null;
  return {
    questionId: question.id,
    answerId: option.id,
    pageSection: question.section,
    label: `${question.id} · ${option.label.replace(/\n/g, " ")}`,
    signals: option.signals,
    semanticTags: option.semanticTags ?? [],
  };
}

export function buildSignalSourceFromAnswer(question: TasteQuestion, rawAnswer: TasteRawAnswer | undefined): SignalSource[] {
  if (!rawAnswer) return [];
  const pool = collectOptionPool(question);
  return rawAnswer.selectedOptionIds
    .map((id) => pool.find((option) => option.id === id))
    .filter((option): option is TasteQuestionOption => Boolean(option))
    .map((option) => optionToSignalSource(question, option))
    .filter((source): source is SignalSource => source !== null);
}

export function mapTasteAnswersToSignalSources(questions: TasteQuestion[], answers: TasteRawAnswers): SignalSource[] {
  return questions.flatMap((question) => buildSignalSourceFromAnswer(question, answers[question.id]));
}

// ============================================================
// 9. VALIDATION FIXTURES — v1 6 PAGE 전체를 대상으로 한 5개 mock
// profile. signal은 각 문항 옵션에 이미 붙은 값을 그대로 조합했을
// 뿐이며, 이 조합에 맞는 새로운 headline/트레잇 해석을 새로 짓지
// 않았다 — analyzeTasteFromSources()가 계산한 결과를 그대로 dev
// preview에서 확인한다.
// ============================================================
export type TasteV1MockProfile = {
  id: string;
  label: string;
  description: string;
  answers: TasteRawAnswers;
};

function rawAnswer(question: TasteQuestion, selectedOptionIds: string[]): TasteRawAnswer {
  return { questionId: question.id, interactionType: question.kind, selectedOptionIds };
}

export const TASTE_V1_MOCK_PROFILES: TasteV1MockProfile[] = [
  {
    id: "quiet-curator",
    label: "QUIET CURATOR",
    description: "조용한 창가 + 물건과 디테일 + timeless/well-made + 신중한 결정 — 낮은 자극·높은 큐레이션/감각/애착.",
    answers: {
      scene: rawAnswer(TASTE_V1_PAGE_01_SCENE, ["window-afternoon"]),
      "what-matters": rawAnswer(TASTE_V1_PAGE_02_WHAT_MATTERS, ["objects-detail"]),
      keep: rawAnswer(TASTE_V1_PAGE_03_KEEP, ["timeless", "well-made"]),
      instinct: rawAnswer(TASTE_V1_PAGE_04_INSTINCT, ["wait-days"]),
      "quick-cuts": rawAnswer(TASTE_V1_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "mood-matters"]),
      "your-day": rawAnswer(TASTE_V1_PAGE_06_YOUR_DAY, ["familiar-day"]),
    },
  },
  {
    id: "urban-explorer",
    label: "URBAN EXPLORER",
    description: "도시 저녁 + 사람과 소리 + different/instant-pull + 즉흥 구매 — 높은 자극·사교·새로움·표현.",
    answers: {
      scene: rawAnswer(TASTE_V1_PAGE_01_SCENE, ["city-evening"]),
      "what-matters": rawAnswer(TASTE_V1_PAGE_02_WHAT_MATTERS, ["people-sound"]),
      keep: rawAnswer(TASTE_V1_PAGE_03_KEEP, ["different", "instant-pull"]),
      instinct: rawAnswer(TASTE_V1_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V1_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "your-day": rawAnswer(TASTE_V1_PAGE_06_YOUR_DAY, ["discover-day"]),
    },
  },
  {
    id: "practical-editor",
    label: "PRACTICAL EDITOR",
    description: "조용한 창가 + 구조와 쓰임 + functional/timeless + 예산 기준 — 높은 큐레이션, 낮은 감각/표현(quiet-curator와 달리 감각 낮음).",
    answers: {
      scene: rawAnswer(TASTE_V1_PAGE_01_SCENE, ["window-afternoon"]),
      "what-matters": rawAnswer(TASTE_V1_PAGE_02_WHAT_MATTERS, ["structure-use"]),
      keep: rawAnswer(TASTE_V1_PAGE_03_KEEP, ["functional", "timeless"]),
      instinct: rawAnswer(TASTE_V1_PAGE_04_INSTINCT, ["budget-limit"]),
      "quick-cuts": rawAnswer(TASTE_V1_PAGE_05_QUICK_CUTS, ["usual-place", "keep-long", "keep-private", "overall-enough"]),
      "your-day": rawAnswer(TASTE_V1_PAGE_06_YOUR_DAY, ["familiar-day"]),
    },
  },
  {
    id: "quiet-explorer",
    label: "QUIET EXPLORER",
    description: "조용한 창가 + 빛과 분위기 + different/storied + 비교 탐색 — 낮은 자극이면서 새로움·큐레이션·감각·애착이 모두 높음(같은 축이 아니라 서로 다른 축의 조합).",
    answers: {
      scene: rawAnswer(TASTE_V1_PAGE_01_SCENE, ["window-afternoon"]),
      "what-matters": rawAnswer(TASTE_V1_PAGE_02_WHAT_MATTERS, ["light-mood"]),
      keep: rawAnswer(TASTE_V1_PAGE_03_KEEP, ["different", "storied"]),
      instinct: rawAnswer(TASTE_V1_PAGE_04_INSTINCT, ["compare"]),
      "quick-cuts": rawAnswer(TASTE_V1_PAGE_05_QUICK_CUTS, ["new-place", "keep-long", "keep-private", "mood-matters"]),
      "your-day": rawAnswer(TASTE_V1_PAGE_06_YOUR_DAY, ["discover-day"]),
    },
  },
  {
    id: "contradiction",
    label: "CONTRADICTION",
    description:
      "조용한 창가(낮은 자극/사교) + 사람과 소리(높은 자극/사교) — stimulus·socialDensity·pace 축에서 문항 간 신호가 정면으로 엇갈리도록 의도적으로 구성.",
    answers: {
      scene: rawAnswer(TASTE_V1_PAGE_01_SCENE, ["window-afternoon"]),
      "what-matters": rawAnswer(TASTE_V1_PAGE_02_WHAT_MATTERS, ["people-sound"]),
      keep: rawAnswer(TASTE_V1_PAGE_03_KEEP, ["different", "instant-pull"]),
      instinct: rawAnswer(TASTE_V1_PAGE_04_INSTINCT, ["buy-if-lingers"]),
      "quick-cuts": rawAnswer(TASTE_V1_PAGE_05_QUICK_CUTS, ["new-place", "swap-fun", "share-it", "overall-enough"]),
      "your-day": rawAnswer(TASTE_V1_PAGE_06_YOUR_DAY, ["discover-day"]),
    },
  },
];

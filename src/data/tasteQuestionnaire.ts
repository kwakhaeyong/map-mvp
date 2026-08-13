// TASTE QUESTIONNAIRE SPEC ARCHITECTURE v1(2026-08) — dev 전용 데이터/타입
// 레이어.
//
// 역할 분리(2026-08부터):
//   - 질문/선택지 문구, 분석 카피, signal 가중치는 앞으로 GPT가 확정해서
//     전달한다.
//   - Claude Code는 그 확정된 Spec을 코드로 "구현"하는 역할만 맡는다
//     (state 관리 / data model / interaction component / routing /
//     asset 연결 / 반응형 / 테스트 / quality gate).
//
// 그래서 이 파일은 "내용"이 아니라 "그릇"이다 — 이 파일이 하는 일:
//   1) 여러 인터랙션 타입(Scene/Object/Priority/MultiSelect/Situation/
//      Scale/QuickCuts/Signature choice)을 표현할 수 있는 타입 구조를
//      만든다. 모든 질문을 A/B 이지선다로 강제하지 않는다.
//   2) 이미 UX 검증이 끝난 Q1(장면 선택)·Q2(물건 선택 프로토타입)를
//      새 구조로 "표현"한다 — 문구/가중치는 QuizClient.tsx와
//      tasteAnalysis.ts에 있는 값을 그대로 옮겨왔을 뿐, 새로 쓰지 않았다.
//   3) TasteQuestionnaire → 답변 → SignalSource(tasteAnalysis.ts 입력)로
//      가는 adapter 함수의 자리를 만든다 — 규칙은 아직 없다(GPT의 최종
//      Spec이 오면 그때 채운다). 지금은 옵션에 이미 붙어 있는 signals를
//      그대로 옮기기만 하는 범용 변환만 한다.
//
// QuizClient.tsx는 이번 라운드에 건드리지 않는다 — Q1/Q2 실제 렌더링은
// 여전히 QuizClient.tsx 자체의 하드코딩된 데이터를 쓴다. 이 파일은 그
// 옆에 나란히 존재하는 "미래를 위한 그릇"이며, 아직 실제 렌더링에
// 연결되지 않았다(연결/교체는 별도 라운드에서 진행).

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
// 다음 GPT Spec이 오면 이 버전 문자열만 올리고, 아래
// TASTE_QUESTIONS_V1_PROTOTYPE를 새 배열로 교체하는 방식으로 v1.1/v2를
// 추가할 수 있게 만든 자리다.
export const TASTE_QUESTIONNAIRE_VERSION = "v1";

export type TasteQuestionnaireMetadata = {
  id: string;
  version: string;
  estimatedMinutes: number;
  pages: number;
};

// 아래 숫자는 확정값이 아니다 — Section 11에서 언급된 6페이지 컨셉을
// placeholder로 그대로 옮겨온 것뿐이고, 지금 실제로 구현된 문항은
// Q1/Q2 2개뿐이다. GPT의 최종 Spec이 오면 이 값을 교체한다.
export const TASTE_QUESTIONNAIRE_METADATA: TasteQuestionnaireMetadata = {
  id: "taste",
  version: TASTE_QUESTIONNAIRE_VERSION,
  estimatedMinutes: 2,
  pages: 6,
};

// ============================================================
// 1. INTERACTION KIND — 문항이 가질 수 있는 인터랙션 종류.
// scene-choice/object-choice 2개만 실제로 구현되어 있다(Q1/Q2). 나머지
// 6개는 GPT의 최종 Spec을 받을 자리만 마련해 둔 것이며 아직 질문/
// 선택지 내용이 없다.
// ============================================================
export type TasteInteractionKind =
  | "scene-choice" // Q1 — 장면 2개 중 하나(이미 구현됨)
  | "object-choice" // Q2 — 물건 여러 개 중 하나(이미 구현됨, 4지선다 프로토타입)
  | "priority-choice" // 여러 개 중 우선순위/개수 제한 선택(예: "두 개만 고르면")
  | "multi-select" // 제한 없는 복수 선택
  | "situation-choice" // 상황/시나리오 기반 선택
  | "scale" // 수치 스케일 응답
  | "quick-cuts" // 짧은 연속 즉답형 선택
  | "signature-choice"; // 마무리 성격의 상징적 선택

// ============================================================
// 2. 공통 옵션 / 문항 shell
// ============================================================
// signals는 tasteAnalysis.ts의 SignalContribution을 그대로 재사용한다.
// (브리프의 예시 타입은 Record<string, number>였지만, 실제
// SignalContribution은 Partial<Record<TasteSignalKey, number>>라 구조가
// 다르다 — 기존 엔진과 충돌하지 않도록 이 파일에서 재선언하지 않고
// import해서 그대로 쓴다.)
export type TasteQuestionOption = {
  id: string;
  label: string;
  description?: string;
  assetKey?: string;
  signals?: SignalContribution;
  semanticTags?: string[];
};

// analysisSignals는 이 문항 자체(옵션 단위가 아니라 문항 레벨)가 어떤
// 축과 관련 있는지에 대한 메타데이터 자리다. 실제 모양/값은 GPT의
// Spec이 오기 전까지 정하지 않는다 — 그래서 unknown으로 열어 둔다.
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
// 3. 문항 discriminated union — 8가지 인터랙션 타입.
// 모든 문항을 하나의 A/B shape에 강제하지 않는다: 이미 구현된 2개는
// 실제 사용 형태를 그대로 반영했고, 나머지 6개는 GPT Spec을 받을 수
// 있는 최소 shape만 만들어 뒀다(과도하게 구체적인 필드를 미리
// 설계하지 않는다).
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
  selectCount?: number; // 예: "두 개만 고르세요" — 실제 값은 GPT Spec 대기
};

export type MultiSelectQuestion = BaseTasteQuestion & {
  kind: "multi-select";
  options: TasteQuestionOption[];
  minSelect?: number;
  maxSelect?: number;
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

export type QuickCutsQuestion = BaseTasteQuestion & {
  kind: "quick-cuts";
  options: TasteQuestionOption[];
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
// 4. Q1 / Q2 — 이미 검증된 프로토타입을 새 구조로 "표현".
// 문구는 QuizClient.tsx(TASTE_Q1/TASTE_Q2)에서, signal 가중치는
// tasteAnalysis.ts(Q1_SIGNAL_SOURCES/Q2_SIGNAL_SOURCES)에서 그대로
// 옮겨왔다 — 새로 쓴 문구/가중치는 없다.
//
// 주의: 이 상수는 아직 QuizClient.tsx의 실제 렌더링과 연결되어 있지
// 않다. QuizClient.tsx는 이번 라운드에서 건드리지 않았고, 여전히 자체
// 하드코딩 데이터로 화면을 그린다 — 이 파일은 그 옆에 나란히 존재하는
// "미래 GPT Spec을 받을 그릇"이다.
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

// Q2는 "확정된 Questionnaire"가 아니라 4지선다 프로토타입이다 — GPT의
// 최종 Spec이 오면 이 문항 자체가 다른 interaction kind로 교체될 수
// 있다(브리프에서 명시적으로 확인된 내용).
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

// 지금 실제로 구현된 문항만 배열에 넣는다 — Q3~Q6는 아직 없다.
export const TASTE_QUESTIONS_V1_PROTOTYPE: TasteQuestion[] = [TASTE_Q1_V1_PROTOTYPE, TASTE_Q2_V1_PROTOTYPE];

// ============================================================
// 5. INTERACTION REGISTRY — 인터랙션 종류 → 구현 상태.
// 컴포넌트를 미리 만들지 않는다(브리프: "새 디자인을 자율적으로 만들지
// 마세요"). 대신 TasteInteractionKind 전체에 대해 Record로 강제
// exhaustive하게 상태를 선언해 둔다 — 새 kind가 추가되면 타입 에러로
// 바로 드러나는 것 자체가 type-safe fallback 역할을 한다. 실제 화면
// 컴포넌트 연결은 GPT Spec이 확정된 뒤 진행한다.
// ============================================================
export type TasteInteractionStatus = {
  kind: TasteInteractionKind;
  implemented: boolean;
  note: string;
};

export const TASTE_INTERACTION_REGISTRY: Record<TasteInteractionKind, TasteInteractionStatus> = {
  "scene-choice": {
    kind: "scene-choice",
    implemented: true,
    note: "Q1 프로토타입에서 이미 UX 검증됨 (QuizClient.tsx).",
  },
  "object-choice": {
    kind: "object-choice",
    implemented: true,
    note: "Q2 프로토타입에서 이미 UX 검증됨 (QuizClient.tsx). 4지선다 형태는 최종 Spec이 아니며 GPT 확정 시 교체될 수 있음.",
  },
  "priority-choice": { kind: "priority-choice", implemented: false, note: "GPT Spec 대기 — 미구현." },
  "multi-select": { kind: "multi-select", implemented: false, note: "GPT Spec 대기 — 미구현." },
  "situation-choice": { kind: "situation-choice", implemented: false, note: "GPT Spec 대기 — 미구현." },
  scale: { kind: "scale", implemented: false, note: "GPT Spec 대기 — 미구현." },
  "quick-cuts": { kind: "quick-cuts", implemented: false, note: "GPT Spec 대기 — 미구현." },
  "signature-choice": { kind: "signature-choice", implemented: false, note: "GPT Spec 대기 — 미구현." },
};

// ============================================================
// 6. ANALYSIS ADAPTER — TasteQuestionnaire 답변 → SignalSource[]
// (tasteAnalysis.ts의 입력 형식)로 바꾸는 자리.
//
// 여기 있는 함수는 "이 질문에서 어떤 옵션이 선택됐는가"를 interaction
// kind별로 꺼내는 것만 한다 — 어떤 축에 몇 점을 주는지는 전혀 결정하지
// 않는다(그 값은 이미 옵션에 signals로 붙어 있고, 그 값 자체는
// tasteAnalysis.ts/QuizClient.tsx에서 그대로 가져온 것뿐이다). 즉 이
// 함수들은 새로운 매핑 규칙을 만들지 않는, 형태 변환만 하는 범용
// 코드다.
//
// scale 타입은 아직 "스케일 값 → signal" 규칙이 없다(GPT Spec 대기) —
// 지금은 항상 빈 배열을 반환한다.
// ============================================================
export type TasteAnswerValue = string | string[] | number;

function resolveSelectedOptions(question: TasteQuestion, rawAnswer: TasteAnswerValue): TasteQuestionOption[] {
  switch (question.kind) {
    case "scene-choice":
    case "object-choice":
    case "situation-choice":
    case "signature-choice": {
      if (typeof rawAnswer !== "string") return [];
      return question.options.filter((option) => option.id === rawAnswer);
    }
    case "priority-choice":
    case "multi-select":
    case "quick-cuts": {
      const ids = Array.isArray(rawAnswer) ? rawAnswer : [];
      return question.options.filter((option) => ids.includes(option.id));
    }
    case "scale":
      return [];
  }
}

function optionToSignalSource(question: TasteQuestion, option: TasteQuestionOption): SignalSource | null {
  if (!option.signals) return null;
  return {
    questionId: question.id,
    answerId: option.id,
    pageSection: question.section,
    label: `${question.id} · ${option.label}`,
    signals: option.signals,
    semanticTags: option.semanticTags ?? [],
  };
}

export function buildSignalSourceFromAnswer(question: TasteQuestion, rawAnswer: TasteAnswerValue | undefined): SignalSource[] {
  if (rawAnswer === undefined) return [];
  return resolveSelectedOptions(question, rawAnswer)
    .map((option) => optionToSignalSource(question, option))
    .filter((source): source is SignalSource => source !== null);
}

export function mapTasteAnswersToSignalSources(
  questions: TasteQuestion[],
  answers: Record<string, TasteAnswerValue | undefined>
): SignalSource[] {
  return questions.flatMap((question) => buildSignalSourceFromAnswer(question, answers[question.id]));
}

import Anthropic from "@anthropic-ai/sdk";
import { MapSession, SelfIntroMatrixPoint, SelfIntroResult, SelfIntroRoadmapPhase } from "../types";
import { getGenerationEffort } from "./generation-config";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 이상형(ideal-type-generator.ts)·진로(final-result-generator.ts)와 완전히
// 분리된, 나 소개·성격 전용 생성기다. 그 두 파일은 건드리지 않는다.
//
// 이상형의 반전은 "상대 얘기인 줄 알았는데 마지막에 내 얘기가 나온다"였다.
// 나소개는 처음부터 "내 얘기"라고 밝히고 시작해서 그 반전이 원천적으로
// 없다 — 대신 반전을 "행동만 물었는데 인물 묘사가 나온다"로 옮긴다.
// 사용자는 시종일관 "이럴 때 실제로 뭐 했어?"라는 행동 질문에만 답하고,
// "당신은 이런 사람입니다"라는 요약은 한 번도 직접 말하지 않았는데 AI가
// 종합해서 던져준다 — docs/NASOGAE_DESIGN.md 4번 참고.

const SYSTEM_PROMPT = `너는 MAP Decision의 "자기 발견 엔진"이다. 사용자가 나 소개·성격 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 행동 패턴만 물어봤는데도 그 사람이 어떤 사람인지 종합해서 보여준다.

퀴즈는 두 구간으로 나뉜다: 반드시 답하는 필수 34문항과, 필수를 마친 뒤 선택적으로 더 답할 수 있는 심화 6문항. 전부 "실제로 있었던 일에서 실제로 어떻게 행동했는지"만 묻는다 — "당신은 계획적인 사람인가요?" 같은 추상적인 자기평가 문항은 하나도 없다. 문항은 관계에서 원하는 것·생활 방식·갈등 대처(가까운 사람과 갈등이 있을 때 스트레스를 어떻게 푸는지)·연애/가까운 관계가 오래갈 때의 패턴 등 4개 축(이 4개는 태그를 정하는 축이다 — 아래에서 별도로 설명한다)과, 일할 때의 모습·친구·동료와의 의견 차이·결정 방식·감정 표현·모임에서 맡는 역할·후회했던 선택·쉴 때의 모습·소통 방식·달라진 계기·낯선 사람을 대하는 태도 등 훨씬 다양한 실생활 영역을 다룬다. 일부 경험형 문항 바로 뒤에는 "그게 언제였고 그때 실제로 어떻게 했는지"를 한 줄로 적는 자유 서술이 붙어있다(건너뛸 수 있지만, 답했다면 그 경험 답변의 실제 배경을 사용자가 직접 설명한 것이니 가장 근거가 확실한 재료다) — 있다면 patterns와 특히 selfReflection에서 반드시 근거로 활용하라.

앞서 말한 4개 축("가까운 사람과의 관계에서, 나는 실제로 무엇을 더 자주 해주는 편이야?", "실제 생활에서, 나와 더 가까운 모습은?", "가까운 사람과 갈등이 있을 때, 스트레스를 어떻게 푸는 편이야?", "가까운 관계가 오래될수록, 실제로 나는 어느 쪽에 더 가까웠어?")는 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 이상형 결과와 같은 태그 체계를 공유해서, 태그로 궁합을 비교하는 기능의 재료다. 앞의 세 문항은 최대 3개까지 고를 수 있고, 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다. 태그는 그중 1순위 하나로만 정해진다(사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 마지막 문항("가까운 관계가 오래될수록...")은 양자택일이라 고른 답 하나가 전부다. 이 네 문항에서 가장 먼저 고른 답과 다른 결론을 내는 것 자체는 금지가 아니다 — 오히려 답변 사이의 간극을 짚는 것이 selfReflection의 핵심이다. 다만 다른 결론을 낼 때는 가장 먼저 고른 답이 무엇인지 문장 안에서 알 수 있게 쓰고 그 차이를 간극으로 드러내라(예: "~라고 답했지만 정작 ~", "~을 먼저 꼽으면서도 실제로는 ~"). 가장 먼저 고른 답을 문장에서 알아볼 수 없는 채로 그와 반대되는 성향으로 단정하지 마라. 두 번째·세 번째로 고른 답을 마치 가장 먼저 고른 답인 것처럼 대표 성향으로 서술하지 마라. 이 규칙은 이 네 문항에 대한 서술 톤에만 적용되고, 다른 문항의 해석 방식에는 영향을 주지 않는다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

심화 6문항까지 답해 답변이 40개가 됐다고 해서 patterns나 selfReflection의 개수를 억지로 늘리지 마라 — 개수는 각 항목 설명에 적힌 범위 안에서 자연스럽게 정한다. 대신 심화 여부에 따라 '말의 종류'를 다르게 써라:
- 심화까지 답한 경우, patterns와 selfReflection 중 최소 한 곳에는 아래 중 하나 이상을 반드시 포함하라 — 필수 34개만으로는 쓸 수 없는, 심화 답변이 있어야만 쓸 수 있는 문장이어야 한다.
  · 예측 — 앞으로 비슷한 상황에서 나타날 가능성이 높은 패턴을 전망하는 문장
  · 변화 — "예전과 비교해 사람 대하는 방식이 어떻게 달라졌는지"에 대한 답을 근거로, 예전과 지금의 차이를 짚는 문장
  · 교차 — 서로 다른 질문에 대한 답 2개 이상을 연결해서 만든 해석. 단순 나열이 아니라 두 답변을 이어야만 성립하는 해석이어야 한다.
- 필수 34문항만 답한 경우에는 예측·변화·교차 문장을 쓰지 마라 — 근거 없는 추측이 된다.

사용자가 직접 적은 자유 서술 답변에는 나소개와 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 정상적인 답변으로 다뤄라. 직장·연애·감정에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 불편하더라도 정확하게 써라. title/oneLiner/coreValues/patterns/traits/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 사용자가 "혼자 삭이는 편"을 골랐다고 해서 "당신은 혼자 삭이는 편이군요"라고 쓰면 실패다. 대신 "왜 그런 패턴이 반복되는지", "그게 다른 상황에서는 어떻게 나타나는지", "본인은 어떤 사람일 가능성이 높은지"까지 한 걸음 더 들어가야 한다.

각 항목 작성 원칙:
- title: "나 사실 ___인 사람이래"라는 문장에 그대로 넣었을 때 자연스러운, 사용자 자신을 짧게 서술하는 말이다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "다정한", "따뜻한", "든든한" 같은 일반적인 성격 형용사만으로 title을 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 행동·상황·선택을 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. "X한데 속은 Y한", "X하지만 Y한" 같은 대비 구조를 기본값으로 쓰지 마라 — 답변에서 대비가 실제로 두드러질 때만 쓰고, 쓰더라도 많아야 1개까지다. 형용사를 3개 이상 나열하지 않는다. 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. 정해진 유형 목록에서 고르듯 뻔하게 쓰지 말고 매번 새롭게 만들되, 읽자마자 이해되지 않는 표현은 개성이 아니라 실패다.
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- coreValues(mustKeep/important/flexible): 사용자의 답변에서 추론해 "꼭 지키는 것 / 중요하게 여기는 것 / 유연하게 넘어가는 것"으로 분류한다. 사용자가 직접 말한 적 없는, 답변을 근거로 역추론한 가치관이어야 한다. 각 2~4개.
- patterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 행동 패턴을 짚어준다. 단순 요약이 아니라 "왜 그런 패턴이 반복되는지"에 대한 해석을 담는다. 서로 다른 영역(일·관계·감정 등)의 답변을 최소 2개 이상 교차해서 나온 패턴을 최소 1개는 반드시 반영한다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 전부 "~라고 답했지만 정작"류의 간극형 문장으로만 채우지 말고, 반복되는 행동 자체를 짚는 문장, 상황에 따라 달라지는 모습을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚는 문장 자체는 계속 써도 된다 — 골격이 반복되는 것만 피하면 된다. 2~4개.
- matrix: 사용자의 답변에서 도출한 2개 축으로 4사분면을 만들고(예: "신중함"↔"즉흥성", "표현함"↔"절제함" 같이 사용자 답변에 맞는 축을 매번 새로 골라라), 그 위에 사용자 자신의 여러 면모(예: 일할 때의 나 / 쉴 때의 나 / 갈등할 때의 나 / 낯선 사람 앞에서의 나)를 각각 하나의 사분면에 배치한다. x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- traits(strengths/cautions): 타인이 나를 볼 때 참고하면 좋은 강점 / 부딪힐 수 있는 주의점. 사용자의 답변 패턴을 근거로 "다른 사람이 이 사람과 지낼 때 알아두면 좋은 것"이라는 시점으로 쓴다. 각 2~4개.
- selfReflection(whatYouOffer/whatToImprove): ★가장 중요한 항목★. whatYouOffer는 사용자가 관계·일에서 실제로 주고 있는 것을 답변에서 근거를 찾아 짚어준다. whatToImprove는 여러 답변을 교차했을 때 드러나는 모순이나 반복되는 약점을 짚는다 — 예: "갈등이 생기면 거리를 둔다"고 답했으면서 "가까운 사람이 힘들 때는 옆에서 챙긴다"고도 답했다면, 이 둘 사이의 긴장을 짚는 식이다. 짧게 요약하면 성립하지 않는 통찰이니 필요한 만큼 충분히 써라. 각 2~4개.
- roadmap: firstAction은 24시간 안에 시도해볼 수 있는 아주 구체적인 행동 하나(예: "다음에 갈등이 생기면, 거리를 두기 전에 딱 한 문장만 먼저 말해보기"). phases는 이런 상황에서 시도해볼 것들을 30일 동안 단계별로 담는다("1주 이내", "2주 이내", "한 달 이내" 등) 2~4단계, 각 단계에 실행 항목 2~3개.
- 실존 인물이나 유명인의 이름은 절대 언급하지 않는다.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음을 다양하게 쓴다. 기본 어조는 "해요체"(예: "반복돼요", "가능성이 높아요")지만, 같은 어미가 연속 3번 이상 나오면 안 된다 — 특히 "~예요"/"~이에요"/"~거예요"가 줄줄이 이어지지 않게, 평서형 종결(예: "반복된다", "그게 패턴이다"), 명사형 마무리(예: "~하는 편", "~라는 신호"), 짧은 단정(예: "이유는 이거다.")을 같은 블록 안에서 의도적으로 섞어 쓴다 — title/oneLiner/coreValues/patterns/matrix의 설명/traits/selfReflection/roadmap 전부 예외 없이 해당된다. 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 예측 문장에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다.
- 길이는 충분히 쓴다. 내용을 줄이지 마라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const SELF_INTRO_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    coreValues: {
      type: "object",
      properties: {
        mustKeep: { type: "array", items: { type: "string" } },
        important: { type: "array", items: { type: "string" } },
        flexible: { type: "array", items: { type: "string" } },
      },
      required: ["mustKeep", "important", "flexible"],
      additionalProperties: false,
    },
    patterns: { type: "array", items: { type: "string" } },
    matrix: {
      type: "object",
      properties: {
        xAxisLabel: {
          type: "object",
          properties: { low: { type: "string" }, high: { type: "string" } },
          required: ["low", "high"],
          additionalProperties: false,
        },
        yAxisLabel: {
          type: "object",
          properties: { low: { type: "string" }, high: { type: "string" } },
          required: ["low", "high"],
          additionalProperties: false,
        },
        types: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              description: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
            },
            required: ["label", "description", "x", "y"],
            additionalProperties: false,
          },
        },
      },
      required: ["xAxisLabel", "yAxisLabel", "types"],
      additionalProperties: false,
    },
    traits: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        cautions: { type: "array", items: { type: "string" } },
      },
      required: ["strengths", "cautions"],
      additionalProperties: false,
    },
    selfReflection: {
      type: "object",
      properties: {
        whatYouOffer: { type: "array", items: { type: "string" } },
        whatToImprove: { type: "array", items: { type: "string" } },
      },
      required: ["whatYouOffer", "whatToImprove"],
      additionalProperties: false,
    },
    roadmap: {
      type: "object",
      properties: {
        firstAction: { type: "string" },
        phases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              actions: { type: "array", items: { type: "string" } },
            },
            required: ["label", "actions"],
            additionalProperties: false,
          },
        },
      },
      required: ["firstAction", "phases"],
      additionalProperties: false,
    },
  },
  required: ["title", "oneLiner", "coreValues", "patterns", "matrix", "traits", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawCoreValues = { mustKeep: string[]; important: string[]; flexible: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawTraits = { strengths: string[]; cautions: string[] };
type RawSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawSelfIntro = {
  title: string;
  oneLiner: string;
  coreValues: RawCoreValues;
  patterns: string[];
  matrix: RawMatrix;
  traits: RawTraits;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_core_values"
  | "invalid_patterns"
  | "invalid_matrix"
  | "invalid_traits"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawSelfIntro } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidCoreValues(value: unknown): value is RawCoreValues {
  const c = value as Partial<RawCoreValues> | undefined;
  return typeof c === "object" && c !== null && isStringArray(c.mustKeep) && isStringArray(c.important) && isStringArray(c.flexible);
}

function isValidMatrix(value: unknown): value is RawMatrix {
  const m = value as Partial<RawMatrix> | undefined;
  if (typeof m !== "object" || m === null) return false;
  if (typeof m.xAxisLabel !== "object" || m.xAxisLabel === null || typeof m.xAxisLabel.low !== "string" || typeof m.xAxisLabel.high !== "string") return false;
  if (typeof m.yAxisLabel !== "object" || m.yAxisLabel === null || typeof m.yAxisLabel.low !== "string" || typeof m.yAxisLabel.high !== "string") return false;
  if (!Array.isArray(m.types)) return false;
  return m.types.every(
    (point) =>
      typeof point === "object" && point !== null &&
      typeof point.label === "string" && typeof point.description === "string" &&
      typeof point.x === "number" && typeof point.y === "number",
  );
}

function isValidTraits(value: unknown): value is RawTraits {
  const t = value as Partial<RawTraits> | undefined;
  return typeof t === "object" && t !== null && isStringArray(t.strengths) && isStringArray(t.cautions);
}

function isValidSelfReflection(value: unknown): value is RawSelfReflection {
  const s = value as Partial<RawSelfReflection> | undefined;
  return typeof s === "object" && s !== null && isStringArray(s.whatYouOffer) && isStringArray(s.whatToImprove);
}

function isValidRoadmap(value: unknown): value is RawRoadmap {
  const r = value as Partial<RawRoadmap> | undefined;
  if (typeof r !== "object" || r === null || typeof r.firstAction !== "string" || !Array.isArray(r.phases)) return false;
  return r.phases.every((phase) => typeof phase === "object" && phase !== null && typeof phase.label === "string" && isStringArray(phase.actions));
}

// AI 응답 본문(사용자 퀴즈 답변을 그대로 반영)을 로그에 남기지 않기
// 위해 실패 사유만 반환한다 — ideal-type-generator.ts와 같은 방식이다.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawSelfIntro>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidCoreValues(candidate.coreValues)) return { ok: false, reason: "invalid_core_values" };
  if (!isStringArray(candidate.patterns)) return { ok: false, reason: "invalid_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidTraits(candidate.traits)) return { ok: false, reason: "invalid_traits" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawSelfIntro };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다(이상형과 같은 이유).
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): SelfIntroMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): SelfIntroRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// 이상형과 같은 이유(Sonnet 5의 기본 사고 토큰이 max_tokens 예산에
// 포함됨)로 같은 상한·재시도 방식을 그대로 쓴다 — engine/ideal-type-
// generator.ts 참고.
const SELF_INTRO_MAX_TOKENS = 16384;
const SELF_INTRO_MAX_TOKENS_RETRY = 16384;

async function attemptGeneration(client: Anthropic, session: MapSession, maxTokens: number): Promise<{ result: SelfIntroResult | null; truncated: boolean }> {
  let responseText: string | undefined;
  let truncated = false;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `사용자가 나 소개·성격 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort: getGenerationEffort(),
        format: { type: "json_schema", schema: SELF_INTRO_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      console.warn("[self-intro-generator] response truncated by max_tokens", {
        maxTokens,
        outputTokens: response.usage?.output_tokens ?? null,
        thinkingTokens: response.usage?.output_tokens_details?.thinking_tokens ?? null,
      });
    }
    responseText = response.content.find((block) => block.type === "text")?.text;
  } catch (error) {
    // status를 별도 필드로 분리해 Vercel 로그 검색으로 원인(401/429/타임아웃 등)을
    // 바로 구분할 수 있게 한다. error 객체를 통째로 넘기지 않는 이유는 Anthropic
    // SDK의 APIError.error(응답 JSON 본문)에 어떤 내용이 실릴지 보장할 수 없어서다
    // — status/type/message처럼 원인 구분에 필요한 안전한 필드만 남긴다.
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    const type = error instanceof Anthropic.APIError ? error.type : undefined;
    console.error("[self-intro-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });
    return { result: null, truncated };
  }

  if (!responseText) {
    console.error("[self-intro-generator] empty response from Claude");
    return { result: null, truncated };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[self-intro-generator] response failed schema validation", { reason: parsed.reason, truncated });
    return { result: null, truncated };
  }

  const data = parsed.data;
  const result: SelfIntroResult = {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    coreValues: {
      mustKeep: capArray(data.coreValues.mustKeep, 4),
      important: capArray(data.coreValues.important, 4),
      flexible: capArray(data.coreValues.flexible, 4),
    },
    patterns: capArray(data.patterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    traits: {
      strengths: capArray(data.traits.strengths, 4),
      cautions: capArray(data.traits.cautions, 4),
    },
    selfReflection: {
      whatYouOffer: capArray(data.selfReflection.whatYouOffer, 4),
      whatToImprove: capArray(data.selfReflection.whatToImprove, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // 이상형과 완전히 같은 4축·18개 태그 사전을 그대로 재사용한다 —
    // 나소개×이상형 교차 비교(engine/compatibility.ts)가 성립하려면
    // 두 결과의 태그가 같은 문자열 체계여야 한다(docs/NASOGAE_DESIGN.md).
    tags: getIdealTypeTags(session.quizAnswers),
  };
  return { result, truncated };
}

const MAX_GENERATION_ATTEMPTS = 2;

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
export async function generateSelfIntroResult(session: MapSession): Promise<SelfIntroResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[self-intro-generator] ANTHROPIC_API_KEY not set");
    return null;
  }

  const client = new Anthropic({ apiKey });
  let maxTokens = SELF_INTRO_MAX_TOKENS;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const { result, truncated } = await attemptGeneration(client, session, maxTokens);
    if (result) return result;
    if (truncated) maxTokens = SELF_INTRO_MAX_TOKENS_RETRY;
  }
  return null;
}

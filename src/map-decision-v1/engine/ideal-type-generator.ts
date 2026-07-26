import Anthropic from "@anthropic-ai/sdk";
import { IdealTypeMatrixPoint, IdealTypeResult, IdealTypeRoadmapPhase, MapSession } from "../types";
import { getIdealTypeSilhouette } from "./ideal-type-silhouette";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 진로(final-result-generator.ts)와 완전히 분리된, 이상형 전용 생성기.
// 진로의 4블록 로직/스키마는 건드리지 않는다.
//
// 이상형 결과는 얕은 "정리"가 아니라 입력을 재료로 한 "발견"이어야 한다.
// 특히 attractionPatterns(끌림 패턴)와 selfReflection(자기 성찰)은
// 사용자가 스스로 말하지 않은 것을 짚어야 이 기능의 임팩트가 산다 —
// 시스템 프롬프트에서 이 두 항목을 특히 강하게 강조한다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "이상형 발견 엔진"이다. 사용자가 이상형 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 그 사람도 몰랐던 자신의 끌림 패턴과 관계 성향을 발견해서 보여준다.

퀴즈는 두 구간으로 나뉜다: 반드시 답하는 필수 30문항(빠른 탭형 13개 — 대부분 외모·스타일·말투 등 이상형에 대한 단순한 취향을 한눈에 골라 답하는 질문이지만, 그중 2개(요즘 마음 상태, 관계에서 주로 맡는 역할)는 이상형이 아니라 지금 사용자 자신의 상태·역할을 묻는 질문이다 / 선호형 6개 — 성격, 가치관, 연애 방식, 라이프스타일, 끌리는 순간 등 여러 선택지 중 우선순위를 고르는 질문 / 양자택일형 6개 — 둘 중 하나를 고르는 우선순위 질문 / 경험·행동형 5개 — 가까운 관계에서 실제로 어땠는지 묻는 질문, 예: 관계가 멀어질 때의 패턴, 갈등 시 스트레스 대처, 돌아봤을 때의 아쉬움, 감정 기복, 예전과 달라진 점)과, 필수를 마친 뒤 선택적으로 더 답할 수 있는 심화 8문항(경험·행동형 4개 — 진지해지는 순간, 사과 방식, 주변의 성취를 대하는 태도, 연애 초반 스타일 등 더 세밀한 경험 질문 / 양자택일형 2개 / 선호형 2개). 즉 필수 문항만 답했더라도 경험·행동형 답변이 최소 5개는 항상 있다 — "질문: 돌아보면...", "질문: 가까웠던 관계가 멀어질 때..." 처럼 실제 경험을 묻는 질문에 대한 답은 사용자가 스스로를 돌아보고 준 재료이니, 몇 개가 있든 attractionPatterns와 특히 selfReflection에서 추측이 아니라 그 답을 직접 근거로 삼아 반영하라. "요즘 마음 상태"와 "관계에서 주로 맡는 역할"에 대한 답도 selfReflection의 재료로 적극 활용하라 — 이상형 취향이 아니라 지금 사용자 자신을 직접 말해주는 답이라 다른 어떤 문항보다도 selfReflection에 곧바로 쓸 수 있다.

심화 8문항까지 답해 경험·행동형 답변이 9개(필수 5개 + 심화 4개)가 됐다고 해서 attractionPatterns나 selfReflection의 개수를 억지로 늘리지 마라 — 개수는 각 항목 설명에 적힌 범위 안에서 자연스럽게 정하면 된다. 대신 심화 여부에 따라 '말의 종류'를 다르게 써라:
- 심화까지 답해 경험·행동형 답변이 9개가 된 경우, attractionPatterns와 selfReflection 중 최소 한 곳에는 아래 세 종류 중 하나 이상을 반드시 포함하라 — 필수 5개만으로는 쓸 수 없는, 심화 답변이 있어야만 쓸 수 있는 문장이어야 한다.
  · 예측 — 앞으로의 관계에서 나타날 가능성이 높은 패턴을 전망하는 문장(예: "다음 관계에서는 이런 사람에게 끌릴 가능성이 높아요")
  · 변화 — 심화 문항 중 "예전과 비교해 관계 맺는 방식이 어떻게 달라졌는지"에 대한 답을 근거로, 예전과 지금의 차이를 짚는 문장
  · 교차 — 서로 다른 질문에 대한 답변 2개 이상(예: 돌아봤을 때 아쉬웠던 점 + 예전과 달라진 점처럼 다른 시점·다른 질문의 답)을 연결해서 만든 해석. 단순 나열이 아니라 두 답변을 이어야만 성립하는 해석이어야 한다.
  좋은 예(아쉬움 답변과 예측을 교차한 문장): "돌아봤을 때 '대화를 더 시도할걸'이 가장 아쉬웠다고 답한 것은 스스로도 이 회피 패턴을 인지하고 있다는 신호예요. 그래서 다음 관계에서는 유독 '먼저 다가와 알아봐주는 사람'에게 더 강하게 끌릴 가능성이 높아요."
- 필수 30문항만 답해 경험·행동형 답변이 5개뿐인 경우에는 예측·변화·교차 문장을 쓰지 마라 — 근거 없는 추측이 된다. 지금 있는 답변만으로 확인 가능한 해석에 머물러라.

사용자가 직접 적은 자유 서술 답변에는 이상형과 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 이상형과 관련된 정상적인 답변으로 다뤄라. 연애·감정·관계에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 배제 대상이 아닌 내용을 이 지시 때문에 얼버무리거나 약화시키지 말고, 불편하더라도 정확하게 써라. title/oneLiner/criteria/attractionPatterns/flags/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라. 자유 서술이 이상형과 완전히 무관하면 그 부분만 무시하고 나머지 선택지 답변으로 결과를 구성하라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 예를 들어 사용자가 "차분한 사람"을 골랐다고 해서 결과에 "당신은 차분한 사람을 좋아하는군요"라고 쓰면 실패다. 대신 "왜 그런 패턴이 반복되는지", "그 선택이 무엇을 암시하는지", "본인은 어떤 사람일 가능성이 높은지"까지 한 걸음 더 들어가야 한다. 말로 전달해도 되는 수준의 정리는 이 기능의 가치가 없다 — 사용자 혼자서는 눈치채기 어려운 통찰을 줘야 한다.

각 항목 작성 원칙:
- title: 이상형 전체를 위트있게 요약하는 짧은 별명(10자 내외). 가볍고 재미있되 무례하지 않게.
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- criteria(mustHave/niceToHave/canCompromise): 사용자의 답변에서 우선순위를 추론해 "꼭 필요한 것 / 있으면 좋은 것 / 없어도 괜찮은 것"으로 재분류한다. 각 2~4개.
- attractionPatterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 끌림의 패턴을 짚어준다. 단순 요약이 아니라 "왜 그런 것에 끌리는지"에 대한 해석을 담는다. 경험·행동형 답변(항상 최소 3개 있음)에서 나온 실제 패턴을 최소 1개는 반드시 반영한다. 2~4개.
- matrix: "끌림 강도"(x축)와 "관계 적합도"(y축) 2개 축으로 4사분면을 만들고, 그 위에 사용자의 답변에서 도출한 4가지 상대방 유형을 각각 하나의 사분면에 배치한다(설레지만 신중히 볼 사람 / 이상적인 사람 / 관심이 덜 가는 사람 / 좋은 인연 후보 같은 4가지 성격의 유형). x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- flags(green/red): 사용자의 답변 패턴을 근거로 실제 상대를 만날 때 참고할 좋은 신호 / 주의 신호. 각 2~4개.
- selfReflection(whatYouOffer/whatToImprove): ★가장 중요한 항목★. 이상형에 대한 답변을 거꾸로 뒤집어서 사용자 자신에 대한 통찰을 준다 — "이런 사람에게 끌린다는 것은, 본인은 이런 면을 가지고 있거나 이런 걸 줄 수 있는 사람일 가능성이 높다"는 식의 역추론. whatToImprove는 사용자가 이상형에게 바라는 것과 본인의 현재 모습 사이의 간극에서 나오는 보완점을 짚는다. 경험·행동형 답변(관계가 멀어질 때의 패턴, 갈등 대처, 아쉬웠던 점 — 항상 최소 3개 있음)은 추측이 아니라 사용자가 직접 답한 실제 패턴이니, whatToImprove에 그 내용을 근거로 한 항목을 최소 1개는 반드시 포함한다. 각 2~4개.
- roadmap: firstAction은 24시간 안에 실천할 수 있는 아주 구체적인 행동 하나. phases는 30일 동안의 단계별 계획(예: "1주 이내", "2주 이내", "한 달 이내") 2~4단계, 각 단계에 실행 항목 2~3개.
- 실존 인물이나 유명인의 이름은 절대 언급하지 않는다.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 모든 출력 문장의 어미는 "~해요/~이에요"체로 통일한다(예: "반복돼요", "가능성이 높아요"). "~다/~이다"체(예: "반복된다", "가능성이 높다")는 쓰지 않는다 — title/oneLiner/criteria/attractionPatterns/matrix의 type 설명/flags/selfReflection/roadmap 전부 예외 없이 해당된다. 이건 어미만 맞추라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 위에서 말한 대로 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 문장 끝맺음만 "~해요/~이에요"체로 맞춰라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const IDEAL_TYPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    criteria: {
      type: "object",
      properties: {
        mustHave: { type: "array", items: { type: "string" } },
        niceToHave: { type: "array", items: { type: "string" } },
        canCompromise: { type: "array", items: { type: "string" } },
      },
      required: ["mustHave", "niceToHave", "canCompromise"],
      additionalProperties: false,
    },
    attractionPatterns: { type: "array", items: { type: "string" } },
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
    flags: {
      type: "object",
      properties: {
        green: { type: "array", items: { type: "string" } },
        red: { type: "array", items: { type: "string" } },
      },
      required: ["green", "red"],
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
  required: ["title", "oneLiner", "criteria", "attractionPatterns", "matrix", "flags", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawCriteria = { mustHave: string[]; niceToHave: string[]; canCompromise: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawFlags = { green: string[]; red: string[] };
type RawSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawIdealType = {
  title: string;
  oneLiner: string;
  criteria: RawCriteria;
  attractionPatterns: string[];
  matrix: RawMatrix;
  flags: RawFlags;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_criteria"
  | "invalid_attraction_patterns"
  | "invalid_matrix"
  | "invalid_flags"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawIdealType } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidCriteria(value: unknown): value is RawCriteria {
  const c = value as Partial<RawCriteria> | undefined;
  return typeof c === "object" && c !== null && isStringArray(c.mustHave) && isStringArray(c.niceToHave) && isStringArray(c.canCompromise);
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

function isValidFlags(value: unknown): value is RawFlags {
  const f = value as Partial<RawFlags> | undefined;
  return typeof f === "object" && f !== null && isStringArray(f.green) && isStringArray(f.red);
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

// Returns a failure reason instead of the raw text so callers never need to
// log the AI response body (which echoes the user's whole quiz answers) just
// to know why validation failed.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawIdealType>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidCriteria(candidate.criteria)) return { ok: false, reason: "invalid_criteria" };
  if (!isStringArray(candidate.attractionPatterns)) return { ok: false, reason: "invalid_attraction_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidFlags(candidate.flags)) return { ok: false, reason: "invalid_flags" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawIdealType };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다.
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): IdealTypeMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): IdealTypeRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

async function attemptGeneration(client: Anthropic, session: MapSession): Promise<IdealTypeResult | null> {
  let responseText: string | undefined;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      // Sonnet 5는 기본적으로 내부 사고(thinking)가 켜져 있어서 그 토큰도
      // 이 한도 안에 포함된다 — 진로 결과 생성에서 4096으로는 중간에
      // 잘리던 것을 8192로 올려 해결했던 것과 같은 이유로 넉넉히 잡는다.
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `사용자가 이상형 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: IDEAL_TYPE_SCHEMA },
      },
    });
    responseText = response.content.find((block) => block.type === "text")?.text;
  } catch (error) {
    console.error("[ideal-type-generator] Claude API call failed", error);
    return null;
  }

  if (!responseText) {
    console.error("[ideal-type-generator] empty response from Claude");
    return null;
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[ideal-type-generator] response failed schema validation", { reason: parsed.reason });
    return null;
  }

  const data = parsed.data;
  return {
    version: 2,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    criteria: {
      mustHave: capArray(data.criteria.mustHave, 4),
      niceToHave: capArray(data.criteria.niceToHave, 4),
      canCompromise: capArray(data.criteria.canCompromise, 4),
    },
    // 화면에 너무 많이 나오지 않도록 자르는 상한 — 심화 답변 여부에 따라
    // 개수를 다르게 유도하지 않는다(그건 이제 프롬프트의 "말의 종류"
    // 지시로 처리한다). 필수/심화 모두 이 범위 안에서 자연스럽게 채워진다.
    attractionPatterns: capArray(data.attractionPatterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    flags: {
      green: capArray(data.flags.green, 4),
      red: capArray(data.flags.red, 4),
    },
    selfReflection: {
      whatYouOffer: capArray(data.selfReflection.whatYouOffer, 4),
      whatToImprove: capArray(data.selfReflection.whatToImprove, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // AI가 만든 필드가 아니다 — 퀴즈 답변(session.quizAnswers)만 보고
    // 코드로 결정적으로 고른 공유 태그. AI 응답 파싱과 무관하게 항상
    // 붙인다(session.quizAnswers가 없는 예전 세션이면 빈 배열).
    tags: getIdealTypeTags(session.quizAnswers),
    // AI가 만든 필드가 아니다 — 태그와 마찬가지로 퀴즈 답변만 보고
    // 코드로 결정적으로 고른 "외모 취향 실루엣" 부품 조합.
    silhouette: getIdealTypeSilhouette(session.quizAnswers),
  };
}

const MAX_GENERATION_ATTEMPTS = 2;

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
export async function generateIdealTypeResult(session: MapSession): Promise<IdealTypeResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const result = await attemptGeneration(client, session);
    if (result) return result;
  }
  return null;
}

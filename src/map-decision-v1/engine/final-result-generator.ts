import Anthropic from "@anthropic-ai/sdk";
import { FactorMatrixBlock, FinalResult, InsightBlock, MapSession, NodeKind, ResultBlockKey, ScenarioBlock, TimelineBlock } from "../types";
import { createId, now } from "./session";
import { NODE_KINDS } from "./ai-node-extractor";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";

const SYSTEM_PROMPT = `너는 MAP Decision의 최종 결과 생성 엔진이다. 지금까지 나눈 대화 전체를 바탕으로, 사용자가 스스로 정리하지 못했던 의사결정 구조를 4개 블록으로 만든다.

대화 중에는 의사결정 정리와 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 의사결정과 관련된 정상적인 입력으로 다뤄라. 직장 상사·동료에 대한 불만이나 연애·감정·관계에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 insights는 사용자를 정면으로 비추는 통찰이어야 한다: 배제 대상이 아닌 내용을 이 지시 때문에 얼버무리거나 약화시키지 말고, 불편하더라도 정확하게 써라. factor_matrix의 요인 설명, scenarios의 이름·설명, timeline의 행동, insights의 메시지를 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라. 관련 있는 내용이 적으면 있는 그대로 담백하게 정리하되, 배제 대상으로 억지로 채우지 마라.

실존 인물이나 유명인의 이름은 절대 언급하지 않는다. 사용자가 대화 중 상사·동료·가족·지인 등 제3자를 실명이나 특정 개인임을 알 수 있는 호칭으로 언급했더라도, factor_matrix·scenarios·timeline·insights 어디에도 그 이름이나 호칭을 그대로 옮기지 마라. 대신 "상사", "동료", "가족", "친구"처럼 관계를 가리키는 일반적인 표현으로 바꿔 쓴다 — 이런 관계 표현은 결과를 이해하는 데 필요하므로 그대로 써도 된다. 이건 식별 정보만 지우라는 지시이지, 그 인물이 얽힌 상황·감정·갈등의 내용을 얼버무리거나 완곡하게 순화하라는 뜻이 아니다 — 위에서 말했듯 불편하더라도 내용 자체는 그대로 정확하게 써라.

원칙: 정답을 대신 정하지 않는다. 시나리오 비교에서 closest_fit은 "가장 가까운 방향"을 근거와 함께 제시하는 것이지, 강제로 하나를 골라주는 게 아니다. 대화만으로 판단 근거가 부족하면 closest_fit을 null로 두어라.

1) factor_matrix: 대화에서 드러난 요인들을 뽑아 2x2 매트릭스에 배치한다. 최대 8개까지만 뽑는다. x_axis_label/y_axis_label은 이 대화 상황에 맞는 축을 스스로 정한다(예: 통제 가능성 x 영향력, 단기 x 장기). 각 요인의 kind는 topic/trigger/fact/emotion/person/value/reason/constraint/option/benefit/risk/missing/direction/action/correction 중 정확히 하나이고, x/y는 0~100 사이 값이다.

2) scenarios: 현실적인 시나리오 2~4개를 만들고 각각 장단점을 적는다. closest_fit은 그 중 대화 맥락과 가장 맞닿아 있는 방향과 이유(reasoning)를 담되, 근거가 약하면 null로 둔다.

3) timeline: 단계별(예: "1주 이내", "1개월 이내", "3개월 이후") 행동 계획을 만든다.

4) insights: 사용자가 대화에서 스스로 말하지 않았던 관점을 2~4개 담는다.

입력은 한국어 대화이며, 모든 출력 텍스트도 한국어로 담백하고 신뢰가 가는 어조로 작성한다.`;

const FACTOR_MATRIX_SCHEMA = {
  type: "object",
  properties: {
    x_axis_label: {
      type: "object",
      properties: { low: { type: "string" }, high: { type: "string" } },
      required: ["low", "high"],
      additionalProperties: false,
    },
    y_axis_label: {
      type: "object",
      properties: { low: { type: "string" }, high: { type: "string" } },
      required: ["low", "high"],
      additionalProperties: false,
    },
    factors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          kind: { type: "string", enum: NODE_KINDS },
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["text", "kind", "x", "y"],
        additionalProperties: false,
      },
    },
  },
  required: ["x_axis_label", "y_axis_label", "factors"],
  additionalProperties: false,
} as const;

const SCENARIOS_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          summary: { type: "string" },
          pros: { type: "array", items: { type: "string" } },
          cons: { type: "array", items: { type: "string" } },
        },
        required: ["name", "summary", "pros", "cons"],
        additionalProperties: false,
      },
    },
    closest_fit: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          properties: {
            scenario_name: { type: "string" },
            reasoning: { type: "string" },
          },
          required: ["scenario_name", "reasoning"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ["items", "closest_fit"],
  additionalProperties: false,
} as const;

const TIMELINE_SCHEMA = {
  type: "object",
  properties: {
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
  required: ["phases"],
  additionalProperties: false,
} as const;

const INSIGHTS_SCHEMA = {
  type: "object",
  properties: {
    messages: { type: "array", items: { type: "string" } },
  },
  required: ["messages"],
  additionalProperties: false,
} as const;

const FINAL_RESULT_SCHEMA = {
  type: "object",
  properties: {
    factor_matrix: FACTOR_MATRIX_SCHEMA,
    scenarios: SCENARIOS_SCHEMA,
    timeline: TIMELINE_SCHEMA,
    insights: INSIGHTS_SCHEMA,
  },
  required: ["factor_matrix", "scenarios", "timeline", "insights"],
  additionalProperties: false,
} as const;

type RawFactorMatrix = {
  x_axis_label: { low: string; high: string };
  y_axis_label: { low: string; high: string };
  factors: Array<{ text: string; kind: string; x: number; y: number }>;
};
type RawScenarios = {
  items: Array<{ name: string; summary: string; pros: string[]; cons: string[] }>;
  closest_fit: { scenario_name: string; reasoning: string } | null;
};
type RawTimeline = { phases: Array<{ label: string; actions: string[] }> };
type RawInsights = { messages: string[] };

type RawFinalResult = {
  factor_matrix: RawFactorMatrix;
  scenarios: RawScenarios;
  timeline: RawTimeline;
  insights: RawInsights;
};

function isNodeKind(value: string): value is NodeKind {
  return (NODE_KINDS as string[]).includes(value);
}

function isValidFactorMatrix(value: unknown): value is RawFactorMatrix {
  const fm = value as Partial<RawFactorMatrix> | undefined;
  if (
    typeof fm !== "object" || fm === null ||
    typeof fm.x_axis_label !== "object" || fm.x_axis_label === null ||
    typeof fm.x_axis_label.low !== "string" || typeof fm.x_axis_label.high !== "string" ||
    typeof fm.y_axis_label !== "object" || fm.y_axis_label === null ||
    typeof fm.y_axis_label.low !== "string" || typeof fm.y_axis_label.high !== "string" ||
    !Array.isArray(fm.factors)
  ) {
    return false;
  }
  return fm.factors.every(
    (factor) =>
      typeof factor === "object" && factor !== null &&
      typeof factor.text === "string" && typeof factor.kind === "string" && isNodeKind(factor.kind) &&
      typeof factor.x === "number" && typeof factor.y === "number",
  );
}

function isValidScenarios(value: unknown): value is RawScenarios {
  const sc = value as Partial<RawScenarios> | undefined;
  if (typeof sc !== "object" || sc === null || !Array.isArray(sc.items)) return false;
  const itemsValid = sc.items.every(
    (scenario) =>
      typeof scenario === "object" && scenario !== null &&
      typeof scenario.name === "string" && typeof scenario.summary === "string" &&
      Array.isArray(scenario.pros) && scenario.pros.every((p) => typeof p === "string") &&
      Array.isArray(scenario.cons) && scenario.cons.every((c) => typeof c === "string"),
  );
  if (!itemsValid) return false;
  if (sc.closest_fit === null) return true;
  return (
    typeof sc.closest_fit === "object" && sc.closest_fit !== null &&
    typeof sc.closest_fit.scenario_name === "string" && typeof sc.closest_fit.reasoning === "string"
  );
}

function isValidTimeline(value: unknown): value is RawTimeline {
  const tl = value as Partial<RawTimeline> | undefined;
  if (typeof tl !== "object" || tl === null || !Array.isArray(tl.phases)) return false;
  return tl.phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      typeof phase.label === "string" &&
      Array.isArray(phase.actions) && phase.actions.every((a) => typeof a === "string"),
  );
}

function isValidInsights(value: unknown): value is RawInsights {
  const ins = value as Partial<RawInsights> | undefined;
  return typeof ins === "object" && ins !== null && Array.isArray(ins.messages) && ins.messages.every((m) => typeof m === "string");
}

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_factor_matrix"
  | "invalid_scenarios"
  | "invalid_timeline"
  | "invalid_insights";

export type ParseResult = { ok: true; data: RawFinalResult } | { ok: false; reason: ParseFailureReason };

// Returns a failure reason instead of the raw text so callers never need to
// log the AI response body (which echoes the user's whole conversation) just
// to know why validation failed.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawFinalResult>;

  if (!isValidFactorMatrix(candidate.factor_matrix)) return { ok: false, reason: "invalid_factor_matrix" };
  if (!isValidScenarios(candidate.scenarios)) return { ok: false, reason: "invalid_scenarios" };
  if (!isValidTimeline(candidate.timeline)) return { ok: false, reason: "invalid_timeline" };
  if (!isValidInsights(candidate.insights)) return { ok: false, reason: "invalid_insights" };

  return { ok: true, data: candidate as RawFinalResult };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(대화 없음)";
  return session.messages.map((message) => `${message.role === "user" ? "사용자" : "AI"}: ${message.text}`).join("\n");
}

function buildFactorMatrixBlock(raw: RawFactorMatrix): FactorMatrixBlock {
  return {
    xAxisLabel: raw.x_axis_label,
    yAxisLabel: raw.y_axis_label,
    factors: raw.factors.slice(0, 8).map((factor) => ({
      id: createId("factor"),
      text: factor.text,
      kind: factor.kind as NodeKind,
      x: factor.x,
      y: factor.y,
    })),
  };
}

function buildScenarioBlock(raw: RawScenarios): ScenarioBlock {
  const scenarios = raw.items.map((scenario) => ({
    id: createId("scenario"),
    name: scenario.name,
    summary: scenario.summary,
    pros: scenario.pros,
    cons: scenario.cons,
  }));
  const closestFitRaw = raw.closest_fit;
  const closestFit = closestFitRaw
    ? (() => {
        const match = scenarios.find((scenario) => scenario.name === closestFitRaw.scenario_name);
        return match ? { scenarioId: match.id, reasoning: closestFitRaw.reasoning } : null;
      })()
    : null;
  return { scenarios, closestFit };
}

function buildTimelineBlock(raw: RawTimeline): TimelineBlock {
  return {
    phases: raw.phases.map((phase) => ({
      id: createId("phase"),
      label: phase.label,
      actions: phase.actions,
    })),
  };
}

function buildInsightBlock(raw: RawInsights): InsightBlock {
  return { messages: raw.messages };
}

// Sonnet 5는 명시하지 않아도 내부 사고(thinking)가 기본 켜져 있고("effort"
// 기본값 high), 그 사고 토큰이 max_tokens 예산과 과금 출력 토큰에 그대로
// 포함된다(Anthropic 공식 마이그레이션 문서 확인). 8192였던 이전 상한은
// 구형 모델 기준으로 잡은 값이라 새 토크나이저(같은 텍스트에 약 30% 더
// 많은 토큰)와 사고 토큰까지 더해지면 부족할 수 있다 — 1차 시도가
// 잘리면(stop_reason === "max_tokens") 2차는 더 큰 상한으로 재시도한다.
// 단, 이 호출은 스트리밍을 쓰지 않는 client.messages.create() 방식이라
// Anthropic 공식 문서가 명시한 "논스트리밍은 max_tokens 16,000 초과 시
// 어느 모델이든 SDK/인프라 타임아웃 위험이 있다(그럴 경우 스트리밍으로
// 전환)"는 상한을 넘기지 않도록 24576이 아니라 16384로 제한한다. 재시도가
// 1차와 같은 상한을 쓰게 되어 "예산을 키워서 구제"하는 효과는 약해지지만,
// 재시도가 타임아웃으로 죽어 사용자가 아무것도 못 받는 것보다는 안전하다.
// 16384에서도 계속 잘리면 스트리밍 전환이 필요하다는 신호 — 별도 승인 후
// 처리한다.
const FULL_GENERATION_MAX_TOKENS = 16384;
const FULL_GENERATION_MAX_TOKENS_RETRY = 16384;

// One attempt: call Sonnet, parse, validate. Returns null on any failure so
// generateFinalResult can retry it without duplicating this logic.
//
// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한에 넣을지.
// 서버 쪽 원인(engine/generation-error.ts)은 false, 빈 응답·스키마
// 검증 실패는 항상 true — ideal-type-generator.ts와 같은 원칙이다.
async function attemptFullGeneration(client: Anthropic, session: MapSession, maxTokens: number): Promise<{ result: FinalResult | null; truncated: boolean; countsAsFailure: boolean }> {
  let responseText: string | undefined;
  let truncated = false;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      // Was 4096 — confirmed in production that a long conversation makes
      // the model's 4-block output (unbounded scenario/timeline/insight
      // array sizes) hit this ceiling mid-JSON, producing a truncated,
      // unparseable response that fell through to the fallback. Raising the
      // ceiling doesn't cost anything for normal-length results — Anthropic
      // bills actual completion tokens generated, not this max — it only
      // lets the genuinely long cases finish instead of getting cut off.
      max_tokens: maxTokens,
      // 시스템 프롬프트는 매 호출마다 완전히 동일한 문자열이다 — 캐시
      // breakpoint를 걸어두면 같은 5분 안의 다음 호출부터 이 부분의
      // 입력 요금이 크게 줄어든다. 결과 품질에는 영향이 없다.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `지금까지 나눈 대화 전체:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort: getGenerationEffort(),
        format: { type: "json_schema", schema: FINAL_RESULT_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      // 사용자 입력·응답 내용은 절대 로그에 넣지 않는다 — 토큰 수치만.
      console.warn("[final-result-generator] full generation truncated by max_tokens", {
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
    // — status/type/message처럼 원인 구분에 필요한 안전한 필드만 남긴다(#132와 동일).
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    const type = error instanceof Anthropic.APIError ? error.type : undefined;
    const serverSide = isServerSideGenerationError(error);
    console.error("[final-result-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[final-result-generator] empty response from Claude");
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[final-result-generator] response failed schema validation", { reason: parsed.reason, truncated });
    return { result: null, truncated, countsAsFailure: true };
  }

  return {
    result: {
      version: 1,
      generatedAt: now(),
      model: "claude-sonnet-5",
      factorMatrix: buildFactorMatrixBlock(parsed.data.factor_matrix),
      scenarios: buildScenarioBlock(parsed.data.scenarios),
      timeline: buildTimelineBlock(parsed.data.timeline),
      insights: buildInsightBlock(parsed.data.insights),
    },
    truncated,
    countsAsFailure: false,
  };
}

const MAX_GENERATION_ATTEMPTS = 2;

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// Retries once on a transient failure (network error, malformed/invalid
// response) before giving up — but only if a key is configured, since a
// missing key fails the exact same way every time. The retry happens inside
// this single call, so the API route's one rate-limit check per request
// still only ever counts as one attempt against the user's budget, even
// though up to two Claude calls may happen underneath it.
export type FinalResultGenerationOutcome = { result: FinalResult | null; countsAsFailure: boolean };

// countsAsFailure(반환값): rate-limit.ts의 세션당 실패 상한에 넣을지 —
// ideal-type-generator.ts의 같은 이름 값과 같은 규칙이다. API 키 미설정도
// 여기서 로그를 남긴다(#132가 이상형·나소개에만 추가했던 걸 여기도
// 맞춤 — 세 생성 경로가 gen-fail 카운터를 공유해서 진단 로그도 맞춰야
// 원인 추적이 된다).
export async function generateFinalResult(session: MapSession): Promise<FinalResultGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[final-result-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  let maxTokens = FULL_GENERATION_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptFullGeneration(client, session, maxTokens);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = FULL_GENERATION_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

// --- Single-block regeneration ---
// Lets the result screen re-ask for just one block (e.g. after more
// conversation happened, or the user didn't like that block) instead of
// paying for a full 4-block regeneration every time.

type BlockValueMap = {
  factorMatrix: FactorMatrixBlock;
  scenarios: ScenarioBlock;
  timeline: TimelineBlock;
  insights: InsightBlock;
};

const BLOCK_JSON_KEY: Record<ResultBlockKey, keyof RawFinalResult> = {
  factorMatrix: "factor_matrix",
  scenarios: "scenarios",
  timeline: "timeline",
  insights: "insights",
};

const BLOCK_JSON_SCHEMA: Record<ResultBlockKey, object> = {
  factorMatrix: FACTOR_MATRIX_SCHEMA,
  scenarios: SCENARIOS_SCHEMA,
  timeline: TIMELINE_SCHEMA,
  insights: INSIGHTS_SCHEMA,
};

const BLOCK_INTRO =
  "너는 MAP Decision의 최종 결과 생성 엔진이다. 사용자가 특정 블록만 다시 만들어달라고 요청했다. 지금까지 나눈 대화 전체(가장 최근에 나눈 내용까지 모두 포함)를 바탕으로 아래 블록 하나만 새로 만든다. 다른 블록은 만들지 않는다.\n\n" +
  "대화 중에는 의사결정 정리와 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 이 블록에서 제외하고, 나머지는 전부 의사결정과 관련된 정상적인 입력으로 다뤄라. 직장 상사·동료에 대한 불만이나 연애·감정·관계에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. insights를 다시 만드는 경우 사용자를 정면으로 비추는 통찰이어야 한다: 배제 대상이 아닌 내용을 이 지시 때문에 얼버무리거나 약화시키지 말고, 불편하더라도 정확하게 써라. 이 블록의 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.\n\n" +
  "실존 인물이나 유명인의 이름은 절대 언급하지 않는다. 사용자가 대화 중 상사·동료·가족·지인 등 제3자를 실명이나 특정 개인임을 알 수 있는 호칭으로 언급했더라도, 이 블록의 어떤 출력 필드에도 그 이름이나 호칭을 그대로 옮기지 마라. 대신 \"상사\", \"동료\", \"가족\", \"친구\"처럼 관계를 가리키는 일반적인 표현으로 바꿔 쓴다 — 이런 관계 표현은 결과를 이해하는 데 필요하므로 그대로 써도 된다. 이건 식별 정보만 지우라는 지시이지, 그 인물이 얽힌 상황·감정·갈등의 내용을 얼버무리거나 완곡하게 순화하라는 뜻이 아니다 — 위에서 말했듯 불편하더라도 내용 자체는 그대로 정확하게 써라.\n\n";
const BLOCK_OUTRO = "\n\n입력은 한국어 대화이며, 모든 출력 텍스트도 한국어로 담백하고 신뢰가 가는 어조로 작성한다.";

const BLOCK_SYSTEM_PROMPTS: Record<ResultBlockKey, string> = {
  factorMatrix: `${BLOCK_INTRO}factor_matrix: 대화에서 드러난 요인들을 뽑아 2x2 매트릭스에 배치한다. x_axis_label/y_axis_label은 이 대화 상황에 맞는 축을 스스로 정한다(예: 통제 가능성 x 영향력, 단기 x 장기). 각 요인의 kind는 topic/trigger/fact/emotion/person/value/reason/constraint/option/benefit/risk/missing/direction/action/correction 중 정확히 하나이고, x/y는 0~100 사이 값이다. 최대 8개까지만 뽑는다.${BLOCK_OUTRO}`,
  scenarios: `${BLOCK_INTRO}scenarios: 현실적인 시나리오 2~4개를 만들고 각각 장단점을 적는다. 정답을 대신 정하지 않는다 — closest_fit은 "가장 가까운 방향"을 근거와 함께 제시하는 것이지, 강제로 하나를 골라주는 게 아니다. 대화만으로 판단 근거가 부족하면 closest_fit을 null로 둔다.${BLOCK_OUTRO}`,
  timeline: `${BLOCK_INTRO}timeline: 단계별(예: "1주 이내", "1개월 이내", "3개월 이후") 행동 계획을 만든다.${BLOCK_OUTRO}`,
  insights: `${BLOCK_INTRO}insights: 사용자가 대화에서 스스로 말하지 않았던 관점을 2~4개 담는다.${BLOCK_OUTRO}`,
};

function buildBlockRequestSchema(block: ResultBlockKey) {
  const key = BLOCK_JSON_KEY[block];
  return {
    type: "object",
    properties: { [key]: BLOCK_JSON_SCHEMA[block] },
    required: [key],
    additionalProperties: false,
  };
}

function isValidBlockValue(block: ResultBlockKey, value: unknown): boolean {
  if (block === "factorMatrix") return isValidFactorMatrix(value);
  if (block === "scenarios") return isValidScenarios(value);
  if (block === "timeline") return isValidTimeline(value);
  return isValidInsights(value);
}

function buildBlockValue<K extends ResultBlockKey>(block: K, value: unknown): BlockValueMap[K] {
  if (block === "factorMatrix") return buildFactorMatrixBlock(value as RawFactorMatrix) as BlockValueMap[K];
  if (block === "scenarios") return buildScenarioBlock(value as RawScenarios) as BlockValueMap[K];
  if (block === "timeline") return buildTimelineBlock(value as RawTimeline) as BlockValueMap[K];
  return buildInsightBlock(value as RawInsights) as BlockValueMap[K];
}

// 전체 생성과 같은 이유(사고 토큰이 max_tokens에 포함, 새 토크나이저)로
// 잘릴 수 있어 같은 방식으로 상향 + 잘림 시 재시도 상향한다. 블록 하나는
// 전체 4블록보다 훨씬 작아서 비율은 그대로 유지한다(기존 3072/8192 ≈
// 0.375와 같은 비율로 16384의 0.375 ≈ 6144).
const BLOCK_GENERATION_MAX_TOKENS = 6144;
const BLOCK_GENERATION_MAX_TOKENS_RETRY = 9216;

// countsAsFailure: attemptFullGeneration과 같은 원칙 — 서버 쪽 원인은
// false, 응답 내용에 기인한 실패(빈 응답·JSON 파싱 실패·스키마 검증
// 실패)는 항상 true.
async function attemptBlockGeneration<K extends ResultBlockKey>(client: Anthropic, session: MapSession, block: K, maxTokens: number): Promise<{ value: BlockValueMap[K] | null; truncated: boolean; countsAsFailure: boolean }> {
  const jsonKey = BLOCK_JSON_KEY[block];

  let responseText: string | undefined;
  let truncated = false;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      // Was 1536, scaled up proportionally to the full-generation bump
      // above (same ~37.5% ratio) — a single block is much smaller than
      // the full 4-block result, so it doesn't need the full 8192, but the
      // same unbounded-array risk applies to whichever block is requested.
      max_tokens: maxTokens,
      // 블록별 시스템 프롬프트도 같은 block 값에 대해서는 매 호출마다
      // 동일한 문자열이라 캐싱 대상이다.
      system: [{ type: "text", text: BLOCK_SYSTEM_PROMPTS[block], cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `지금까지 나눈 대화 전체(가장 최근 내용까지 포함):\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort: getGenerationEffort(),
        format: { type: "json_schema", schema: buildBlockRequestSchema(block) },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      // 사용자 입력·응답 내용은 절대 로그에 넣지 않는다 — 토큰 수치만.
      console.warn("[final-result-generator] block regeneration truncated by max_tokens", {
        block,
        maxTokens,
        outputTokens: response.usage?.output_tokens ?? null,
        thinkingTokens: response.usage?.output_tokens_details?.thinking_tokens ?? null,
      });
    }
    responseText = response.content.find((part) => part.type === "text")?.text;
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    const type = error instanceof Anthropic.APIError ? error.type : undefined;
    const serverSide = isServerSideGenerationError(error);
    console.error("[final-result-generator] block regeneration call failed", {
      block,
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    return { value: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[final-result-generator] empty block response from Claude", { block });
    return { value: null, truncated, countsAsFailure: true };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    console.error("[final-result-generator] block response was not valid JSON", { block, truncated });
    return { value: null, truncated, countsAsFailure: true };
  }
  if (typeof parsed !== "object" || parsed === null) {
    console.error("[final-result-generator] block response was not a JSON object", { block, truncated });
    return { value: null, truncated, countsAsFailure: true };
  }

  const value = (parsed as Record<string, unknown>)[jsonKey];
  if (!isValidBlockValue(block, value)) {
    console.error("[final-result-generator] block response failed schema validation", { block, truncated });
    return { value: null, truncated, countsAsFailure: true };
  }

  return { value: buildBlockValue(block, value), truncated, countsAsFailure: false };
}

export type ResultBlockGenerationOutcome<K extends ResultBlockKey> = { value: BlockValueMap[K] | null; countsAsFailure: boolean };

// Server-side only, same retry and rate-limit-counting behavior as
// generateFinalResult above.
export async function generateResultBlock<K extends ResultBlockKey>(session: MapSession, block: K): Promise<ResultBlockGenerationOutcome<K>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[final-result-generator] ANTHROPIC_API_KEY not set");
    return { value: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  let maxTokens = BLOCK_GENERATION_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptBlockGeneration(client, session, block, maxTokens);
    if (outcome.value) return { value: outcome.value, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = BLOCK_GENERATION_MAX_TOKENS_RETRY;
  }
  return { value: null, countsAsFailure };
}

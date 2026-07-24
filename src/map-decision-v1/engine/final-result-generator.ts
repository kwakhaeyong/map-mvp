import Anthropic from "@anthropic-ai/sdk";
import { FactorMatrixBlock, FinalResult, InsightBlock, MapSession, NodeKind, ResultBlockKey, ScenarioBlock, TimelineBlock } from "../types";
import { createId, now } from "./session";
import { NODE_KINDS } from "./ai-node-extractor";

const SYSTEM_PROMPT = `너는 MAP Decision의 최종 결과 생성 엔진이다. 지금까지 나눈 대화 전체를 바탕으로, 사용자가 스스로 정리하지 못했던 의사결정 구조를 4개 블록으로 만든다.

원칙: 정답을 대신 정하지 않는다. 시나리오 비교에서 closest_fit은 "가장 가까운 방향"을 근거와 함께 제시하는 것이지, 강제로 하나를 골라주는 게 아니다. 대화만으로 판단 근거가 부족하면 closest_fit을 null로 두어라.

1) factor_matrix: 대화에서 드러난 요인들을 뽑아 2x2 매트릭스에 배치한다. x_axis_label/y_axis_label은 이 대화 상황에 맞는 축을 스스로 정한다(예: 통제 가능성 x 영향력, 단기 x 장기). 각 요인의 kind는 topic/trigger/fact/emotion/person/value/reason/constraint/option/benefit/risk/missing/direction/action/correction 중 정확히 하나이고, x/y는 0~100 사이 값이다.

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
      maxItems: 8,
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
      type: ["object", "null"],
      properties: {
        scenario_name: { type: "string" },
        reasoning: { type: "string" },
      },
      required: ["scenario_name", "reasoning"],
      additionalProperties: false,
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

// One attempt: call Sonnet, parse, validate. Returns null on any failure so
// generateFinalResult can retry it without duplicating this logic.
async function attemptFullGeneration(client: Anthropic, session: MapSession): Promise<FinalResult | null> {
  let responseText: string | undefined;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `지금까지 나눈 대화 전체:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: FINAL_RESULT_SCHEMA },
      },
    });
    responseText = response.content.find((block) => block.type === "text")?.text;
  } catch (error) {
    console.error("[final-result-generator] Claude API call failed", error);
    return null;
  }

  if (!responseText) {
    console.error("[final-result-generator] empty response from Claude");
    return null;
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[final-result-generator] response failed schema validation", { reason: parsed.reason });
    return null;
  }

  return {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    factorMatrix: buildFactorMatrixBlock(parsed.data.factor_matrix),
    scenarios: buildScenarioBlock(parsed.data.scenarios),
    timeline: buildTimelineBlock(parsed.data.timeline),
    insights: buildInsightBlock(parsed.data.insights),
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
export async function generateFinalResult(session: MapSession): Promise<FinalResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const result = await attemptFullGeneration(client, session);
    if (result) return result;
  }
  return null;
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
  "너는 MAP Decision의 최종 결과 생성 엔진이다. 사용자가 특정 블록만 다시 만들어달라고 요청했다. 지금까지 나눈 대화 전체(가장 최근에 나눈 내용까지 모두 포함)를 바탕으로 아래 블록 하나만 새로 만든다. 다른 블록은 만들지 않는다.\n\n";
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

async function attemptBlockGeneration<K extends ResultBlockKey>(client: Anthropic, session: MapSession, block: K): Promise<BlockValueMap[K] | null> {
  const jsonKey = BLOCK_JSON_KEY[block];

  let responseText: string | undefined;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1536,
      system: BLOCK_SYSTEM_PROMPTS[block],
      messages: [
        {
          role: "user",
          content: `지금까지 나눈 대화 전체(가장 최근 내용까지 포함):\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: buildBlockRequestSchema(block) },
      },
    });
    responseText = response.content.find((part) => part.type === "text")?.text;
  } catch (error) {
    console.error("[final-result-generator] block regeneration call failed", { block, error });
    return null;
  }

  if (!responseText) {
    console.error("[final-result-generator] empty block response from Claude", { block });
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    console.error("[final-result-generator] block response was not valid JSON", { block });
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const value = (parsed as Record<string, unknown>)[jsonKey];
  if (!isValidBlockValue(block, value)) {
    console.error("[final-result-generator] block response failed schema validation", { block });
    return null;
  }

  return buildBlockValue(block, value);
}

// Server-side only, same retry and rate-limit-counting behavior as
// generateFinalResult above.
export async function generateResultBlock<K extends ResultBlockKey>(session: MapSession, block: K): Promise<BlockValueMap[K] | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const result = await attemptBlockGeneration(client, session, block);
    if (result) return result;
  }
  return null;
}

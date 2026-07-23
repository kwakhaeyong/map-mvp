import Anthropic from "@anthropic-ai/sdk";
import { FinalResult, MapSession, NodeKind } from "../types";
import { createId, now } from "./session";
import { NODE_KINDS } from "./ai-node-extractor";

const SYSTEM_PROMPT = `너는 MAP Decision의 최종 결과 생성 엔진이다. 지금까지 나눈 대화 전체를 바탕으로, 사용자가 스스로 정리하지 못했던 의사결정 구조를 4개 블록으로 만든다.

원칙: 정답을 대신 정하지 않는다. 시나리오 비교에서 closest_fit은 "가장 가까운 방향"을 근거와 함께 제시하는 것이지, 강제로 하나를 골라주는 게 아니다. 대화만으로 판단 근거가 부족하면 closest_fit을 null로 두어라.

1) factor_matrix: 대화에서 드러난 요인들을 뽑아 2x2 매트릭스에 배치한다. x_axis_label/y_axis_label은 이 대화 상황에 맞는 축을 스스로 정한다(예: 통제 가능성 x 영향력, 단기 x 장기). 각 요인의 kind는 topic/trigger/fact/emotion/person/value/reason/constraint/option/benefit/risk/missing/direction/action/correction 중 정확히 하나이고, x/y는 0~100 사이 값이다.

2) scenarios: 현실적인 시나리오 2~4개를 만들고 각각 장단점을 적는다. closest_fit은 그 중 대화 맥락과 가장 맞닿아 있는 방향과 이유(reasoning)를 담되, 근거가 약하면 null로 둔다.

3) timeline: 단계별(예: "1주 이내", "1개월 이내", "3개월 이후") 행동 계획을 만든다.

4) insights: 사용자가 대화에서 스스로 말하지 않았던 관점을 2~4개 담는다.

입력은 한국어 대화이며, 모든 출력 텍스트도 한국어로 담백하고 신뢰가 가는 어조로 작성한다.`;

const FINAL_RESULT_SCHEMA = {
  type: "object",
  properties: {
    factor_matrix: {
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
    },
    scenarios: {
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
    },
    timeline: {
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
    },
    insights: {
      type: "object",
      properties: {
        messages: { type: "array", items: { type: "string" } },
      },
      required: ["messages"],
      additionalProperties: false,
    },
  },
  required: ["factor_matrix", "scenarios", "timeline", "insights"],
  additionalProperties: false,
} as const;

type RawFinalResult = {
  factor_matrix: {
    x_axis_label: { low: string; high: string };
    y_axis_label: { low: string; high: string };
    factors: Array<{ text: string; kind: string; x: number; y: number }>;
  };
  scenarios: {
    items: Array<{ name: string; summary: string; pros: string[]; cons: string[] }>;
    closest_fit: { scenario_name: string; reasoning: string } | null;
  };
  timeline: { phases: Array<{ label: string; actions: string[] }> };
  insights: { messages: string[] };
};

function isNodeKind(value: string): value is NodeKind {
  return (NODE_KINDS as string[]).includes(value);
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

  const fm = candidate.factor_matrix as RawFinalResult["factor_matrix"] | undefined;
  if (
    typeof fm !== "object" || fm === null ||
    typeof fm.x_axis_label !== "object" || fm.x_axis_label === null ||
    typeof fm.x_axis_label.low !== "string" || typeof fm.x_axis_label.high !== "string" ||
    typeof fm.y_axis_label !== "object" || fm.y_axis_label === null ||
    typeof fm.y_axis_label.low !== "string" || typeof fm.y_axis_label.high !== "string" ||
    !Array.isArray(fm.factors)
  ) {
    return { ok: false, reason: "invalid_factor_matrix" };
  }
  for (const factor of fm.factors) {
    if (
      typeof factor !== "object" || factor === null ||
      typeof factor.text !== "string" || typeof factor.kind !== "string" || !isNodeKind(factor.kind) ||
      typeof factor.x !== "number" || typeof factor.y !== "number"
    ) {
      return { ok: false, reason: "invalid_factor_matrix" };
    }
  }

  const sc = candidate.scenarios as RawFinalResult["scenarios"] | undefined;
  if (typeof sc !== "object" || sc === null || !Array.isArray(sc.items)) {
    return { ok: false, reason: "invalid_scenarios" };
  }
  for (const scenario of sc.items) {
    if (
      typeof scenario !== "object" || scenario === null ||
      typeof scenario.name !== "string" || typeof scenario.summary !== "string" ||
      !Array.isArray(scenario.pros) || scenario.pros.some((p) => typeof p !== "string") ||
      !Array.isArray(scenario.cons) || scenario.cons.some((c) => typeof c !== "string")
    ) {
      return { ok: false, reason: "invalid_scenarios" };
    }
  }
  if (sc.closest_fit !== null) {
    if (
      typeof sc.closest_fit !== "object" || sc.closest_fit === null ||
      typeof sc.closest_fit.scenario_name !== "string" ||
      typeof sc.closest_fit.reasoning !== "string"
    ) {
      return { ok: false, reason: "invalid_scenarios" };
    }
  }

  const tl = candidate.timeline as RawFinalResult["timeline"] | undefined;
  if (typeof tl !== "object" || tl === null || !Array.isArray(tl.phases)) {
    return { ok: false, reason: "invalid_timeline" };
  }
  for (const phase of tl.phases) {
    if (
      typeof phase !== "object" || phase === null ||
      typeof phase.label !== "string" ||
      !Array.isArray(phase.actions) || phase.actions.some((a) => typeof a !== "string")
    ) {
      return { ok: false, reason: "invalid_timeline" };
    }
  }

  const ins = candidate.insights as RawFinalResult["insights"] | undefined;
  if (
    typeof ins !== "object" || ins === null ||
    !Array.isArray(ins.messages) || ins.messages.some((m) => typeof m !== "string")
  ) {
    return { ok: false, reason: "invalid_insights" };
  }

  return { ok: true, data: candidate as RawFinalResult };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(대화 없음)";
  return session.messages.map((message) => `${message.role === "user" ? "사용자" : "AI"}: ${message.text}`).join("\n");
}

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
export async function generateFinalResult(session: MapSession): Promise<FinalResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

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

  const timestamp = now();

  const factors = parsed.data.factor_matrix.factors.slice(0, 8).map((factor) => ({
    id: createId("factor"),
    text: factor.text,
    kind: factor.kind as NodeKind,
    x: factor.x,
    y: factor.y,
  }));

  const scenarios = parsed.data.scenarios.items.map((scenario) => ({
    id: createId("scenario"),
    name: scenario.name,
    summary: scenario.summary,
    pros: scenario.pros,
    cons: scenario.cons,
  }));

  const closestFitRaw = parsed.data.scenarios.closest_fit;
  const closestFit = closestFitRaw
    ? (() => {
        const match = scenarios.find((scenario) => scenario.name === closestFitRaw.scenario_name);
        return match ? { scenarioId: match.id, reasoning: closestFitRaw.reasoning } : null;
      })()
    : null;

  const phases = parsed.data.timeline.phases.map((phase) => ({
    id: createId("phase"),
    label: phase.label,
    actions: phase.actions,
  }));

  return {
    version: 1,
    generatedAt: timestamp,
    model: "claude-sonnet-5",
    factorMatrix: {
      xAxisLabel: parsed.data.factor_matrix.x_axis_label,
      yAxisLabel: parsed.data.factor_matrix.y_axis_label,
      factors,
    },
    scenarios: { scenarios, closestFit },
    timeline: { phases },
    insights: { messages: parsed.data.insights.messages },
  };
}

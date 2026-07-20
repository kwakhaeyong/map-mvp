import Anthropic from "@anthropic-ai/sdk";
import { Confidence, MapNode, MapSession, NodeKind } from "../types";
import { createId, now } from "./session";
import { nodeLabels } from "./thinking-extractor";

const NODE_KINDS: NodeKind[] = [
  "topic", "trigger", "fact", "emotion", "person", "value", "reason",
  "constraint", "option", "benefit", "risk", "missing", "direction",
  "action", "correction",
];
const CONFIDENCE_LEVELS: Confidence[] = ["user", "ai", "confirmed"];

const SYSTEM_PROMPT = `너는 MAP Decision의 의사결정 구조화 엔진이다. 사용자의 입력을 "의사결정 관점"에서 분석해서, 핵심 주제·사실·가정·선택지·기준(가치)·리스크·감정·불확실성(확인할 정보)·행동 등으로 구조화된 노드를 추출하는 것만 한다.

다음은 절대 하지 마라: 코드 작성, 번역, 일반 지식 질문 답변, 창작, 그 외 의사결정 정리와 무관한 요청. 그런 요청이 오면 on_topic을 false로 하고, nodes는 빈 배열로 두고, guidance_message에 사용자를 의사결정 정리로 부드럽게 유도하는 한국어 안내를 짧게 적어라.

의사결정 정리 요청일 때는(on_topic: true), 표면적인 단어 조각이 아니라 "의사결정에 실제로 중요한 정보"를 뽑아라. 예를 들어 커리어 상담이면 지향하는 직무, 제약 조건, 실패 경험, 우선순위 갈등처럼 핵심적인 내용을 우선하고, 긴 입력이라도 앞부분만 보지 말고 전체에서 중요한 정보를 골라라. 이미 정리된 노드와 중복되는 내용은 다시 만들지 마라.

각 노드의 kind는 다음 중 정확히 하나여야 한다: topic(핵심 주제), trigger(계기), fact(사실), emotion(감정), person(사람), value(가치), reason(이유), constraint(제약), option(선택지), benefit(장점), risk(리스크), missing(확인할 정보 — 아직 모르는 것/가정), direction(방향), action(행동), correction(수정된 이해).

confidence는 다음 중 하나다: user(사용자가 직접 말한 사실), ai(네가 대화 맥락에서 추론한 내용), confirmed(사용자가 확정적으로 단언한 내용).

입력은 한국어이며, 항상 한국어로 처리하고 노드 text도 한국어로 작성한다. 노드 text는 원문을 과도하게 요약하지 말고 핵심을 유지한 채 한두 문장으로 작성하며, 한 번에 최대 8개까지만 추출한다.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    on_topic: { type: "boolean" },
    guidance_message: { type: ["string", "null"] },
    nodes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          kind: { type: "string", enum: NODE_KINDS },
          confidence: { type: "string", enum: CONFIDENCE_LEVELS },
        },
        required: ["text", "kind", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["on_topic", "guidance_message", "nodes"],
  additionalProperties: false,
} as const;

type RawExtraction = {
  on_topic: boolean;
  guidance_message: string | null;
  nodes: Array<{ text: string; kind: string; confidence: string }>;
};

export type AiExtraction = {
  onTopic: boolean;
  guidanceMessage: string | null;
  nodes: MapNode[];
};

function summarizeExistingNodes(session: MapSession): string {
  if (session.nodes.length === 0) return "(아직 없음)";
  return session.nodes
    .slice(-12)
    .map((node) => `- [${node.kind}] ${node.text}`)
    .join("\n");
}

function isNodeKind(value: string): value is NodeKind {
  return (NODE_KINDS as string[]).includes(value);
}

function isConfidence(value: string): value is Confidence {
  return (CONFIDENCE_LEVELS as string[]).includes(value);
}

export function parseAndValidate(raw: string): RawExtraction | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const candidate = parsed as Partial<RawExtraction>;
  if (typeof candidate.on_topic !== "boolean") return null;
  if (candidate.guidance_message !== null && typeof candidate.guidance_message !== "string") return null;
  if (!Array.isArray(candidate.nodes)) return null;
  for (const node of candidate.nodes) {
    if (typeof node !== "object" || node === null) return null;
    const n = node as Record<string, unknown>;
    if (typeof n.text !== "string" || typeof n.kind !== "string" || typeof n.confidence !== "string") return null;
    if (!isNodeKind(n.kind) || !isConfidence(n.confidence)) return null;
  }
  return candidate as RawExtraction;
}

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
export async function extractNodesWithAI(text: string, session: MapSession): Promise<AiExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  let responseText: string | undefined;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `지금까지 정리된 노드:\n${summarizeExistingNodes(session)}\n\n사용자의 새 입력:\n${text}`,
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: RESPONSE_SCHEMA },
      },
    });
    responseText = response.content.find((block) => block.type === "text")?.text;
  } catch (error) {
    console.error("[ai-node-extractor] Claude API call failed", error);
    return null;
  }

  if (!responseText) {
    console.error("[ai-node-extractor] empty response from Claude");
    return null;
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed) {
    console.error("[ai-node-extractor] response failed schema validation", responseText);
    return null;
  }

  const timestamp = now();
  const nodes: MapNode[] = parsed.nodes.map((node) => ({
    id: createId("node"),
    kind: node.kind as NodeKind,
    label: nodeLabels[node.kind as NodeKind],
    text: node.text,
    confidence: node.confidence as Confidence,
    createdAt: timestamp,
  }));

  return { onTopic: parsed.on_topic, guidanceMessage: parsed.guidance_message, nodes };
}

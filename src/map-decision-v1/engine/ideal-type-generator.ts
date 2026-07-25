import Anthropic from "@anthropic-ai/sdk";
import { IdealTypeResult, MapSession } from "../types";
import { now } from "./session";

// 진로(final-result-generator.ts)와 완전히 분리된, 이상형 전용 생성기.
// 진로의 4블록 로직/스키마는 건드리지 않는다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "이상형 카드" 생성 엔진이다. 사용자가 5개 항목(외모·분위기, 성격, 가치관, 연애 방식, 라이프스타일)에서 고른 선택지와 직접 적은 말을 바탕으로, 그 사람의 이상형을 한 장의 카드로 요약한다.

원칙:
- title: 이상형 전체를 위트있게 요약하는 짧은 별명(10자 내외). 가볍고 재미있되 상대를 낮잡아보거나 무례하지 않게.
- 각 항목(appearance/personality/values/relationship/lifestyle)은 사용자가 고른 선택지와 직접 쓴 말을 자연스러운 한 문장으로 다듬어 표현한다. 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 무난하고 긍정적인 일반적 표현으로 채운다 — 절대 "답변 없음"이나 빈 문장으로 두지 않는다.
- 실존 인물이나 유명인의 이름은 절대 언급하지 않는다.
- 모든 출력은 한국어로, 친근하고 담백한 어조로 작성한다.`;

const IDEAL_TYPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    appearance: { type: "string" },
    personality: { type: "string" },
    values: { type: "string" },
    relationship: { type: "string" },
    lifestyle: { type: "string" },
  },
  required: ["title", "appearance", "personality", "values", "relationship", "lifestyle"],
  additionalProperties: false,
} as const;

type RawIdealType = {
  title: string;
  appearance: string;
  personality: string;
  values: string;
  relationship: string;
  lifestyle: string;
};

export type ParseFailureReason = "invalid_json" | "invalid_title" | "invalid_appearance" | "invalid_personality" | "invalid_values" | "invalid_relationship" | "invalid_lifestyle";
export type ParseResult = { ok: true; data: RawIdealType } | { ok: false; reason: ParseFailureReason };

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
  if (typeof candidate.appearance !== "string" || !candidate.appearance.trim()) return { ok: false, reason: "invalid_appearance" };
  if (typeof candidate.personality !== "string" || !candidate.personality.trim()) return { ok: false, reason: "invalid_personality" };
  if (typeof candidate.values !== "string" || !candidate.values.trim()) return { ok: false, reason: "invalid_values" };
  if (typeof candidate.relationship !== "string" || !candidate.relationship.trim()) return { ok: false, reason: "invalid_relationship" };
  if (typeof candidate.lifestyle !== "string" || !candidate.lifestyle.trim()) return { ok: false, reason: "invalid_lifestyle" };

  return { ok: true, data: candidate as RawIdealType };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

async function attemptGeneration(client: Anthropic, session: MapSession): Promise<IdealTypeResult | null> {
  let responseText: string | undefined;
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
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

  return {
    version: 1,
    generatedAt: now(),
    model: "claude-haiku-4-5",
    title: parsed.data.title,
    appearance: parsed.data.appearance,
    personality: parsed.data.personality,
    values: parsed.data.values,
    relationship: parsed.data.relationship,
    lifestyle: parsed.data.lifestyle,
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

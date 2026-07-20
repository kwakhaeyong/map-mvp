import { NextRequest, NextResponse } from "next/server";
import { extractThinking, buildRelationsForNodes } from "../../../src/map-decision-v1/engine/thinking-extractor";
import { extractNodesWithAI } from "../../../src/map-decision-v1/engine/ai-node-extractor";
import { registerSessionStart } from "../../../src/map-decision-v1/engine/rate-limit";
import { MapNode, MapRelation, MapSession } from "../../../src/map-decision-v1/types";

const MAX_INPUT_LENGTH = 5000;
const MAX_MESSAGES_PER_SESSION = 40;

type RequestBody = { text: string; session: MapSession; correction?: boolean };
type SuccessResponse = {
  source: "ai" | "rule-based";
  nodes: MapNode[];
  relations: MapRelation[];
  guidanceMessage: string | null;
};
type BlockedResponse = { blocked: true; reason: string; message: string };

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<RequestBody>;
  return typeof candidate.text === "string" && typeof candidate.session === "object" && candidate.session !== null;
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!isRequestBody(body)) {
    return NextResponse.json({ blocked: true, reason: "invalid_request", message: "요청 형식이 올바르지 않아요." } satisfies BlockedResponse, { status: 400 });
  }
  const { text, session, correction = false } = body;

  if (text.trim().length === 0) {
    return NextResponse.json({ blocked: true, reason: "empty_input", message: "내용을 입력해 주세요." } satisfies BlockedResponse, { status: 400 });
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { blocked: true, reason: "input_too_long", message: `한 번에 ${MAX_INPUT_LENGTH.toLocaleString()}자까지만 정리할 수 있어요. 나눠서 말씀해 주세요.` } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
    return NextResponse.json(
      { blocked: true, reason: "too_many_messages", message: "이 대화는 대화 길이 한도에 도달했어요. 결과를 확인하거나 새 MAP을 시작해 주세요." } satisfies BlockedResponse,
      { status: 400 },
    );
  }

  const isFirstUserMessage = !session.messages.some((message) => message.role === "user");
  if (isFirstUserMessage) {
    const ip = getClientIp(request);
    const { allowed } = registerSessionStart(ip);
    if (!allowed) {
      return NextResponse.json(
        { blocked: true, reason: "daily_session_limit", message: "오늘 시작할 수 있는 대화 수를 모두 사용했어요. 내일 다시 시작해 주세요." } satisfies BlockedResponse,
        { status: 429 },
      );
    }
  }

  const aiResult = await extractNodesWithAI(text, session);

  if (aiResult) {
    const nodes = correction
      ? aiResult.nodes.map((node) => ({ ...node, kind: "correction" as const, label: "수정된 이해", confidence: "confirmed" as const }))
      : aiResult.nodes;
    const relations = buildRelationsForNodes(nodes, session);
    return NextResponse.json({
      source: "ai",
      nodes,
      relations,
      guidanceMessage: aiResult.onTopic ? null : aiResult.guidanceMessage,
    } satisfies SuccessResponse);
  }

  const fallback = extractThinking(text, session, correction);
  return NextResponse.json({
    source: "rule-based",
    nodes: fallback.nodes,
    relations: fallback.relations,
    guidanceMessage: null,
  } satisfies SuccessResponse);
}

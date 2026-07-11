import { MapSession, Message, SCHEMA_VERSION } from "../types";

export function now() { return new Date().toISOString(); }
export function createId(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export function createSession(topic?: string): MapSession {
  const timestamp = now();
  const starter: Message = {
    id: createId("ai"),
    role: "ai",
    provider: "local",
    timestamp,
    text: topic ? `“${topic}”부터 같이 한 장으로 정리해볼까요? 편하게 말해 주세요.` : "오늘은 어떤 생각을 같이 정리해볼까요? 말로 해도, 짧게 써도 괜찮아요.",
  };
  return {
    version: SCHEMA_VERSION,
    stage: "conversation",
    preferredMapType: "thinking",
    selectedTopic: topic,
    messages: [starter],
    nodes: topic ? [{ id: "topic", kind: "topic", label: "핵심 주제", text: topic, confidence: "user", createdAt: timestamp }] : [],
    relations: [],
    startedAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createLandingSession(): MapSession {
  const timestamp = now();
  return { version: SCHEMA_VERSION, stage: "landing", preferredMapType: "thinking", messages: [], nodes: [], relations: [], startedAt: timestamp, updatedAt: timestamp };
}

export function isValidSession(value: unknown): value is MapSession {
  const session = value as MapSession;
  return Boolean(session && Array.isArray(session.messages) && Array.isArray(session.nodes) && Array.isArray(session.relations) && typeof session.stage === "string");
}

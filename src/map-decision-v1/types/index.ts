export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "map-decision-v1-session";

export type Role = "ai" | "user";
export type MapOutputType = "thinking" | "decision" | "execution" | "priority" | "comparison" | "career" | "process" | "patientJourney" | "handover";
export type SessionStage = "landing" | "conversation" | "result";
export type Confidence = "user" | "ai" | "confirmed";
export type NodeKind = "topic" | "trigger" | "fact" | "emotion" | "person" | "value" | "reason" | "constraint" | "option" | "benefit" | "risk" | "missing" | "direction" | "action" | "correction";
export type RelationKind = "원인" | "영향" | "충돌" | "대안" | "장점" | "리스크" | "확인 필요" | "다음 행동";

export type Message = { id: string; role: Role; text: string; timestamp: string; checkpoint?: boolean; provider?: "local" | "api" };
export type MapNode = { id: string; kind: NodeKind; label: string; text: string; confidence: Confidence; createdAt: string };
export type MapRelation = { id: string; from: string; to: string; kind: RelationKind; strength: "solid" | "dotted" | "accent" };
export type MapSession = {
  version: number;
  stage: SessionStage;
  selectedTopic?: string;
  preferredMapType: MapOutputType;
  messages: Message[];
  nodes: MapNode[];
  relations: MapRelation[];
  checkpointStatus?: "pending" | "confirmed" | "correcting";
  startedAt: string;
  updatedAt: string;
};

export type ConversationProvider = {
  id: "local" | "api";
  nextReply(session: MapSession, latestUserText: string): Message;
};

export type VoiceProvider = { id: "webSpeech" | "openaiRealtime" | "whisper" | "geminiLive" | "custom"; label: string; configured: boolean; }

export type VoiceProviderState = {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  seconds: number;
  error: string;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

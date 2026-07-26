export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "map-decision-v1-session";

export type Role = "ai" | "user";
export type MapOutputType = "thinking" | "decision" | "execution" | "priority" | "comparison" | "career" | "process" | "patientJourney" | "handover";
export type SessionStage = "landing" | "conversation" | "result";
export type Confidence = "user" | "ai" | "confirmed";
export type NodeKind = "topic" | "trigger" | "fact" | "emotion" | "person" | "value" | "reason" | "constraint" | "option" | "benefit" | "risk" | "missing" | "direction" | "action" | "correction";
export type RelationKind = "원인" | "영향" | "충돌" | "대안" | "장점" | "리스크" | "확인 필요" | "다음 행동";

export type Message = { id: string; role: Role; text: string; timestamp: string; checkpoint?: boolean; provider?: "local" | "api"; followUpQuestions?: string[] };
export type MapNode = { id: string; kind: NodeKind; label: string; text: string; confidence: Confidence; createdAt: string };
export type MapRelation = { id: string; from: string; to: string; kind: RelationKind; strength: "solid" | "dotted" | "accent" };
export type MapSession = {
  version: number;
  stage: SessionStage;
  selectedTopic?: string;
  topicId?: string;
  preferredMapType: MapOutputType;
  messages: Message[];
  nodes: MapNode[];
  relations: MapRelation[];
  checkpointStatus?: "pending" | "confirmed" | "correcting";
  startedAt: string;
  updatedAt: string;
  isDemo?: boolean;
  demoStep?: number;
  quizStep?: number;
  localDraft?: string;
  result?: FinalResult;
  idealTypeResult?: IdealTypeResult;
  // 이상형 퀴즈를 필수 12문항에서 끝냈는지("quick"), 선택 8문항까지
  // 마쳤는지("deep") — 결과 화면의 "🔍 심층 분석 포함" 배지와, 결과를
  // 이미 본 뒤 "8개 더 답하기"를 안내할지 판단하는 데 쓴다.
  idealTypeQuizDepth?: "quick" | "deep";
  // 결과를 이미 본 뒤 "8개 더 답하기"로 되돌아간 상태 — true인 동안
  // TopicQuiz는 마지막 심화 문항을 답하면 마무리 질문을 다시 묻지 않고
  // 곧장 결과를 다시 만든다(이미 한 번 답한 마무리 질문을 또 물으면
  // 어색하다).
  idealTypeResuming?: boolean;
};

export type FactorMatrixItem = { id: string; text: string; kind: NodeKind; x: number; y: number };
export type FactorMatrixBlock = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  factors: FactorMatrixItem[];
};

export type ScenarioItem = { id: string; name: string; summary: string; pros: string[]; cons: string[] };
export type ScenarioBlock = {
  scenarios: ScenarioItem[];
  closestFit: { scenarioId: string; reasoning: string } | null;
};

export type TimelinePhase = { id: string; label: string; actions: string[] };
export type TimelineBlock = { phases: TimelinePhase[] };

export type InsightBlock = { messages: string[] };

export type FinalResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5" | "claude-haiku-4-5";
  factorMatrix: FactorMatrixBlock;
  scenarios: ScenarioBlock;
  timeline: TimelineBlock;
  insights: InsightBlock;
};

export type ResultBlockKey = "factorMatrix" | "scenarios" | "timeline" | "insights";

// 이상형 결과는 "입력을 정리"하는 게 아니라 "입력을 재료로 발견을 주는"
// 7요소 구조다. 배열은 전부 개수 제한 없이(Structured Outputs가
// maxItems/minItems를 지원하지 않는 문제를 피하려고) 선언하고, 화면에
// 너무 많이 나오지 않도록 자르는 건 항상 코드(.slice())에서 한다 —
// engine/ideal-type-generator.ts 참고.
export type IdealTypeCriteria = { mustHave: string[]; niceToHave: string[]; canCompromise: string[] };
export type IdealTypeMatrixPoint = { label: string; description: string; x: number; y: number };
export type IdealTypeMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: IdealTypeMatrixPoint[];
};
export type IdealTypeFlags = { green: string[]; red: string[] };
export type IdealTypeSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
export type IdealTypeRoadmapPhase = { label: string; actions: string[] };
export type IdealTypeRoadmap = { firstAction: string; phases: IdealTypeRoadmapPhase[] };

export type IdealTypeResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  criteria: IdealTypeCriteria;
  attractionPatterns: string[];
  matrix: IdealTypeMatrix;
  flags: IdealTypeFlags;
  selfReflection: IdealTypeSelfReflection;
  roadmap: IdealTypeRoadmap;
};

export type ConversationProvider = {
  id: "local" | "api";
  nextReply(session: MapSession, latestUserText: string, followUpQuestions?: string[]): Message;
};

export type VoiceProvider = { id: "webSpeech" | "openaiRealtime" | "whisper" | "geminiLive" | "custom"; label: string; configured: boolean; }

export type VoiceProviderState = {
  supported: boolean;
  listening: boolean;
  seconds: number;
  error: string;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

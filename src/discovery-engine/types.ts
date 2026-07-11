export interface DiscoveryConversationTurn {
  id: string;
  text: string;
  source: "user" | "map";
}

export interface DiscoveryContext {
  sessionId: string;
  category: "ideal-type" | "travel" | "food" | "work" | "life" | "expression" | "friend";
  locale: "ko-KR";
  createdAt: string;
}

export interface MemoryMoment {
  id: string;
  text: string;
  strength: "weak" | "strong";
  sourceTurnIds: string[];
}

export interface EmotionDiscovery {
  label: string;
  warmth: number;
  intensity: number;
  evidence: string[];
}

export type DiscoveryPatternConcept =
  | "laugh"
  | "comfort"
  | "kindness"
  | "challenge"
  | "adventure"
  | "family"
  | "freedom"
  | "growth";

export interface PatternDiscovery {
  concept: DiscoveryPatternConcept;
  count: number;
  evidence: string[];
}

export type DiscoverySignalType =
  | "repeated-word"
  | "emotional-intensity"
  | "topic-frequency"
  | "preference"
  | "relationship"
  | "temporal";

export interface DiscoverySignal {
  id: string;
  type: DiscoverySignalType;
  label: string;
  strength: number;
  evidence: string[];
}

export interface ConnectionSignal {
  id: string;
  sentence: string;
  groundedIn: string[];
}

export interface ContrastDiscovery {
  says: string;
  conversationEmphasizes: string[];
  candidate: string;
  confidence: number;
}

export interface DiscoveryCandidate {
  id: string;
  title: string;
  memory: MemoryMoment;
  patterns: PatternDiscovery[];
  connections: ConnectionSignal[];
  contrast?: ContrastDiscovery;
  emotionalReason: string;
}

export interface FinalDiscovery {
  candidate: DiscoveryCandidate;
  whyItMatters: string;
  isOneCoreDiscovery: true;
  isSurprisingInsight: true;
}

export interface DiscoveryMeaning {
  id: string;
  sentence: string;
  supportingEvidence: Array<{
    source: "memory" | "connection" | "pattern" | "emotion";
    text: string;
  }>;
  confidenceScore: number;
}

export interface DiscoveryStory {
  /** Maximum 150 characters. Warm, memorable, and shareable. */
  finalStory: string;
  memorableLine: string;
}

export interface MAPDiscoveryResult {
  context: DiscoveryContext;
  signals: DiscoverySignal[];
  discovery: FinalDiscovery;
  meaning: DiscoveryMeaning;
  story: DiscoveryStory;
}

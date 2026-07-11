import type { ConnectionSignal, DiscoveryContext, EmotionDiscovery, MemoryMoment, PatternDiscovery } from "./types";

export interface MeaningEvidence {
  source: "memory" | "connection" | "pattern" | "emotion";
  text: string;
}

export interface CoreMeaning {
  id: string;
  sentence: string;
  supportingEvidence: MeaningEvidence[];
  confidenceScore: number;
}

export interface MeaningInput {
  context: DiscoveryContext;
  memories: MemoryMoment[];
  connections: ConnectionSignal[];
  patterns: PatternDiscovery[];
  emotion: EmotionDiscovery;
}

export interface MeaningEngine {
  deriveMeaning(input: MeaningInput): CoreMeaning;
}

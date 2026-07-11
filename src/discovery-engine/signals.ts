import type { DiscoveryContext, DiscoverySignal, EmotionDiscovery, MemoryMoment, PatternDiscovery } from "./types";

export interface SignalExtractionInput {
  context: DiscoveryContext;
  memories: MemoryMoment[];
  emotion: EmotionDiscovery;
  patterns: PatternDiscovery[];
}

export interface SignalEngine {
  /** Converts raw memory artifacts into reusable signals before Connection Engine runs. */
  extractSignals(input: SignalExtractionInput): DiscoverySignal[];
}

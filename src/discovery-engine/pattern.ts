import type { DiscoveryContext, DiscoveryPatternConcept, MemoryMoment, PatternDiscovery } from "./types";

export const discoveryPatternConcepts: readonly DiscoveryPatternConcept[] = [
  "laugh",
  "comfort",
  "kindness",
  "challenge",
  "adventure",
  "family",
  "freedom",
  "growth",
] as const;

export interface PatternDetectionInput {
  context: DiscoveryContext;
  memories: MemoryMoment[];
}

export interface PatternDetector {
  detectPatterns(input: PatternDetectionInput): PatternDiscovery[];
}

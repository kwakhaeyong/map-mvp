import type { DiscoveryContext, DiscoveryConversationTurn, MemoryMoment } from "./types";

export interface MemoryExtractionInput {
  context: DiscoveryContext;
  conversation: DiscoveryConversationTurn[];
}

export interface MemoryExtractor {
  /** Extract memorable moments, not opinions. */
  extractMemories(input: MemoryExtractionInput): MemoryMoment[];
}

export function isStrongMemoryCandidate(text: string): boolean {
  const memoryMarkers = ["기억", "장면", "그때", "같이", "still remember", "remember"];
  return memoryMarkers.some((marker) => text.toLowerCase().includes(marker.toLowerCase()));
}

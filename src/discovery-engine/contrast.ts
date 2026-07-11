import type { ContrastDiscovery, DiscoveryContext, DiscoveryConversationTurn, PatternDiscovery } from "./types";

export interface ContrastDetectionInput {
  context: DiscoveryContext;
  conversation: DiscoveryConversationTurn[];
  patterns: PatternDiscovery[];
}

export interface ContrastDetector {
  /** Detects contradictions between what the user says and what the conversation mostly emphasizes. */
  detectContrast(input: ContrastDetectionInput): ContrastDiscovery | undefined;
}

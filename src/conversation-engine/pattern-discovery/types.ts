import type { ConversationMoment, ConversationContext, DiscoveredPattern } from "../shared/types";

export interface PatternDiscoveryInput {
  context: ConversationContext;
  moments: ConversationMoment[];
}

export interface PatternDiscoveryEngine {
  discover(input: PatternDiscoveryInput): DiscoveredPattern[];
}

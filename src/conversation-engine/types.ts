import type { ConversationFlow } from "./conversation-flow/types";
import type { CuriosityEngine } from "./curiosity-engine/types";
import type { MAPHandoffEngine } from "./map-handoff/types";
import type { PatternDiscoveryEngine } from "./pattern-discovery/types";
import type { ReactionEngine } from "./reaction-engine/types";
import type { ReflectionEngine } from "./reflection-engine/types";
import type { ShareHandoffEngine } from "./share-handoff/types";
import type { StoryHandoffEngine } from "./story-handoff/types";
import type { ConversationContext, ConversationShareCue, ConversationState, ConversationStoryHandoff, UserStoryTurn } from "./shared/types";

export interface ConversationEngineModules {
  reactionEngine: ReactionEngine;
  curiosityEngine: CuriosityEngine;
  conversationFlow: ConversationFlow;
  reflectionEngine: ReflectionEngine;
  patternDiscovery: PatternDiscoveryEngine;
  storyHandoff: StoryHandoffEngine;
  mapHandoff: MAPHandoffEngine;
  shareHandoff: ShareHandoffEngine;
}

export interface ConversationEngineRunInput {
  context: ConversationContext;
  state?: ConversationState;
  userTurn?: UserStoryTurn;
}

export interface ConversationEngineRunOutput {
  state: ConversationState;
  storyHandoff?: ConversationStoryHandoff;
  shareCue?: ConversationShareCue;
}

export interface ConversationEngine {
  run(input: ConversationEngineRunInput): ConversationEngineRunOutput;
}

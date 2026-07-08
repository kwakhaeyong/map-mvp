import type { ConversationContext, ConversationMoment, ConversationStoryHandoff, DiscoveredPattern } from "../shared/types";

export interface StoryHandoffInput {
  context: ConversationContext;
  moments: ConversationMoment[];
  patterns: DiscoveredPattern[];
}

export interface StoryHandoffEngine {
  prepareStory(input: StoryHandoffInput): ConversationStoryHandoff;
}

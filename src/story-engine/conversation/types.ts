import type { ConversationInput, ConversationModel, StoryEngineContext } from "../shared/types";

export interface ConversationLayerInput {
  context: StoryEngineContext;
  inputs: ConversationInput[];
}

export interface ConversationLayer {
  buildConversation(input: ConversationLayerInput): ConversationModel;
}

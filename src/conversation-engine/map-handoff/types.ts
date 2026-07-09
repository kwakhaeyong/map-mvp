import type { ConversationMAPPayload, ConversationStoryHandoff } from "../shared/types";

export interface MAPHandoffEngine {
  prepareMAP(storyHandoff: ConversationStoryHandoff): ConversationMAPPayload;
}

import type { ConversationShareCue, ConversationStoryHandoff } from "../shared/types";

export interface ShareHandoffEngine {
  prepareShareCue(storyHandoff: ConversationStoryHandoff): ConversationShareCue;
}

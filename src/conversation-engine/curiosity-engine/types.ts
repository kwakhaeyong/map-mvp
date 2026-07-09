import type { ConversationContext, ConversationMoment, CuriosityPrompt } from "../shared/types";

export interface CuriosityEngineInput {
  context: ConversationContext;
  previousMoments: ConversationMoment[];
}

export interface CuriosityEngine {
  /** Creates warm prompts that invite stories, not survey answers. */
  createPrompt(input: CuriosityEngineInput): CuriosityPrompt;
}

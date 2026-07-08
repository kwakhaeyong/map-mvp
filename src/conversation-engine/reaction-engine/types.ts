import type { ConversationContext, ConversationMoment, MAPSmallResponse, UserStoryTurn } from "../shared/types";
import type { ReactionTemplate } from "./reaction-library";

export interface ReactionEngineInput {
  context: ConversationContext;
  userTurn?: UserStoryTurn;
  previousMoments: ConversationMoment[];
}

export interface ReactionEngine {
  /** MAP must react before asking the next curiosity prompt. */
  createReaction(input: ReactionEngineInput): MAPSmallResponse;
  listReactions(): readonly ReactionTemplate[];
}

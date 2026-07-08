import type { ConversationContext, ConversationState, MAPSmallResponse, UserStoryTurn } from "../shared/types";

export interface ConversationFlowInput {
  context: ConversationContext;
  state?: ConversationState;
  userTurn?: UserStoryTurn;
}

export interface ConversationFlow {
  /** Keeps the exchange feeling like a close friend: small response, curiosity, follow-up, reflection. */
  continue(input: ConversationFlowInput): ConversationState;
  createSmallResponse(turn: UserStoryTurn): MAPSmallResponse;
}

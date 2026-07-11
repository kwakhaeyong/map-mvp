import type { ConversationMemorySnapshot, ConversationTurn, MAPAnswer, MAPOSContext } from "../shared/types";

export interface ConversationMemoryInput {
  context: MAPOSContext;
  answers: MAPAnswer[];
}

export interface ConversationMemory {
  appendTurn(turn: ConversationTurn): ConversationMemorySnapshot;
  buildSnapshot(input: ConversationMemoryInput): ConversationMemorySnapshot;
}

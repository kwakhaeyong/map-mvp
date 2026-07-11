import type { ConversationMemorySnapshot, MAPOSContext, ThemeSignal, ValueSignal } from "../shared/types";

export interface ValueEngineInput {
  context: MAPOSContext;
  memory: ConversationMemorySnapshot;
  themes: ThemeSignal[];
}

export interface ValueEngine {
  detectValues(input: ValueEngineInput): ValueSignal[];
}

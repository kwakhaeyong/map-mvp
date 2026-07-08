import type { ConversationMemorySnapshot, EmotionSignal, MAPOSContext, ThemeSignal, ValueSignal } from "../shared/types";

export interface EmotionEngineInput {
  context: MAPOSContext;
  memory: ConversationMemorySnapshot;
  themes: ThemeSignal[];
  values: ValueSignal[];
}

export interface EmotionEngine {
  readEmotions(input: EmotionEngineInput): EmotionSignal[];
}

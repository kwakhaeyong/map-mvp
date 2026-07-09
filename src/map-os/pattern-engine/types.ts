import type { EmotionSignal, MAPOSContext, PatternSignal, ThemeSignal, ValueSignal } from "../shared/types";

export interface PatternEngineInput {
  context: MAPOSContext;
  themes: ThemeSignal[];
  values: ValueSignal[];
  emotions: EmotionSignal[];
}

export interface PatternEngine {
  findPatterns(input: PatternEngineInput): PatternSignal[];
}

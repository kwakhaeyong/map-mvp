import type { EmotionSignal, MAPOSContext, MAPStoryOutput, PatternSignal, ThemeSignal, ValueSignal } from "../shared/types";

export interface StoryEngineInput {
  context: MAPOSContext;
  themes: ThemeSignal[];
  values: ValueSignal[];
  emotions: EmotionSignal[];
  patterns: PatternSignal[];
}

export interface StoryEngine {
  generateStory(input: StoryEngineInput): MAPStoryOutput;
}

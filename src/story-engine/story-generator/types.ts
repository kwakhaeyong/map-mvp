import type { ConflictAnalysis, EmotionAnalysis, PatternAnalysis, StoryDraft, StoryEngineContext, ValueAnalysis } from "../shared/types";

export interface StoryGeneratorInput {
  context: StoryEngineContext;
  emotion: EmotionAnalysis;
  values: ValueAnalysis;
  conflicts: ConflictAnalysis;
  patterns: PatternAnalysis;
}

export interface StoryGenerator {
  /**
   * Always produces one memorable sentence as the primary story artifact.
   */
  generateStory(input: StoryGeneratorInput): StoryDraft;
}

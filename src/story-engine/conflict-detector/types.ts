import type { ConflictAnalysis, ConversationModel, EmotionAnalysis, StoryEngineContext, ValueAnalysis } from "../shared/types";

export interface ConflictDetectorInput {
  context: StoryEngineContext;
  conversation: ConversationModel;
  emotion: EmotionAnalysis;
  values: ValueAnalysis;
}

export interface ConflictDetector {
  /**
   * Identifies differences between what users explicitly say and what they actually emphasize.
   */
  detectConflicts(input: ConflictDetectorInput): ConflictAnalysis;
}

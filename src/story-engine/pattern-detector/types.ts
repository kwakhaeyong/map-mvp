import type { ConflictAnalysis, ConversationModel, EmotionAnalysis, PatternAnalysis, StoryEngineContext, ValueAnalysis } from "../shared/types";

export interface PatternDetectorInput {
  context: StoryEngineContext;
  conversation: ConversationModel;
  emotion: EmotionAnalysis;
  values: ValueAnalysis;
  conflicts: ConflictAnalysis;
}

export interface PatternDetector {
  detectPatterns(input: PatternDetectorInput): PatternAnalysis;
}

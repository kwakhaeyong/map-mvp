import type { ConversationModel, EmotionAnalysis, StoryEngineContext, ValueAnalysis } from "../shared/types";

export interface ValueAnalyzerInput {
  context: StoryEngineContext;
  conversation: ConversationModel;
  emotion: EmotionAnalysis;
}

export interface ValueAnalyzer {
  analyzeValues(input: ValueAnalyzerInput): ValueAnalysis;
}

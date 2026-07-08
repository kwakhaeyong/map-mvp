import type { ConversationModel, EmotionAnalysis, StoryEngineContext } from "../shared/types";

export interface EmotionAnalyzerInput {
  context: StoryEngineContext;
  conversation: ConversationModel;
}

export interface EmotionAnalyzer {
  analyzeEmotion(input: EmotionAnalyzerInput): EmotionAnalysis;
}

import type { DiscoveryContext, EmotionDiscovery, MemoryMoment } from "./types";

export interface EmotionDetectionInput {
  context: DiscoveryContext;
  memories: MemoryMoment[];
}

export interface EmotionDetector {
  detectEmotion(input: EmotionDetectionInput): EmotionDiscovery;
}

import type { ContrastDetector } from "./contrast";
import type { DiscoveryEngine } from "./discovery";
import type { EmotionDetector } from "./emotion";
import type { MemoryExtractor } from "./memory";
import type { PatternDetector } from "./pattern";
import type { DiscoveryStoryBuilder } from "./story";
import type { DiscoveryContext, DiscoveryConversationTurn, MAPDiscoveryResult } from "./types";

export interface MAPDiscoveryEngineModules {
  memory: MemoryExtractor;
  emotion: EmotionDetector;
  pattern: PatternDetector;
  contrast: ContrastDetector;
  discovery: DiscoveryEngine;
  story: DiscoveryStoryBuilder;
}

export interface MAPDiscoveryEngineInput {
  context: DiscoveryContext;
  conversation: DiscoveryConversationTurn[];
}

export interface MAPDiscoveryEngine {
  run(input: MAPDiscoveryEngineInput): MAPDiscoveryResult;
}

export function createMAPDiscoveryEngine(modules: MAPDiscoveryEngineModules): MAPDiscoveryEngine {
  return {
    run(input) {
      const memories = modules.memory.extractMemories(input);
      const emotion = modules.emotion.detectEmotion({ context: input.context, memories });
      const patterns = modules.pattern.detectPatterns({ context: input.context, memories });
      const contrast = modules.contrast.detectContrast({ context: input.context, conversation: input.conversation, patterns });
      const discovery = modules.discovery.discover({ context: input.context, memories, emotion, patterns, contrast });
      const story = modules.story.buildStory({ context: input.context, discovery });

      return {
        context: input.context,
        discovery,
        story,
      };
    },
  };
}

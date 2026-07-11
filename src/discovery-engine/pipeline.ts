import type { ConnectionDetector } from "./connection";
import type { ContrastDetector } from "./contrast";
import type { DiscoveryEngine } from "./discovery";
import type { EmotionDetector } from "./emotion";
import type { MeaningEngine } from "./meaning";
import type { MemoryExtractor } from "./memory";
import type { PatternDetector } from "./pattern";
import type { SignalEngine } from "./signals";
import type { DiscoveryStoryBuilder } from "./story";
import type { DiscoveryContext, DiscoveryConversationTurn, MAPDiscoveryResult } from "./types";

export interface MAPDiscoveryEngineModules {
  memory: MemoryExtractor;
  emotion: EmotionDetector;
  pattern: PatternDetector;
  signals: SignalEngine;
  connection: ConnectionDetector;
  contrast: ContrastDetector;
  discovery: DiscoveryEngine;
  meaning: MeaningEngine;
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
      const signals = modules.signals.extractSignals({ context: input.context, memories, emotion, patterns });
      const connections = modules.connection.detectConnections({ context: input.context, signals });
      const contrast = modules.contrast.detectContrast({ context: input.context, conversation: input.conversation, patterns });
      const discovery = modules.discovery.discover({ context: input.context, memories, emotion, patterns, connections, contrast });
      const meaning = modules.meaning.deriveMeaning({ context: input.context, memories, connections, patterns, emotion });
      const story = modules.story.buildStory({ context: input.context, meaning });

      return {
        context: input.context,
        signals,
        discovery,
        meaning,
        story,
      };
    },
  };
}

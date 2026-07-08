import type { MAPEngine, MAPEngineModules } from "../types/contracts";
import type { MAPEngineOutput, MAPInput } from "../types/core";
import {
  dummyConversationParser,
  dummyGraphBuilder,
  dummyInsightEngine,
  dummyMemoryBuilder,
  dummyPatternFinder,
  dummyResultRenderer,
  dummyShareEngine,
  dummyStoryEngine,
  dummyThemeAnalyzer,
  dummyValueDetector,
} from "./dummy-modules";

export function createDummyMAPEngine(modules: MAPEngineModules = defaultDummyModules): MAPEngine {
  return {
    run(input: MAPInput): MAPEngineOutput {
      const parsed = modules.conversationParser.parse(input);
      const memory = modules.memoryBuilder.build(parsed);
      const themes = modules.themeAnalyzer.extract(memory);
      const values = modules.valueDetector.detect(memory, themes);
      const patterns = modules.patternFinder.find(memory, themes, values);
      const graph = modules.graphBuilder.buildGraph(input, themes, values, patterns);
      const insight = modules.insightEngine.generateInsight(input, graph, values, patterns);
      const story = modules.storyEngine.generateStory(input, insight, themes, values);
      const result = modules.resultRenderer.renderResult(input, graph, values, insight, story);
      const share = modules.shareEngine.renderShare(result);

      return {
        result: { ...result, share },
        trace: [
          { stage: "input", description: "Received category input and answers." },
          { stage: "conversation-parser", description: "Converted answers into utterances and keywords." },
          { stage: "memory-builder", description: "Built stable preference memory from parsed conversation." },
          { stage: "theme-extractor", description: "Extracted weighted themes." },
          { stage: "value-detector", description: "Detected values and priorities." },
          { stage: "pattern-finder", description: "Found repeated emotional patterns." },
          { stage: "map-generator", description: "Generated MAP graph nodes and edges." },
          { stage: "insight-generator", description: "Generated user-facing insights." },
          { stage: "story-generator", description: "Generated lightweight shareable story copy." },
          { stage: "result-renderer", description: "Composed result payload for UI rendering." },
          { stage: "share-renderer", description: "Composed share preview payload." },
        ],
      };
    },
  };
}

export const defaultDummyModules: MAPEngineModules = {
  conversationParser: dummyConversationParser,
  memoryBuilder: dummyMemoryBuilder,
  themeAnalyzer: dummyThemeAnalyzer,
  valueDetector: dummyValueDetector,
  patternFinder: dummyPatternFinder,
  graphBuilder: dummyGraphBuilder,
  insightEngine: dummyInsightEngine,
  storyEngine: dummyStoryEngine,
  resultRenderer: dummyResultRenderer,
  shareEngine: dummyShareEngine,
};

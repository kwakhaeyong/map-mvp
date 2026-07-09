import type { ConflictDetector } from "./conflict-detector/types";
import type { ConversationLayer } from "./conversation/types";
import type { EmotionAnalyzer } from "./emotion-analyzer/types";
import type { HeadlineGenerator } from "./headline-generator/types";
import type { InsightGenerator } from "./insight-generator/types";
import type { StoryMAPRenderer } from "./map-renderer/types";
import type { PatternDetector } from "./pattern-detector/types";
import type { StoryGenerator } from "./story-generator/types";
import type { ValueAnalyzer } from "./value-analyzer/types";
import type { ConversationInput, StoryEngineContext, StoryEngineOutput, StoryRenderedMAP } from "./shared/types";

export interface StoryEngineModules {
  conversation: ConversationLayer;
  emotionAnalyzer: EmotionAnalyzer;
  valueAnalyzer: ValueAnalyzer;
  conflictDetector: ConflictDetector;
  patternDetector: PatternDetector;
  storyGenerator: StoryGenerator;
  headlineGenerator: HeadlineGenerator;
  insightGenerator: InsightGenerator;
  mapRenderer: StoryMAPRenderer;
}

export interface StoryEngineRunInput {
  context: StoryEngineContext;
  inputs: ConversationInput[];
}

export interface StoryEngineRunOutput extends StoryEngineOutput {
  renderedMap: StoryRenderedMAP;
}

export interface StoryEngineMVP {
  run(input: StoryEngineRunInput): StoryEngineRunOutput;
}

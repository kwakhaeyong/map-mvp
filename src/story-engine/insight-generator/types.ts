import type { ConflictAnalysis, HiddenInsight, PatternAnalysis, ShareableHeadline, StoryDraft, StoryEngineContext } from "../shared/types";

export interface InsightGeneratorInput {
  context: StoryEngineContext;
  story: StoryDraft;
  headline: ShareableHeadline;
  conflicts: ConflictAnalysis;
  patterns: PatternAnalysis;
}

export interface InsightGenerator {
  /** Creates one hidden insight after story and headline exist. */
  generateInsight(input: InsightGeneratorInput): HiddenInsight;
}

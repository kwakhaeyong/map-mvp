import type { ShareableHeadline, StoryDraft, StoryEngineContext } from "../shared/types";

export interface HeadlineGeneratorInput {
  context: StoryEngineContext;
  story: StoryDraft;
}

export interface HeadlineGenerator {
  /** Creates one shareable headline from the story. */
  generateHeadline(input: HeadlineGeneratorInput): ShareableHeadline;
}

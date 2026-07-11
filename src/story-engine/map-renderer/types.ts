import type { HiddenInsight, ShareableHeadline, StoryDraft, StoryEngineContext, StoryRenderedMAP } from "../shared/types";

export interface StoryMAPRendererInput {
  context: StoryEngineContext;
  story: StoryDraft;
  headline: ShareableHeadline;
  hiddenInsight: HiddenInsight;
}

export interface StoryMAPRenderer {
  /**
   * MAP Renderer never creates stories. It only visualizes Story Engine output.
   */
  renderMAP(input: StoryMAPRendererInput): StoryRenderedMAP;
}

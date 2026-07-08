import type { IdentityProfile, MAPOSContext, MAPStoryOutput, RenderedMAP } from "../shared/types";

export interface MAPRendererInput {
  context: MAPOSContext;
  story: MAPStoryOutput;
  identity: IdentityProfile;
}

export interface MAPRenderer {
  /**
   * MAP Renderer must only visualize Story Engine output plus reusable identity context.
   * It must not generate new meaning, labels, or insights.
   */
  renderMap(input: MAPRendererInput): RenderedMAP;
}

import type { IdentityProfile, MAPOSContext, MAPStoryOutput, RenderedMAP, ShareArtifact } from "../shared/types";

export interface ShareRendererInput {
  context: MAPOSContext;
  story: MAPStoryOutput;
  identity: IdentityProfile;
  renderedMap: RenderedMAP;
}

export interface ShareRenderer {
  renderShare(input: ShareRendererInput): ShareArtifact;
}

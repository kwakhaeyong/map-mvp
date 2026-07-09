import type { IdentityProfile, MAPOSContext, MAPStoryOutput, PatternSignal, ValueSignal } from "../shared/types";

export interface IdentityEngineInput {
  context: MAPOSContext;
  story: MAPStoryOutput;
  values: ValueSignal[];
  patterns: PatternSignal[];
  previousIdentity?: IdentityProfile;
}

export interface IdentityEngine {
  buildIdentity(input: IdentityEngineInput): IdentityProfile;
}

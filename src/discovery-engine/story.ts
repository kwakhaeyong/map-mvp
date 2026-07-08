import type { DiscoveryContext, DiscoveryStory, FinalDiscovery } from "./types";

export interface DiscoveryStoryInput {
  context: DiscoveryContext;
  discovery: FinalDiscovery;
}

export interface DiscoveryStoryBuilder {
  /** Generates only one final story. Never classify, judge, or diagnose. Always warm, memorable, shareable, and within 150 characters. */
  buildStory(input: DiscoveryStoryInput): DiscoveryStory;
}

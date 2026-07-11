import type { DiscoveryContext, DiscoveryMeaning, DiscoveryStory } from "./types";

export interface DiscoveryStoryInput {
  context: DiscoveryContext;
  meaning: DiscoveryMeaning;
}

export interface DiscoveryStoryBuilder {
  /** Generates only one final story. Never classify, judge, or diagnose. Always warm, memorable, shareable, and within 150 characters. */
  buildStory(input: DiscoveryStoryInput): DiscoveryStory;
}

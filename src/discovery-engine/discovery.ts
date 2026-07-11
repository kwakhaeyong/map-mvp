import type { ConnectionSignal, ContrastDiscovery, DiscoveryCandidate, DiscoveryContext, EmotionDiscovery, FinalDiscovery, MemoryMoment, PatternDiscovery } from "./types";

export interface DiscoveryInput {
  context: DiscoveryContext;
  memories: MemoryMoment[];
  emotion: EmotionDiscovery;
  patterns: PatternDiscovery[];
  connections: ConnectionSignal[];
  contrast?: ContrastDiscovery;
}

export interface DiscoveryEngine {
  discover(input: DiscoveryInput): FinalDiscovery;
}

export function createDiscoveryCandidate(input: DiscoveryInput): DiscoveryCandidate {
  const strongestMemory = input.memories.find((memory) => memory.strength === "strong") ?? input.memories[0];

  return {
    id: `${input.context.sessionId}-discovery-candidate`,
    title: strongestMemory?.text ?? "아직 이름 붙지 않은 발견",
    memory: strongestMemory ?? {
      id: "empty-memory",
      text: "아직 충분한 장면이 모이지 않았어요.",
      strength: "weak",
      sourceTurnIds: [],
    },
    patterns: input.patterns,
    connections: input.connections,
    contrast: input.contrast,
    emotionalReason: input.emotion.label,
  };
}

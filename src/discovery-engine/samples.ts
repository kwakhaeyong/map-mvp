import type { MAPDiscoveryEngineInput } from "./pipeline";
import type { MAPDiscoveryResult } from "./types";

export const sampleDiscoveryInputs: Record<"love" | "travel" | "work", MAPDiscoveryEngineInput> = {
  love: {
    context: { sessionId: "sample-love", category: "ideal-type", locale: "ko-KR", createdAt: "2026-07-08T00:00:00.000Z" },
    conversation: [
      { id: "love-1", source: "user", text: "외모도 중요하다고 생각했는데, 아직도 같이 별거 아닌 일로 웃던 장면이 생각나요." },
      { id: "love-2", source: "user", text: "말이 없어도 편하고 다정한 사람이 오래 남아요." },
    ],
  },
  travel: {
    context: { sessionId: "sample-travel", category: "travel", locale: "ko-KR", createdAt: "2026-07-08T00:00:00.000Z" },
    conversation: [
      { id: "travel-1", source: "user", text: "계획이 중요하다고 말하지만 아직도 혼자 낯선 골목을 걷던 장면이 선명해요." },
      { id: "travel-2", source: "user", text: "그때 이상하게 자유롭고 조금 설렜어요." },
    ],
  },
  work: {
    context: { sessionId: "sample-work", category: "work", locale: "ko-KR", createdAt: "2026-07-08T00:00:00.000Z" },
    conversation: [
      { id: "work-1", source: "user", text: "스펙이 중요하다고 생각했는데, 팀이 어려운 문제를 같이 풀던 때가 제일 기억나요." },
      { id: "work-2", source: "user", text: "도전적이었지만 배우고 성장하는 느낌이 좋았어요." },
    ],
  },
};

export const expectedDiscoveryOutputs: Record<keyof typeof sampleDiscoveryInputs, Pick<MAPDiscoveryResult, "meaning" | "story"> & { signalTypes: string[]; patterns: string[]; connections: string[]; hasContrast: boolean }> = {
  love: {
    signalTypes: ["repeated-word", "emotional-intensity", "relationship", "preference", "temporal", "topic-frequency"],
    patterns: ["laugh", "comfort", "kindness"],
    connections: ["함께 웃던 장면이 편안함의 감정으로 이어져요."],
    hasContrast: true,
    meaning: {
      id: "sample-love-meaning",
      sentence: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
      supportingEvidence: [
        { source: "memory", text: "아직도 같이 별거 아닌 일로 웃던 장면이 생각나요." },
        { source: "connection", text: "함께 웃던 장면이 편안함의 감정으로 이어져요." },
        { source: "pattern", text: "laugh" },
        { source: "emotion", text: "편안함" },
      ],
      confidenceScore: 0.95,
    },
    story: {
      finalStory: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
      memorableLine: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
    },
  },
  travel: {
    signalTypes: ["repeated-word", "emotional-intensity", "preference", "temporal", "topic-frequency"],
    patterns: ["adventure", "freedom"],
    connections: ["목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요."],
    hasContrast: true,
    meaning: {
      id: "sample-travel-meaning",
      sentence: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
      supportingEvidence: [
        { source: "memory", text: "혼자 낯선 골목을 걷던 장면" },
        { source: "connection", text: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요." },
        { source: "pattern", text: "adventure" },
        { source: "emotion", text: "가벼운 설렘" },
      ],
      confidenceScore: 0.95,
    },
    story: {
      finalStory: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
      memorableLine: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
    },
  },
  work: {
    signalTypes: ["repeated-word", "emotional-intensity", "relationship", "preference", "temporal", "topic-frequency"],
    patterns: ["challenge", "growth"],
    connections: ["어려운 문제를 푸는 과정이 성장의 감각으로 이어져요."],
    hasContrast: true,
    meaning: {
      id: "sample-work-meaning",
      sentence: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
      supportingEvidence: [
        { source: "memory", text: "팀이 어려운 문제를 같이 풀던 때" },
        { source: "connection", text: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요." },
        { source: "pattern", text: "challenge" },
        { source: "emotion", text: "몰입" },
      ],
      confidenceScore: 0.95,
    },
    story: {
      finalStory: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
      memorableLine: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
    },
  },
};

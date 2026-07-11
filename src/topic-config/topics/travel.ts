import type { TopicConfig } from "../types";

export const travelTopic: TopicConfig = {
  id: "travel",
  title: "Travel MAP",
  description: "내가 떠나고 싶은 이유와 여행 취향을 그리는 MAP",
  conversationStarter: "아직도 사진 없이 선명하게 떠오르는 여행 장면이 있나요?",
  promptConfig: {
    maxTurns: 4,
    starterPromptId: "travel-scene-start",
    followUpStyle: "memory-first",
    requiredSignals: ["memory", "emotion", "pattern"],
  },
};

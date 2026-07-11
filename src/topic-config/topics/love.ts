import type { TopicConfig } from "../types";

export const loveTopic: TopicConfig = {
  id: "love",
  title: "Love MAP",
  description: "내가 오래 끌리는 마음의 모양을 그리는 MAP",
  conversationStarter: "처음 만났는데 집에 와서도 이상하게 계속 떠오른 사람이 있었나요?",
  promptConfig: {
    maxTurns: 4,
    starterPromptId: "love-memory-start",
    followUpStyle: "memory-first",
    requiredSignals: ["memory", "emotion", "value", "pattern"],
  },
};

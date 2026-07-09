import type { TopicConfig } from "../types";

export const friendTopic: TopicConfig = {
  id: "friend",
  title: "Friend MAP",
  description: "친구 관계에서 편해지는 순간과 나의 관계 방식을 그리는 MAP",
  conversationStarter: "같이 있으면 말투까지 편해지는 친구가 있나요?",
  promptConfig: {
    maxTurns: 4,
    starterPromptId: "friend-comfort-start",
    followUpStyle: "memory-first",
    requiredSignals: ["memory", "emotion", "value", "pattern"],
  },
};

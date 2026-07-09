import type { TopicConfig } from "../types";

export const foodTopic: TopicConfig = {
  id: "food",
  title: "Food MAP",
  description: "음식 취향에 숨어 있는 나의 기분과 생활 리듬을 그리는 MAP",
  conversationStarter: "별거 아닌데 아직도 생각나는 한 끼가 있나요?",
  promptConfig: {
    maxTurns: 3,
    starterPromptId: "food-memory-start",
    followUpStyle: "scene-first",
    requiredSignals: ["memory", "emotion", "value"],
  },
};

import type { TopicConfig } from "../types";

export const workTopic: TopicConfig = {
  id: "work",
  title: "Work MAP",
  description: "일할 때 나다워지는 순간과 에너지를 찾는 MAP",
  conversationStarter: "최근 일하다가 “나 이런 거 좋아했네” 싶었던 순간이 있었나요?",
  promptConfig: {
    maxTurns: 4,
    starterPromptId: "work-energy-start",
    followUpStyle: "scene-first",
    requiredSignals: ["memory", "value", "pattern", "contrast"],
  },
};

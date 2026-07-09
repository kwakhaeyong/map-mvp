import type { TopicConfig } from "../types";

export const todayTopic: TopicConfig = {
  id: "today",
  title: "Today MAP",
  description: "오늘의 생각, 기분, 방향을 가볍게 남기는 MAP",
  conversationStarter: "오늘 스쳐 갔는데 이상하게 마음에 남은 장면이 있나요?",
  promptConfig: {
    maxTurns: 3,
    starterPromptId: "today-moment-start",
    followUpStyle: "scene-first",
    requiredSignals: ["memory", "emotion", "pattern"],
  },
};

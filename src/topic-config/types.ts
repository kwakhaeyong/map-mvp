export type MAPTopicId = "love" | "work" | "travel" | "food" | "friend" | "today";

export interface TopicPromptConfig {
  maxTurns: number;
  starterPromptId: string;
  followUpStyle: "memory-first" | "scene-first" | "contrast-first";
  requiredSignals: Array<"memory" | "emotion" | "value" | "pattern" | "contrast">;
}

export interface TopicConfig {
  id: MAPTopicId;
  title: string;
  description: string;
  conversationStarter: string;
  promptConfig: TopicPromptConfig;
}

export interface TopicEngineFlow {
  topic: TopicConfig;
  stages: readonly ["conversation", "discovery", "story", "map"];
}

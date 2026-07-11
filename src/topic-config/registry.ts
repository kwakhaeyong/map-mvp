import { foodTopic, friendTopic, loveTopic, todayTopic, travelTopic, workTopic } from "./topics";
import type { MAPTopicId, TopicConfig, TopicEngineFlow } from "./types";

export const topicConfigs: Record<MAPTopicId, TopicConfig> = {
  love: loveTopic,
  work: workTopic,
  travel: travelTopic,
  food: foodTopic,
  friend: friendTopic,
  today: todayTopic,
};

export function getTopicConfig(topicId: MAPTopicId): TopicConfig {
  return topicConfigs[topicId];
}

export function createTopicEngineFlow(topicId: MAPTopicId): TopicEngineFlow {
  return {
    topic: getTopicConfig(topicId),
    stages: ["conversation", "discovery", "story", "map"],
  };
}

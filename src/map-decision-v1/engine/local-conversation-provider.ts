import { ConversationProvider, MapSession, Message, NodeKind } from "../types";
import { createId, now } from "./session";

function truncate(text: string, length = 54) {
  const clean = text.trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

const followUps: Record<NodeKind, string> = {
  topic: "그 생각이 요즘 특히 커진 계기는 무엇에 가까워요?",
  trigger: "그 안에서 마음을 가장 흔드는 감정은 무엇인가요?",
  emotion: "그 감정 뒤에 지키고 싶은 기준이나 가치가 있다면 뭐라고 느껴져요?",
  value: "그 기준을 놓고 보면 현실적으로 가능한 선택지는 어떤 것들이 있나요?",
  reason: "반대로 이 선택을 어렵게 만드는 제약이나 조건은 무엇인가요?",
  constraint: "이 제약을 줄이려면 먼저 확인해야 할 정보가 있을까요?",
  option: "각 선택지에서 기대되는 좋은 점과 걸리는 점을 하나씩 말해볼까요?",
  benefit: "그 좋은 점을 얻으려 할 때 조심해야 할 리스크는 무엇인가요?",
  risk: "그 리스크가 사실인지 확인하려면 어떤 정보가 필요할까요?",
  missing: "확인할 정보가 생겼다면, 24시간 안에 할 수 있는 가장 작은 행동은 무엇일까요?",
  direction: "그 방향이 맞는지 확인할 첫 행동을 아주 작게 정하면 무엇일까요?",
  action: "좋아요. 실행한 뒤 다시 보면 어떤 조건에서 방향을 바꿔야 할까요?",
  person: "그 사람과의 관계에서 지키고 싶은 선은 무엇인가요?",
  correction: "좋아요. 수정된 이해를 기준으로 다음에 더 확인할 부분은 무엇일까요?",
};

export const localConversationProvider: ConversationProvider = {
  id: "local",
  nextReply(session: MapSession, latestUserText: string): Message {
    const userTurns = session.messages.filter((message) => message.role === "user").length;
    if (userTurns >= 3 && session.checkpointStatus !== "confirmed") {
      const bullets = session.nodes.slice(0, 5).map((node) => `- ${node.label}: ${truncate(node.text, 44)}`).join("\n");
      return { id: createId("ai"), role: "ai", provider: "local", checkpoint: true, timestamp: now(), text: `지금까지 이야기한 걸 보면\n\n${bullets}\n\n제가 이해한 게 맞나요?` };
    }

    const kinds = new Set(session.nodes.map((node) => node.kind));
    const nextKind = (["trigger", "emotion", "value", "option", "risk", "missing", "action"] as NodeKind[]).find((kind) => !kinds.has(kind)) || "direction";
    const topic = session.nodes.find((node) => node.kind === "topic")?.text || session.selectedTopic || latestUserText;
    const theme = session.nodes.find((node) => node.kind === "value")?.text || session.nodes.find((node) => node.kind === "emotion")?.text;
    const reflection = theme ? `특히 “${truncate(theme, 32)}”가 중요한 단서처럼 보여요.` : "생각의 중심이 조금씩 보이기 시작했어요.";

    return {
      id: createId("ai"),
      role: "ai",
      provider: "local",
      timestamp: now(),
      text: `말해주신 내용을 보면 “${truncate(topic, 36)}” 안에서 ${reflection}\n\n지금까지 이야기만 보면 결론을 서두르기보다 기준과 확인할 정보를 분리해보면 좋겠어요.\n\n${followUps[nextKind]}`,
    };
  },
};

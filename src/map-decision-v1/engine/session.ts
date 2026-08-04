import { MapSession, Message, SCHEMA_VERSION } from "../types";
import { resolveTopic } from "./topics";

export function now() { return new Date().toISOString(); }
export function createId(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

// 세션을 마지막으로 저장한 뒤(session.updatedAt) 이만큼 시간이 지나면,
// 홈(/)에 다시 들어왔을 때 결과·대화 화면으로 곧장 돌아가지 않고 랜딩
// (종류 선택 화면)부터 보여준다(MapDecisionProduct.tsx의 마운트 시
// loadSession 복원 참고). messages/nodes/quizAnswers/결과 데이터는 전혀
// 지우지 않는다 — stage만 landing으로 바꾼다. 짧은 새로고침(30분 이내)에는
// 이 규칙이 전혀 개입하지 않아 결과 화면 새로고침이 그대로 유지되고,
// MAP_CONSTITUTION.md의 "Back/cancel must never destroy the current
// session" 원칙도 지켜진다(세션 내용은 그대로, 화면 진입점만 바뀐다).
export const STALE_SESSION_MS = 30 * 60 * 1000;

export function isSessionStale(session: MapSession, referenceTime: number = Date.now()): boolean {
  const savedAt = Date.parse(session.updatedAt);
  if (Number.isNaN(savedAt)) return false;
  return referenceTime - savedAt > STALE_SESSION_MS;
}

// topicId comes from a topic-picker card (e.g. "career"). Left undefined,
// this stays the original topicless path — nothing defaults to career here
// (that default only applies inside resolveTopic for the AI prompt, once a
// session already exists). Passing an unknown/not-yet-implemented topicId
// still resolves to career via resolveTopic, but the picker screen only
// ever calls this with implemented topics, so that fallback shouldn't fire
// in practice.
export function createSession(topicId?: string, compareWithId?: string): MapSession {
  const timestamp = now();
  const topic = topicId ? resolveTopic(topicId) : undefined;
  const isQuiz = topic?.inputMode === "quiz";
  // 퀴즈형 입력(TopicQuiz.tsx)은 스텝 UI 자체가 첫 질문을 보여주므로
  // 대화 메시지를 미리 채우지 않는다. 그래도 topic 노드는 항상 심어둬야
  // MapDecisionProduct.tsx의 랜딩 폴백 조건(메시지·노드 모두 없을 때
  // 랜딩으로 되돌리는 로직)이 빈 messages 배열만 보고 퀴즈 세션을
  // 잘못 튕겨내지 않는다.
  const messages: Message[] = isQuiz
    ? []
    : [
        {
          id: createId("ai"),
          role: "ai",
          provider: "local",
          timestamp,
          text: topic ? topic.entryQuestion : "오늘은 어떤 생각을 같이 정리해볼까요? 말로 해도, 짧게 써도 괜찮아요.",
        },
      ];
  return {
    version: SCHEMA_VERSION,
    stage: "conversation",
    preferredMapType: "thinking",
    selectedTopic: topic?.name,
    topicId: topic?.id,
    messages,
    nodes: topic ? [{ id: "topic", kind: "topic", label: "핵심 주제", text: topic.name, confidence: "user", createdAt: timestamp }] : [],
    relations: [],
    startedAt: timestamp,
    updatedAt: timestamp,
    ...(isQuiz ? { quizStep: 0, quizVersion: topic?.quizVersion } : {}),
    ...(compareWithId ? { compareWithId } : {}),
  };
}

export function createLandingSession(): MapSession {
  const timestamp = now();
  return { version: SCHEMA_VERSION, stage: "landing", preferredMapType: "thinking", messages: [], nodes: [], relations: [], startedAt: timestamp, updatedAt: timestamp };
}

export function isValidSession(value: unknown): value is MapSession {
  const session = value as MapSession;
  return Boolean(session && Array.isArray(session.messages) && Array.isArray(session.nodes) && Array.isArray(session.relations) && typeof session.stage === "string");
}

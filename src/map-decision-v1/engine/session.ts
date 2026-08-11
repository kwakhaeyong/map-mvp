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

// 새 주제를 시작해도 이전에 완료해둔 다른 주제의 결과는 지우지 않기
// 위한 목록 — MapSession 타입이 애초에 6개 주제 결과(idealTypeResult...
// travelResult) + career 결과(result)를 동시에 담을 수 있게 설계돼
// 있었는데(서로 다른 필드라 겹쳐 써도 안전), createSession()이 매번
// 완전히 새 객체를 만들면서 이전 세션의 이 필드들을 그냥 버리고
// 있었다. 여기 나열한 것 외에는 전부 "진행 중이던 것"(messages/nodes/
// quizAnswers/quizStep/profile 등)이라 새 주제 것으로 리셋돼야 맞다 —
// 이 목록에 진행 상태를 하나라도 섞으면 새 주제가 이전 주제의 흔적을
// 이어받는 사고가 난다. 결과 본문(*Result)과 그 결과의 출처를 증명하는
// 서명(*ResultSignature)·심화 배지(*QuizDepth)만 정확히 대상이다.
function preserveCompletedResults(previousSession?: MapSession): Partial<MapSession> {
  if (!previousSession) return {};
  const preserved: Partial<MapSession> = {};
  if (previousSession.result !== undefined) preserved.result = previousSession.result;
  if (previousSession.resultBlockSignatures !== undefined) preserved.resultBlockSignatures = previousSession.resultBlockSignatures;
  if (previousSession.idealTypeResult !== undefined) preserved.idealTypeResult = previousSession.idealTypeResult;
  if (previousSession.idealTypeResultSignature !== undefined) preserved.idealTypeResultSignature = previousSession.idealTypeResultSignature;
  if (previousSession.idealTypeQuizDepth !== undefined) preserved.idealTypeQuizDepth = previousSession.idealTypeQuizDepth;
  if (previousSession.selfIntroResult !== undefined) preserved.selfIntroResult = previousSession.selfIntroResult;
  if (previousSession.selfIntroResultSignature !== undefined) preserved.selfIntroResultSignature = previousSession.selfIntroResultSignature;
  if (previousSession.selfIntroQuizDepth !== undefined) preserved.selfIntroQuizDepth = previousSession.selfIntroQuizDepth;
  if (previousSession.friendshipResult !== undefined) preserved.friendshipResult = previousSession.friendshipResult;
  if (previousSession.friendshipResultSignature !== undefined) preserved.friendshipResultSignature = previousSession.friendshipResultSignature;
  if (previousSession.workResult !== undefined) preserved.workResult = previousSession.workResult;
  if (previousSession.workResultSignature !== undefined) preserved.workResultSignature = previousSession.workResultSignature;
  if (previousSession.tasteResult !== undefined) preserved.tasteResult = previousSession.tasteResult;
  if (previousSession.tasteResultSignature !== undefined) preserved.tasteResultSignature = previousSession.tasteResultSignature;
  if (previousSession.travelResult !== undefined) preserved.travelResult = previousSession.travelResult;
  if (previousSession.travelResultSignature !== undefined) preserved.travelResultSignature = previousSession.travelResultSignature;
  return preserved;
}

// topicId comes from a topic-picker card (e.g. "career"). Left undefined,
// this stays the original topicless path — nothing defaults to career here
// (that default only applies inside resolveTopic for the AI prompt, once a
// session already exists). Passing an unknown/not-yet-implemented topicId
// still resolves to career via resolveTopic, but the picker screen only
// ever calls this with implemented topics, so that fallback shouldn't fire
// in practice.
//
// previousSession은 "이 세션이 새로 시작되기 직전, 화면에 떠 있던
// 세션"이다 — 넘기면 그 세션에서 완료된 다른 주제 결과들만
// preserveCompletedResults()로 골라 새 세션에 이어붙인다(profile은
// 예전부터 이어받지 않는 결정이었고, 그대로 유지한다 — 위 함수 주석
// 참고). 넘기지 않으면(데모 세션 등) 완전히 빈 새 세션이 된다.
export function createSession(topicId?: string, compareWithId?: string, previousSession?: MapSession): MapSession {
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
    ...preserveCompletedResults(previousSession),
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

import { createId, now } from "./session";
import { TopicAxis } from "./topics";
import { MapSession } from "../types";

// TopicQuiz.tsx의 commitAnswer가 하던 순수 변환 로직을 그대로 옮긴 것 —
// FIRST ACTION MVP(2026-08)에서 Landing.tsx의 REAL Q1 히어로도 똑같은
// 규칙으로 답을 기록해야 해서(퀴즈 화면과 다른 데이터를 만들면 태그
// 매핑·결과 생성이 어긋난다) 컴포넌트 밖으로 뺐다. TopicQuiz.tsx의
// 동작 자체는 이 함수를 호출하는 것으로 바뀌었을 뿐 결과는 이전과
// 완전히 같다(줄 그대로 이동, 로직 변경 없음).

// step(포함) 이후에 위치한 필수·심화 문항의 axisId를 모은다 — "되돌아간
// 지점부터 그 뒤 전부"를 지우기 위한 대상 목록. 필수·심화 문항이 전부
// 이 하나의 함수로 처리된다(문항 종류마다 따로 분기하지 않는다). 요구
// 인덱스로 직접 계산한다 — resolvePhase로 step을 하나씩 훑는 방식은
// 시도했다가 버렸다: resolvePhase는 "빠른 경로"(requiredCount+1)와
// "심화 경로"(requiredCount+2+심화개수) 두 서로 다른 step 번호를 똑같이
// closing으로 해석해서, step을 그대로 훑으면 심화 쪽 closing 번호가
// 얕은 목표 범위에도 우연히 걸려(심화 문항 하나로 돌아갔을 뿐인데 심화
// 경로의 closing 번호가 그 뒤에 있어 같이 지워짐) 방금 빠른 경로로 막
// 제출한 마무리 답변까지 지워버리는 걸 실제로 재현해서 확인했다.
//
// 그래서 마무리 질문(closing)은 이 목록에 아예 넣지 않는다 — 다시
// 제출할 때 applyQuizAnswer의 axisId 필터가 옛 것을 교체하는 것만으로
// 충분하다(자유 서술 한 덩어리라, 옛 답이 잠깐 남아있어도 이상형 태그
// 매핑처럼 실제 모순을 만들지 않는다).
function collectAxisIdsFrom(step: number, requiredAxes: TopicAxis[], optionalAxes: TopicAxis[]): Set<string> {
  const requiredCount = requiredAxes.length;
  const ids = new Set<string>();
  for (let i = Math.max(step, 0); i < requiredCount; i++) ids.add(requiredAxes[i].id);
  optionalAxes.forEach((axis, index) => {
    if (requiredCount + 2 + index >= step) ids.add(axis.id);
  });
  return ids;
}

// step 이후 axisId에 걸린 메시지·quizAnswers 항목을 지운 새 세션을
// 돌려준다. 지울 게 없으면 원본 객체를 그대로 돌려줘 불필요한 리렌더를
// 만들지 않는다.
export function pruneFromStep(current: MapSession, step: number, requiredAxes: TopicAxis[], optionalAxes: TopicAxis[]): MapSession {
  const invalidIds = collectAxisIdsFrom(step, requiredAxes, optionalAxes);
  if (invalidIds.size === 0) return current;
  const nextMessages = current.messages.filter((message) => !message.axisId || !invalidIds.has(message.axisId));
  const nextQuizAnswers = current.quizAnswers
    ? Object.fromEntries(Object.entries(current.quizAnswers).filter(([axisId]) => !invalidIds.has(axisId)))
    : current.quizAnswers;
  if (nextMessages.length === current.messages.length && nextQuizAnswers === current.quizAnswers) return current;
  return { ...current, messages: nextMessages, quizAnswers: nextQuizAnswers };
}

// axisId/selectedTopLevelLabels는 이 답변이 실제 TopicAxis(topics.ts)에
// 묶여 있을 때만 넘어온다 — 있을 때만 session.quizAnswers에 기록해서
// 공유 태그(ideal-type-tags.ts)가 나중에 코드로 결정적으로 매핑할 수
// 있게 한다. TopicQuiz.tsx의 commitAnswer와 Landing.tsx의 REAL Q1
// 히어로 둘 다 이 함수 하나만 호출한다 — 두 진입점이 서로 다른 답변
// 데이터를 만들 위험을 구조적으로 없앤다.
export function applyQuizAnswer(
  current: MapSession,
  questionText: string,
  answerText: string,
  axisId: string | undefined,
  selectedTopLevelLabels: string[] | undefined,
  requiredAxes: TopicAxis[],
  optionalAxes: TopicAxis[],
): MapSession {
  const timestamp = now();
  // "이전"으로 되돌아가 같은 axisId를 다시 답한 경우, 그 축의 예전
  // 질문·답변 쌍을 먼저 지운다.
  const baseMessages = axisId ? current.messages.filter((message) => message.axisId !== axisId) : current.messages;
  const nextMessages = answerText
    ? [
        ...baseMessages,
        { id: createId("ai"), role: "ai" as const, provider: "local" as const, timestamp, text: questionText, axisId },
        { id: createId("user"), role: "user" as const, timestamp, text: answerText, axisId },
      ]
    : baseMessages;
  const nextQuizAnswers =
    axisId && selectedTopLevelLabels && selectedTopLevelLabels.length > 0
      ? { ...current.quizAnswers, [axisId]: selectedTopLevelLabels }
      : current.quizAnswers;
  const nextStep = (current.quizStep ?? 0) + 1;
  const pruned = pruneFromStep({ ...current, messages: nextMessages, quizAnswers: nextQuizAnswers }, nextStep, requiredAxes, optionalAxes);
  return { ...pruned, quizStep: nextStep, updatedAt: timestamp };
}

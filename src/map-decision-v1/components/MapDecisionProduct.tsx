"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLandingSession, createSession, isSessionStale, now } from "../engine/session";
import { resolveTopic } from "../engine/topics";
import { clearSession, loadSession, saveSession } from "../storage/session-storage";
import { MapOutputType, MapSession } from "../types";
import { Conversation } from "./Conversation";
import { FriendshipCard } from "./FriendshipCard";
import { IdealTypeCard } from "./IdealTypeCard";
import { Landing } from "./Landing";
import { ProfileStep } from "./ProfileStep";
import { Result } from "./Result";
import { SelfIntroCard } from "./SelfIntroCard";
import { TasteCard } from "./TasteCard";
import { TopicQuiz } from "./TopicQuiz";
import { TravelCard } from "./TravelCard";
import { WorkCard } from "./WorkCard";

function createDemoSession(): MapSession {
  const session = createSession("career");
  return {
    ...session,
    isDemo: true,
    demoStep: 0,
    messages: [
      ...session.messages,
      { id: "demo-user-1", role: "user", text: "요즘 일은 익숙한데 성장하는 느낌이 거의 없어요.", timestamp: now() },
      { id: "demo-ai-1", role: "ai", provider: "local", text: "익숙함은 안정감을 주지만, 성장감이 줄어든 부분이 크게 걸리는 흐름으로 보여요. 지금은 바로 결론보다 기준을 같이 나눠보면 좋겠어요.", timestamp: now() },
    ],
    nodes: [
      ...session.nodes,
      { id: "demo-fact", kind: "fact", label: "내가 말한 상황", text: "일은 익숙하지만 성장감이 줄어듦", confidence: "user", createdAt: now() },
      { id: "demo-value", kind: "value", label: "중요한 기준", text: "안정과 성장 사이에서 흔들림", confidence: "ai", createdAt: now() },
      { id: "demo-missing", kind: "missing", label: "확인할 내용", text: "다른 팀 기회와 생활비 여유", confidence: "ai", createdAt: now() },
    ],
    relations: [
      { id: "demo-rel-1", from: "topic", to: "demo-fact", kind: "원인", strength: "solid" },
      { id: "demo-rel-2", from: "topic", to: "demo-value", kind: "영향", strength: "accent" },
      { id: "demo-rel-3", from: "topic", to: "demo-missing", kind: "확인 필요", strength: "dotted" },
    ],
  };
}


const demoReplies = [
  {
    user: "성장감이 제일 걸려요.",
    ai: "성장감이 줄어든 감각이 중심에 놓였네요. 지금은 바로 떠날지보다, 무엇이 회복되면 남을 수 있는지도 같이 볼 수 있어요.",
    node: { id: "demo-emotion", kind: "emotion", label: "걸리는 부분", text: "성장감이 줄어든 감각", confidence: "user" },
    relation: { id: "demo-rel-4", from: "topic", to: "demo-emotion", kind: "영향", strength: "accent" },
  },
  {
    user: "생활비 때문에 바로 움직이긴 부담돼요.",
    ai: "움직이고 싶은 마음과 생활비 부담이 같이 있네요. 그래서 확인할 정보가 생기면 선택이 더 안전해질 수 있어요.",
    node: { id: "demo-risk", kind: "risk", label: "걸리는 부분", text: "생활비 공백에 대한 부담", confidence: "user" },
    relation: { id: "demo-rel-5", from: "topic", to: "demo-risk", kind: "리스크", strength: "dotted" },
  },
  {
    user: "먼저 채용공고랑 내부 이동을 확인해볼게요.",
    ai: "좋아요. 지금 보이는 흐름은 ‘바로 결론’보다 확인 후 움직이는 쪽에 가까워요. 이 상태로 MAP을 열어보면 관계가 더 잘 보입니다.",
    node: { id: "demo-action", kind: "action", label: "다음 행동", text: "채용공고와 내부 이동 가능성 확인", confidence: "user" },
    relation: { id: "demo-rel-6", from: "topic", to: "demo-action", kind: "다음 행동", strength: "accent" },
  },
] as const;

export function MapDecisionProduct() {
  const [session, setSession] = useState<MapSession>(() => createLandingSession());
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  // 복원한 세션이 30분 넘게 방치돼 stage를 landing으로 강제 전환한
  // 경우에만, 그 stage가 원래 "result"였고 결과 데이터가 남아있으면
  // true — Landing이 "이전 결과 보기" 버튼을 보여줄지 판단하는 데 쓴다.
  // 세션을 새로 만드는 모든 지점(start/startDemo/reset/exitDemoToReal)
  // 에서 반드시 false로 되돌려야 한다 — 안 그러면 그 새 세션에는
  // idealTypeResult 등이 없는데도 이 버튼이 남아있다가, 눌렀을 때
  // 존재하지 않는 결과로 이동하려 해서 깨진다.
  const [hasStaleResult, setHasStaleResult] = useState(false);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving">("loading");
  const routeReady = useRef(false);

  useEffect(() => {
    const saved = loadSession();
    // 30분 넘게 방치된 세션은 stage만 landing으로 되돌린다 — messages/
    // nodes/quizAnswers/결과 데이터는 그대로 둔다(MAP_CONSTITUTION.md의
    // "Back/cancel must never destroy the current session"). 30분 이내
    // 새로고침은 이 분기를 타지 않아 결과 화면 새로고침이 그대로
    // 유지된다.
    const effective = saved && isSessionStale(saved) ? ({ ...saved, stage: "landing" } as MapSession) : saved;
    if (effective) {
      if (saved && effective !== saved) {
        const hasResultData = Boolean(saved.idealTypeResult || saved.selfIntroResult || saved.friendshipResult || saved.workResult || saved.tasteResult || saved.travelResult || saved.result);
        setHasStaleResult(saved.stage === "result" && hasResultData);
      }
      setSession(effective);
      setHasSavedDraft(effective.messages.length > 0 || effective.nodes.length > 0 || Boolean(effective.localDraft?.trim()));
    }
    // 공유 화면(/r/{id})의 "너도 만들어봐"가 랜딩(종류 선택)을 한 번 더
    // 거치게 하면 그 사이에 이탈한다 — /?start=<topicId>로 오면 랜딩을
    // 건너뛰고 그 주제 퀴즈를 곧장 시작한다. 이미 진행 중인 세션(대화나
    // 결과 화면에 실제로 머물러 있는 상태)이 있으면 그 진행을 지우지
    // 않고 무시한다. 소비하고 나면 주소에서 지워서, 새로고침해도
    // 처음부터 다시 시작되지 않게 한다.
    //
    // ★stage가 아니라 messages/nodes 길이만으로 판단하면 안 된다(#99) —
    // 대화를 시작했다가 브라우저 뒤로가기로 랜딩까지 되돌아온 경우
    // stage는 "landing"으로 바뀌지만 messages/nodes는 그대로 남아있다.
    // 그 상태에서 공유 링크로 들어와 CTA를 눌러도 이 조건이 "진행 중"
    // 이라고 오판해 오버라이드를 건너뛰어, 결국 랜딩(종류 선택 화면)
    // 그대로 보여지는 문제가 있었다 — 직접 재현해서 확인함.
    //
    // ★여기서도 saved가 아니라 effective(30분 지나 landing으로 강제된
    // 뒤)의 stage를 봐야 한다 — 방치된 세션은 더 이상 "진행 중"이
    // 아니므로, ?start=로 들어온 새 시작을 막지 않아야 한다.
    const hasActiveSession = Boolean(effective && effective.stage !== "landing" && (effective.messages.length > 0 || effective.nodes.length > 0));
    const searchParams = new URLSearchParams(window.location.search);
    const startTopic = searchParams.get("start");
    // 친구의 공유 카드(/r/{id})를 통해 들어온 경우, 그 친구의 공유 ID를
    // 같이 받아 세션에 남겨둔다(궁합 기능 — 결과 화면에서 "친구와의 궁합
    // 보기" 배너를 띄우는 데만 쓴다). createShareId()가 만드는 형식(16자
    // base64url)이 아니면 무시한다 — 다른 값이 들어와도 조용히 버려지고
    // 나머지 흐름에는 영향이 없다.
    const withParam = searchParams.get("with");
    const compareWithId = withParam && /^[A-Za-z0-9_-]{16}$/.test(withParam) ? withParam : undefined;
    if (startTopic && !hasActiveSession) {
      setHasStaleResult(false);
      setSession(createSession(startTopic, compareWithId));
      window.history.replaceState({}, "", window.location.pathname);
    }
    setSaveState("saved");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || session.isDemo) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveSession({ ...session, updatedAt: now() });
      setHasSavedDraft(session.messages.length > 0 || session.nodes.length > 0 || Boolean(session.localDraft?.trim()));
      setSaveState("saved");
    }, 220);
    return () => window.clearTimeout(timer);
  }, [hydrated, session]);

  useEffect(() => {
    if (!hydrated) return;
    const current = window.history.state as { mapStage?: string } | null;
    if (!current?.mapStage) {
      window.history.replaceState({ mapStage: session.stage }, "", window.location.href);
    }
    routeReady.current = true;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !routeReady.current) return;
    const current = window.history.state as { mapStage?: string } | null;
    if (current?.mapStage !== session.stage) {
      window.history.pushState({ mapStage: session.stage }, "", window.location.href);
    }
  }, [hydrated, session.stage]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const stage = (event.state as { mapStage?: MapSession["stage"] } | null)?.mapStage;
      if (stage === "landing" || stage === "profile" || stage === "conversation" || stage === "result") {
        setSession((current) => ({ ...current, stage }));
        return;
      }
      setSession((current) => ({ ...current, stage: current.messages.length || current.nodes.length ? "conversation" : "landing" }));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // 아래 네 곳 모두 세션을 통째로 새로 만든다 — 복원 시 계산해둔
  // hasStaleResult는 그 예전 세션 얘기라 새 세션에는 더 이상 맞지
  // 않으므로 같이 꺼준다(안 그러면 방금 만든, 결과가 없는 세션인데도
  // "이전 결과 보기"가 남아있다가 눌렀을 때 깨진다).
  // 주제를 고른 직후 곧장 "conversation"(대화·퀴즈 화면)으로 보내지
  // 않고 "profile"(ProfileStep.tsx)을 먼저 거치게 한다 — 프로필 입력을
  // 마치거나 건너뛰면 goConversation이 "conversation"으로 넘긴다.
  // /?start=<topicId> 딥링크(공유 카드의 "너도 만들어봐")는 이 함수를
  // 거치지 않고 createSession()을 직접 호출하는 별도 경로라(아래
  // hydrate effect 참고) 여전히 profile 화면을 건너뛴다 — 알려진 한계.
  //
  // createSession()은 매번 profile 없는 새 세션을 만들고, 여기서도 이전
  // 세션의 profile을 이어붙이지 않는다 — 주제마다 맥락이 달라 같은
  // 사람도 다르게 답할 수 있으므로(예: 방금 "일할 때의 나"에서 30대·
  // 직장인이라 답했어도, 이어서 "친구·인간관계"를 고르면 그 답이 그대로
  // 맞으리라고 가정하지 않는다), 주제를 바꿀 때마다 프로필을 새로
  // 묻는 것은 의도된 설계이지 버그가 아니다.
  const start = (topicId?: string) => {
    setHasStaleResult(false);
    setSession({ ...createSession(topicId), stage: "profile" });
  };
  const startDemo = () => { setHasStaleResult(false); setSession(createDemoSession()); };
  const reset = () => { if (!session.isDemo) clearSession(); setHasSavedDraft(false); setHasStaleResult(false); setSaveState("saved"); setSession(createLandingSession()); };
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));
  // "직접 해보기"도 이제 종류 선택 화면을 거친다 — 데모를 벗어나는 것도
  // 하나의 진입이므로, 주제 없이 곧장 대화로 들어가던 예전 동작 대신
  // 랜딩(종류 선택 화면)으로 보낸다.
  const exitDemoToReal = () => { setHasStaleResult(false); setSession(createLandingSession()); };
  const goConversation = useCallback(() => setSession((current) => ({ ...current, stage: "conversation" })), []);
  const goResult = useCallback(() => setSession((current) => ({ ...current, stage: "result" })), []);
  // "다른 주제 고르기"(ProfileStep.tsx의 work+학생 안내) 전용. reset()과
  // 달리 세션·localStorage를 지우지 않고 stage만 "landing"으로 돌린다 —
  // 다음 주제에 profile을 이어붙이려는 게 아니라(그건 이제 하지 않는다,
  // start() 참고), 방금 답한 occupationStatus가 남아있어야 돌아간
  // 랜딩 화면에서 hideWorkTopic이 곧바로 work 카드를 계속 숨겨둘 수
  // 있기 때문이다 — reset()을 쓰면 profile까지 지워져 카드가 다시
  // 나타난다.
  const backToLandingKeepProfile = useCallback(() => setSession((current) => ({ ...current, stage: "landing" })), []);

  const advanceDemo = () => setSession((current) => {
    const step = current.demoStep || 0;
    const reply = demoReplies[Math.min(step, demoReplies.length - 1)];
    if (!current.isDemo || step >= demoReplies.length) return current;
    const createdAt = now();
    return {
      ...current,
      demoStep: step + 1,
      messages: [
        ...current.messages,
        { id: `demo-user-step-${step}`, role: "user", text: reply.user, timestamp: createdAt },
        { id: `demo-ai-step-${step}`, role: "ai", provider: "local", text: reply.ai, timestamp: createdAt },
      ],
      nodes: [...current.nodes, { ...reply.node, createdAt }],
      relations: [...current.relations, reply.relation],
      updatedAt: createdAt,
    } as MapSession;
  });

  if (session.stage === "landing" || (!session.messages.length && !session.nodes.length)) {
    return (
      <Landing
        hasDraft={hasSavedDraft}
        hasStaleResult={hasStaleResult}
        onStart={start}
        onResume={goConversation}
        onViewResult={goResult}
        onDemo={startDemo}
        saveState={saveState}
        // 프로필 화면은 주제를 고른 "뒤"에 나온다 — 그래서 이 값은 첫
        // 방문(아직 profile이 없음)에는 항상 false다. work를 처음
        // 선택하는 사람에게는 아무 영향이 없다. 이미 학생으로 답한 뒤
        // (1) 브라우저 뒤로가기로 랜딩에 돌아왔거나 (2) ProfileStep.tsx의
        // work+학생 안내에서 "다른 주제 고르기"를 눌렀을 때만 카드가
        // 빠진다 — 두 경로 다 reset()이 아니라서 profile이 유지된다.
        hideWorkTopic={session.profile?.occupationStatus === "학생"}
      />
    );
  }
  if (session.stage === "profile") {
    return (
      <ProfileStep
        session={session}
        setSession={setSession}
        onContinue={goConversation}
        onReset={reset}
        onChooseDifferentTopic={backToLandingKeepProfile}
      />
    );
  }
  if (session.stage === "result") {
    const resultTopic = resolveTopic(session.topicId);
    if (resultTopic.resultLayoutId === "idealType") {
      return <IdealTypeCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    if (resultTopic.resultLayoutId === "selfIntro") {
      return <SelfIntroCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    if (resultTopic.resultLayoutId === "friendship") {
      return <FriendshipCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    if (resultTopic.resultLayoutId === "work") {
      return <WorkCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    if (resultTopic.resultLayoutId === "taste") {
      return <TasteCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    if (resultTopic.resultLayoutId === "travelStyle") {
      return <TravelCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    return <Result session={session} setSession={setSession} onContinue={goConversation} onReset={reset} onSelectType={selectType} onRealStart={exitDemoToReal} saveState={saveState} />;
  }
  const topic = resolveTopic(session.topicId);
  if (topic.inputMode === "quiz") {
    return <TopicQuiz session={session} setSession={setSession} onFinish={goResult} onReset={reset} saveState={saveState} />;
  }
  return <Conversation session={session} setSession={setSession} onFinish={goResult} onReset={reset} onRealStart={exitDemoToReal} onDemoChoice={advanceDemo} saveState={saveState} />;
}

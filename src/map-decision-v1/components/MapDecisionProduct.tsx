"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLandingSession, createSession, now } from "../engine/session";
import { resolveTopic } from "../engine/topics";
import { clearSession, loadSession, saveSession } from "../storage/session-storage";
import { MapOutputType, MapSession } from "../types";
import { Conversation } from "./Conversation";
import { IdealTypeCard } from "./IdealTypeCard";
import { Landing } from "./Landing";
import { Result } from "./Result";
import { TopicQuiz } from "./TopicQuiz";

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
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving">("loading");
  const routeReady = useRef(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
      setHasSavedDraft(saved.messages.length > 0 || saved.nodes.length > 0 || Boolean(saved.localDraft?.trim()));
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
    const hasActiveSession = Boolean(saved && saved.stage !== "landing" && (saved.messages.length > 0 || saved.nodes.length > 0));
    const startTopic = new URLSearchParams(window.location.search).get("start");
    if (startTopic && !hasActiveSession) {
      setSession(createSession(startTopic));
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
      if (stage === "landing" || stage === "conversation" || stage === "result") {
        setSession((current) => ({ ...current, stage }));
        return;
      }
      setSession((current) => ({ ...current, stage: current.messages.length || current.nodes.length ? "conversation" : "landing" }));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const start = (topicId?: string) => setSession(createSession(topicId));
  const startDemo = () => setSession(createDemoSession());
  const reset = () => { if (!session.isDemo) clearSession(); setHasSavedDraft(false); setSaveState("saved"); setSession(createLandingSession()); };
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));
  // "직접 해보기"도 이제 종류 선택 화면을 거친다 — 데모를 벗어나는 것도
  // 하나의 진입이므로, 주제 없이 곧장 대화로 들어가던 예전 동작 대신
  // 랜딩(종류 선택 화면)으로 보낸다.
  const exitDemoToReal = () => setSession(createLandingSession());
  const goConversation = useCallback(() => setSession((current) => ({ ...current, stage: "conversation" })), []);
  const goResult = useCallback(() => setSession((current) => ({ ...current, stage: "result" })), []);

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
    return <Landing hasDraft={hasSavedDraft} onStart={start} onResume={goConversation} onDemo={startDemo} saveState={saveState} />;
  }
  if (session.stage === "result") {
    const resultTopic = resolveTopic(session.topicId);
    if (resultTopic.resultLayoutId === "idealType") {
      return <IdealTypeCard session={session} setSession={setSession} onContinue={goConversation} onReset={reset} />;
    }
    return <Result session={session} setSession={setSession} onContinue={goConversation} onReset={reset} onSelectType={selectType} onRealStart={exitDemoToReal} saveState={saveState} />;
  }
  const topic = resolveTopic(session.topicId);
  if (topic.inputMode === "quiz") {
    return <TopicQuiz session={session} setSession={setSession} onFinish={goResult} onReset={reset} saveState={saveState} />;
  }
  return <Conversation session={session} setSession={setSession} onFinish={goResult} onReset={reset} onRealStart={exitDemoToReal} onDemoChoice={advanceDemo} saveState={saveState} />;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLandingSession, createSession, now } from "../engine/session";
import { clearSession, loadSession, saveSession } from "../storage/session-storage";
import { MapOutputType, MapSession } from "../types";
import { Conversation } from "./Conversation";
import { Landing } from "./Landing";
import { Result } from "./Result";

function createDemoSession(): MapSession {
  const session = createSession("이직할까?");
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

  const start = (topic?: string) => setSession(createSession(topic));
  const startDemo = () => setSession(createDemoSession());
  const reset = () => { if (!session.isDemo) clearSession(); setHasSavedDraft(false); setSaveState("saved"); setSession(createLandingSession()); };
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));
  const exitDemoToReal = () => setSession(createSession());
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
    return <Result session={session} setSession={setSession} onContinue={goConversation} onReset={reset} onSelectType={selectType} onRealStart={exitDemoToReal} saveState={saveState} />;
  }
  return <Conversation session={session} setSession={setSession} onFinish={goResult} onReset={reset} onRealStart={exitDemoToReal} onDemoChoice={advanceDemo} saveState={saveState} />;
}

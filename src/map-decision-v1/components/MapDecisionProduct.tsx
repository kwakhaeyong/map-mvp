"use client";

import { useEffect, useState } from "react";
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

export function MapDecisionProduct() {
  const [session, setSession] = useState<MapSession>(() => createLandingSession());
  const [hydrated, setHydrated] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
      setHasSavedDraft(saved.messages.length > 0 || saved.nodes.length > 0);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || session.isDemo) return;
    saveSession({ ...session, updatedAt: now() });
  }, [hydrated, session]);

  const start = (topic?: string) => setSession(createSession(topic));
  const startDemo = () => setSession(createDemoSession());
  const reset = () => { if (!session.isDemo) clearSession(); setHasSavedDraft(false); setSession(createLandingSession()); };
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));
  const exitDemoToReal = () => setSession(createSession());

  if (session.stage === "landing" || (!session.messages.length && !session.nodes.length)) {
    return <Landing hasDraft={hasSavedDraft} onStart={start} onResume={() => setSession((current) => ({ ...current, stage: "conversation" }))} onDemo={startDemo} />;
  }
  if (session.stage === "result") {
    return <Result session={session} onContinue={() => setSession((current) => ({ ...current, stage: "conversation" }))} onReset={reset} onSelectType={selectType} onRealStart={exitDemoToReal} />;
  }
  return <Conversation session={session} setSession={setSession} onFinish={() => setSession((current) => ({ ...current, stage: "result" }))} onReset={reset} onRealStart={exitDemoToReal} />;
}

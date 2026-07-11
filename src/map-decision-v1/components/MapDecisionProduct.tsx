"use client";

import { useEffect, useState } from "react";
import { createLandingSession, createSession, now } from "../engine/session";
import { clearSession, loadSession, saveSession } from "../storage/session-storage";
import { MapOutputType, MapSession } from "../types";
import { Conversation } from "./Conversation";
import { Landing } from "./Landing";
import { Result } from "./Result";

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
    if (!hydrated) return;
    saveSession({ ...session, updatedAt: now() });
  }, [hydrated, session]);

  const start = (topic?: string) => setSession(createSession(topic));
  const reset = () => { clearSession(); setHasSavedDraft(false); setSession(createLandingSession()); };
  const selectType = (type: MapOutputType) => setSession((current) => ({ ...current, preferredMapType: type }));

  if (session.stage === "landing" || (!session.messages.length && !session.nodes.length)) {
    return <Landing hasDraft={hasSavedDraft} onStart={start} onResume={() => setSession((current) => ({ ...current, stage: "conversation" }))} />;
  }
  if (session.stage === "result") {
    return <Result session={session} onContinue={() => setSession((current) => ({ ...current, stage: "conversation" }))} onReset={reset} onSelectType={selectType} />;
  }
  return <Conversation session={session} setSession={setSession} onFinish={() => setSession((current) => ({ ...current, stage: "result" }))} onReset={reset} />;
}

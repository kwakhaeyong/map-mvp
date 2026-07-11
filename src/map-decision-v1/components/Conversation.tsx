"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { localConversationProvider } from "../engine/local-conversation-provider";
import { extractThinking } from "../engine/thinking-extractor";
import { createId, now } from "../engine/session";
import { MapSession, Message } from "../types";
import { useWebSpeech } from "../voice/use-web-speech";
import { Brand } from "./Landing";
import { MapCanvas } from "./MapCanvas";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }

export function Conversation({ session, setSession, onFinish, onReset }: { session: MapSession; setSession: Dispatch<SetStateAction<MapSession>>; onFinish: () => void; onReset: () => void }) {
  const [draft, setDraft] = useState("");
  const [correction, setCorrection] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const speech = useWebSpeech((text) => setDraft((current) => `${current}${current ? " " : ""}${text}`));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [session.messages.length]);

  const submit = (text = draft, isCorrection = false) => {
    const clean = text.trim();
    if (!clean) return;
    setDraft("");
    setCorrection("");
    setSession((previous) => {
      const userMessage: Message = { id: createId("user"), role: "user", text: clean, timestamp: now() };
      const extracted = extractThinking(clean, previous, isCorrection);
      const intermediate: MapSession = {
        ...previous,
        checkpointStatus: isCorrection ? "confirmed" : previous.checkpointStatus,
        messages: [...previous.messages, userMessage],
        nodes: [...previous.nodes, ...extracted.nodes],
        relations: [...previous.relations, ...extracted.relations],
        updatedAt: now(),
      };
      return { ...intermediate, messages: [...intermediate.messages, localConversationProvider.nextReply(intermediate, clean)] };
    });
  };

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-[#fbf7ef]/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Brand />
          <div className="flex gap-2">
            <button className="rounded-full border bg-white px-4 py-2 text-sm font-black" onClick={onReset}>새 MAP</button>
            <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={onFinish}>현재 MAP 보기</button>
          </div>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1.08fr)]">
        <aside className="order-2 hidden lg:order-1 lg:block">
          <MapCanvas session={session} />
          <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-500">작성 내용은 이 브라우저에 임시 저장돼요. MAP은 말할수록 바로 자라납니다.</p>
        </aside>
        <section className="order-1 flex min-h-[72vh] flex-col rounded-[2rem] border border-white bg-white/88 shadow-2xl shadow-slate-200/70" aria-label="MAP 대화">
          <button className="mx-4 mt-4 block rounded-2xl border border-blue-100 bg-blue-50 p-3 text-left font-black text-blue-800 lg:hidden" onClick={() => setMapOpen(true)}>지금 보이는 MAP 열기 · 노드 {session.nodes.length}개</button>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {session.messages.map((message) => (
              <div key={message.id} className={cx("max-w-[86%] rounded-[1.5rem] p-4 leading-7 shadow-sm", message.role === "user" ? "ml-auto bg-blue-700 font-bold text-white" : "bg-slate-50 font-semibold text-slate-750")}>
                <p className="whitespace-pre-line">{message.text}</p>
                {message.checkpoint ? <CheckpointControls setSession={setSession} /> : null}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {session.checkpointStatus === "correcting" ? (
            <div className="border-t border-slate-100 p-4">
              <label className="text-sm font-black text-rose-700" htmlFor="correction">어떤 부분이 달랐나요?</label>
              <textarea id="correction" className="mt-2 min-h-20 w-full rounded-2xl border p-3 focus:outline-none focus:ring-4 focus:ring-rose-100" value={correction} onChange={(event) => setCorrection(event.target.value)} placeholder="예: 성장보다 안정이 더 중요한 것 같아요." />
              <button className="mt-2 rounded-full bg-rose-600 px-4 py-2 font-black text-white" onClick={() => submit(correction, true)}>수정 반영하기</button>
            </div>
          ) : null}
          <ResponseChips onPick={(text) => setDraft((current) => current ? `${current} ${text}` : text)} />
          <Composer draft={draft} setDraft={setDraft} speech={speech} onSubmit={() => submit()} onFinish={onFinish} />
        </section>
      </section>
      {mapOpen ? <div className="fixed inset-0 z-50 bg-slate-950/55 p-3 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="전체 MAP"><div className="h-full overflow-y-auto rounded-[2rem] bg-[#fbf7ef] p-3"><button className="mb-3 rounded-full bg-slate-950 px-4 py-2 font-black text-white" onClick={() => setMapOpen(false)}>닫기</button><MapCanvas session={session} /></div></div> : null}
    </main>
  );
}

function CheckpointControls({ setSession }: { setSession: Dispatch<SetStateAction<MapSession>> }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={() => setSession((session) => ({ ...session, checkpointStatus: "confirmed", messages: [...session.messages, { id: createId("ai"), role: "ai", provider: "local", text: "좋아요. 확인된 이해로 표시해둘게요. 이제 빠진 정보와 다음 행동을 더 선명하게 볼 수 있어요.", timestamp: now() }], nodes: session.nodes.map((node) => ({ ...node, confidence: node.confidence === "user" ? "confirmed" : node.confidence })) }))}>맞아요</button>
      <button className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700" onClick={() => setSession((session) => ({ ...session, checkpointStatus: "correcting" }))}>조금 달라요</button>
    </div>
  );
}

function Composer({ draft, setDraft, speech, onSubmit, onFinish }: { draft: string; setDraft: (value: string) => void; speech: ReturnType<typeof useWebSpeech>; onSubmit: () => void; onFinish: () => void }) {
  return (
    <div className="sticky bottom-0 rounded-b-[2rem] border-t border-slate-100 bg-white/95 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-black">{speech.listening ? "듣고 있어요" : "말하거나 입력해 주세요"}</p>
          <p className="text-sm font-bold text-slate-500">{speech.listening ? `편하게 계속 말해 주세요 · ${speech.seconds}초` : "말한 내용을 글로 옮기고 있어요 · 확인하고 수정할 수 있어요"}</p>
          {speech.interimTranscript ? <p className="mt-1 text-sm font-bold text-blue-700">{speech.interimTranscript}</p> : null}
          {speech.error ? <p className="mt-1 text-sm font-bold text-rose-600">{speech.error}</p> : null}
          {!speech.supported ? <p className="mt-1 text-sm font-bold text-amber-700">음성 미지원 브라우저라 텍스트 입력으로 이어갈게요.</p> : null}
        </div>
        <div className="flex gap-2">
          <button aria-label={speech.listening ? "녹음 중지" : "마이크로 말하기"} className={cx("grid size-14 place-items-center rounded-full text-xl font-black text-white shadow-xl", speech.listening ? "animate-pulse bg-rose-600" : "bg-blue-700")} onClick={speech.listening ? speech.stop : speech.start}>🎙</button>
          {speech.listening ? <button className="rounded-full border px-4 py-2 font-black" onClick={speech.cancel}>취소</button> : null}
        </div>
      </div>
      <textarea className="min-h-24 w-full resize-y rounded-[1.25rem] border border-slate-200 p-4 text-lg font-semibold leading-8 focus:outline-none focus:ring-4 focus:ring-blue-100" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="예: 이직을 고민하고 있는데 사람들은 좋고 성장하는 느낌은 없어요." />
      <div className="mt-3 flex justify-between">
        <button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onFinish}>MAP 미리보기</button>
        <button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-40" disabled={!draft.trim()} onClick={onSubmit}>보내기</button>
      </div>
    </div>
  );
}

function ResponseChips({ onPick }: { onPick: (text: string) => void }) {
  const chips = ["이 부분이 제일 마음에 걸려요", "아직 확인할 정보가 있어요", "지금 마음은 이쪽에 가까워요"];
  return <div className="border-t border-slate-100 px-4 py-3"><p className="mb-2 text-xs font-black text-slate-500">가볍게 이어서 말하기</p><div className="flex flex-wrap gap-2">{chips.map((chip) => <button key={chip} className="rounded-full bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 hover:bg-blue-50" onClick={() => onPick(chip)}>{chip}</button>)}</div></div>;
}

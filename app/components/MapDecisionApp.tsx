"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "map-decision-thinking-os-v1";
const SCHEMA_VERSION = 1;

type Role = "ai" | "user";
type MapType = "thinking" | "decision";
type NodeKind = "topic" | "trigger" | "emotion" | "person" | "value" | "reason" | "constraint" | "option" | "benefit" | "risk" | "missing" | "direction" | "action" | "correction";
type RelationKind = "원인" | "영향" | "충돌" | "대안" | "장점" | "리스크" | "확인 필요" | "다음 행동";

type Message = { id: string; role: Role; text: string; timestamp: string; checkpoint?: boolean };
type MapNode = { id: string; kind: NodeKind; label: string; text: string; confidence: "user" | "ai" | "confirmed"; createdAt: string };
type MapRelation = { id: string; from: string; to: string; kind: RelationKind; strength: "solid" | "dotted" | "accent" };
type Session = {
  version: number;
  messages: Message[];
  nodes: MapNode[];
  relations: MapRelation[];
  selectedTopic?: string;
  stage: "landing" | "conversation" | "result";
  preferredMapType?: MapType;
  checkpointStatus?: "pending" | "confirmed" | "correcting";
  startedAt: string;
  updatedAt: string;
};

type SpeechRecognitionEventLike = Event & { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechRecognitionErrorLike = Event & { error?: string };
type SpeechRecognitionLike = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
};

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike } }

function now() { return new Date().toISOString(); }
function id(prefix = "id") { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function truncate(text: string, n = 56) { const clean = text.trim(); return clean.length > n ? `${clean.slice(0, n)}…` : clean; }

function createSession(topic?: string): Session {
  const t = now();
  const starter = topic ? `“${topic}”부터 같이 한 장으로 정리해볼까요? 편하게 말해 주세요.` : "오늘은 어떤 생각을 같이 정리해볼까요? 말로 해도, 짧게 써도 괜찮아요.";
  const nodes: MapNode[] = topic ? [{ id: "topic", kind: "topic", label: "핵심 주제", text: topic, confidence: "user", createdAt: t }] : [];
  return { version: SCHEMA_VERSION, selectedTopic: topic, stage: "conversation", messages: [{ id: id("ai"), role: "ai", text: starter, timestamp: t }], nodes, relations: [], startedAt: t, updatedAt: t };
}

function isSession(value: unknown): value is Session {
  const s = value as Session;
  return Boolean(s && s.version === SCHEMA_VERSION && Array.isArray(s.messages) && Array.isArray(s.nodes) && Array.isArray(s.relations) && typeof s.stage === "string");
}

const topicGroups = [
  ["일과 진로", ["이직할까, 조금 더 다닐까?", "대학원에 갈까?", "잠깐 쉬어도 될까?", "부업을 시작할까?", "이 프로젝트를 계속할까?"]],
  ["관계", ["먼저 연락할까?", "고백할까?", "솔직하게 말할까?", "이 관계를 계속 이어갈까?"]],
  ["돈과 소비", ["아이패드 살까?", "PT 등록할까?", "자취를 시작할까?", "여행 갈까, 저축할까?"]],
  ["일상", ["이번 주말 뭐 하지?", "어떤 운동을 시작할까?", "시험을 다시 준비할까?", "어떤 일부터 먼저 할까?"]],
] as const;

const labels: Record<NodeKind, string> = { topic: "핵심 주제", trigger: "계기", emotion: "감정", person: "사람", value: "가치", reason: "이유", constraint: "제약", option: "선택지", benefit: "장점", risk: "리스크", missing: "확인할 정보", direction: "방향", action: "행동", correction: "수정된 이해" };
const kindClass: Record<NodeKind, string> = { topic: "bg-slate-950 text-white border-slate-950", trigger: "bg-amber-50 text-amber-950 border-amber-200", emotion: "bg-rose-50 text-rose-950 border-rose-200", person: "bg-violet-50 text-violet-950 border-violet-200", value: "bg-blue-50 text-blue-950 border-blue-200", reason: "bg-sky-50 text-sky-950 border-sky-200", constraint: "bg-orange-50 text-orange-950 border-orange-200", option: "bg-emerald-50 text-emerald-950 border-emerald-200", benefit: "bg-teal-50 text-teal-950 border-teal-200", risk: "bg-red-50 text-red-950 border-red-200", missing: "bg-stone-50 text-stone-950 border-dashed border-stone-300", direction: "bg-indigo-50 text-indigo-950 border-indigo-200", action: "bg-lime-50 text-lime-950 border-lime-200", correction: "bg-fuchsia-50 text-fuchsia-950 border-fuchsia-200" };

function inferKind(text: string, existing: MapNode[]): NodeKind {
  const t = text.toLowerCase();
  if (!existing.some((n) => n.kind === "topic")) return "topic";
  if (/불안|걱정|답답|좋|싫|무섭|기대|아쉽|후회|편해|힘들/.test(t)) return "emotion";
  if (/성장|자유|안정|돈|시간|관계|건강|경험|커리어|가치/.test(t)) return "value";
  if (/선택|방법|하거나|또는|갈까|살까|할까|남|옮|시작/.test(t)) return "option";
  if (/리스크|위험|부담|비용|잃|문제|단점/.test(t)) return "risk";
  if (/확인|모르|알아보|정보|조건|물어/.test(t)) return "missing";
  if (/오늘|내일|이번 주|24시간|먼저|예약|보내|정리|검색/.test(t)) return "action";
  if (/때문|왜냐|이유|느낌|계기/.test(t)) return "reason";
  return existing.length < 2 ? "trigger" : existing.length < 5 ? "reason" : "direction";
}

function extractNodes(text: string, session: Session, correction = false): { nodes: MapNode[]; relations: MapRelation[] } {
  const pieces = text.split(/[\n.!?。]|그리고|하지만|반대로|,/).map((p) => p.trim()).filter((p) => p.length > 1).slice(0, 3);
  const created = (pieces.length ? pieces : [text]).map((piece) => {
    const kind = correction ? "correction" : inferKind(piece, [...session.nodes]);
    return { id: id("node"), kind, label: labels[kind], text: piece, confidence: correction ? "confirmed" : "user", createdAt: now() } satisfies MapNode;
  });
  const center = session.nodes.find((n) => n.kind === "topic")?.id || created.find((n) => n.kind === "topic")?.id;
  const relations = created.filter((n) => center && n.id !== center).map((n) => ({ id: id("rel"), from: center!, to: n.id, kind: relationFor(n.kind), strength: n.kind === "risk" || n.kind === "missing" ? "dotted" : n.kind === "value" || n.kind === "action" ? "accent" : "solid" } satisfies MapRelation));
  return { nodes: created, relations };
}
function relationFor(kind: NodeKind): RelationKind { return kind === "option" ? "대안" : kind === "benefit" ? "장점" : kind === "risk" ? "리스크" : kind === "missing" ? "확인 필요" : kind === "action" ? "다음 행동" : kind === "emotion" ? "영향" : "원인"; }

function buildReply(session: Session, userText: string): Message {
  const kinds = new Set(session.nodes.map((n) => n.kind));
  const topic = session.nodes.find((n) => n.kind === "topic")?.text || session.selectedTopic || truncate(userText, 32);
  const missing = (["value", "option", "risk", "missing", "action"] as NodeKind[]).find((k) => !kinds.has(k));
  const checkpoints = session.messages.filter((m) => m.role === "user").length >= 3 && session.checkpointStatus !== "confirmed";
  if (checkpoints) {
    const bullets = session.nodes.slice(0, 4).map((n) => `- ${n.label}: ${truncate(n.text, 42)}`).join("\n");
    return { id: id("ai"), role: "ai", checkpoint: true, timestamp: now(), text: `지금까지 이야기한 걸 보면\n\n${bullets}\n\n제가 이해한 게 맞나요?` };
  }
  const question: Record<string, string> = {
    value: "이 선택에서 가장 지키고 싶은 기준은 무엇에 가까워요?",
    option: "현실적으로 가능한 선택지를 2~3개만 펼쳐보면 뭐가 있을까요?",
    risk: "반대로 마음에 걸리는 리스크나 부담은 무엇인가요?",
    missing: "결정 전에 확인해야 할 정보가 있다면 무엇일까요?",
    action: "지금 방향을 확인하기 위해 24시간 안에 할 수 있는 아주 작은 행동은 뭘까요?",
  };
  const theme = session.nodes.find((n) => n.kind === "value")?.text || session.nodes.find((n) => n.kind === "emotion")?.text;
  return { id: id("ai"), role: "ai", timestamp: now(), text: `말해주신 내용을 보면 “${truncate(topic, 34)}” 안에서 ${theme ? `“${truncate(theme, 28)}”가 꽤 중요한 단서처럼 보여요.` : "중심이 조금씩 보이기 시작했어요."}\n\n지금까지 이야기만 보면 결론을 서두르기보다 기준을 더 선명하게 보면 좋겠어요.\n\n${missing ? question[missing] : "현재 마음은 어느 방향에 조금 더 가까워 보여요?"}` };
}

function useWebSpeech(onAppend: (text: string) => void) {
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { setSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)); }, []);
  useEffect(() => { if (!listening) return; const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000); return () => window.clearInterval(timer); }, [listening]);
  const start = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); setError("이 브라우저에서는 음성 입력을 바로 사용할 수 없어 텍스트 입력으로 이어갈게요."); return; }
    const r = new Ctor(); recognition.current = r; r.lang = "ko-KR"; r.interimResults = true; r.continuous = true;
    r.onstart = () => { setSeconds(0); setError(""); setListening(true); };
    r.onend = () => setListening(false);
    r.onerror = (e) => { setListening(false); setError(e.error === "not-allowed" ? "마이크 권한이 꺼져 있어요. 텍스트로도 바로 이어갈 수 있어요." : "음성이 잠시 불안정해요. 말한 내용을 텍스트로 적어도 괜찮아요."); };
    r.onresult = (event) => { let finalText = ""; let interimText = ""; for (let i = event.resultIndex; i < event.results.length; i += 1) { const txt = event.results[i][0].transcript; if (event.results[i].isFinal) finalText += txt; else interimText += txt; } setInterim(interimText); if (finalText.trim()) onAppend(finalText.trim()); };
    r.start();
  };
  return { supported, listening, interim, error, seconds, start, stop: () => recognition.current?.stop(), cancel: () => { recognition.current?.abort(); setInterim(""); setListening(false); } };
}

export function MapDecisionApp() {
  const [session, setSession] = useState<Session>(() => createSession());
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const parsed = JSON.parse(raw); if (isSession(parsed)) setSession(parsed); else localStorage.removeItem(STORAGE_KEY); } } catch { localStorage.removeItem(STORAGE_KEY); } finally { setHydrated(true); } }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, updatedAt: now() })); }, [hydrated, session]);
  const start = (topic?: string) => setSession(createSession(topic));
  const reset = () => { localStorage.removeItem(STORAGE_KEY); setSession({ ...createSession(), stage: "landing", messages: [], nodes: [], relations: [] }); };
  if (session.stage === "landing" || (!session.messages.length && !session.nodes.length)) return <Landing hasDraft={hydrated && Boolean(localStorage.getItem(STORAGE_KEY))} onStart={start} onResume={() => setSession((s) => ({ ...s, stage: "conversation" }))} />;
  if (session.stage === "result") return <Result session={session} onContinue={() => setSession((s) => ({ ...s, stage: "conversation" }))} onReset={reset} onType={(type) => setSession((s) => ({ ...s, preferredMapType: type }))} />;
  return <Conversation session={session} setSession={setSession} onFinish={() => setSession((s) => ({ ...s, stage: "result", preferredMapType: s.preferredMapType || "thinking" }))} onReset={reset} />;
}

function Brand() { return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span><span className="font-black tracking-[-0.02em]">MAP Decision</span></div>; }
function Landing({ hasDraft, onStart, onResume }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void }) { return <main className="min-h-screen bg-[#fbf7ef] px-4 py-4 text-slate-950 sm:px-6"><header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white bg-white/80 px-4 py-3 shadow-lg"><Brand />{hasDraft ? <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={onResume}>이어하기</button> : null}</header><section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20"><div><p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">로그인 없이 바로 시작 · 첫 MAP까지 약 5분 · 작성 중에도 자동 저장</p><h1 className="mt-6 whitespace-pre-line text-5xl font-black leading-[1.08] tracking-[-0.045em] sm:text-7xl">머릿속이 조금 복잡한가요?{`\n`}같이 한 장으로 정리해볼까요?</h1><p className="mt-6 max-w-2xl whitespace-pre-line text-xl font-semibold leading-9 text-slate-600">편하게 말하거나 입력해 주세요.{`\n`}생각의 핵심, 선택지, 걸리는 부분과 다음 행동을 하나의 MAP으로 정리해드려요.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button className="rounded-full bg-blue-700 px-8 py-4 text-lg font-black text-white shadow-xl shadow-blue-200" onClick={() => onStart()}>🎙 말로 시작하기</button><button className="rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-black" onClick={() => onStart()}>⌨️ 직접 입력하기</button></div><p className="mt-6 font-black text-slate-500">가벼운 고민부터 인생의 큰 선택까지.</p></div><LiveMap session={createSession("말하면 생각이 보이는 MAP")} sample /></section><section className="mx-auto max-w-7xl pb-16"><div className="grid gap-4 md:grid-cols-4">{topicGroups.map(([group, items]) => <article key={group} className="rounded-[1.5rem] border border-white bg-white/80 p-5 shadow-xl shadow-slate-200/60"><h2 className="font-black text-blue-700">{group}</h2><div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <button key={item} className="rounded-full bg-slate-50 px-3 py-2 text-left text-sm font-bold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => onStart(item)}>{item}</button>)}</div></article>)}</div></section></main>; }

function Conversation({ session, setSession, onFinish, onReset }: { session: Session; setSession: React.Dispatch<React.SetStateAction<Session>>; onFinish: () => void; onReset: () => void }) {
  const [draft, setDraft] = useState(""); const [correction, setCorrection] = useState(""); const endRef = useRef<HTMLDivElement>(null);
  const speech = useWebSpeech((text) => setDraft((d) => `${d}${d ? " " : ""}${text}`));
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [session.messages.length]);
  const submit = (text = draft, isCorrection = false) => { const clean = text.trim(); if (!clean) return; setDraft(""); setCorrection(""); setSession((prev) => { const user: Message = { id: id("user"), role: "user", text: clean, timestamp: now() }; const extracted = extractNodes(clean, prev, isCorrection); const mid: Session = { ...prev, checkpointStatus: isCorrection ? "confirmed" : prev.checkpointStatus, messages: [...prev.messages, user], nodes: [...prev.nodes, ...extracted.nodes], relations: [...prev.relations, ...extracted.relations], updatedAt: now() }; return { ...mid, messages: [...mid.messages, buildReply(mid, clean)] }; }); };
  const lastCheckpoint = [...session.messages].reverse().find((m) => m.checkpoint);
  return <main className="min-h-screen bg-[#fbf7ef] text-slate-950"><header className="sticky top-0 z-30 border-b border-white/70 bg-[#fbf7ef]/85 px-4 py-3 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between"><Brand /><div className="flex gap-2"><button className="rounded-full border bg-white px-4 py-2 text-sm font-black" onClick={onReset}>새 MAP</button><button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={onFinish}>현재 MAP 보기</button></div></div></header><section className="mx-auto grid max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,1.08fr)]"><div className="order-2 lg:order-1"><LiveMap session={session} /><p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-500">작성 내용은 이 브라우저에 임시 저장돼요. MAP은 말할수록 바로 자라납니다.</p></div><div className="order-1 flex min-h-[72vh] flex-col rounded-[2rem] border border-white bg-white/88 shadow-2xl shadow-slate-200/70"><div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">{session.messages.map((m) => <div key={m.id} className={cx("max-w-[86%] rounded-[1.5rem] p-4 leading-7 shadow-sm", m.role === "user" ? "ml-auto bg-blue-700 font-bold text-white" : "bg-slate-50 font-semibold text-slate-750")}><p className="whitespace-pre-line">{m.text}</p>{m.checkpoint ? <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={() => setSession((s) => ({ ...s, checkpointStatus: "confirmed", messages: [...s.messages, { id: id("ai"), role: "ai", text: "좋아요. 확인된 이해로 표시해둘게요. 이제 빠진 정보와 다음 행동을 더 선명하게 볼 수 있어요.", timestamp: now() }], nodes: s.nodes.map((n) => ({ ...n, confidence: n.confidence === "user" ? "confirmed" : n.confidence })) }))}>맞아요</button><button className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700" onClick={() => setSession((s) => ({ ...s, checkpointStatus: "correcting" }))}>조금 달라요</button></div> : null}</div>)}<div ref={endRef} /></div>{session.checkpointStatus === "correcting" && lastCheckpoint ? <div className="border-t border-slate-100 p-4"><label className="text-sm font-black text-rose-700">어떤 부분이 달랐나요?</label><textarea className="mt-2 min-h-20 w-full rounded-2xl border p-3 focus:outline-none focus:ring-4 focus:ring-rose-100" value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="예: 성장보다 안정이 더 중요한 것 같아요." /><button className="mt-2 rounded-full bg-rose-600 px-4 py-2 font-black text-white" onClick={() => submit(correction, true)}>수정 반영하기</button></div> : null}<div className="sticky bottom-0 rounded-b-[2rem] border-t border-slate-100 bg-white/95 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-black">{speech.listening ? "듣고 있어요" : "말하거나 입력해 주세요"}</p><p className="text-sm font-bold text-slate-500">{speech.listening ? `편하게 계속 말해 주세요 · ${speech.seconds}초` : "텍스트로 확인한 뒤 수정할 수 있어요"}</p>{speech.interim ? <p className="mt-1 text-sm font-bold text-blue-700">{speech.interim}</p> : null}{speech.error ? <p className="mt-1 text-sm font-bold text-rose-600">{speech.error}</p> : null}{!speech.supported ? <p className="mt-1 text-sm font-bold text-amber-700">음성 미지원 브라우저라 텍스트 입력으로 이어갈게요.</p> : null}</div><div className="flex gap-2"><button aria-label={speech.listening ? "녹음 중지" : "마이크로 말하기"} className={cx("grid size-14 place-items-center rounded-full text-xl font-black text-white shadow-xl", speech.listening ? "animate-pulse bg-rose-600" : "bg-blue-700")} onClick={speech.listening ? speech.stop : speech.start}>🎙</button>{speech.listening ? <button className="rounded-full border px-4 py-2 font-black" onClick={speech.cancel}>취소</button> : null}</div></div><textarea className="min-h-24 w-full resize-y rounded-[1.25rem] border border-slate-200 p-4 text-lg font-semibold leading-8 focus:outline-none focus:ring-4 focus:ring-blue-100" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="예: 이직을 고민하고 있는데 사람들은 좋고 성장하는 느낌은 없어요." /><div className="mt-3 flex justify-between"><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onFinish}>MAP 미리보기</button><button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-40" disabled={!draft.trim()} onClick={() => submit()}>보내기</button></div></div></div></section></main>;
}

function LiveMap({ session, sample = false }: { session: Session; sample?: boolean }) { const nodes = sample ? [...session.nodes, { id: "n1", kind: "value", label: "가치", text: "중요한 기준", confidence: "ai", createdAt: now() } as MapNode, { id: "n2", kind: "risk", label: "리스크", text: "걸리는 부분", confidence: "ai", createdAt: now() } as MapNode, { id: "n3", kind: "action", label: "행동", text: "24시간 첫 행동", confidence: "ai", createdAt: now() } as MapNode] : session.nodes; const center = nodes.find((n) => n.kind === "topic") || nodes[0]; const outer = nodes.filter((n) => n.id !== center?.id).slice(0, 8); const pos = [[14,18],[72,16],[8,48],[72,48],[18,76],[65,76],[42,10],[42,84]]; return <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white bg-white/85 p-4 shadow-2xl shadow-slate-200/70"><div className="absolute inset-6 rounded-[1.5rem] border border-dashed border-slate-200"/><svg className="absolute inset-0 h-full w-full" aria-label="생각 MAP 관계선">{outer.map((n,i)=><line key={n.id} x1="50%" y1="50%" x2={`${pos[i][0]+8}%`} y2={`${pos[i][1]+6}%`} stroke={n.kind==="risk"||n.kind==="missing"?"#94a3b8":"#2563eb"} strokeWidth={n.kind==="value"||n.kind==="action"?3:1.7} strokeDasharray={n.kind==="risk"||n.kind==="missing"?"6 7":""}/>)}</svg><article className="absolute left-1/2 top-1/2 z-10 w-[72%] max-w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-2xl"><p className="text-xs font-black text-blue-200">핵심 주제</p><h3 className="mt-2 text-xl font-black leading-snug">{center ? truncate(center.text, 76) : "첫 이야기를 하면 중심 노드가 생겨요"}</h3></article>{outer.map((n,i)=><article key={n.id} className={cx("absolute z-20 w-[12.5rem] rounded-2xl border p-3 shadow-xl transition", kindClass[n.kind])} style={{left:`${pos[i][0]}%`,top:`${pos[i][1]}%`}}><p className="text-[0.68rem] font-black opacity-70">{n.label} · {n.confidence === "confirmed" ? "확인됨" : n.confidence === "user" ? "직접 말함" : "AI 해석"}</p><p className="mt-1 text-sm font-black leading-5">{truncate(n.text, 58)}</p></article>)}</div>; }

function Result({ session, onContinue, onReset, onType }: { session: Session; onContinue: () => void; onReset: () => void; onType: (type: MapType) => void }) { const by = (k: NodeKind) => session.nodes.filter((n) => n.kind === k).map((n) => n.text).join("\n") || "아직 더 이야기하면 선명해져요."; const missing = by("missing"); const action = by("action"); const direction = by("direction") !== "아직 더 이야기하면 선명해져요." ? by("direction") : "현재 이야기만 보면 즉시 결론보다 조건을 확인하면서 가능성을 검증하는 방향이 현실적이에요."; const exportImage = () => window.print(); return <main className="min-h-screen bg-[#fbf7ef] px-4 py-6 text-slate-950 print:bg-white"><section className="mx-auto max-w-7xl"><header className="rounded-[2rem] bg-white/90 p-6 shadow-xl print:shadow-none"><p className="font-black text-blue-700">이야기해주신 내용을 한 장으로 정리했어요.</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">{session.preferredMapType === "decision" ? "의사결정 MAP" : "생각정리 MAP"}</h1><p className="mt-3 font-bold text-slate-500">사용자가 직접 말한 내용, AI가 해석한 내용, 아직 확인이 필요한 내용을 구분했어요.</p><div className="mt-5 flex flex-wrap gap-2 print:hidden"><button className="rounded-full bg-blue-700 px-5 py-3 font-black text-white" onClick={() => onType("thinking")}>생각정리 MAP</button><button className="rounded-full bg-slate-950 px-5 py-3 font-black text-white" onClick={() => onType("decision")}>의사결정 MAP</button><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onContinue}>다시 이야기하기</button><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onContinue}>특정 내용 수정하기</button><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={exportImage}>이미지로 저장</button><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={() => window.print()}>인쇄 / PDF 저장</button><button className="rounded-full border bg-white px-5 py-3 font-black" onClick={() => alert("공유 링크는 아직 만들지 않았어요. 이 화면에는 이 브라우저의 임시 저장 내용만 사용됩니다.")}>공유용 화면 보기</button><button className="rounded-full bg-rose-600 px-5 py-3 font-black text-white" onClick={onReset}>새 MAP 만들기</button></div></header><div className="mt-6"><LiveMap session={session} /></div><div className="mt-6 grid gap-4 lg:grid-cols-3"><ResultCard title="사용자가 직접 말한 내용" body={session.nodes.filter((n)=>n.confidence!=="ai").slice(0,6).map((n)=>`• ${n.label}: ${n.text}`).join("\n") || "아직 직접 말한 조각이 적어요."}/><ResultCard title="AI가 해석한 내용" body={`지금 이야기는 ‘생각정리 MAP’으로 먼저 보고, 그다음 ‘의사결정 MAP’까지 이어가면 좋을 것 같아요.\n\n현재 마음은 ${truncate(direction,80)} 쪽에 가까워 보여요.`}/><ResultCard title="아직 확인이 필요한 내용" body={missing}/><ResultCard title="선택지와 장점" body={`${by("option")}\n\n${by("benefit")}`}/><ResultCard title="리스크" body={by("risk")}/><ResultCard dark title="24시간 첫 행동" body={action !== "아직 더 이야기하면 선명해져요." ? action : "오늘 안에 관련 조건 하나를 확인하거나, 믿을 만한 사람 한 명에게 현재 고민을 10분만 설명해보세요."}/></div><article className="mt-6 rounded-[2rem] bg-slate-950 p-7 text-white"><h2 className="text-2xl font-black">현실적인 현재 방향</h2><p className="mt-4 whitespace-pre-line text-xl font-bold leading-9">현재 이야기만 보면 중요한 기준을 더 확인하면서 움직이는 것이 좋아 보여요. 다만 이 MAP은 결정을 대신하지 않아요. 확인할 정보가 채워졌을 때 다시 보고, 방향이 여전히 맞는지 검토해보세요.\n\n다음 리뷰 조건: 확인할 정보 1개를 얻었거나 24시간 첫 행동을 실행한 뒤.</p></article></section></main>; }
function ResultCard({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) { return <article className={cx("rounded-[1.5rem] p-6 shadow-xl", dark ? "bg-blue-700 text-white" : "bg-white/85 text-slate-950")}><h2 className="font-black text-lg">{title}</h2><p className="mt-3 whitespace-pre-line font-semibold leading-7">{body}</p></article>; }

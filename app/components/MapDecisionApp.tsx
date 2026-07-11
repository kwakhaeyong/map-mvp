"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "map-decision-progress-v2";

type SavedProgress = {
  currentStep: number;
  answers: string[];
  startedAt: string;
  lastUpdatedAt: string;
};

const questions = [
  { title: "지금 결정해야 하는 주제는 무엇인가요?", hint: "예: 이직할지, 프로젝트를 계속할지, 관계를 어떻게 정리할지처럼 한 문장으로 적어보세요." },
  { title: "왜 이 결정을 지금 해야 한다고 느끼나요?", hint: "마감, 감정의 변화, 반복되는 문제, 기회처럼 지금성을 만드는 이유를 적어주세요." },
  { title: "가장 크게 고민되는 지점은 무엇인가요?", hint: "내가 망설이는 핵심 갈등이나 놓치기 싫은 가치를 중심으로 써보세요." },
  { title: "현실적으로 선택 가능한 대안은 무엇인가요?", hint: "완벽한 답보다 실제로 선택할 수 있는 A/B/C안을 줄바꿈으로 나열해도 좋아요." },
  { title: "각 선택지의 좋은 점은 무엇인가요?", hint: "각 대안이 주는 기대효과, 얻을 수 있는 것, 마음이 놓이는 지점을 적어보세요." },
  { title: "각 선택지의 부담이나 리스크는 무엇인가요?", hint: "비용, 시간, 관계, 감정 소모, 되돌리기 어려운 점을 솔직하게 적어주세요." },
  { title: "지금의 나에게 더 현실적인 선택은 무엇인가요?", hint: "가장 멋진 선택이 아니라 현재 에너지와 조건에서 실행 가능한 선택을 골라보세요." },
  { title: "결정 후 24시간 안에 할 수 있는 첫 행동은 무엇인가요?", hint: "메시지 보내기, 30분 조사하기, 일정 잡기처럼 아주 작고 구체적인 행동이면 충분해요." },
];

const resultLabels = ["핵심 주제", "중요 이유", "핵심 고민", "선택 가능한 대안", "장점", "리스크", "현실적인 선택", "첫 행동"];
const nodePositions = [
  "left-[7%] top-[10%]", "right-[6%] top-[12%]", "left-[3%] top-[43%]", "right-[3%] top-[43%]", "left-[12%] bottom-[9%]", "right-[12%] bottom-[9%]",
];

function createEmptyProgress(): SavedProgress {
  const now = new Date().toISOString();
  return { currentStep: 0, answers: Array(questions.length).fill(""), startedAt: now, lastUpdatedAt: now };
}

function isValidProgress(value: unknown): value is SavedProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as SavedProgress;
  return Number.isInteger(progress.currentStep) && progress.currentStep >= 0 && progress.currentStep <= questions.length && Array.isArray(progress.answers) && progress.answers.length === questions.length && progress.answers.every((answer) => typeof answer === "string") && typeof progress.startedAt === "string" && typeof progress.lastUpdatedAt === "string";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function MapPreview({ answers, sample = false }: { answers?: string[]; sample?: boolean }) {
  const data = sample
    ? ["현재 회사에 남을까, 이직할까?", "성장 정체감과 안정성 사이에서 선택이 필요함", "커리어 성장 vs 생활 안정", "잔류 · 이직 준비 · 내부 이동", "새 환경에서 성장 가능", "수입 변동과 적응 비용", "3개월 안에 이직 준비를 병행", "이번 주 포트폴리오 업데이트"]
    : resultLabels.map((_, index) => answers?.[index]?.trim() || (index === 0 ? "나의 결정 주제" : "답변을 바탕으로 정리됩니다"));

  return (
    <div className="map-canvas relative min-h-[31rem] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-2xl shadow-slate-200/70 sm:min-h-[35rem] sm:p-7">
      <div className="absolute inset-8 rounded-[1.5rem] border border-dashed border-slate-200" />
      <svg className="absolute inset-0 h-full w-full text-slate-300" aria-hidden="true">
        {[[50, 50, 24, 18], [50, 50, 76, 20], [50, 50, 19, 52], [50, 50, 82, 52], [50, 50, 28, 82], [50, 50, 72, 82]].map(([x1, y1, x2, y2], index) => <line key={index} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />)}
      </svg>
      <div className="absolute left-1/2 top-1/2 z-10 w-[72%] max-w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-400/50 sm:w-[46%]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Core topic</p>
        <h3 className="mt-2 line-clamp-4 text-xl font-black leading-snug tracking-[-0.03em]">{data[0]}</h3>
      </div>
      {data.slice(1, 7).map((text, index) => (
        <div className={cx("absolute z-10 hidden w-[12.5rem] rounded-2xl border border-white bg-white/95 p-4 shadow-xl shadow-slate-200/80 sm:block", nodePositions[index])} key={resultLabels[index + 1]}>
          <p className="text-[0.68rem] font-black text-blue-600">{resultLabels[index + 1]}</p>
          <p className="mt-1 line-clamp-3 text-sm font-bold leading-5 text-slate-700">{text}</p>
        </div>
      ))}
      <div className="absolute inset-x-5 bottom-5 z-20 grid gap-2 sm:hidden">
        {data.slice(1, 4).map((text, index) => <div className="rounded-2xl bg-white/95 p-3 text-sm font-bold shadow-lg" key={index}>{resultLabels[index + 1]} · <span className="text-slate-600">{text}</span></div>)}
      </div>
    </div>
  );
}

function ExpandableAnswer({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 130;
  const visibleText = !isLong || expanded ? text : `${text.slice(0, 130)}...`;
  return <div><p className="whitespace-pre-line text-[0.95rem] font-semibold leading-7 text-slate-650">{visibleText || "아직 답변이 비어 있어요."}</p>{isLong ? <button className="mt-3 text-sm font-black text-blue-700" type="button" onClick={() => setExpanded((value) => !value)}>{expanded ? "접기" : "더보기"}</button> : null}</div>;
}

export function MapDecisionApp() {
  const [progress, setProgress] = useState<SavedProgress>(() => createEmptyProgress());
  const [hydrated, setHydrated] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const answeredCount = progress.answers.filter((answer) => answer.trim()).length;
  const isResult = progress.currentStep >= questions.length;
  const currentQuestion = questions[Math.min(progress.currentStep, questions.length - 1)];
  const percentage = Math.round((answeredCount / questions.length) * 100);
  const stepPercentage = Math.round(((Math.min(progress.currentStep, questions.length - 1) + 1) / questions.length) * 100);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isValidProgress(parsed)) {
          setProgress(parsed);
          setShowFlow(parsed.answers.some((answer) => answer.trim()) || parsed.currentStep > 0);
        } else window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch { window.localStorage.removeItem(STORAGE_KEY); }
    finally { setHydrated(true); }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const next = { ...progress, lastUpdatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [hydrated, progress]);

  const lastUpdatedLabel = useMemo(() => progress.lastUpdatedAt ? new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(progress.lastUpdatedAt)) : "", [progress.lastUpdatedAt]);
  const generatedLabel = useMemo(() => new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(progress.lastUpdatedAt)), [progress.lastUpdatedAt]);

  const updateAnswer = (value: string) => setProgress((prev) => { const answers = [...prev.answers]; answers[prev.currentStep] = value; return { ...prev, answers, lastUpdatedAt: new Date().toISOString() }; });
  const startNew = () => { const empty = createEmptyProgress(); window.localStorage.removeItem(STORAGE_KEY); setProgress(empty); setShowFlow(true); };
  const goTo = (step: number) => setProgress((prev) => ({ ...prev, currentStep: Math.max(0, Math.min(step, questions.length)), lastUpdatedAt: new Date().toISOString() }));
  const goHome = () => { setShowFlow(false); goTo(Math.min(progress.currentStep, questions.length - 1)); };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f3ea] text-slate-950">
      {!showFlow ? <Landing answeredCount={answeredCount} onStart={() => setShowFlow(true)} /> : isResult ? <Result progress={progress} answeredCount={answeredCount} lastUpdatedLabel={lastUpdatedLabel} generatedLabel={generatedLabel} onEdit={() => goTo(0)} onNew={startNew} /> : <QuestionFlow progress={progress} answeredCount={answeredCount} currentQuestion={currentQuestion} percentage={percentage} stepPercentage={stepPercentage} lastUpdatedLabel={lastUpdatedLabel} onAnswer={updateAnswer} onPrev={() => goTo(progress.currentStep - 1)} onNext={() => goTo(progress.currentStep + 1)} onHome={goHome} />}
    </main>
  );
}

function Header({ onStart, answeredCount }: { onStart: () => void; answeredCount: number }) {
  return <header className="sticky top-3 z-40 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/80 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl sm:px-6"><button className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button"><span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span><span className="text-lg font-black tracking-[-0.03em]">MAP Decision</span><span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 sm:inline-flex">v0.3.0</span></button><nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex"><a href="#intro">서비스 소개</a><a href="#how">작동 방식</a><a href="#example">결과 예시</a></nav><button className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5" type="button" onClick={onStart}>{answeredCount ? "이어서 만들기" : "내 MAP 만들기"}</button></header>;
}

function Landing({ onStart, answeredCount }: { onStart: () => void; answeredCount: number }) {
  return <div className="px-4 py-3 sm:px-6 lg:px-8"><Header onStart={onStart} answeredCount={answeredCount} /><section id="intro" className="mx-auto grid max-w-7xl items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24"><div><p className="mb-5 inline-flex rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-black text-rose-600">복잡한 생각을 질문으로 정리하는 의사결정 도구</p><h1 className="max-w-4xl text-5xl font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-7xl">복잡한 생각,<br />한 장의 MAP으로 정리하세요.</h1><p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-650">질문에 답하면 생각의 핵심, 선택지, 장단점과 첫 행동까지<br className="hidden sm:block" />시각적인 의사결정 MAP으로 정리됩니다.</p><div className="mt-10 flex flex-col gap-3 sm:flex-row"><button className="rounded-full bg-blue-700 px-8 py-4 text-lg font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1" onClick={onStart} type="button">내 MAP 만들기</button><a className="rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-lg font-black text-slate-800" href="#example">결과 예시 보기</a></div></div><MapPreview sample /></section><section id="how" className="mx-auto max-w-7xl py-10"><SectionTitle eyebrow="How it works" title="답변은 짧게, 구조화는 선명하게." /><div className="mt-8 grid gap-4 md:grid-cols-3">{["질문에 답하기", "생각 구조화하기", "Visual MAP 확인하기"].map((title, index) => <article className="card p-7" key={title}><span className="text-sm font-black text-blue-700">0{index + 1}</span><h3 className="mt-4 text-2xl font-black">{title}</h3><p className="mt-3 font-semibold leading-7 text-slate-600">8개의 질문이 흩어진 생각을 의사결정에 필요한 정보로 차분히 바꿔줍니다.</p></article>)}</div></section><section className="mx-auto max-w-7xl py-10"><SectionTitle eyebrow="Use cases" title="중요하지만 말로 정리하기 어려운 순간에." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["이직 결정", "사업 아이디어", "관계 고민", "우선순위 정리"].map((item) => <div className="card p-6" key={item}><div className="mb-8 size-10 rounded-2xl bg-rose-50" /><h3 className="text-xl font-black">{item}</h3><p className="mt-2 font-semibold text-slate-600">선택지와 감정, 리스크를 한 화면에서 비교합니다.</p></div>)}</div></section><section id="example" className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr]"><div><SectionTitle eyebrow="Result preview" title="“현재 회사에 남을까, 이직할까?”" /><div className="mt-6 grid gap-3">{["핵심 주제", "중요 이유", "선택지", "장점", "리스크", "현실적인 선택", "첫 행동"].map((label) => <div className="rounded-2xl border border-white bg-white/80 p-4 font-bold shadow-sm" key={label}><span className="text-blue-700">{label}</span><span className="text-slate-500"> · 실제 답변처럼 읽히는 샘플 MAP 정보</span></div>)}</div></div><MapPreview sample /></section><section className="mx-auto max-w-7xl py-12"><div className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-12"><SectionTitle eyebrow="Privacy" title="로그인 없이 시작하고, 브라우저에만 저장됩니다." dark /><div className="mt-8 grid gap-4 md:grid-cols-3">{["로그인 없이 시작", "작성 내용은 브라우저에 저장", "언제든 이어서 수정 가능"].map((item) => <div className="rounded-2xl bg-white/10 p-5 font-black" key={item}>{item}</div>)}</div></div></section><Footer /></div>;
}

function SectionTitle({ eyebrow, title, dark = false }: { eyebrow: string; title: string; dark?: boolean }) { return <div><p className={cx("text-sm font-black uppercase tracking-[0.14em]", dark ? "text-blue-200" : "text-blue-700")}>{eyebrow}</p><h2 className={cx("mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl", dark ? "text-white" : "text-slate-950")}>{title}</h2></div>; }
function Footer() { return <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-200 py-8 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>MAP Decision · 현재 MVP 버전 v0.3.0</span><span>저장 방식: 브라우저 localStorage</span><span>© 2026 MAP Decision</span></footer>; }

function QuestionFlow(props: { progress: SavedProgress; answeredCount: number; currentQuestion: { title: string; hint: string }; percentage: number; stepPercentage: number; lastUpdatedLabel: string; onAnswer: (value: string) => void; onPrev: () => void; onNext: () => void; onHome: () => void; }) {
  const { progress, answeredCount, currentQuestion, percentage, stepPercentage, lastUpdatedLabel, onAnswer, onPrev, onNext, onHome } = props;
  return <div className="min-h-screen px-4 py-4 sm:px-6"><header className="mx-auto flex max-w-5xl items-center justify-between rounded-full border border-white bg-white/85 px-4 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span><div><p className="font-black">MAP Decision</p><p className="text-xs font-bold text-slate-500">질문 {progress.currentStep + 1} / {questions.length} · {percentage}% 완료</p></div></div><button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black" onClick={onHome} type="button">홈으로</button></header><section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center py-10"><div className="w-full rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-200/70 sm:p-8"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">질문 {progress.currentStep + 1} / {questions.length}</span><span className="text-sm font-black text-slate-500">답변 {answeredCount}/{questions.length}개</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700 transition-all duration-500" style={{ width: `${stepPercentage}%` }} /></div><h1 className="mt-8 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">{currentQuestion.title}</h1><p className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5 font-semibold leading-7 text-blue-950">힌트 · {currentQuestion.hint}</p><textarea className="mt-6 min-h-64 w-full resize-y rounded-[1.5rem] border border-slate-200 bg-white p-5 text-lg font-semibold leading-8 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100" value={progress.answers[progress.currentStep]} onChange={(event) => onAnswer(event.target.value)} placeholder="여기에 답변을 적어주세요." autoFocus /><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-500"><span>자동 저장됨 · {lastUpdatedLabel}</span><span>작성된 답변 기준 진행률 {percentage}%</span></div><div className="mt-8 flex items-center justify-between gap-3"><button className="rounded-full border border-slate-200 bg-white px-6 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40" disabled={progress.currentStep === 0} onClick={onPrev} type="button">이전</button><button className="rounded-full bg-blue-700 px-7 py-3 font-black text-white shadow-lg shadow-blue-200" onClick={onNext} type="button">{progress.currentStep === questions.length - 1 ? "결과 MAP 보기" : "다음"}</button></div></div></section></div>;
}

function Result({ progress, answeredCount, lastUpdatedLabel, generatedLabel, onEdit, onNew }: { progress: SavedProgress; answeredCount: number; lastUpdatedLabel: string; generatedLabel: string; onEdit: () => void; onNew: () => void; }) {
  return <div className="px-4 py-6 sm:px-6 lg:px-8"><section className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 rounded-[2rem] bg-white/85 p-5 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="text-sm font-black text-blue-700">생성 시간 · {generatedLabel}</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-6xl">나의 의사결정 MAP</h1><p className="mt-3 font-bold text-slate-500">답변 {answeredCount}/{questions.length}개 · 마지막 저장 {lastUpdatedLabel}</p></div><div className="flex gap-2"><button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-black" onClick={onEdit} type="button">답변 수정</button><button className="rounded-full bg-blue-700 px-5 py-3 font-black text-white" onClick={onNew} type="button">새 MAP</button></div></div><div className="mt-8"><MapPreview answers={progress.answers} /></div><div className="mt-8 grid gap-4 lg:grid-cols-2">{resultLabels.map((label, index) => <article className="card p-6" key={label}><p className="text-sm font-black text-blue-700">{label}</p><div className="mt-3"><ExpandableAnswer text={progress.answers[index]} /></div></article>)}</div><div className="mt-8 grid gap-4 rounded-[2rem] bg-slate-950 p-6 text-white md:grid-cols-2 md:p-8"><div><p className="text-sm font-black text-blue-200">내가 지금 선택한 방향</p><p className="mt-3 whitespace-pre-line text-2xl font-black leading-snug">{progress.answers[6] || "현실적인 선택을 답변하면 여기에 강조됩니다."}</p></div><div><p className="text-sm font-black text-rose-200">24시간 안에 할 첫 행동</p><p className="mt-3 whitespace-pre-line text-2xl font-black leading-snug">{progress.answers[7] || "첫 행동을 답변하면 여기에 강조됩니다."}</p></div></div><div className="mt-8 flex flex-col gap-3 pb-10 sm:flex-row sm:justify-center"><button className="rounded-full border border-slate-200 bg-white px-7 py-3 font-black" onClick={onEdit} type="button">다시 수정하기</button><button className="rounded-full bg-blue-700 px-7 py-3 font-black text-white" onClick={onNew} type="button">새 MAP 만들기</button></div></section></div>;
}

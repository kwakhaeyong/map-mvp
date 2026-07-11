"use client";

import { useEffect, useMemo, useState } from "react";
import { IdealTypeResult } from "./IdealTypeResult";

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

const resultLabels = ["핵심 주제", "중요 이유", "핵심 고민", "선택 가능한 대안", "장점", "단점", "현실적인 선택", "첫 실행 행동"];

function createEmptyProgress(): SavedProgress {
  const now = new Date().toISOString();
  return { currentStep: 0, answers: Array(questions.length).fill(""), startedAt: now, lastUpdatedAt: now };
}

function isValidProgress(value: unknown): value is SavedProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as SavedProgress;
  return (
    Number.isInteger(progress.currentStep) &&
    progress.currentStep >= 0 &&
    progress.currentStep <= questions.length &&
    Array.isArray(progress.answers) &&
    progress.answers.length === questions.length &&
    progress.answers.every((answer) => typeof answer === "string") &&
    typeof progress.startedAt === "string" &&
    typeof progress.lastUpdatedAt === "string"
  );
}

function PreviewCard() {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-slate-200/80 backdrop-blur">
      <IdealTypeResult compact />
      <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">Result example</p>
        <p className="mt-2 text-lg font-black tracking-[-0.05em]">결정의 이유와 첫 행동까지 한 장에 정리돼요.</p>
      </div>
    </div>
  );
}

function ExpandableAnswer({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 95;
  const visibleText = !isLong || expanded ? text : `${text.slice(0, 95)}...`;

  return (
    <div>
      <p className="whitespace-pre-line text-sm font-bold leading-6 text-slate-600">{visibleText || "아직 답변이 비어 있어요."}</p>
      {isLong ? (
        <button className="mt-3 text-sm font-black text-fuchsia-600" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </div>
  );
}

export function MapDecisionApp() {
  const [progress, setProgress] = useState<SavedProgress>(() => createEmptyProgress());
  const [hydrated, setHydrated] = useState(false);
  const [showFlow, setShowFlow] = useState(false);
  const answeredCount = progress.answers.filter((answer) => answer.trim()).length;
  const isResult = progress.currentStep >= questions.length;
  const currentQuestion = questions[Math.min(progress.currentStep, questions.length - 1)];
  const percentage = Math.round((answeredCount / questions.length) * 100);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isValidProgress(parsed)) {
          setProgress(parsed);
          setShowFlow(parsed.answers.some((answer) => answer.trim()) || parsed.currentStep > 0);
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, lastUpdatedAt: new Date().toISOString() }));
  }, [hydrated, progress]);

  const lastUpdatedLabel = useMemo(() => {
    if (!progress.lastUpdatedAt) return "";
    return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(progress.lastUpdatedAt));
  }, [progress.lastUpdatedAt]);

  const updateAnswer = (value: string) => {
    setProgress((prev) => {
      const answers = [...prev.answers];
      answers[prev.currentStep] = value;
      return { ...prev, answers, lastUpdatedAt: new Date().toISOString() };
    });
  };

  const startNew = () => {
    const empty = createEmptyProgress();
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress(empty);
    setShowFlow(true);
  };

  const goTo = (step: number) => setProgress((prev) => ({ ...prev, currentStep: Math.max(0, Math.min(step, questions.length)), lastUpdatedAt: new Date().toISOString() }));

  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-12 pt-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-100 via-fuchsia-100 to-sky-100 blur-3xl" />
        <div className="relative z-10 mb-4 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-center text-sm font-black text-sky-600 shadow-sm">MAP Decision · v0.2.0</div>
        <nav className="relative z-10 flex items-center justify-between rounded-full border border-white/80 bg-white/70 px-5 py-3 shadow-xl shadow-slate-100 backdrop-blur-2xl">
          <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">M</span><span className="text-lg font-black tracking-[-0.06em]">MAP Decision</span></div>
          <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" type="button" onClick={() => setShowFlow(true)}>{answeredCount ? "작성 중인 MAP 이어서 하기" : "내 MAP 만들기"}</button>
        </nav>

        {!showFlow ? (
          <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="text-center lg:text-left">
              <p className="mx-auto mb-5 inline-flex rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-500 lg:mx-0">3분이면 나를 설명하는 MAP 하나.</p>
              <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.08em] sm:text-7xl lg:text-8xl">지금 내 생각은 어떤 모습일까?</h1>
              <p className="mx-auto mt-7 max-w-xl text-xl font-bold leading-8 tracking-[-0.04em] text-slate-600 sm:text-2xl sm:leading-10 lg:mx-0">결정해야 할 주제, 고민, 대안, 첫 행동을 질문 8개로 정리해 Visual MAP으로 남겨요.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"><button className="inline-flex justify-center rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-600 to-sky-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-200 transition hover:-translate-y-1" type="button" onClick={() => setShowFlow(true)}>내 MAP 만들기</button>{answeredCount ? <button className="rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-black text-slate-700" type="button" onClick={() => setShowFlow(true)}>작성 중인 MAP 이어서 하기</button> : null}</div>
            </div>
            <div className="mx-auto w-full max-w-[28rem] rotate-[-2deg]"><PreviewCard /></div>
          </div>
        ) : isResult ? (
          <div className="relative z-10 py-10"><div className="mx-auto max-w-5xl rounded-[2.5rem] border border-slate-100 bg-white/85 p-5 shadow-2xl shadow-slate-200 sm:p-8"><div className="text-center"><p className="text-sm font-black text-sky-600">Visual MAP Result</p><h2 className="mt-2 text-4xl font-black tracking-[-0.07em] sm:text-6xl">{progress.answers[0] || "나의 결정 MAP"}</h2><p className="mt-4 font-bold text-slate-500">답변 {answeredCount}/{questions.length}개 · 마지막 저장 {lastUpdatedLabel}</p></div><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="md:col-span-2 rounded-[2rem] bg-slate-950 p-6 text-white"><p className="text-sm font-black text-sky-200">중앙 노드 · 핵심 주제</p><ExpandableAnswer text={progress.answers[0]} /></div>{resultLabels.slice(1).map((label, index) => (<article className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5" key={label}><h3 className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">{label}</h3><ExpandableAnswer text={progress.answers[index + 1]} /></article>))}</div><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><button className="rounded-full border border-slate-200 px-6 py-3 font-black" type="button" onClick={() => goTo(0)}>다시 수정하기</button><button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white" type="button" onClick={startNew}>새 MAP 만들기</button></div></div></div>
        ) : (
          <div className="relative z-10 mx-auto w-full max-w-3xl py-10"><div className="rounded-[2.5rem] border border-slate-100 bg-white/90 p-5 shadow-2xl shadow-slate-200 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-fuchsia-600">질문 {progress.currentStep + 1}/{questions.length}</p><h2 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-5xl">{currentQuestion.title}</h2></div><span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-600">답변 {answeredCount}/{questions.length}개</span></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 transition-all" style={{ width: `${((progress.currentStep + 1) / questions.length) * 100}%` }} /></div><p className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700">힌트: {currentQuestion.hint}</p><textarea className="mt-6 min-h-56 w-full resize-y rounded-[2rem] border border-slate-200 bg-white p-5 text-lg font-bold leading-8 outline-none ring-sky-200 transition focus:ring-4" value={progress.answers[progress.currentStep]} onChange={(event) => updateAnswer(event.target.value)} placeholder="여기에 답변을 적어주세요." /><p className="mt-3 text-sm font-bold text-slate-400">진행률 {percentage}% · 자동 저장됨</p><div className="mt-8 flex items-center justify-between gap-3"><button className="rounded-full border border-slate-200 px-5 py-3 font-black disabled:opacity-40" type="button" disabled={progress.currentStep === 0} onClick={() => goTo(progress.currentStep - 1)}>이전</button><button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white" type="button" onClick={() => goTo(progress.currentStep + 1)}>{progress.currentStep === questions.length - 1 ? "결과 보기" : "다음"}</button></div></div></div>
        )}
        <footer className="relative z-10 border-t border-slate-100 py-8 text-center text-sm font-bold text-slate-400">© 2026 MAP Decision. 오늘의 결정을 한 장의 MAP으로.</footer>
      </section>
    </main>
  );
}

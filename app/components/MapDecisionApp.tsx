"use client";

import { useEffect, useMemo, useState } from "react";
import { IdealTypeResult } from "./IdealTypeResult";

type Step = "landing" | "questions" | "result";
type SavedProgress = {
  currentStep: number;
  answers: string[];
  startedAt: string;
  lastUpdatedAt: string;
};

const STORAGE_KEY = "map-decision-progress-v2";

const questions = [
  "지금 결정해야 하는 주제는 무엇인가요?",
  "왜 이 결정을 지금 해야 한다고 느끼나요?",
  "가장 크게 고민되는 지점은 무엇인가요?",
  "현실적으로 선택 가능한 대안은 무엇인가요?",
  "각 선택지의 좋은 점은 무엇인가요?",
  "각 선택지의 부담이나 리스크는 무엇인가요?",
  "지금의 나에게 더 현실적인 선택은 무엇인가요?",
  "결정 후 24시간 안에 할 수 있는 첫 행동은 무엇인가요?",
];

const questionHints = [
  "예: 이직 제안을 받아들일지, 현재 회사에 남을지",
  "시간, 감정, 기회비용, 주변 상황을 함께 적어보세요.",
  "돈, 성장, 안정감, 관계, 에너지 중 무엇이 핵심인가요?",
  "선택지를 2~3개로 나눠 적으면 결과 MAP이 선명해져요.",
  "각 대안이 주는 기대 효과를 짧게 적어주세요.",
  "놓치기 쉬운 비용과 감정적 부담까지 적어주세요.",
  "완벽한 선택보다 실행 가능한 선택을 기준으로 적어보세요.",
  "작고 확인 가능한 행동이면 충분합니다.",
];

const resultLabels = [
  "핵심 주제",
  "중요 이유",
  "핵심 고민",
  "선택 가능한 대안",
  "장점",
  "단점",
  "현실적인 선택",
  "첫 실행 행동",
];

function createEmptyAnswers() {
  return Array.from({ length: questions.length }, () => "");
}

function isSavedProgress(value: unknown): value is SavedProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<SavedProgress>;
  return (
    typeof progress.currentStep === "number" &&
    Array.isArray(progress.answers) &&
    progress.answers.length === questions.length &&
    progress.answers.every((answer) => typeof answer === "string") &&
    typeof progress.startedAt === "string" &&
    typeof progress.lastUpdatedAt === "string"
  );
}

function readSavedProgress(): SavedProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isSavedProgress(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      ...parsed,
      currentStep: Math.min(Math.max(parsed.currentStep, 0), questions.length - 1),
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function formatSavedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장 시간 확인 불가";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldClamp = value.length > 84;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className={`mt-3 whitespace-pre-line text-base font-bold leading-7 text-slate-800 ${!expanded && shouldClamp ? "line-clamp-3" : ""}`}>
        {value || "아직 답변이 비어 있어요."}
      </p>
      {shouldClamp ? (
        <button className="mt-3 text-sm font-black text-sky-700" type="button" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </article>
  );
}

export function MapDecisionApp() {
  const [step, setStep] = useState<Step>("landing");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(createEmptyAnswers);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  useEffect(() => {
    const saved = readSavedProgress();
    if (saved) {
      setHasSavedProgress(true);
      setLastUpdatedAt(saved.lastUpdatedAt);
    }
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const now = new Date().toISOString();
    const progress: SavedProgress = {
      currentStep,
      answers,
      startedAt,
      lastUpdatedAt: now,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    setLastUpdatedAt(now);
    setHasSavedProgress(true);
  }, [answers, currentStep, startedAt]);

  const answeredCount = useMemo(() => answers.filter((answer) => answer.trim().length > 0).length, [answers]);
  const progress = Math.round(((currentStep + 1) / questions.length) * 100);

  const startNew = () => {
    const now = new Date().toISOString();
    const emptyAnswers = createEmptyAnswers();
    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers(emptyAnswers);
    setCurrentStep(0);
    setStartedAt(now);
    setLastUpdatedAt(now);
    setHasSavedProgress(false);
    setStep("questions");
  };

  const resume = () => {
    const saved = readSavedProgress();
    if (!saved) {
      startNew();
      return;
    }
    setAnswers(saved.answers);
    setCurrentStep(saved.currentStep);
    setStartedAt(saved.startedAt);
    setLastUpdatedAt(saved.lastUpdatedAt);
    setHasSavedProgress(true);
    setStep("questions");
  };

  const updateAnswer = (value: string) => {
    setAnswers((current) => current.map((answer, index) => (index === currentStep ? value : answer)));
  };

  const goNext = () => {
    if (currentStep === questions.length - 1) {
      setStep("result");
      return;
    }
    setCurrentStep((current) => Math.min(current + 1, questions.length - 1));
  };

  const resetAll = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAnswers(createEmptyAnswers());
    setCurrentStep(0);
    setStartedAt(null);
    setLastUpdatedAt(null);
    setHasSavedProgress(false);
    setStep("landing");
  };

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between rounded-full border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
          <button className="flex items-center gap-2" type="button" onClick={() => setStep("landing")}>
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">M</span>
            <span className="text-lg font-black tracking-[-0.06em]">MAP Decision</span>
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">v0.2.0</span>
        </nav>

        {step === "landing" ? (
          <section className="relative grid flex-1 items-center gap-12 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
            <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-100 via-white to-sky-100 blur-3xl" />
            <div className="text-center lg:text-left">
              <p className="mx-auto mb-5 inline-flex rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-500 lg:mx-0">
                3분이면 나를 설명하는 MAP 하나.
              </p>
              <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.08em] sm:text-7xl lg:text-8xl">
                지금 내 생각은 어떤 모습일까?
              </h1>
              <p className="mx-auto mt-7 max-w-xl whitespace-pre-line text-xl font-bold leading-8 tracking-[-0.04em] text-slate-600 sm:text-2xl sm:leading-10 lg:mx-0">
                가볍게 이야기하면, 오늘의 나를 한 장의 MAP로 남겨요. 이직처럼 복잡한 선택도 질문 8개로 정리할 수 있어요.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row lg:justify-start">
                <button className="inline-flex w-full justify-center rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-600 to-sky-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-200 transition hover:-translate-y-1 sm:w-auto" type="button" onClick={startNew}>
                  내 MAP 만들기
                </button>
                {hasSavedProgress ? (
                  <button className="inline-flex w-full justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-lg font-black text-slate-800 shadow-lg shadow-slate-100 sm:w-auto" type="button" onClick={resume}>
                    작성 중인 MAP 이어서 하기
                  </button>
                ) : null}
              </div>
              {lastUpdatedAt ? <p className="mt-4 text-sm font-bold text-slate-500">마지막 저장: {formatSavedTime(lastUpdatedAt)}</p> : null}

              <div className="mt-12 grid gap-3 sm:grid-cols-3">
                {["질문 8개에 답변", "자동 저장 및 복원", "Visual MAP 결과 확인"].map((item, index) => (
                  <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                    <p className="text-sm font-black text-sky-700">0{index + 1}</p>
                    <p className="mt-2 text-lg font-black tracking-[-0.04em]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[28rem] rotate-[-2deg]">
              <IdealTypeResult compact />
            </div>
          </section>
        ) : null}

        {step === "questions" ? (
          <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-sky-700">질문 {currentStep + 1} / {questions.length}</p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">{questions[currentStep]}</h1>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">{progress}%</span>
              </div>
              <div className="mt-6 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-slate-950 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-6 text-sm font-bold leading-6 text-slate-500">{questionHints[currentStep]}</p>
              <textarea
                className="mt-4 min-h-44 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-5 text-base font-bold leading-7 outline-none transition focus:border-sky-400 focus:bg-white"
                value={answers[currentStep]}
                onChange={(event) => updateAnswer(event.target.value)}
                placeholder="편하게 적어주세요. 문장이 완벽하지 않아도 괜찮아요."
              />
              <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row">
                <button className="rounded-full border border-slate-300 bg-white px-6 py-3 font-black text-slate-700 disabled:opacity-40" type="button" disabled={currentStep === 0} onClick={() => setCurrentStep((current) => Math.max(current - 1, 0))}>
                  이전
                </button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="rounded-full border border-slate-300 bg-white px-6 py-3 font-black text-slate-700" type="button" onClick={resetAll}>
                    새로 시작하기
                  </button>
                  <button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white" type="button" onClick={goNext}>
                    {currentStep === questions.length - 1 ? "결과 보기" : "다음"}
                  </button>
                </div>
              </div>
              <p className="mt-5 text-sm font-bold text-slate-500">답변 {answeredCount}/{questions.length}개 저장됨 · {lastUpdatedAt ? formatSavedTime(lastUpdatedAt) : "저장 준비 중"}</p>
            </div>
          </section>
        ) : null}

        {step === "result" ? (
          <section className="py-10">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Visual MAP Result</p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.07em]">{answers[0] || "나의 의사결정 MAP"}</h1>
                <p className="mt-4 text-base font-bold leading-7 text-slate-600">중앙의 핵심 주제를 기준으로 이유, 고민, 대안, 장단점, 선택과 첫 행동을 연결했습니다.</p>
                <div className="relative mt-6 h-[28rem] overflow-hidden rounded-[1.6rem] bg-slate-950 p-5 text-white">
                  <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 360 448" fill="none" aria-hidden="true">
                    <path d="M180 224 L82 82 M180 224 L278 86 M180 224 L70 224 M180 224 L290 224 M180 224 L82 360 M180 224 L278 360" stroke="white" strokeWidth="2" />
                  </svg>
                  <div className="absolute left-1/2 top-1/2 z-10 flex size-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white p-4 text-center text-lg font-black leading-tight text-slate-950 shadow-2xl">
                    {answers[0] || "핵심 주제"}
                  </div>
                  {resultLabels.slice(1, 7).map((label, index) => (
                    <div
                      key={label}
                      className={`absolute z-10 flex size-24 items-center justify-center rounded-full border border-white/20 bg-sky-100 p-3 text-center text-xs font-black leading-tight text-slate-950 shadow-lg ${
                        ["left-4 top-8", "right-4 top-10", "left-3 top-[11.5rem]", "right-3 top-[11.5rem]", "bottom-10 left-5", "bottom-10 right-5"][index]
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {resultLabels.map((label, index) => (
                  <SummaryCard key={label} label={label} value={answers[index]} />
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button className="rounded-full border border-slate-300 bg-white px-6 py-3 font-black text-slate-800" type="button" onClick={() => setStep("questions")}>
                다시 수정하기
              </button>
              <button className="rounded-full bg-slate-950 px-6 py-3 font-black text-white" type="button" onClick={resetAll}>
                새 MAP 만들기
              </button>
            </div>
          </section>
        ) : null}

        <footer className="mt-auto border-t border-slate-200 py-5 text-sm font-bold text-slate-500">
          MAP Decision MVP · v0.2.0 · 저장 데이터는 이 브라우저의 localStorage에만 보관됩니다.
        </footer>
      </div>
    </main>
  );
}

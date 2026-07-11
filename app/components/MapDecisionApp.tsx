"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "map-decision-progress-v2";

type SavedProgress = {
  currentStep: number;
  answers: string[];
  startedAt: string;
  lastUpdatedAt: string;
};

type MicState = "idle" | "recording" | "converting";

const thinkingPrompts = [
  {
    mapType: "Topic",
    nodeLabel: "정리하고 싶은 생각",
    ai: "오늘 머릿속에서 가장 자주 돌아오는 생각은 뭐예요?",
    followUp: "결정처럼 쓰지 않아도 괜찮아요. 지금 떠오르는 문장 그대로 말해도 돼요.",
    reaction: "좋아요. 이제 생각의 중심이 조금 보이기 시작했어요.",
  },
  {
    mapType: "Reason",
    nodeLabel: "지금 중요한 이유",
    ai: "그 생각이 하필 지금 크게 느껴지는 이유가 있을까요?",
    followUp: "마감, 감정 변화, 기회, 반복되는 불편함처럼 ‘지금성’을 만든 단서를 찾아볼게요.",
    reaction: "그 부분이 꽤 중요한 신호처럼 보여요.",
  },
  {
    mapType: "Tension",
    nodeLabel: "마음이 걸리는 지점",
    ai: "그 안에서 제일 마음이 걸리는 건 무엇에 가까워요?",
    followUp: "두려움일 수도 있고, 놓치기 싫은 가치일 수도 있어요. 애매해도 그대로 남겨둘게요.",
    reaction: "망설임의 모양이 조금 더 선명해졌어요.",
  },
  {
    mapType: "Choices",
    nodeLabel: "가능한 선택들",
    ai: "현실적으로 가능한 선택지를 모두 펼쳐보면 어떤 것들이 있나요?",
    followUp: "완벽한 답이 아니라 실제로 할 수 있는 선택을 짧게 나열해도 좋아요.",
    reaction: "선택지가 보이면 생각이 덜 뭉쳐 보여요.",
  },
  {
    mapType: "Upside",
    nodeLabel: "끌리는 이유",
    ai: "각 선택이 나에게 줄 수 있는 좋은 점은 뭐라고 느껴져요?",
    followUp: "성장, 안정, 자유, 관계, 돈, 시간처럼 끌리는 이유를 찾아볼게요.",
    reaction: "어떤 가치에 마음이 움직이는지 드러나고 있어요.",
  },
  {
    mapType: "Risk",
    nodeLabel: "부담과 리스크",
    ai: "반대로 조심해야 할 부담이나 리스크는 무엇인가요?",
    followUp: "비용, 관계, 시간, 후회 가능성, 되돌리기 어려운 점을 솔직히 적어도 괜찮아요.",
    reaction: "좋아요. 낙관과 걱정을 같이 놓고 볼 수 있게 됐어요.",
  },
  {
    mapType: "Direction",
    nodeLabel: "지금의 방향",
    ai: "지금 이야기한 기준으로 보면, 현재의 나에게 더 현실적인 방향은 어디에 가까워요?",
    followUp: "최종 결론이 아니어도 돼요. 오늘 기준의 ‘임시 방향’을 잡아볼게요.",
    reaction: "결정이 아니라 방향이 생겼어요. 이 정도면 충분히 의미 있어요.",
  },
  {
    mapType: "Action",
    nodeLabel: "24시간 첫 행동",
    ai: "그 방향을 확인하기 위해 24시간 안에 할 수 있는 아주 작은 행동은 뭐가 있을까요?",
    followUp: "검색하기, 메시지 보내기, 30분 정리하기처럼 작고 구체적이면 좋아요.",
    reaction: "이제 생각이 행동으로 이어질 수 있어요.",
  },
];

const sampleAnswers = [
  "이직할지, 지금 회사에 남을지 계속 고민돼요.",
  "요즘 성장 속도가 느려졌다는 느낌이 크고, 주변 친구들이 움직이는 걸 보며 더 신경 쓰여요.",
  "안정적인 팀과 좋은 동료를 잃는 건 아쉽지만, 커리어가 멈추는 느낌도 싫어요.",
  "1. 3개월 더 남아보기\n2. 이직 준비를 조용히 시작하기\n3. 내부 이동 가능성을 알아보기",
  "이직 준비는 가능성을 넓혀주고, 남는 선택은 생활 리듬과 안정감을 지켜줘요.",
  "준비 없이 나가면 수입과 적응 리스크가 있고, 남으면 같은 고민이 반복될 수 있어요.",
  "바로 퇴사보다 3개월 동안 이직 준비와 내부 이동 탐색을 병행하는 쪽.",
  "이번 주말에 포트폴리오를 업데이트하고, 믿을 만한 선배 한 명에게 커피챗을 요청하기.",
];

const mapPalette = [
  "border-slate-300 bg-slate-950 text-white",
  "border-blue-200 bg-blue-50 text-blue-950",
  "border-rose-200 bg-rose-50 text-rose-950",
  "border-amber-200 bg-amber-50 text-amber-950",
  "border-emerald-200 bg-emerald-50 text-emerald-950",
  "border-orange-200 bg-orange-50 text-orange-950",
  "border-indigo-200 bg-indigo-50 text-indigo-950",
  "border-sky-200 bg-sky-50 text-sky-950",
];

function createEmptyProgress(): SavedProgress {
  const now = new Date().toISOString();
  return { currentStep: 0, answers: Array(thinkingPrompts.length).fill(""), startedAt: now, lastUpdatedAt: now };
}

function isValidProgress(value: unknown): value is SavedProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as SavedProgress;
  return (
    Number.isInteger(progress.currentStep) &&
    progress.currentStep >= 0 &&
    progress.currentStep <= thinkingPrompts.length &&
    Array.isArray(progress.answers) &&
    progress.answers.length === thinkingPrompts.length &&
    progress.answers.every((answer) => typeof answer === "string") &&
    typeof progress.startedAt === "string" &&
    typeof progress.lastUpdatedAt === "string"
  );
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function shortText(text: string, fallback: string, length = 82) {
  const clean = text.trim();
  if (!clean) return fallback;
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("ko-KR", options).format(new Date(value));
}

function ThoughtMap({ answers, sample = false, compact = false }: { answers: string[]; sample?: boolean; compact?: boolean }) {
  const source = sample ? sampleAnswers : answers;
  const filled = source.map((answer, index) => ({ ...thinkingPrompts[index], answer: answer.trim(), active: Boolean(answer.trim()) }));
  const visible = filled.filter((node, index) => sample || node.active || index === 0);
  const center = shortText(source[0], sample ? sampleAnswers[0] : "생각의 중심이 여기에 생겨요", 68);

  return (
    <div className={cx("thinking-map relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur-xl", compact ? "min-h-[25rem]" : "min-h-[34rem] sm:min-h-[39rem]")}> 
      <div className="absolute inset-6 rounded-[1.5rem] border border-dashed border-slate-200/80" />
      <svg className="absolute inset-0 h-full w-full text-slate-300/80" aria-hidden="true">
        {visible.slice(1).map((_, index) => {
          const coordinates = [[50, 50, 23, 22], [50, 50, 77, 21], [50, 50, 18, 52], [50, 50, 82, 52], [50, 50, 27, 82], [50, 50, 73, 82], [50, 50, 50, 90]][index] || [50, 50, 50, 50];
          return <line key={index} x1={`${coordinates[0]}%`} y1={`${coordinates[1]}%`} x2={`${coordinates[2]}%`} y2={`${coordinates[3]}%`} stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />;
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 w-[76%] max-w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-400/40 sm:w-[42%]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">Thinking core</p>
        <h3 className="mt-2 line-clamp-4 text-xl font-black leading-snug tracking-[-0.02em]">{center}</h3>
      </div>

      {visible.slice(1, 8).map((node, index) => {
        const positions = ["left-[5%] top-[9%]", "right-[5%] top-[10%]", "left-[3%] top-[43%]", "right-[3%] top-[43%]", "left-[11%] bottom-[9%]", "right-[11%] bottom-[9%]", "left-1/2 bottom-[3%] -translate-x-1/2"];
        return (
          <article className={cx("absolute z-10 hidden w-[13rem] rounded-2xl border p-4 shadow-xl shadow-slate-200/70 sm:block", mapPalette[index + 1], positions[index])} key={node.mapType}>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.13em] opacity-70">{node.mapType}</p>
            <h4 className="mt-1 text-sm font-black">{node.nodeLabel}</h4>
            <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 opacity-80">{shortText(node.answer, "이야기하면 노드가 생겨요", 74)}</p>
          </article>
        );
      })}

      <div className="absolute inset-x-4 bottom-4 z-30 grid gap-2 sm:hidden">
        {visible.slice(1, 4).map((node) => (
          <div className="rounded-2xl border border-white bg-white/95 p-3 text-sm font-bold shadow-lg" key={node.mapType}>
            <span className="text-blue-700">{node.nodeLabel}</span> · <span className="text-slate-600">{shortText(node.answer, "말하면 여기에 나타나요", 46)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpandableAnswer({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 150;
  const visibleText = !isLong || expanded ? text : `${text.slice(0, 150)}…`;

  return (
    <div>
      <p className="whitespace-pre-line text-[0.95rem] font-semibold leading-7 text-slate-650">{visibleText || "아직 비어 있어요."}</p>
      {isLong ? (
        <button className="mt-3 text-sm font-black text-blue-700" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </div>
  );
}

export function MapDecisionApp() {
  const [progress, setProgress] = useState<SavedProgress>(() => createEmptyProgress());
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<"home" | "conversation">("home");
  const [micState, setMicState] = useState<MicState>("idle");

  const answeredCount = progress.answers.filter((answer) => answer.trim()).length;
  const isResult = progress.currentStep >= thinkingPrompts.length;
  const currentIndex = Math.min(progress.currentStep, thinkingPrompts.length - 1);
  const currentPrompt = thinkingPrompts[currentIndex];
  const mapCompletion = Math.round((answeredCount / thinkingPrompts.length) * 100);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isValidProgress(parsed)) {
          setProgress(parsed);
          setMode(parsed.answers.some((answer) => answer.trim()) || parsed.currentStep > 0 ? "conversation" : "home");
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

  const lastUpdatedLabel = useMemo(() => formatDate(progress.lastUpdatedAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), [progress.lastUpdatedAt]);
  const generatedLabel = useMemo(() => formatDate(progress.lastUpdatedAt, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }), [progress.lastUpdatedAt]);

  const updateAnswer = (value: string) => {
    setProgress((prev) => {
      const answers = [...prev.answers];
      answers[prev.currentStep] = value;
      return { ...prev, answers, lastUpdatedAt: new Date().toISOString() };
    });
  };

  const goTo = (step: number) => setProgress((prev) => ({ ...prev, currentStep: Math.max(0, Math.min(step, thinkingPrompts.length)), lastUpdatedAt: new Date().toISOString() }));

  const startNew = () => {
    const empty = createEmptyProgress();
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress(empty);
    setMode("conversation");
    setMicState("idle");
  };

  const startThinking = () => setMode("conversation");

  const handleMic = () => {
    if (micState !== "idle") return;
    setMicState("recording");
    window.setTimeout(() => setMicState("converting"), 900);
    window.setTimeout(() => {
      setMicState("idle");
      updateAnswer(progress.answers[progress.currentStep] || "음성으로 말한 생각이 여기에 텍스트로 바뀌어 들어옵니다. 자유롭게 고쳐 쓸 수 있어요.");
    }, 1700);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f3ea] text-slate-950">
      {mode === "home" ? (
        <Landing answeredCount={answeredCount} onStart={startThinking} />
      ) : isResult ? (
        <Result progress={progress} answeredCount={answeredCount} generatedLabel={generatedLabel} lastUpdatedLabel={lastUpdatedLabel} onEdit={() => goTo(0)} onNew={startNew} />
      ) : (
        <Conversation progress={progress} currentPrompt={currentPrompt} answeredCount={answeredCount} mapCompletion={mapCompletion} lastUpdatedLabel={lastUpdatedLabel} micState={micState} onMic={handleMic} onAnswer={updateAnswer} onPrev={() => goTo(progress.currentStep - 1)} onNext={() => goTo(progress.currentStep + 1)} onHome={() => setMode("home")} />
      )}
    </main>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span>
      <span className="text-lg font-black tracking-[-0.02em]">MAP Decision</span>
    </div>
  );
}

function Landing({ answeredCount, onStart }: { answeredCount: number; onStart: () => void }) {
  return (
    <div className="px-4 py-3 sm:px-6 lg:px-8">
      <header className="sticky top-3 z-40 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/80 bg-white/80 px-4 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl sm:px-6">
        <BrandMark />
        <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
          <a href="#voice">Voice first</a>
          <a href="#live-map">Live MAP</a>
          <a href="#output">Result</a>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">v0.3.0</span>
        </nav>
        <button className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-300/60 transition hover:-translate-y-0.5" type="button" onClick={onStart}>
          {answeredCount ? "내 생각 이어보기" : "같이 정리하기"}
        </button>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:py-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-white bg-white/75 px-4 py-2 text-sm font-black text-rose-600 shadow-sm">머릿속이 조금 복잡한가요?</p>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-7xl lg:text-8xl">
            말하면,
            <br />생각이 MAP이 됩니다.
          </h1>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-650 sm:text-2xl sm:leading-10">
            답을 주는 서비스가 아니라, 내 생각의 구조를 같이 발견하는 Thinking Operating System.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-blue-700 px-8 py-4 text-lg font-black text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1" onClick={onStart} type="button">🎙 Tell me</button>
            <button className="rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-black text-slate-800" onClick={onStart} type="button">⌨ Or type</button>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-sm font-bold text-slate-500">
            {["이직할까?", "고백할까?", "아이패드 살까?", "자취할까?", "운동 시작할까?"].map((item) => <span className="rounded-full bg-white/75 px-3 py-1.5" key={item}>{item}</span>)}
          </div>
        </div>
        <ThoughtMap answers={sampleAnswers} sample />
      </section>

      <section id="voice" className="mx-auto max-w-7xl py-10">
        <SectionTitle eyebrow="Voice first" title="입력하는 순간보다 말하는 순간에 가깝게." />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["🎙 말하기", "마이크를 누르면 녹음 중 상태와 변환 중 상태가 보여요."],
            ["✍️ 고쳐 쓰기", "변환된 문장은 언제든 직접 수정할 수 있어요."],
            ["🧭 이어가기", "AI는 답을 강요하지 않고 다음 관점을 부드럽게 열어줘요."],
          ].map(([title, copy]) => <InfoCard key={title} title={title} copy={copy} />)}
        </div>
      </section>

      <section id="live-map" className="mx-auto grid max-w-7xl gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionTitle eyebrow="Live MAP" title="이야기할수록 내 생각이 보입니다." />
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">Topic, Reason, Value, Constraint, Choice, Risk, Action이 대화 중 바로 노드가 되어 자라납니다. 마지막 결과만 기다리는 제품이 아닙니다.</p>
          <div className="mt-7 grid gap-3">
            {["패턴을 찾고", "모순을 부드럽게 보여주고", "빠진 관점을 제안하고", "결정 대신 이해를 돕습니다"].map((item) => <div className="rounded-2xl bg-white/75 p-4 font-black shadow-sm" key={item}>{item}</div>)}
          </div>
        </div>
        <ThoughtMap answers={sampleAnswers} sample compact />
      </section>

      <section id="output" className="mx-auto max-w-7xl py-12">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/50 md:p-12">
          <SectionTitle eyebrow="Final output" title="결론보다 먼저, 내 생각을 이해합니다." dark />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Thinking Map", "Alternative choices", "Missing information", "Risks", "Decision summary", "24시간 첫 행동"].map((item) => <div className="rounded-2xl bg-white/10 p-5 font-black" key={item}>{item}</div>)}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionTitle({ eyebrow, title, dark = false }: { eyebrow: string; title: string; dark?: boolean }) {
  return <div><p className={cx("text-sm font-black uppercase tracking-[0.14em]", dark ? "text-blue-200" : "text-blue-700")}>{eyebrow}</p><h2 className={cx("mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl", dark ? "text-white" : "text-slate-950")}>{title}</h2></div>;
}

function InfoCard({ title, copy }: { title: string; copy: string }) {
  return <article className="card p-7"><h3 className="text-2xl font-black">{title}</h3><p className="mt-3 font-semibold leading-7 text-slate-600">{copy}</p></article>;
}

function Footer() {
  return <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-slate-200 py-8 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>MAP Decision · Thinking Operating System v0.3.0</span><span>저장 방식: 브라우저 localStorage</span><span>© 2026 MAP Decision</span></footer>;
}

function Conversation(props: { progress: SavedProgress; currentPrompt: (typeof thinkingPrompts)[number]; answeredCount: number; mapCompletion: number; lastUpdatedLabel: string; micState: MicState; onMic: () => void; onAnswer: (value: string) => void; onPrev: () => void; onNext: () => void; onHome: () => void }) {
  const { progress, currentPrompt, answeredCount, mapCompletion, lastUpdatedLabel, micState, onMic, onAnswer, onPrev, onNext, onHome } = props;
  const currentAnswer = progress.answers[progress.currentStep];
  const hasAnswer = currentAnswer.trim().length > 0;
  const checkpoint = answeredCount >= 3 && progress.currentStep === 3;

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white bg-white/85 px-4 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
        <BrandMark />
        <div className="hidden min-w-[15rem] items-center gap-3 md:flex">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${mapCompletion}%` }} /></div>
          <span className="text-xs font-black text-slate-500">MAP {mapCompletion}%</span>
        </div>
        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black" onClick={onHome} type="button">처음으로</button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 py-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] lg:py-12">
        <div className="order-2 lg:order-1">
          <ThoughtMap answers={progress.answers} />
          <div className="mt-4 rounded-[1.5rem] border border-white bg-white/80 p-4 shadow-lg shadow-slate-200/50">
            <div className="flex items-center justify-between text-sm font-black text-slate-500"><span>생각 조각 {answeredCount}/8</span><span>자동 저장 · {lastUpdatedLabel}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{ width: `${mapCompletion}%` }} /></div>
          </div>
        </div>

        <div className="order-1 flex flex-col justify-center lg:order-2">
          <div className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-2xl shadow-slate-200/70 backdrop-blur-xl sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-950 text-white">AI</div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-blue-700">Thinking partner</p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">{currentPrompt.ai}</h1>
                <p className="mt-4 text-lg font-semibold leading-8 text-slate-600">{currentPrompt.followUp}</p>
              </div>
            </div>

            {progress.currentStep > 0 ? <p className="mt-6 rounded-3xl bg-blue-50 p-4 font-bold leading-7 text-blue-950">{thinkingPrompts[progress.currentStep - 1].reaction}</p> : null}

            {checkpoint ? (
              <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-5">
                <p className="font-black text-rose-950">지금까지 보면, 중심 고민과 가능한 선택지가 분리되기 시작했어요. 제가 이해한 방향이 맞나요?</p>
                <div className="mt-4 flex gap-2"><button className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white" type="button">맞아요</button><button className="rounded-full bg-white px-4 py-2 text-sm font-black text-rose-700" type="button">조금 달라요</button></div>
              </div>
            ) : null}

            <div className="mt-7 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-500">🎙 Tell me</p>
                  <p className="text-xs font-bold text-slate-400">음성은 데모 상태이며 변환된 문장을 직접 수정할 수 있어요.</p>
                </div>
                <button className={cx("relative rounded-full px-5 py-3 font-black text-white shadow-lg transition", micState === "recording" ? "bg-rose-600 shadow-rose-200" : micState === "converting" ? "bg-amber-500 shadow-amber-200" : "bg-blue-700 shadow-blue-200 hover:-translate-y-0.5")} onClick={onMic} type="button">
                  {micState === "recording" ? "● Recording" : micState === "converting" ? "Converting…" : "마이크로 말하기"}
                </button>
              </div>
              <textarea className="mt-4 min-h-32 w-full resize-y rounded-[1.25rem] border border-white bg-white p-4 text-lg font-semibold leading-8 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100" value={currentAnswer} onChange={(event) => onAnswer(event.target.value)} placeholder="말하거나, 여기에서 바로 써도 괜찮아요." />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button className="rounded-full border border-slate-200 bg-white px-6 py-3 font-black disabled:cursor-not-allowed disabled:opacity-40" disabled={progress.currentStep === 0} onClick={onPrev} type="button">이전 생각</button>
              <button className="rounded-full bg-slate-950 px-7 py-3 font-black text-white shadow-lg shadow-slate-300/60" onClick={onNext} type="button">{progress.currentStep === thinkingPrompts.length - 1 ? "내 MAP 확인하기" : hasAnswer ? "계속 이야기하기" : "건너뛰고 이어가기"}</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Result({ progress, answeredCount, generatedLabel, lastUpdatedLabel, onEdit, onNew }: { progress: SavedProgress; answeredCount: number; generatedLabel: string; lastUpdatedLabel: string; onEdit: () => void; onNew: () => void }) {
  const missing = thinkingPrompts.filter((_, index) => !progress.answers[index].trim()).map((prompt) => prompt.nodeLabel);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-[2rem] bg-white/85 p-5 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-sm font-black text-blue-700">생성 시간 · {generatedLabel}</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-6xl">내 생각의 MAP</h1>
            <p className="mt-3 font-bold text-slate-500">생각 조각 {answeredCount}/8 · 마지막 저장 {lastUpdatedLabel}</p>
          </div>
          <div className="flex gap-2"><button className="rounded-full border border-slate-200 bg-white px-5 py-3 font-black" onClick={onEdit} type="button">다시 이야기하기</button><button className="rounded-full bg-blue-700 px-5 py-3 font-black text-white" onClick={onNew} type="button">새 MAP</button></div>
        </header>

        <div className="mt-8"><ThoughtMap answers={progress.answers} /></div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {thinkingPrompts.map((prompt, index) => <article className="card p-6" key={prompt.mapType}><p className="text-sm font-black uppercase tracking-[0.13em] text-blue-700">{prompt.mapType}</p><h2 className="mt-2 text-2xl font-black">{prompt.nodeLabel}</h2><div className="mt-3"><ExpandableAnswer text={progress.answers[index]} /></div></article>)}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <SummaryCard title="Decision Summary" body={progress.answers[6] || "아직 방향이 비어 있어요. 다시 이야기하면서 오늘 기준의 임시 방향을 잡아보세요."} dark />
          <SummaryCard title="Alternative choices" body={progress.answers[3] || "선택지를 더 펼치면 생각이 덜 막혀 보여요."} />
          <SummaryCard title="Missing information" body={missing.length ? `${missing.join(", ")}에 대한 정보가 더 있으면 MAP이 선명해져요.` : "빠진 조각 없이 충분히 선명한 MAP이에요."} />
          <SummaryCard title="Risks" body={progress.answers[5] || "리스크가 비어 있어요. 조심해야 할 조건을 더 적어보세요."} />
          <SummaryCard title="Next action" body={progress.answers[7] || "24시간 안에 할 아주 작은 행동을 정해보세요."} dark />
          <SummaryCard title="AI role" body="MAP Decision은 결정을 대신하지 않습니다. 당신의 생각 안에 이미 있던 패턴을 보이게 합니다." />
        </div>

        <div className="mt-8 flex flex-col gap-3 pb-10 sm:flex-row sm:justify-center"><button className="rounded-full border border-slate-200 bg-white px-7 py-3 font-black" onClick={onEdit} type="button">다시 이야기하기</button><button className="rounded-full bg-blue-700 px-7 py-3 font-black text-white" onClick={onNew} type="button">새 MAP 만들기</button></div>
      </section>
    </div>
  );
}

function SummaryCard({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  return <article className={cx("rounded-[1.5rem] p-6 shadow-xl", dark ? "bg-slate-950 text-white shadow-slate-300/50" : "border border-white bg-white/80 text-slate-950 shadow-slate-200/60")}><p className={cx("text-sm font-black uppercase tracking-[0.13em]", dark ? "text-blue-200" : "text-blue-700")}>{title}</p><p className="mt-4 whitespace-pre-line text-lg font-bold leading-8">{body}</p></article>;
}

import { MapStartActions } from "./components/MapStartActions";

const commitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

const steps = [
  {
    number: "01",
    title: "질문에 답하기",
    description: "복잡한 상황을 짧은 질문으로 정리합니다.",
  },
  {
    number: "02",
    title: "생각 구조화",
    description: "고민, 대안, 장단점과 우선순위를 연결합니다.",
  },
  {
    number: "03",
    title: "실행 MAP 완성",
    description: "결론과 가장 먼저 할 행동을 한눈에 확인합니다.",
  },
];

const exampleNodes = [
  { label: "중요한 이유", value: "성장과 보상" },
  { label: "핵심 고민", value: "안정성과 새로운 기회" },
  { label: "대안 A", value: "현재 회사 유지" },
  { label: "대안 B", value: "새로운 회사 이직" },
];

function ExampleNode({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-100">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black leading-7 tracking-[-0.04em] text-slate-800">{value}</p>
    </article>
  );
}

export default function Home() {
  return (
    <main className="bg-[#f7f7f4] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7f7f4]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="text-lg font-black tracking-[-0.05em] text-slate-950">
            MAP Decision
          </a>
          <div className="hidden items-center gap-7 text-sm font-black text-slate-500 md:flex">
            <a className="transition hover:text-slate-950" href="#how-it-works">작동 방식</a>
            <a className="transition hover:text-slate-950" href="#example-map">결과 예시</a>
          </div>
          <MapStartActions variant="nav" />
        </nav>
      </header>

      <section id="top" className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 lg:py-20">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm">
            MAP Decision · v0.1.0
          </p>
          <h1 className="max-w-3xl whitespace-pre-line text-5xl font-black leading-[1.03] tracking-[-0.075em] text-slate-950 sm:text-7xl lg:text-8xl">
            {"생각이 복잡할수록,\n지도로 보면 명확해집니다."}
          </h1>
          <p className="mt-7 max-w-2xl whitespace-pre-line text-lg font-bold leading-8 tracking-[-0.035em] text-slate-600 sm:text-xl sm:leading-9">
            {"MAP Decision은 몇 가지 질문을 통해\n복잡한 고민을 구조화하고,\n선택과 다음 행동을 한눈에 보여줍니다."}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <MapStartActions startLabel="내 MAP 만들기" />
            <a
              href="#example-map"
              className="inline-flex justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950"
            >
              결과 예시 보기
            </a>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white bg-white/70 p-4 shadow-2xl shadow-slate-200/80 sm:p-6">
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300 sm:p-7">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white/40">Example Output</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.06em] sm:text-4xl">이직 의사결정 MAP</h2>
            <div className="mt-7 grid gap-3">
              <div className="rounded-[1.4rem] bg-white p-4 text-slate-950">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">핵심 주제</p>
                <p className="mt-2 text-xl font-black tracking-[-0.04em]">이직 여부 결정</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">현실적인 선택</p>
                  <p className="mt-2 text-lg font-black leading-7">조건을 확인한 뒤 이직 추진</p>
                </div>
                <div className="rounded-[1.4rem] bg-white/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">첫 행동</p>
                  <p className="mt-2 text-lg font-black leading-7">이번 주 채용공고 3개 검토</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.065em] sm:text-5xl">세 단계로 생각을 정리합니다.</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
              <p className="text-4xl font-black tracking-[-0.07em] text-slate-300">{step.number}</p>
              <h3 className="mt-8 text-2xl font-black tracking-[-0.05em] text-slate-950">{step.title}</h3>
              <p className="mt-3 text-base font-bold leading-7 text-slate-500">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="example-map" className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Result Example</p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.065em] sm:text-5xl">이직 의사결정 MAP</h2>
          <p className="mt-4 text-lg font-bold leading-8 text-slate-500">
            답변은 단순 목록이 아니라, 선택의 구조와 다음 행동이 연결된 MAP로 정리됩니다.
          </p>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/70 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-xl rounded-[1.8rem] bg-slate-950 p-5 text-center text-white shadow-2xl shadow-slate-300">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">중앙 노드</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.06em]">이직 여부 결정</p>
            </div>
            <div aria-hidden="true" className="mx-auto h-10 w-px bg-slate-300" />
            <div className="relative grid gap-4 md:grid-cols-4">
              <div aria-hidden="true" className="absolute left-1/2 top-[-1.25rem] hidden h-px w-3/4 -translate-x-1/2 bg-slate-300 md:block" />
              {exampleNodes.map((node) => <ExampleNode key={node.label} {...node} />)}
            </div>
            <div aria-hidden="true" className="mx-auto h-10 w-px bg-slate-300" />
            <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
              <ExampleNode label="현실적인 선택" value="조건을 확인한 뒤 이직 추진" />
              <ExampleNode label="첫 행동" value="이번 주 채용공고 3개 검토" />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-slate-950 p-7 text-center text-2xl font-black leading-9 tracking-[-0.05em] text-white shadow-2xl shadow-slate-300 sm:text-3xl sm:leading-10">
          {"정답을 대신 결정하지 않습니다.\n더 명확하게 결정할 수 있도록 돕습니다."}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-slate-500 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xl font-black tracking-[-0.05em] text-slate-950">MAP Decision</p>
            <p className="mt-2 text-base font-bold">Think clearly. Decide confidently.</p>
          </div>
          <div className="text-sm font-black">
            <p>© 2026 MAP Decision</p>
            <p className="mt-1 inline-flex rounded-full border border-slate-300 px-3 py-1 text-slate-600">v0.1.0 · {commitHash}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

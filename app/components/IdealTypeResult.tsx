import { createDummyMAPEngine, idealTypeSampleInput } from "../../src/map-engine";

const { result } = createDummyMAPEngine().run(idealTypeSampleInput);

const graphNodeClasses = [
  "left-[12%] top-[18%] h-24 w-24 bg-rose-300",
  "right-[10%] top-[12%] h-28 w-28 bg-orange-200",
  "bottom-[18%] left-[18%] h-32 w-32 bg-sky-200",
  "bottom-[10%] right-[14%] h-24 w-24 bg-fuchsia-300",
];

export function IdealTypeResult({ compact = false }: { compact?: boolean }) {
  const discoveries = result.priorities.slice(0, 3);

  const articleClass = compact
    ? "mx-auto w-full max-w-[36rem] space-y-3"
    : "mx-auto w-full max-w-[31rem] space-y-4";

  return (
    <article className={articleClass}>
      <header className="rounded-[2.5rem] bg-white p-4 shadow-2xl shadow-rose-100/70">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-400 via-fuchsia-400 to-sky-400 p-1">
          <div className={`relative overflow-hidden rounded-[1.8rem] bg-white/15 p-6 text-white backdrop-blur-md ${compact ? "min-h-[22rem]" : "min-h-[25rem]"}`}>
            <div className="absolute -right-12 -top-10 size-40 rounded-full bg-white/25" />
            <div className="absolute bottom-6 right-8 size-16 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <p className="text-6xl drop-shadow-sm">{result.emoji}</p>
              <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">Example MAP</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-white/75">Today&apos;s MAP</p>
              <h1 className={`mt-3 font-black leading-none tracking-[-0.09em] ${compact ? "text-4xl" : "text-5xl"}`}>{result.title}</h1>
              <p className={`mt-4 font-black leading-tight tracking-[-0.07em] ${compact ? "text-2xl" : "text-3xl"}`}>“{result.insight.memorableSentence}”</p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2.5rem] bg-slate-950 p-4 text-white shadow-2xl shadow-slate-200">
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950 p-5 ${compact ? "h-[18rem]" : "h-[24rem]"}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.22),transparent_0.55rem),radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.12),transparent_6rem)]" />
          <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 320 400" fill="none" aria-hidden="true">
            <path d="M80 105 C150 35 220 65 244 96" stroke="white" strokeOpacity="0.28" strokeWidth="2" />
            <path d="M84 280 C128 210 205 220 240 300" stroke="white" strokeOpacity="0.24" strokeWidth="2" />
            <path d="M90 110 C98 190 92 230 84 280" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
            <path d="M244 96 C235 178 250 230 240 300" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
          </svg>
          {result.graph.nodes.map((node, index) => (
            <div key={node.id} className={`absolute flex items-center justify-center rounded-full text-sm font-black text-slate-950 shadow-2xl shadow-white/10 ${graphNodeClasses[index]}`}>
              {node.label}
            </div>
          ))}
          <div className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-pre-line rounded-full bg-white text-center font-black leading-tight text-slate-950 shadow-2xl shadow-rose-500/30 ${compact ? "size-28 text-lg" : "size-32 text-xl"}`}>
            {result.graph.centerLabel}
          </div>
        </div>
      </section>

      <section className={`rounded-[2.25rem] border border-rose-50 bg-white shadow-xl shadow-slate-100 ${compact ? "p-5" : "p-6"}`}>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-400">Story</p>
        <p className={`mt-3 font-black leading-tight tracking-[-0.07em] ${compact ? "text-2xl" : "text-3xl"}`}>{result.insight.memorableSentence}</p>
      </section>

      <section className={`rounded-[2.25rem] bg-gradient-to-br from-rose-50 to-sky-50 ${compact ? "p-5" : "p-6"}`}>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">3 Discoveries</p>
        <div className={`mt-4 ${compact ? "grid gap-2 sm:grid-cols-3" : "space-y-3"}`}>
          {discoveries.map((item, index) => (
            <div key={item.id} className="rounded-[1.5rem] bg-white p-4 shadow-lg shadow-slate-100/80">
              <p className="text-sm font-black text-rose-400">0{index + 1}</p>
              <p className={`mt-2 font-black tracking-[-0.04em] ${compact ? "text-lg" : "text-xl"}`}>{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {!compact ? (
        <button className="sticky bottom-4 z-20 w-full rounded-full bg-slate-950 px-6 py-4 text-lg font-black text-white shadow-2xl shadow-slate-300 transition active:scale-[0.98]">
          {result.share.ctaText}
        </button>
      ) : null}
    </article>
  );
}

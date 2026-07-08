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

  return (
    <article className={`mx-auto w-full max-w-[31rem] space-y-5 ${compact ? "scale-[0.96]" : ""}`}>
      <header className="rounded-[2.5rem] bg-white p-5 shadow-2xl shadow-rose-100/70">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-400 via-fuchsia-400 to-sky-400 p-1">
          <div className="relative min-h-[25rem] overflow-hidden rounded-[1.8rem] bg-white/15 p-6 text-white backdrop-blur-md">
            <div className="absolute -right-12 -top-10 size-40 rounded-full bg-white/25" />
            <div className="absolute bottom-6 right-8 size-16 rounded-full bg-white/20" />
            <p className="text-6xl drop-shadow-sm">{result.emoji}</p>
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-white/75">Today&apos;s MAP</p>
              <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.09em]">{result.title}</h1>
              <p className="mt-5 text-3xl font-black leading-tight tracking-[-0.07em]">“{result.insight.memorableSentence}”</p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2.5rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-200">
        <div className="relative h-[24rem] overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950 p-5">
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
          <div className="absolute left-1/2 top-1/2 flex size-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-pre-line rounded-full bg-white text-center text-xl font-black leading-tight text-slate-950 shadow-2xl shadow-rose-500/30">
            {result.graph.centerLabel}
          </div>
        </div>
      </section>

      <section className="rounded-[2.25rem] border border-rose-50 bg-white p-6 shadow-xl shadow-slate-100">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-400">Story</p>
        <p className="mt-4 text-3xl font-black leading-tight tracking-[-0.07em]">{result.insight.memorableSentence}</p>
      </section>

      <section className="rounded-[2.25rem] bg-gradient-to-br from-rose-50 to-sky-50 p-6">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">3 Discoveries</p>
        <div className="mt-5 space-y-3">
          {discoveries.map((item, index) => (
            <div key={item.id} className="rounded-[1.5rem] bg-white p-4 shadow-lg shadow-slate-100/80">
              <p className="text-sm font-black text-rose-400">0{index + 1}</p>
              <p className="mt-2 text-xl font-black tracking-[-0.04em]">{item.label}</p>
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

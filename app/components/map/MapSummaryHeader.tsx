import type { VisualMapResult } from "../../lib/mapResult";

interface MapSummaryHeaderProps {
  result: VisualMapResult;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "오늘";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function MapSummaryHeader({ result }: MapSummaryHeaderProps) {
  return (
    <header className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-2xl shadow-slate-100 backdrop-blur-xl sm:p-7">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-400">Visual MAP</p>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] text-slate-950 sm:text-6xl">
            {result.title}
          </h1>
          <p className="mt-3 text-base font-bold text-slate-400">생성일 · {formatDate(result.createdAt)}</p>
        </div>
        <div className="grid gap-2 rounded-[1.5rem] bg-slate-50 p-4 text-sm font-bold text-slate-500">
          {result.topic ? <p><span className="text-slate-950">핵심 주제</span> · {result.topic.value}</p> : null}
          {result.realisticChoice ? <p><span className="text-slate-950">현실적인 선택</span> · {result.realisticChoice.value}</p> : null}
          {result.firstAction ? <p><span className="text-slate-950">첫 실행 행동</span> · {result.firstAction.value}</p> : null}
        </div>
      </div>
    </header>
  );
}

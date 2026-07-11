interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.round((current / total) * 100);

  return (
    <div className="space-y-3" aria-label={`질문 진행률 ${current} / ${total}`}>
      <div className="flex items-center justify-between text-sm font-black text-slate-500">
        <span>{current} / {total}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-500 to-sky-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

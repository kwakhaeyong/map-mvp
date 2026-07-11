interface QuestionCardProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-100 sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-400">MAP Question</p>
      <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.06em] text-slate-950 sm:text-4xl">
        {question}
      </h1>
      <textarea
        className="mt-8 min-h-44 w-full resize-none rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 text-lg font-bold leading-8 tracking-[-0.03em] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-sky-200 focus:bg-white focus:ring-4 focus:ring-sky-50"
        placeholder="떠오르는 대로 편하게 적어주세요."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}

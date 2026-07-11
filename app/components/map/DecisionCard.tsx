import type { VisualMapResult } from "../../lib/mapResult";

interface DecisionCardProps {
  result: VisualMapResult;
}

export function DecisionCard({ result }: DecisionCardProps) {
  return (
    <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300 sm:p-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-white/40">현재의 결론</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div>
          <p className="text-sm font-black text-white/45">가장 현실적인 선택</p>
          <p className="mt-2 whitespace-pre-line text-xl font-black leading-8 tracking-[-0.04em]">
            {result.realisticChoice?.value ?? "아직 현실적인 선택이 입력되지 않았어요."}
          </p>
        </div>
        <div>
          <p className="text-sm font-black text-white/45">왜 그 선택인가</p>
          <p className="mt-2 whitespace-pre-line text-base font-bold leading-7 text-white/75">
            {result.importance?.value ?? result.strengths?.value ?? "중요한 이유와 장점을 더 적으면 결론이 선명해져요."}
          </p>
        </div>
        <div>
          <p className="text-sm font-black text-white/45">첫 실행 행동</p>
          <p className="mt-2 whitespace-pre-line text-base font-bold leading-7 text-white/75">
            {result.firstAction?.value ?? "가장 먼저 할 행동을 입력하면 실행 카드가 완성돼요."}
          </p>
        </div>
      </div>
    </section>
  );
}

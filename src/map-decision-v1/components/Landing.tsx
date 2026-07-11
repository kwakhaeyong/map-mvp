import { createSession } from "../engine/session";
import { topicGroups } from "../engine/topics";
import { MapCanvas } from "./MapCanvas";

export function Brand() {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span><span className="font-black tracking-[-0.01em]">MAP Decision</span></div>;
}

export function Landing({ hasDraft, onStart, onResume }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbf7ef] px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white bg-white/85 px-4 py-3 shadow-md shadow-slate-200/70">
        <Brand />
        {hasDraft ? <button className="min-h-10 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={onResume}>이어하기</button> : null}
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(26rem,1.08fr)] lg:gap-14 lg:py-20">
        <div className="min-w-0 max-w-2xl">
          <p className="inline-flex max-w-full rounded-full bg-white px-4 py-2 text-xs font-black leading-5 text-blue-700 shadow-sm sm:text-sm">로그인 없이 바로 시작 · 첫 MAP까지 약 5분 · 자동 저장</p>
          <h1 className="mt-5 max-w-2xl whitespace-pre-line break-keep text-[2.25rem] font-black leading-[1.16] tracking-[-0.025em] sm:text-5xl lg:text-[4rem]">머릿속이 조금 복잡한가요?{`\n`}편하게 이야기해 주세요.</h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-base font-semibold leading-8 text-slate-600 sm:text-lg">말하거나 입력하면, 생각의 핵심과 선택지, 걸리는 부분과 다음 행동을 한 장의 MAP으로 정리해드려요.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-950 px-7 py-4 text-base font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:text-lg" onClick={() => onStart()}>🎙 말로 시작하기</button>
            <button className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:text-lg" onClick={() => onStart()}>⌨️ 직접 입력하기</button>
          </div>
          <div className="mt-6 grid gap-2 text-sm font-extrabold text-slate-500 sm:grid-cols-2">
            <span>작성 중 자동 저장</span>
            <span>언제든 이어서 수정 가능</span>
            <span className="sm:col-span-2">가벼운 고민부터 인생의 큰 선택까지.</span>
          </div>
        </div>

        <div className="w-full min-w-0">
          <MapCanvas session={createSession("말하면 생각이 보이는 MAP")} sample compact className="mx-auto w-full max-w-2xl" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/80 py-12 sm:py-16">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-blue-700">시작하기 좋은 이야기</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.015em] sm:text-3xl">지금 떠오르는 고민을 골라도 좋아요.</h2>
          </div>
          <p className="max-w-md text-sm font-bold leading-6 text-slate-500">처음부터 완벽하게 말하지 않아도 괜찮아요. 하나만 골라도 MAP이 시작됩니다.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topicGroups.map(({ group, items }) => {
            const visible = items.slice(0, 3);
            const hidden = items.slice(3);
            return (
              <article key={group} className="rounded-[1.35rem] border border-white bg-white/82 p-4 shadow-md shadow-slate-200/60">
                <h3 className="font-black text-slate-950">{group}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visible.map((item) => <TopicButton key={item} item={item} onStart={onStart} />)}
                </div>
                {hidden.length ? (
                  <details className="mt-2 group">
                    <summary className="cursor-pointer list-none text-sm font-black text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">더 보기</summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hidden.map((item) => <TopicButton key={item} item={item} onStart={onStart} />)}
                    </div>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function TopicButton({ item, onStart }: { item: string; onStart: (topic?: string) => void }) {
  return <button className="rounded-full bg-slate-50 px-3 py-2 text-left text-sm font-bold leading-5 text-slate-700 transition hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => onStart(item)}>{item}</button>;
}

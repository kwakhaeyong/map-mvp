import { createSession } from "../engine/session";
import { topicGroups } from "../engine/topics";
import { MapCanvas } from "./MapCanvas";

export function Brand() {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">M</span><span className="font-black tracking-[-0.02em]">MAP Decision</span></div>;
}

export function Landing({ hasDraft, onStart, onResume }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void }) {
  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 py-4 text-slate-950 sm:px-6">
      <header className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white bg-white/80 px-4 py-3 shadow-lg">
        <Brand />
        {hasDraft ? <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={onResume}>이어하기</button> : null}
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <p className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm">로그인 없이 바로 시작 · 첫 MAP까지 약 5분 · 작성 중 자동 저장 · 언제든 이어서 수정 가능</p>
          <h1 className="mt-6 whitespace-pre-line text-5xl font-black leading-[1.08] tracking-[-0.045em] sm:text-7xl">머릿속이 조금 복잡한가요?{`\n`}편하게 이야기해 주세요.</h1>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-xl font-semibold leading-9 text-slate-600">편하게 말하거나 입력해 주세요.{`\n`}생각의 핵심과 선택지, 걸리는 부분과 다음 행동을
한 장의 MAP으로 정리해드려요.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-full bg-blue-700 px-8 py-4 text-lg font-black text-white shadow-xl shadow-blue-200" onClick={() => onStart()}>🎙 말로 시작하기</button>
            <button className="rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-black" onClick={() => onStart()}>⌨️ 직접 입력하기</button>
          </div>
          <p className="mt-6 font-black text-slate-500">가벼운 고민부터 인생의 큰 선택까지.</p>
        </div>
        <MapCanvas session={createSession("말하면 생각이 보이는 MAP")} sample />
      </section>
      <section className="mx-auto max-w-7xl pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {topicGroups.map(({ group, items }) => (
            <article key={group} className="rounded-[1.5rem] border border-white bg-white/80 p-5 shadow-xl shadow-slate-200/60">
              <h2 className="font-black text-blue-700">{group}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {items.map((item) => <button key={item} className="rounded-full bg-slate-50 px-3 py-2 text-left text-sm font-bold hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100" onClick={() => onStart(item)}>{item}</button>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

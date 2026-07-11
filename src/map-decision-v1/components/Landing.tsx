import { createSession } from "../engine/session";
import { MapCanvas } from "./MapCanvas";

export function Brand() {
  return <div className="flex items-center gap-3" aria-label="MAP Decision"><span className="relative grid size-9 place-items-center rounded-2xl bg-[var(--map-navy)] text-sm font-black text-white shadow-sm"><span className="absolute left-2 top-2 size-1.5 rounded-full bg-[#91d9bf]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#c8b9ff]" /><span>M</span></span><span className="text-base font-extrabold tracking-[-0.02em]">MAP Decision</span></div>;
}

const topics = ["전공을 바꿀까?", "휴학할까?", "먼저 연락할까?", "이직할까?", "아이패드 살까?", "부업을 시작할까?"];

export function Landing({ hasDraft, onStart, onResume }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void }) {
  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-full border border-white/80 bg-white/80 px-4 py-3 shadow-[var(--map-shadow-sm)] backdrop-blur-xl">
        <Brand />
        {hasDraft ? <button className="btn btn-secondary" onClick={onResume}>현재 MAP 보기</button> : null}
      </header>

      <section className="map-container grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,.9fr)_minmax(28rem,1.1fr)] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="kicker">말하면, 생각이 보입니다.</p>
          <h1 className="mt-4 text-balance break-keep text-[2.15rem] font-black leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[4rem]">머릿속이 조금 복잡한가요?<br />편하게 이야기해 주세요.</h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-lg font-medium leading-8 text-[var(--map-muted)]">말하거나 입력하면,{`\n`}생각의 핵심과 선택지, 걸리는 부분과 다음 행동을{`\n`}한 장의 MAP으로 정리해드려요.</p>
          <div className="mt-8 rounded-[30px] border border-white/90 bg-white/75 p-3 shadow-[var(--map-shadow-md)] backdrop-blur">
            <button className="group flex min-h-24 w-full items-center gap-4 rounded-[24px] bg-[var(--map-navy)] px-5 py-4 text-left text-white transition hover:-translate-y-0.5" onClick={() => onStart()}>
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white/14 text-3xl shadow-inner group-hover:scale-105">🎙</span>
              <span><span className="block text-xl font-extrabold">말로 바로 시작하기</span><span className="mt-1 block text-sm font-medium text-white/72">권한을 허용하지 않아도 입력으로 이어갈 수 있어요.</span></span>
            </button>
            <div className="mt-3 flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => onStart()}>직접 입력하기</button>
              {hasDraft ? <button className="btn btn-ghost flex-1" onClick={onResume}>이어서 정리</button> : null}
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm font-bold text-[var(--map-muted)] sm:grid-cols-4">
            {['로그인 없이 바로 시작','자동 저장','언제든 이어서 수정','첫 변화는 30초 안에'].map((item) => <span key={item} className="rounded-full bg-white/65 px-3 py-2 text-center">{item}</span>)}
          </div>
        </div>
        <MapCanvas session={createSession("말하면 생각이 보이는 서비스")} sample compact className="mx-auto w-full" />
      </section>

      <section className="map-container pb-16">
        <div className="mb-5 flex items-end justify-between gap-4"><div><p className="kicker">시작하기 좋은 이야기</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">하나만 골라도 충분해요.</h2></div><p className="hidden max-w-sm text-sm font-medium leading-6 text-[var(--map-muted)] sm:block">처음부터 정리된 말이 아니어도 MAP이 같이 자랍니다.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => <button key={topic} className="map-card min-h-24 p-5 text-left text-lg font-extrabold transition hover:-translate-y-1 hover:border-[var(--map-indigo)]" onClick={() => onStart(topic)}>{topic}<span className="mt-3 block text-sm font-medium text-[var(--map-muted)]">이 이야기로 시작하기 →</span></button>)}
        </div>
      </section>
    </main>
  );
}

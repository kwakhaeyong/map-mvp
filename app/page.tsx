import Link from "next/link";
import { IdealTypeResult } from "./components/IdealTypeResult";

export default function Home() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-20 pt-5 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-100 via-fuchsia-100 to-sky-100 blur-3xl" />
        <nav className="relative z-10 flex items-center justify-between rounded-full border border-white/80 bg-white/70 px-5 py-3 shadow-xl shadow-slate-100 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">M</span>
            <span className="text-lg font-black tracking-[-0.06em]">MAP</span>
          </div>
          <Link className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href="/result">
            내 MAP 만들기
          </Link>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="text-center lg:text-left">
            <p className="mx-auto mb-5 inline-flex rounded-full bg-rose-50 px-4 py-2 text-sm font-black text-rose-500 lg:mx-0">
              3분이면 나를 설명하는 MAP 하나.
            </p>
            <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.08em] sm:text-7xl lg:text-8xl">
              지금 내 생각은 어떤 모습일까?
            </h1>
            <p className="mx-auto mt-7 max-w-xl whitespace-pre-line text-xl font-bold leading-8 tracking-[-0.04em] text-slate-600 sm:text-2xl sm:leading-10 lg:mx-0">
              {"가볍게 이야기하면, 오늘의 나를 한 장의 MAP로 남겨요."}
            </p>
            <Link className="mt-10 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-slate-950 via-fuchsia-600 to-sky-500 px-8 py-4 text-lg font-black text-white shadow-2xl shadow-rose-200 transition hover:-translate-y-1 sm:w-auto" href="/result">
              내 MAP 만들기
            </Link>
          </div>
          <div className="mx-auto w-full max-w-[28rem] rotate-[-2deg]">
            <IdealTypeResult compact />
          </div>
        </div>
      </section>
    </main>
  );
}

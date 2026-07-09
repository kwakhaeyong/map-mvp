import Link from "next/link";
import { IdealTypeResult } from "../components/IdealTypeResult";

export default function ResultPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <section className="relative mx-auto min-h-screen w-full max-w-[31rem] px-5 pb-10 pt-5 sm:max-w-[34rem]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 rounded-b-[4rem] bg-gradient-to-br from-rose-100 via-white to-sky-100" />
        <nav className="relative z-10 mb-8 flex items-center justify-between rounded-full border border-white/80 bg-white/70 px-4 py-3 shadow-xl shadow-rose-100/50 backdrop-blur-2xl">
          <Link className="flex items-center gap-2" href="/">
            <span className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">M</span>
            <span className="text-sm font-black tracking-[0.18em] text-slate-500">MAP RESULT</span>
          </Link>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-500">save & send</span>
        </nav>
        <div className="relative z-10">
          <IdealTypeResult />
        </div>
      </section>
    </main>
  );
}

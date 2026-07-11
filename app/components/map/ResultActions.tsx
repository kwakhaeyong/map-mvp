"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearMapProgress } from "../../lib/mapProgressStorage";

export function ResultActions() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  function showPlaceholderToast() {
    setToast("곧 제공될 기능입니다.");
    window.setTimeout(() => setToast(""), 1800);
  }

  function createNewMap() {
    const confirmed = window.confirm("현재 MAP 내용이 삭제됩니다.\n\n새 MAP를 만드시겠습니까?");
    if (!confirmed) return;

    clearMapProgress();
    router.push("/");
  }

  return (
    <section className="relative rounded-[2rem] border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-100 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => router.push("/questions")}
          className="rounded-full bg-slate-950 px-5 py-4 text-base font-black text-white shadow-xl shadow-slate-200 transition hover:-translate-y-0.5"
        >
          다시 수정하기
        </button>
        <button
          type="button"
          onClick={createNewMap}
          className="rounded-full border border-slate-200 px-5 py-4 text-base font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
        >
          새 MAP 만들기
        </button>
        <button
          type="button"
          onClick={showPlaceholderToast}
          className="rounded-full border border-slate-200 px-5 py-4 text-base font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
        >
          이미지 저장
        </button>
        <button
          type="button"
          onClick={showPlaceholderToast}
          className="rounded-full border border-slate-200 px-5 py-4 text-base font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
        >
          공유하기
        </button>
      </div>
      {toast ? (
        <p className="absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-xl" role="status">
          {toast}
        </p>
      ) : null}
    </section>
  );
}

"use client";

import { magazineChapters } from "../../../src/data/magazineChapters";

// MAGAZINE PROGRESS PROTOTYPE(2026-08) — dev-only. 아직 디자인을
// 확정하지 않는다 — magazineChapters를 그대로 나열해 완료/미완료
// 상태만 기능적으로 보여준다. HOME/ME/TASTE 화면에는 삽입하지 않고
// 이 별도 dev 경로에서만 확인한다.
const STATUS_LABEL: Record<string, string> = {
  complete: "COMPLETE",
  "in-progress": "IN PROGRESS",
  empty: "EMPTY",
};

export function ProgressClient() {
  return (
    <div className="min-h-dvh bg-background px-5 py-10 text-text-primary">
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-text-muted">MY ISSUE 2026</p>
        <ol className="mt-6 flex flex-col">
          {magazineChapters.map((chapter) => (
            <li key={chapter.id} className="flex items-center gap-3 border-b border-border py-3">
              <span className="font-serif text-xs font-bold text-text-muted">{chapter.number}</span>
              <span className="flex-1 text-sm font-black uppercase tracking-[0.02em]">{chapter.title}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{STATUS_LABEL[chapter.status]}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

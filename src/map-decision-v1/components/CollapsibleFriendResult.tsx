"use client";

import { useState, type ReactNode } from "react";

// /r/{id} 받는 사람 화면 전용. 기존 6블록(children)은 서버가 이미 전부
// 렌더해서 내려보낸 것 — 여기서는 보이기/숨기기만 클라이언트에서
// 토글한다(추가 요청 없음). 기본은 접힌 상태로 시작해서 "받는 사람이
// 알고 싶은 두 가지(쟤 뭐 나왔어/나는?)" 사이에 6블록이 끼어들지
// 않게 한다.
export function CollapsibleFriendResult({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 text-sm font-extrabold text-text-primary shadow-subtle transition-colors hover:border-border-strong"
      >
        <span>{expanded ? "접기" : "친구 결과 전체 보기"}</span>
        <span aria-hidden="true">{expanded ? "▲" : "▾"}</span>
      </button>
      <div className={expanded ? "flex flex-col gap-3" : "hidden"}>{children}</div>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";

const DEFAULT_INITIAL_VISIBLE = 2;

// TopicQuiz.tsx의 더보기 버튼과 같은 방식(조건부 렌더링)을 따른다 —
// CollapsibleFriendResult.tsx처럼 hidden 클래스로 숨기는 대신, 접힌
// 항목은 아예 렌더링하지 않는다.
export function CollapsibleItems({
  items,
  initialVisible = DEFAULT_INITIAL_VISIBLE,
}: {
  items: ReactNode[];
  initialVisible?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = items.length > initialVisible;
  const visibleItems = isExpanded ? items : items.slice(0, initialVisible);

  return (
    <div className="flex flex-col gap-2">
      {visibleItems}
      {hasMore ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="w-full rounded-large border border-border bg-surface px-3 py-2 text-xs font-black text-text-muted hover:border-border-strong hover:text-text-primary"
        >
          {isExpanded ? "접기 ▲" : "더보기 ▾"}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";

const PRIMARY_CTA_CLASS =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-pill border border-primary bg-primary px-6 text-base font-extrabold tracking-[-0.01em] text-primary-foreground shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating active:translate-y-0";

// 궁합 화면(/r/{A의 id}/match)에 온 사람(B)은 이미 자기 결과를 만든
// 사람이다 — "나도 MAP 만들어보기"보다 "내 결과도 친구에게 보내기"가
// 다음 바이럴 고리로 더 맞다. B의 공유 링크(myShareId)는 이 화면에
// 오기 전(IdealTypeCard.tsx의 CompatibilityBanner)에 이미 만들어져
// myId 쿼리로 전달된 값이라, 여기서는 서버 호출 없이 링크만 조립해서
// 공유하면 된다.
export function SendMyResultCta({ myShareId, title, oneLiner }: { myShareId: string; title: string; oneLiner: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = `${window.location.origin}/r/${myShareId}`;
    const text = `내 이상형은 "${title}"\n${oneLiner}\n\n${url}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "내 이상형 카드", text, url });
      } catch {
        // 사용자가 공유 시트를 닫은 경우 등 — 버튼을 다시 누르면 재시도된다.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API를 못 쓰는 환경 — 조용히 무시(버튼 문구만 원래대로 유지).
    }
  };

  return (
    <button type="button" onClick={handleClick} className={PRIMARY_CTA_CLASS}>
      {copied ? "복사됐어요!" : "내 결과 친구에게 보내기"}
    </button>
  );
}

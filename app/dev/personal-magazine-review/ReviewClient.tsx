"use client";

import { HomepageHero, MeStory, TasteCollage } from "../personal-magazine-editorial-system/EditorialSystemClient";

// PERSONAL MAGAZINE — ART DIRECTION REVIEW(2026-08) — dev-only.
// 이 페이지는 새 기능이 아니라 "지금까지 만든 HOME → ME → TASTE를
// 한 화면에서 이어 보기 위한" 리뷰 도구다. 세 섹션 모두
// personal-magazine-editorial-system에 이미 있는 컴포넌트를 그대로
// import해서 쓴다 — 여기서 새로 만들거나 값을 바꾸지 않는다. crop,
// 타이포, gradient, badge, CTA 어느 것도 추가하지 않는다.
const NAV_ITEMS = [
  { href: "#review-cover", label: "COVER" },
  { href: "#review-me", label: "ME" },
  { href: "#feature-taste", label: "TASTE" },
];

export function ReviewClient() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 flex items-center justify-center gap-4 border-b border-dashed border-border-strong bg-background px-3 py-2 text-[11px] font-bold text-text-muted backdrop-blur">
        <span>ART DIRECTION REVIEW</span>
        <span aria-hidden="true">·</span>
        <nav className="flex items-center gap-3">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="uppercase tracking-[0.06em] text-text-primary underline underline-offset-2">
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-md">
        <div id="review-cover">
          <HomepageHero />
        </div>
        <div id="review-me">
          <MeStory />
        </div>
        <TasteCollage />
      </div>
    </div>
  );
}

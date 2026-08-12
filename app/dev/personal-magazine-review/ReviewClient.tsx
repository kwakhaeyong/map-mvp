"use client";

import { HomepageHero, MeStory, TasteCollage } from "../personal-magazine-editorial-system/EditorialSystemClient";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";

// PERSONAL MAGAZINE — ART DIRECTION REVIEW(2026-08) — dev-only.
// 이 페이지는 새 기능이 아니라 "지금까지 만든 HOME → ME → TASTE →
// TRAVEL을 한 화면에서 이어 보기 위한" 리뷰 도구다. HOME/ME/TASTE는
// personal-magazine-editorial-system에 이미 있는 컴포넌트를 그대로
// import해서 쓴다 — 여기서 새로 만들거나 값을 바꾸지 않는다. crop,
// 타이포, gradient, badge, CTA 어느 것도 추가하지 않는다.
const NAV_ITEMS = [
  { href: "#review-cover", label: "COVER" },
  { href: "#review-me", label: "ME" },
  { href: "#feature-taste", label: "TASTE" },
  { href: "#review-travel", label: "TRAVEL" },
];

// TRAVEL HERO INTEGRATION(2026-08) — TRAVEL은 Hero 한 장만 검증한다.
// 이미지 자체가 이미 CHAPTER 03/TRAVEL 타이틀과 CITY/NATURE/PEOPLE/
// MOMENT 미리보기까지 포함한 완성된 chapter opening이라, 그 위에
// 제목/설명/배지/CTA를 다시 얹지 않는다. TASTE의 HERO→PLACE→OBJECT→
// DETAIL처럼 점점 좁아지는 프레임 문법을 그대로 복사하지 않고, TASTE
// DETAIL과 TRAVEL HERO 사이에 충분한 여백만 둬 "새로운 세계가 열리는
// 챕터 전환"을 만든다. HERO는 컨테이너 폭 전체를 그대로 쓴다(추가
// inset 없음) — TASTE보다 열려 있고 확장적인 느낌을 위해서다.
function TravelHero() {
  const asset = magazineVisualAssets.travel.hero;
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <section id="review-travel" className="pb-14 pt-20">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
        <img src={asset.src} alt={asset.alt} className="size-full object-contain" style={{ objectPosition: asset.objectPositionMobile }} />
      </div>
    </section>
  );
}

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
        <TravelHero />
      </div>
    </div>
  );
}

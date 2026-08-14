"use client";

import { useEffect } from "react";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { TRAVEL_V1_AXIS_KEYS, TRAVEL_V1_AXIS_LABELS } from "../../../src/data/travelQuestionnaireV1";
import type { TravelMagazineNarrativeV1 } from "../../../src/data/travelNarrativeV1";
import type { CrossIssueCandidate } from "../../../src/data/travelCrossIssueV1";

// TRAVEL v1 RESULT(ISSUE 02, 2026-08, PR #261 Round I) — TasteMagazineResultV3.tsx와
// 같은 편집 문법(SectionMarker/FeatureSection/InterestingPartSection/
// EndingSection)을 그대로 재사용해 TASTE Result와 한 매거진처럼
// 보이게 한다. §14 — TASTE×TRAVEL 섹션은 primary candidate가 없으면
// (TASTE 미완료 포함) 완전히 숨긴다 — "먼저 TASTE를 해보세요" 같은
// 광고성 빈 상태를 두지 않는다.
//
// §19 — hero는 실제 TRAVEL 이미지지만 CHAPTER 03이 박혀 있어(§Round I
// §0 감사 결과) 프로덕션에는 쓸 수 없다 — dev 화면에서는 그대로
// 노출하고, 완료 보고에 프로덕션 블로커로 명시한다.

function SectionMarker({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
      {index} · {label}
    </p>
  );
}

function ImageFrame({ asset, className }: { asset: MagazineVisualAsset; className?: string }) {
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <div className={className ?? "relative w-full overflow-hidden"} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={asset.src} alt={asset.alt} className="size-full object-cover" style={{ objectPosition: asset.objectPositionMobile }} />
    </div>
  );
}

function OpeningSection({ narrative }: { narrative: TravelMagazineNarrativeV1 }) {
  return (
    <section className="pb-4">
      <div className="px-5 pt-6">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>
        <p className="mt-0.5 font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">ISSUE 02 · TRAVEL</p>
      </div>
      <div className="mt-4">
        <ImageFrame asset={magazineVisualAssets.travel.hero} />
      </div>
      <div className="px-5 pt-8">
        <h1 className="whitespace-pre-line text-[1.9rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">{narrative.opening.headline}</h1>
        <p className="mt-4 max-w-[30rem] text-sm font-semibold leading-6 text-text-secondary">{narrative.opening.summary}</p>
        {narrative.keywords.length > 0 && (
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{narrative.keywords.join(" · ")}</p>
        )}
      </div>
    </section>
  );
}

function FeatureSection({ index, label, headline, body }: { index: string; label: string; headline: string; body: string }) {
  return (
    <section className="px-5 py-14">
      <SectionMarker index={index} label={label} />
      <h2 className="mt-4 whitespace-pre-line text-2xl font-black leading-[1.2] tracking-[-0.015em] text-text-primary">{headline}</h2>
      <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
    </section>
  );
}

function InterestingPartSection({ headline, body }: { headline: string; body: string }) {
  return (
    <section className="border-y border-border-strong bg-tag-fill px-5 py-16">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-primary">THE INTERESTING PART</p>
      <h2 className="mt-4 whitespace-pre-line text-[1.75rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">{headline}</h2>
      <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
    </section>
  );
}

// §14/§16 — candidate가 null이면 이 섹션 자체를 렌더링하지 않는다
// (호출부에서 조건부 렌더). 있을 때만 primary(+secondary) 카드를
// 보여준다 — confidence/type 같은 내부 라벨은 노출하지 않는다.
function CrossIssueSection({ primary, secondary }: { primary: CrossIssueCandidate; secondary: CrossIssueCandidate | null }) {
  return (
    <section id="cross-issue" className="scroll-mt-10 border-y border-border-strong px-5 py-16">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">TASTE × TRAVEL</p>
      <h2 className="mt-4 whitespace-pre-line text-[1.6rem] font-black leading-[1.2] tracking-[-0.015em] text-text-primary">{primary.editorialHeadline}</h2>
      <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{primary.editorialBody}</p>

      {secondary && (
        <div className="mt-10 border-t border-dashed border-border-strong pt-8">
          <h3 className="whitespace-pre-line text-lg font-black leading-[1.25] tracking-[-0.01em] text-text-primary">{secondary.editorialHeadline}</h3>
          <p className="mt-3 max-w-[26rem] text-sm font-semibold leading-6 text-text-secondary">{secondary.editorialBody}</p>
        </div>
      )}
    </section>
  );
}

function EndingSection({ body, pullQuote }: { body: string; pullQuote: string }) {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center">
      <p className="mx-auto max-w-[28rem] text-left text-sm font-semibold leading-6 text-text-secondary">{body}</p>
      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR TRAVEL IN ONE LINE</p>
      <p className="mt-6 max-w-[24rem] whitespace-pre-line font-serif text-[1.6rem] font-medium italic leading-[1.25] text-text-primary">{pullQuote}</p>
      <p className="mt-14 font-serif text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">MY ISSUE · TRAVEL</p>
    </section>
  );
}

function DebugPanel({ narrative, crossIssue }: { narrative: TravelMagazineNarrativeV1; crossIssue: { primary: CrossIssueCandidate | null; secondary: CrossIssueCandidate | null } }) {
  return (
    <details className="mx-5 mb-16 mt-10 border border-dashed border-border-strong p-4">
      <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEBUG · TRAVEL v1 (dev only, 기본 접힘)</summary>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">axes</p>
          <div className="mt-1 flex flex-col gap-0.5">
            {TRAVEL_V1_AXIS_KEYS.map((key) => (
              <p key={key} className="text-[11px] font-bold text-text-muted">
                {TRAVEL_V1_AXIS_LABELS[key]}: {narrative.debug.axes[key]}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">cross-issue candidate</p>
          <p className="text-[11px] font-bold text-text-muted">
            primary: {crossIssue.primary ? `${crossIssue.primary.pairId} / ${crossIssue.primary.type} / ${crossIssue.primary.confidence}` : "(없음)"}
          </p>
          <p className="text-[11px] font-bold text-text-muted">
            secondary: {crossIssue.secondary ? `${crossIssue.secondary.pairId} / ${crossIssue.secondary.type} / ${crossIssue.secondary.confidence}` : "(없음)"}
          </p>
        </div>
      </div>
    </details>
  );
}

export function TravelMagazineResultV1({
  narrative,
  crossIssue,
  scrollTarget,
  hideDebugPanel = false,
}: {
  narrative: TravelMagazineNarrativeV1;
  crossIssue: { primary: CrossIssueCandidate | null; secondary: CrossIssueCandidate | null };
  scrollTarget?: "cross-issue" | null;
  hideDebugPanel?: boolean;
}) {
  // MY MAGAZINE의 NEW CONNECTION "OPEN CONNECTION" CTA(§17)가 이
  // 화면으로 들어올 때 scrollTarget="cross-issue"를 React state로
  // 내려받는다 — mount 후 그 섹션으로 스크롤한다(primary가 없어 섹션
  // 자체가 없으면 target 엘리먼트가 null이라 아무 일도 하지 않는다).
  //
  // ROUND J SCROLL FIX(1) — 원래는 window.location.hash="cross-issue"를
  // 남기고 이 컴포넌트가 그 해시를 읽는 방식이었는데, 그사이에
  // PersonalMagazineBetaClient.tsx의 updateViewQueryParam()이
  // history.replaceState를 pathname+search로만 다시 만들면서 hash를
  // 그대로 지워버리는 게 진짜 원인이었다(재현 확인, OPEN CONNECTION을
  // 눌러도 스크롤이 아예 시작되지 않았다) — URL을 거치지 않고 React
  // state(scrollTarget prop)로 직접 넘기도록 바꿨다.
  //
  // ROUND J SCROLL FIX(2) — 좌표를 mount 시점에 한 번만 계산해
  // scrollIntoView를 단발로 호출하는 대신, 문서 높이가 바뀔 때마다
  // (ResizeObserver) 짧은 시간 동안 반복해서 다시 scrollIntoView를
  // 호출해 "최종적으로 안정된 위치"에 자연스럽게 도달하게 한다(hero
  // 이미지처럼 늦게 로드되는 자산에 대비).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (scrollTarget !== "cross-issue") return;

    const scrollToTarget = () => {
      document.getElementById("cross-issue")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToTarget();

    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const rescheduleSettle = () => {
      if (settleTimer) clearTimeout(settleTimer);
      // 마지막 레이아웃 변화 이후 250ms 동안 조용하면(이미지 로딩이
      // 끝났다고 보고) 최종 위치로 한 번 더 스크롤한다.
      settleTimer = setTimeout(scrollToTarget, 250);
    };

    const observer = new ResizeObserver(() => rescheduleSettle());
    observer.observe(document.body);

    // 관찰을 무한히 열어두지 않는다 — 2.5초 뒤에는 정리한다(그 이후
    // 발생하는 레이아웃 변화는 이미지 로딩이 아니라 사용자 스크롤일
    // 가능성이 높다).
    const stopTimer = setTimeout(() => {
      observer.disconnect();
      if (settleTimer) clearTimeout(settleTimer);
    }, 2500);

    return () => {
      observer.disconnect();
      if (settleTimer) clearTimeout(settleTimer);
      clearTimeout(stopTimer);
    };
  }, [scrollTarget]);

  return (
    <div className="mx-auto max-w-lg">
      <OpeningSection narrative={narrative} />

      <FeatureSection index="01" label="THE WAY YOU LEAVE" headline={narrative.theWayYouLeave.headline} body={narrative.theWayYouLeave.body} />
      <FeatureSection index="02" label="THE WAY YOU MOVE" headline={narrative.theWayYouMove.headline} body={narrative.theWayYouMove.body} />
      <FeatureSection index="03" label="THE WAY YOU CONNECT" headline={narrative.theWayYouConnect.headline} body={narrative.theWayYouConnect.body} />

      <InterestingPartSection headline={narrative.interestingPart.headline} body={narrative.interestingPart.body} />

      {crossIssue.primary && <CrossIssueSection primary={crossIssue.primary} secondary={crossIssue.secondary} />}

      <EndingSection body={narrative.ending.body} pullQuote={narrative.pullQuote} />

      {!hideDebugPanel && <DebugPanel narrative={narrative} crossIssue={crossIssue} />}
    </div>
  );
}

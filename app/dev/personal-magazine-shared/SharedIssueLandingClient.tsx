"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";

// VIRAL LOOP PROTOTYPE(2026-08) — Share Recipient Landing.
//
// 역할(§3-2, 명확히 한정): 친구 Result 전체 공개 페이지도, 분석 상세
// 페이지도, 서비스 설명 페이지도, HOME 복사본도 아니다. 친구가 발행한
// Issue의 표지를 보여주고, 보는 사람이 자기 Issue를 만들고 싶어지게
// 만드는 초대장 한 장이다.
//
// Privacy principle(§4-2) — 공유자는 Cover만 공유했다. 이 화면은
// headline 한 줄과 발행 시점만 보여준다. 전체 분석/answer/raw
// score/axes/Evidence/Relationship/Tension은 이 화면 어디에도 없다
// (애초에 이 컴포넌트는 그 데이터를 받지도 않는다 — URL query param
// 2개(headline/published)가 전부다).
//
// display name(§3-2 audit 결과) — tasteIssueStorage.ts/로그인 구조를
// 감사한 결과 이 서비스에는 사용자 표시 이름 데이터가 전혀 없다(로그인
// 없음, SavedTasteIssue에 name 필드 없음). 없는 데이터를 fake로
// 만들지 않고, 이름 없는 버전의 문구만 쓴다.
function formatPublished(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `PUBLISHED · ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}`;
}

function HeroFrame({ asset, className }: { asset: MagazineVisualAsset; className?: string }) {
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <div className={className} style={{ position: "relative", width: "100%", overflow: "hidden", aspectRatio: `${w} / ${h}` }}>
      <img src={asset.src} alt={asset.alt} className="size-full object-cover" style={{ objectPosition: asset.objectPositionMobile }} />
    </div>
  );
}

function SharedIssueLandingBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const headline = searchParams.get("headline");
  const publishedLabel = formatPublished(searchParams.get("published"));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-14 text-center">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">SHARED ISSUE</p>

      <div className="relative mx-auto mt-7 w-full max-w-[18rem] overflow-hidden border border-border-strong">
        <HeroFrame asset={magazineVisualAssets.taste.hero} />
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">ISSUE 01 · TASTE</p>
        {headline && (
          <h1 className="mt-1 whitespace-pre-line text-[1.5rem] font-black leading-[1.2] tracking-[-0.02em] text-text-primary">
            {headline}
          </h1>
        )}
        {publishedLabel && <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{publishedLabel}</p>}
      </div>

      <p className="mx-auto mt-5 max-w-[22rem] text-sm font-bold leading-6 text-text-secondary">
        누군가 자신의 첫 번째 Personal Magazine Issue를 공유했습니다.
      </p>

      <div className="mt-12 border-t border-dashed border-border-strong pt-10">
        <h2 className="whitespace-pre-line text-[1.75rem] font-black leading-[1.2] tracking-[-0.02em] text-text-primary">
          {"당신의 Issue는\n어떤 모습일까요?"}
        </h2>
        <p className="mx-auto mt-4 max-w-[22rem] whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
          {"같은 15개의 장면을 지나도\n누구도 같은 Issue가 되지는 않습니다."}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dev/personal-magazine-beta?view=intro")}
            className="inline-flex h-12 w-full max-w-xs items-center justify-center bg-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-background"
          >
나도 발행하기
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">약 3분 · 15개의 선택 · ISSUE 01</p>
        </div>
      </div>
    </div>
  );
}

export function SharedIssueLandingClient() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <Suspense fallback={null}>
        <SharedIssueLandingBody />
      </Suspense>
    </div>
  );
}

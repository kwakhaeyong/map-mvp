import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { TASTE_SIGNAL_KEYS, TASTE_SIGNAL_LABELS, type PageSectionKey, type TasteAnalysisResult } from "../../../src/data/tasteAnalysis";
import { type TasteMagazineNarrative } from "../../../src/data/tasteNarrative";

// TASTE MAGAZINE RESULT — 실제 TASTE 이미지 4장(taste-hero/place/object/
// detail.png)과 TasteMagazineNarrative를 하나의 Magazine 지면으로
// 편집하는 재사용 컴포넌트. /dev/personal-magazine-taste-result(mock
// profile 미리보기)와 /dev/personal-magazine-taste-journey(실제 답변
// 기반 결과)가 동일하게 이 컴포넌트를 쓴다 — Result 화면의 레이아웃/
// 타이포그래피는 한 곳에서만 관리된다.
//
// signals/confidence/evidence/pagePriority 같은 debug 데이터는 화면
// 맨 아래 기본적으로 접혀 있는 <details> 안에만 둔다. 사용자에게
// 보이는 본문에는 headline/summary/feature body/interestingPart/
// pullQuote/keywords만 나온다.

const TASTE_CHAPTER = { number: "02", title: "TASTE" }; // QuizClient.tsx TASTE_CHAPTER와 동일 값

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================
// 이미지 프레임 — EditorialSystemClient.tsx의 TasteCollage()와 동일한
// 규칙(object-contain + inline aspectRatio + objectPositionMobile).
// 이미지 내부에 이미 타이포그래피가 있어 자르지 않는다(object-contain).
// ============================================================
function ImageFrame({ asset, className }: { asset: MagazineVisualAsset; className?: string }) {
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <div className={cx("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={asset.src} alt={asset.alt} className="size-full object-contain" style={{ objectPosition: asset.objectPositionMobile }} />
    </div>
  );
}

function weightFor(pagePriority: TasteAnalysisResult["pagePriority"], section: PageSectionKey): number {
  return pagePriority.find((p) => p.section === section)?.weight ?? 0;
}

// ============================================================
// SectionMarker — "PLACE"/"OBJECT"/"DETAIL"/"RITUAL"을 이미지 안
// typography와 경쟁하지 않는 아주 작은 metadata로만 쓴다. 실제 제목
// 역할은 Narrative headline이 한다.
// ============================================================
function SectionMarker({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
      {index} · {label}
    </p>
  );
}

// ============================================================
// TASTE OPENING — hero 이미지가 먼저 주인공, 그다음 별도 블록으로
// headline/summary/keywords.
// ============================================================
function OpeningSection({ narrative }: { narrative: TasteMagazineNarrative }) {
  return (
    <section className="pb-4">
      <div className="px-5 pt-6">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
          CHAPTER {TASTE_CHAPTER.number} · {TASTE_CHAPTER.title}
        </p>
      </div>
      <div className="mt-4">
        <ImageFrame asset={magazineVisualAssets.taste.hero} />
      </div>
      <div className="px-5 pt-8">
        <h1 className="whitespace-pre-line text-[1.9rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">{narrative.opening.headline}</h1>
        <p className="mt-4 max-w-[30rem] text-sm font-semibold leading-6 text-text-secondary">{narrative.opening.summary}</p>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">{narrative.keywords.join(" · ")}</p>
      </div>
    </section>
  );
}

// ============================================================
// PLACE / OBJECT / DETAIL — 이미지+텍스트 편집 비중이 각기 다르다.
// pagePriority 가중치는 순서를 바꾸지 않고 headline 크기/본문 폭에만
// 제한적으로 반영한다.
// ============================================================
type FeatureVariant = "dominant" | "balanced" | "quiet";

function FeatureSection({
  index,
  label,
  asset,
  headline,
  body,
  weight,
  variant,
  imagePaddingClass,
}: {
  index: string;
  label: string;
  asset: MagazineVisualAsset;
  headline: string;
  body: string;
  weight: number;
  variant: FeatureVariant;
  imagePaddingClass: string;
}) {
  const headlineScale =
    variant === "quiet"
      ? "text-lg" // DETAIL은 신호가 강해도 다시 표지처럼 커지지 않는다
      : weight >= 28
        ? "text-2xl"
        : weight >= 14
          ? "text-xl"
          : "text-lg";
  const bodyWidth = variant === "quiet" ? "max-w-[19rem]" : weight >= 20 ? "max-w-[30rem]" : "max-w-[26rem]";

  return (
    <section className={cx("pt-14", variant === "quiet" && "pt-16")}>
      <div className={imagePaddingClass}>
        <ImageFrame asset={asset} />
      </div>
      <div className="px-5 pt-6 lg:mx-auto lg:max-w-3xl lg:px-0">
        <SectionMarker index={index} label={label} />
        <h2 className={cx("mt-2 whitespace-pre-line font-black leading-tight tracking-[-0.015em] text-text-primary", headlineScale)}>{headline}</h2>
        <p className={cx("mt-3 text-sm font-semibold leading-6 text-text-secondary", bodyWidth)}>{body}</p>
      </div>
    </section>
  );
}

// ============================================================
// RITUAL — 사진이 없다(새 이미지 생성 금지). 텍스트 중심 editorial
// page로 앞뒤 사진 페이지 사이에 호흡을 만든다.
// ============================================================
function RitualSection({ headline, body, weight }: { headline: string; body: string; weight: number }) {
  const headlineScale = weight >= 28 ? "text-[1.9rem]" : weight >= 14 ? "text-2xl" : "text-xl";
  return (
    <section className="px-5 py-20">
      <SectionMarker index="04" label="RITUAL" />
      <h2 className={cx("mt-4 whitespace-pre-line font-black leading-[1.15] tracking-[-0.02em] text-text-primary", headlineScale)}>{headline}</h2>
      <p className="mt-6 max-w-[26rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
      <div className="mt-10 h-px w-10 bg-border-strong" />
      <p className="mt-3 font-serif text-[10px] italic text-text-muted">— 05 —</p>
    </section>
  );
}

// ============================================================
// THE INTERESTING PART — 존재할 때만 렌더링. contradiction profile
// 에서는 이 영역이 전체 결과의 핵심이 되어야 한다(사진보다 강해도
// 된다).
// ============================================================
function InterestingPartSection({ headline, body }: { headline: string; body: string }) {
  return (
    <section className="border-y border-border-strong bg-tag-fill px-5 py-16">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-primary">THE INTERESTING PART</p>
      <h2 className="mt-4 whitespace-pre-line text-[1.75rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">{headline}</h2>
      <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
    </section>
  );
}

// ============================================================
// ENDING — 강한 이미지 대신 pullQuote로 조용히 끝낸다.
// ============================================================
function EndingSection({ pullQuote }: { pullQuote: string }) {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR TASTE IN ONE LINE</p>
      <p className="mt-6 max-w-[24rem] whitespace-pre-line font-serif text-[1.6rem] font-medium italic leading-[1.25] text-text-primary">{pullQuote}</p>
      <p className="mt-14 font-serif text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">MY ISSUE · TASTE</p>
    </section>
  );
}

// ============================================================
// DEBUG PANEL — 기본 접힘. signal/confidence/evidence/pagePriority.
// ============================================================
function DebugPanel({ result, narrative }: { result: TasteAnalysisResult; narrative: TasteMagazineNarrative }) {
  return (
    <details className="mx-5 mb-16 mt-10 border border-dashed border-border-strong p-4">
      <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEBUG · SIGNAL DATA (dev only, 기본 접힘)</summary>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">signals / confidence</p>
          <div className="mt-1 flex flex-col gap-0.5">
            {TASTE_SIGNAL_KEYS.map((key) => (
              <p key={key} className="text-[11px] font-bold text-text-muted">
                {TASTE_SIGNAL_LABELS[key]}: {result.signals[key]} · confidence {result.confidence[key]}%
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">pagePriority</p>
          <p className="text-[11px] font-bold text-text-muted">{result.pagePriority.map((p) => `${p.section}:${p.weight}%`).join(" · ")}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">contradictions</p>
          <p className="text-[11px] font-bold text-text-muted">
            {result.contradictions.length === 0 ? "(없음)" : result.contradictions.map((c) => c.title).join(" · ")}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">evidence.headline</p>
          <p className="text-[11px] font-bold text-text-muted">{narrative.evidence.headline.join(" · ")}</p>
        </div>
      </div>
    </details>
  );
}

// ============================================================
// ROOT
// ============================================================
export function TasteMagazineResult({
  narrative,
  result,
  hideDebugPanel = false,
}: {
  narrative: TasteMagazineNarrative;
  result: TasteAnalysisResult;
  // Private Beta 전용(2026-08) — 기본값 false라 기존 두 dev route
  // (personal-magazine-taste-result / personal-magazine-taste-journey)는
  // 이 prop을 넘기지 않으므로 debug accordion이 그대로 노출된다.
  // personal-magazine-beta만 true를 넘겨 사용자에게 debug 정보가
  // 보이지 않게 한다 — 공용 Result 레이아웃/카피는 전혀 바뀌지 않는다.
  hideDebugPanel?: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <OpeningSection narrative={narrative} />

      <FeatureSection
        index="01"
        label="PLACE"
        asset={magazineVisualAssets.taste.place}
        headline={narrative.features.place.headline}
        body={narrative.features.place.body}
        weight={weightFor(result.pagePriority, "place")}
        variant="dominant"
        imagePaddingClass="px-4"
      />

      <FeatureSection
        index="02"
        label="OBJECT"
        asset={magazineVisualAssets.taste.object}
        headline={narrative.features.object.headline}
        body={narrative.features.object.body}
        weight={weightFor(result.pagePriority, "object")}
        variant="balanced"
        imagePaddingClass="px-8"
      />

      <FeatureSection
        index="03"
        label="DETAIL"
        asset={magazineVisualAssets.taste.detail}
        headline={narrative.features.detail.headline}
        body={narrative.features.detail.body}
        weight={weightFor(result.pagePriority, "detail")}
        variant="quiet"
        imagePaddingClass="px-14"
      />

      <RitualSection headline={narrative.features.ritual.headline} body={narrative.features.ritual.body} weight={weightFor(result.pagePriority, "ritual")} />

      {narrative.interestingPart && (
        <InterestingPartSection headline={narrative.interestingPart.headline} body={narrative.interestingPart.body} />
      )}

      <EndingSection pullQuote={narrative.pullQuote} />

      {!hideDebugPanel && <DebugPanel result={result} narrative={narrative} />}
    </div>
  );
}

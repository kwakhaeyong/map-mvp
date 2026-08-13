import { magazineVisualAssets, type MagazineVisualAsset } from "../../../src/data/magazineVisualAssets";
import { TASTE_V3_AXIS_KEYS, TASTE_V3_AXIS_LABELS } from "../../../src/data/tasteQuestionnaireV3";
import { type TasteMagazineNarrativeV3 } from "../../../src/data/tasteNarrativeV3";

// TASTE v3 RESULT — RESULT EDITORIAL COMPRESSION(PR #261 후속) §6
// 5-section 구조. 이전 4-feature(SPACE/SENSORY/RHYTHM&RELATION/
// EXPLORATION&EXPRESSION, 축에 고정) 구조를 CORE TASTE/HOW IT SHOWS
// UP(축 순위에 따라 동적으로 배정) 2개로 압축했다. 어떤 축이 이
// 사용자의 "취향의 중심"이 되는지 SectionMarker에 그대로 노출해
// (§9) 결과 구조 자체가 사용자마다 달라진다는 것이 화면에서도
// 보이게 했다. 기존 3장의 실사 이미지(hero/place/object)를 재사용
// 하고, 신규 이미지는 만들지 않았다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ImageFrame({ asset, className }: { asset: MagazineVisualAsset; className?: string }) {
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <div className={cx("relative w-full overflow-hidden", className)} style={{ aspectRatio: `${w} / ${h}` }}>
      <img src={asset.src} alt={asset.alt} className="size-full object-contain" style={{ objectPosition: asset.objectPositionMobile }} />
    </div>
  );
}

function SectionMarker({ index, label }: { index: string; label: string }) {
  return (
    <p className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
      {index} · {label}
    </p>
  );
}

function OpeningSection({ narrative }: { narrative: TasteMagazineNarrativeV3 }) {
  return (
    <section className="pb-4">
      <div className="px-5 pt-6">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">CHAPTER 02 · TASTE</p>
      </div>
      <div className="mt-4">
        <ImageFrame asset={magazineVisualAssets.taste.hero} />
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

type FeatureVariant = "dominant" | "balanced" | "quiet" | "text-only";

function FeatureSection({
  index,
  label,
  asset,
  headline,
  body,
  variant,
  imagePaddingClass,
}: {
  index: string;
  label: string;
  asset?: MagazineVisualAsset;
  headline: string;
  body: string;
  variant: FeatureVariant;
  imagePaddingClass?: string;
}) {
  if (variant === "text-only" || !asset) {
    return (
      <section className="px-5 py-16">
        <SectionMarker index={index} label={label} />
        <h2 className="mt-4 whitespace-pre-line text-2xl font-black leading-[1.2] tracking-[-0.015em] text-text-primary">{headline}</h2>
        <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
      </section>
    );
  }
  const headlineScale = variant === "dominant" ? "text-2xl" : variant === "balanced" ? "text-xl" : "text-lg";
  const bodyWidth = variant === "dominant" ? "max-w-[30rem]" : "max-w-[26rem]";
  return (
    <section className="pt-14">
      <div className={imagePaddingClass ?? "px-6"}>
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

function InterestingPartSection({ headline, body }: { headline: string; body: string }) {
  return (
    <section className="border-y border-border-strong bg-tag-fill px-5 py-16">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.14em] text-primary">THE INTERESTING PART</p>
      <h2 className="mt-4 whitespace-pre-line text-[1.75rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">{headline}</h2>
      <p className="mt-5 max-w-[28rem] text-sm font-semibold leading-6 text-text-secondary">{body}</p>
    </section>
  );
}

function EndingSection({ body, pullQuote }: { body: string; pullQuote: string }) {
  return (
    <section className="flex flex-col items-center px-6 py-24 text-center">
      <p className="mx-auto max-w-[28rem] text-left text-sm font-semibold leading-6 text-text-secondary">{body}</p>
      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR TASTE IN ONE LINE</p>
      <p className="mt-6 max-w-[24rem] whitespace-pre-line font-serif text-[1.6rem] font-medium italic leading-[1.25] text-text-primary">{pullQuote}</p>
      <p className="mt-14 font-serif text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">MY ISSUE · TASTE</p>
    </section>
  );
}

function DebugPanel({ narrative }: { narrative: TasteMagazineNarrativeV3 }) {
  return (
    <details className="mx-5 mb-16 mt-10 border border-dashed border-border-strong p-4">
      <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">DEBUG · TASTE v3 (dev only, 기본 접힘)</summary>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">axes</p>
          <div className="mt-1 flex flex-col gap-0.5">
            {TASTE_V3_AXIS_KEYS.map((key) => (
              <p key={key} className="text-[11px] font-bold text-text-muted">
                {TASTE_V3_AXIS_LABELS[key]}: {narrative.debug.axes[key]}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">relationship matches</p>
          <p className="text-[11px] font-bold text-text-muted">{narrative.debug.relationshipMatches.join(" · ") || "(없음)"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">tension matches</p>
          <p className="text-[11px] font-bold text-text-muted">{narrative.debug.tensionMatches.join(" · ") || "(없음)"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">opening / interesting-part source</p>
          <p className="text-[11px] font-bold text-text-muted">
            {narrative.debug.openingSource} / {narrative.debug.interestingPartSource}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">char count</p>
          <p className="text-[11px] font-bold text-text-muted">{narrative.charCount}자</p>
        </div>
      </div>
    </details>
  );
}

export function TasteMagazineResultV3({ narrative, hideDebugPanel = false }: { narrative: TasteMagazineNarrativeV3; hideDebugPanel?: boolean }) {
  return (
    <div className="mx-auto max-w-lg">
      <OpeningSection narrative={narrative} />

      <FeatureSection
        index="01"
        label={`CORE TASTE · ${narrative.coreTaste.axisLabel}`}
        asset={magazineVisualAssets.taste.place}
        headline={narrative.coreTaste.headline}
        body={narrative.coreTaste.body}
        variant="dominant"
        imagePaddingClass="px-4"
      />

      <FeatureSection
        index="02"
        label={`HOW IT SHOWS UP · ${narrative.howItShowsUp.axisLabel}`}
        asset={magazineVisualAssets.taste.object}
        headline={narrative.howItShowsUp.headline}
        body={narrative.howItShowsUp.body}
        variant="balanced"
        imagePaddingClass="px-8"
      />

      <InterestingPartSection headline={narrative.interestingPart.headline} body={narrative.interestingPart.body} />

      <EndingSection body={narrative.ending.body} pullQuote={narrative.pullQuote} />

      {!hideDebugPanel && <DebugPanel narrative={narrative} />}
    </div>
  );
}

"use client";

import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";

// EDITORIAL FRAME SYSTEM — STRUCTURE FIRST PASS(2026-08) — dev-only.
// 이번 라운드는 "예쁜 프로토타입"이 아니라 "나중에 실제 사진/GPT
// 이미지 파일을 끼워넣기만 하면 완성되는 틀"을 만드는 라운드다. 그래서
// 이 파일은 인물·산·음식·도시 같은 그림을 SVG로 그리지 않는다 — 모든
// 이미지 자리는 EditorialImageFrame 하나로만 표현되고, 지금은 중립
// 회색/오프화이트 배경에 "[ PORTRAIT · 2:3 ]" 같은 라벨만 보인다.
// 실제 사진이 오면 EditorialImageFrame 안에서 <img src=".../> 한 줄만
// 추가하면 되도록 자리(비율·자르기 기준점)만 여기서 미리 정한다.
//
// 색도 이전 라운드(취향=흙빛, 미식=강황...)처럼 주제마다 배경색을
// 바꾸지 않는다 — 잡지 전체가 종이(background)+잉크(text-primary) 한
// 벌이고, primary(청록) 하나만 스프레드당 최대 1번 정도 절제해서 쓴다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================
// WIDTH CLASSES — §3 MAGAZINE MASTER GRID
// 12-column 잡지 그리드처럼 "사고"하되 실제 구현은 flex/퍼센트 폭이다.
// 한 스프레드 안에서 이미지 폭을 전부 100%로 두지 않는다.
// ============================================================
const WIDTH_XS = "w-[28%]";
const WIDTH_S = "w-[42%]";
const WIDTH_M = "w-[60%]";
const WIDTH_L = "w-[80%]";
const WIDTH_XL = "w-full";

// ============================================================
// GRAIN — 종이 질감 하나만, 아주 옅게. blob/glassmorphism/그라디언트는
// 이번 라운드에서 전부 금지됐다(§18) — 배경은 종이 표면 하나뿐이다.
// ============================================================
function GrainDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="edsys-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
    </svg>
  );
}
function Grain({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("pointer-events-none absolute inset-0", className ?? "opacity-[0.035]")} style={{ filter: "url(#edsys-grain)" }} />;
}

// ============================================================
// EDITORIAL IMAGE FRAME — §19. 유일한 "이미지" 컴포넌트.
// 지금은 항상 placeholder만 그린다. 나중에 실제 이미지가 오면 이
// 컴포넌트 내부에 <img> 한 줄만 추가하면 된다(주석 참고).
// ============================================================
export function EditorialImageFrame({
  ratio,
  label,
  className,
  labelSize = "default",
}: {
  ratio: string; // "4:5" 같은 형태
  label: string; // "PORTRAIT · 2:3" 같은 표시 텍스트
  className?: string;
  labelSize?: "default" | "small";
}) {
  const [w, h] = ratio.split(":").map(Number);
  return (
    <div
      className={cx("relative flex items-center justify-center overflow-hidden border border-border-strong bg-tag-fill", className)}
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      {/* 실제 이미지 연결 지점: 여기에 <img src="/images/generated/...webp" className="absolute inset-0 size-full object-cover" /> 한 줄만 추가하면 이 자리가 그대로 완성된다. */}
      <span className={cx("px-2 text-center font-serif font-bold uppercase tracking-[0.1em] text-text-muted", labelSize === "small" ? "text-[8px]" : "text-[10px]")}>
        [ {label} ]
      </span>
    </div>
  );
}

// ============================================================
// TYPOGRAPHY PRIMITIVES — §4. 카드용 heading이 아니라 잡지 위계.
// ============================================================
function Masthead({ compact }: { compact?: boolean }) {
  return <span className={cx("font-black tracking-[-0.01em] text-text-primary", compact ? "text-xs" : "text-sm")}>PERSONAL MAGAZINE</span>;
}
function Folio({ text }: { text: string }) {
  return <span className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">{text}</span>;
}
function Kicker({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <p className={cx("font-serif text-[11px] font-bold uppercase tracking-[0.2em]", accent ? "text-primary" : "text-text-muted")}>{children}</p>;
}
function FeatureTitle({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <h2 className={cx("text-[clamp(2.25rem,10vw,4.25rem)] font-black leading-[0.92] tracking-[-0.02em] text-text-primary", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </h2>
  );
}
function Deck({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx("text-base font-bold leading-6 text-text-secondary", className)}>{children}</p>;
}
function CaptionText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx("font-serif text-[11px] italic leading-4 text-text-muted", className)}>{children}</p>;
}
function PullQuote({ children }: { children: React.ReactNode }) {
  return <p className="font-serif text-[1.9rem] font-medium italic leading-[1.15] text-text-primary">{children}</p>;
}

function SignatureMark({ tone = "ink", className }: { tone?: "ink" | "paper"; className?: string }) {
  const stroke = tone === "ink" ? "stroke-text-primary" : "stroke-background";
  const dot = tone === "ink" ? "fill-text-primary" : "fill-background";
  return (
    <svg viewBox="0 0 40 40" className={cx("size-5", className)} aria-hidden="true">
      <path d="M6 26 C10 18, 16 14, 24 12 S 34 8, 36 5" className={cx("fill-none", stroke)} strokeWidth="1.1" strokeDasharray="1 3.2" strokeLinecap="round" opacity={0.75} />
      <circle cx="6" cy="26" r="1.8" className={dot} opacity={0.75} />
    </svg>
  );
}

// ── 페이지 상단 공통 행: masthead + folio. 이것만 7개 화면 공통이고,
// 그 아래 구성은 템플릿마다 완전히 다르다(§2 ONE MAGAZINE / MANY FEATURES). ──
function PageHeader({ folio }: { folio: string }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6">
      <Masthead compact />
      <Folio text={folio} />
    </div>
  );
}

// ============================================================
// MOCK DATA — 문항/생성 로직과 무관한 프레임 검증용 최소 텍스트.
// ============================================================
type Feature = {
  id: string;
  folio: string;
  kicker: string;
  titleLines: string[];
  deck: string;
};

const FEATURES: Record<string, Feature> = {
  me: { id: "me", folio: "ISSUE 001 · p. 01", kicker: "ME · FEATURE 01", titleLines: ["WHO", "I AM."], deck: "이번 호의 주인공은 나예요." },
  taste: { id: "taste", folio: "ISSUE 001 · p. 02", kicker: "TASTE · FEATURE 02", titleLines: ["THINGS", "THAT MAKE", "ME, ME."], deck: "내가 좋아하는 것들의 편집." },
  food: { id: "food", folio: "ISSUE 001 · p. 03", kicker: "FOOD · FEATURE 03", titleLines: ["MY", "TABLE."], deck: "내 취향을 접시에 담는다면." },
  travel: { id: "travel", folio: "ISSUE 001 · p. 04", kicker: "JOURNEY · FEATURE 04", titleLines: ["THE WAY", "I SEE THE", "WORLD."], deck: "내가 세상을 보는 방식." },
  style: { id: "style", folio: "ISSUE 001 · p. 05", kicker: "STYLE · FEATURE 05", titleLines: ["MY STYLE,", "EDITED."], deck: "고르는 것 하나하나가 곧 나." },
  love: { id: "love", folio: "ISSUE 001 · p. 06", kicker: "RELATIONSHIPS · FEATURE 06", titleLines: ["WHO I", "LET CLOSE."], deck: "내가 곁을 내어주는 방식." },
  work: { id: "work", folio: "ISSUE 001 · p. 07", kicker: "NEXT CHAPTER · FEATURE 07", titleLines: ["NEXT", "CHAPTER."], deck: "다음 장면을 준비하는 나." },
};

const SHELF = [
  { code: "01", label: "ME", included: true },
  { code: "02", label: "TASTE", included: true },
  { code: "03", label: "FOOD", included: false },
  { code: "04", label: "JOURNEY", included: false },
  { code: "05", label: "STYLE", included: false },
  { code: "06", label: "RELATIONSHIPS", included: false },
  { code: "07", label: "NEXT CHAPTER", included: false },
];

// ============================================================
// COVER — §5. Homepage와 다른, 잡지 자체의 표지. 이미지 영역이
// 전체의 65~80%를 차지한다 — 검은 사각형 안에 글자를 채우지 않는다.
// hero에서 재사용하기 위해 size prop으로 축소판도 지원한다.
// ============================================================
function Cover({ size = "full" }: { size?: "full" | "hero" }) {
  const compact = size === "hero";
  return (
    <section id="cover" className={cx("relative overflow-hidden border border-border-strong bg-background", compact ? "" : "")}>
      <Grain />
      <div className="relative flex items-center justify-between px-4 pt-4">
        <span className={cx("font-black tracking-[-0.01em] text-text-primary", compact ? "text-xs" : "text-sm")}>PERSONAL MAGAZINE</span>
        <span className="font-serif text-[9px] font-bold uppercase tracking-[0.14em] text-text-muted">ISSUE 001 · 2026</span>
      </div>
      <EditorialImageFrame ratio="4:5" label="PORTRAIT · 4:5" className={cx("relative mt-3", compact ? "mx-4" : "mx-4")} />
      <div className="relative -mt-9 px-4">
        <h1 className={cx("font-black leading-[0.95] tracking-[-0.02em] text-text-primary", compact ? "text-3xl" : "text-[2.75rem]")}>OOO</h1>
      </div>
      <div className="relative mt-2 flex flex-col gap-1 px-4 pb-4">
        <Kicker>Who I Am</Kicker>
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">TASTE · JOURNEY · STYLE · RELATIONSHIPS · NEXT CHAPTER</p>
      </div>
    </section>
  );
}

// ============================================================
// FEATURE TEMPLATES — §6~12. 7개가 서로 완전히 다른 편집 구성이어야
// 한다. 공통은 PageHeader뿐이고 그 아래는 템플릿마다 다시 짰다.
// ============================================================

// TYPE A — COVER STORY (ME)
// ME OPENING VISUAL INTEGRATION(2026-08) — 실제 GPT editorial spread를
// 그대로 꽂았다. 이 이미지 자체가 이미 CHAPTER 01/ME 타이틀·인물·
// 프로필·풀쿼트·MIND/LIFE/VALUES 3분할까지 완성된 한 장의 스프레드라,
// PageHeader/Kicker/FeatureTitle/Deck/PullQuote처럼 그 내용을 HTML로
// 다시 말하던 주변 텍스트를 전부 걷어냈다 — 지금 이 화면은 "매거진을
// 보여주는 화면"이지 "매거진 디자인을 설명하는 화면"이 아니다. 이미지
// 위에는 아무것도 얹지 않는다.
export function MeStory() {
  const asset = magazineVisualAssets.me.openingFeature;
  const [w, h] = asset.aspectRatio.split(":").map(Number);
  return (
    <section id="feature-me" className="px-5 pb-12 pt-10">
      <div className="relative mx-auto w-full max-w-xl overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
        <img src={asset.src} alt={asset.alt} className="size-full object-contain" style={{ objectPosition: asset.objectPositionMobile }} />
      </div>
    </section>
  );
}

// TYPE B — EDITORIAL COLLAGE (TASTE)
// TASTE VISUAL INTEGRATION(2026-08) — 실제 GPT editorial 이미지 4장(HERO/
// PLACE/OBJECT/DETAIL)을 그대로 꽂았다. 4장은 절대 하나로 합성하지 않고
// 끝까지 독립된 <img> 4개로 유지한다 — 각각 나중에 사용자 데이터 기반으로
// 따로 교체될 자산이기 때문이다. HERO는 이미 CHAPTER 02/TASTE 타이틀과
// PLACE·OBJECT·DETAIL·RITUAL 미리보기까지 포함한 완성된 chapter opening이라
// Kicker/FeatureTitle/Deck처럼 그 내용을 HTML로 다시 말하는 텍스트는 전부
// 걷어냈다. 4장의 프레임 폭·여백·이미지 사이 간격을 의도적으로 다르게 줘서
// "사람이 있는 세계(HERO) → 내가 머무는 공간(PLACE) → 내가 쥔 물건(OBJECT) →
// 하루의 작은 순간(DETAIL)"으로 시야가 점점 좁아지는 리듬을 만든다 — 4장을
// 같은 크기로 반복 나열하지 않는다.
export function TasteCollage() {
  const f = FEATURES.taste;
  const taste = magazineVisualAssets.taste;

  function frame(asset: (typeof taste)[keyof typeof taste]) {
    const [w, h] = asset.aspectRatio.split(":").map(Number);
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
        <img src={asset.src} alt={asset.alt} className="size-full object-contain" style={{ objectPosition: asset.objectPositionMobile }} />
      </div>
    );
  }

  return (
    <section id={`feature-${f.id}`} className="pb-14">
      <PageHeader folio={f.folio} />

      {/* HERO — 챕터를 여는 세계 전체. 여백 없이 가장 크게, 가장 먼저. */}
      <div className="mt-4">{frame(taste.hero)}</div>

      {/* PLACE — 그 세계 안, 내가 머무는 공간. 살짝 여백을 둬 시야가 좁아지기 시작한다. */}
      <div className="mt-10 px-5">{frame(taste.place)}</div>

      {/* OBJECT — 공간에서 다시 물건으로. 여백을 더 주고 폭도 살짝 좁혀 시선이 계속 좁아진다. */}
      <div className="mt-14 px-8">{frame(taste.object)}</div>

      {/* DETAIL — 챕터의 마지막, 하루의 가장 작은 순간. 가장 좁게, 가장 안쪽으로. */}
      <div className="mt-14 px-12 pb-2">{frame(taste.detail)}</div>
    </section>
  );
}

// TYPE C — HERO OBJECT (FOOD)
function FoodHero() {
  const f = FEATURES.food;
  return (
    <section id={`feature-${f.id}`} className="pb-12">
      <PageHeader folio={f.folio} />
      <div className="px-5 pt-3">
        <Kicker>{f.kicker}</Kicker>
      </div>
      <EditorialImageFrame ratio="4:5" label="FOOD HERO · 4:5" className="relative mx-5 mt-2" />
      <div className="relative -mt-10 px-5">
        <FeatureTitle lines={f.titleLines} />
      </div>
      <div className="mt-4 flex items-start gap-3 px-5">
        <div className={cx("flex flex-col gap-1.5", WIDTH_XS)}>
          <EditorialImageFrame ratio="1:1" label="DETAIL · 1:1" labelSize="small" />
        </div>
        <Deck className={WIDTH_L}>{f.deck}</Deck>
      </div>
    </section>
  );
}

// TYPE D — CINEMATIC FULL BLEED (TRAVEL)
function TravelCinematic() {
  const f = FEATURES.travel;
  return (
    <section id={`feature-${f.id}`} className="relative">
      <PageHeader folio={f.folio} />
      <div className="relative mt-3">
        <EditorialImageFrame ratio="4:5" label="FULL BLEED LANDSCAPE · 4:5" className="mx-0 border-x-0" />
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
          <Kicker>{f.kicker}</Kicker>
          <div>
            <FeatureTitle lines={f.titleLines} />
            <CaptionText className="mt-2">아직 가보지 않은 곳에서 시작하는 문장</CaptionText>
          </div>
        </div>
      </div>
    </section>
  );
}

// TYPE E — FASHION EDITORIAL (STYLE)
function StyleFashion() {
  const f = FEATURES.style;
  return (
    <section id={`feature-${f.id}`} className="pb-14">
      <PageHeader folio={f.folio} />
      <div className="relative mt-4 flex items-stretch">
        <div className="flex w-[46%] flex-col justify-center gap-3 pl-5 pr-3">
          <Kicker accent>{f.kicker}</Kicker>
          <FeatureTitle lines={f.titleLines} />
        </div>
        <div className="relative w-[54%]">
          <EditorialImageFrame ratio="2:3" label="FASHION · 2:3" className="ml-0 mr-0" />
        </div>
      </div>
      <div className="mt-5 flex items-start justify-end gap-3 px-5">
        <CaptionText className="max-w-[40%] text-right">질감과 실루엣으로 보는 나</CaptionText>
        <div className={WIDTH_XS}>
          <EditorialImageFrame ratio="1:1" label="FABRIC · 1:1" labelSize="small" />
        </div>
      </div>
    </section>
  );
}

// TYPE F — HUMAN STORY (LOVE)
function LoveHumanStory() {
  const f = FEATURES.love;
  return (
    <section id={`feature-${f.id}`} className="pb-14">
      <PageHeader folio={f.folio} />
      <div className="px-5 pt-3">
        <Kicker>{f.kicker}</Kicker>
      </div>
      <div className="relative mt-4 px-5">
        <div className={cx("ml-0", WIDTH_S)}>
          <EditorialImageFrame ratio="2:3" label="PORTRAIT A · 2:3" />
        </div>
        <div className={cx("-mt-6 ml-auto mr-0", WIDTH_S)}>
          <EditorialImageFrame ratio="2:3" label="PORTRAIT B · 2:3" />
        </div>
      </div>
      <div className="mt-8 px-5">
        <FeatureTitle lines={f.titleLines} />
        <Deck className="mt-3">{f.deck}</Deck>
      </div>
    </section>
  );
}

// TYPE G — EDITORIAL REPORT (WORK)
function WorkReport() {
  const f = FEATURES.work;
  const notes = ["지금 하는 일에서 가장 확실한 것", "아직 물음표로 남아있는 방향", "다음 장에서 시도해볼 만한 것"];
  return (
    <section id={`feature-${f.id}`} className="pb-14">
      <PageHeader folio={f.folio} />
      <div className="px-5 pt-3">
        <Kicker>{f.kicker}</Kicker>
      </div>
      <EditorialImageFrame ratio="3:4" label="CONCEPT · 3:4" className="relative mx-5 mt-2" />
      <div className="relative -mt-10 px-5">
        <FeatureTitle lines={f.titleLines} />
      </div>
      <div className="mt-5 flex flex-col px-5">
        {notes.map((note, i) => (
          <div key={i} className="flex items-baseline gap-3 border-t border-border py-3">
            <span className="font-serif text-xs font-bold text-text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm font-bold text-text-secondary">{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// HOMEPAGE — §14~16. 3개 장면.
// ============================================================

// Scene 1 — HERO: 완성된 표지 + 뒤에 살짝 삐져나온 3장.
// HOME HERO IMAGE INTEGRATION(2026-08) — GPT가 만든 실제 Visual Target
// 1호(magazineVisualAssets.home.hero)를 그대로 꽂았다. 그 전까지 여기
// 있던 회색 placeholder 3장 + Cover 컴포넌트 재사용(가짜 magazine
// mockup)은 전부 지웠다 — 이미지 자체가 이미 "표지+뒤로 겹친 페이지"
// 구도를 완성해서 갖고 있으므로 그걸 CSS로 다시 만들 필요가 없다.
// 이미지 위에는 아무것도 얹지 않는다(헤드라인 겹침·그라디언트
// 오버레이·배지 금지) — 이미지 앞뒤로 순서만 배치한다: 헤드라인/설명
// → 이미지(가장 큰 시각 요소) → 실제 클릭 가능한 CTA.
export function HomepageHero() {
  const hero = magazineVisualAssets.home.hero;
  const [w, h] = hero.aspectRatio.split(":").map(Number);
  return (
    <section className="flex flex-col gap-6 px-5 pb-10 pt-8">
      <p className="text-center text-xs font-black tracking-[-0.01em] text-text-primary">PERSONAL MAGAZINE</p>

      <div className="text-center">
        <h1 className="text-2xl font-black leading-8 tracking-[-0.02em] text-text-primary">나를 한 권으로 만들다.</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm font-bold leading-6 text-text-secondary">
          성격, 취향, 음식, 여행, 스타일, 관계와 일까지. 답할수록 나만의 Magazine이 완성됩니다.
        </p>
      </div>

      {/* 실제 이미지 연결 지점: registry(src/data/magazineVisualAssets.ts)의
          src만 바꾸면 이 자리 전체가 다음 버전 이미지로 교체된다. */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
        <img
          src={hero.src}
          alt={hero.alt}
          className="size-full object-contain"
          style={{ objectPosition: hero.objectPositionMobile }}
        />
      </div>

      <div className="flex justify-center">
        <a href="#shelf" className="inline-flex h-12 items-center justify-center border border-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-text-primary">
          내 첫 번째 Issue 만들기
        </a>
      </div>
    </section>
  );
}

// Scene 2 — YOUR MAGAZINE GROWS WITH YOU (editorial shelf)
function GrowingMagazineScene() {
  return (
    <section id="shelf" className="border-t border-border-strong bg-background px-5 py-12">
      <Kicker>Your Magazine Grows With You</Kicker>
      <p className="mt-2 text-2xl font-black leading-8 tracking-[-0.02em] text-text-primary">한 챕터씩, 한 권이 됩니다.</p>
      <ol className="mt-7 flex flex-col">
        {SHELF.map((item) => (
          <li key={item.code} className={cx("flex items-center gap-4 py-3", item.included ? "border-b border-text-primary" : "border-b border-dashed border-border")}>
            <span className="font-serif text-xs font-bold text-text-muted">{item.code}</span>
            <span className={cx("flex-1 text-sm font-black uppercase tracking-[0.02em]", item.included ? "text-text-primary" : "text-text-muted")}>{item.label}</span>
            <span aria-hidden="true" className={cx("size-1.5 rounded-full", item.included ? "bg-primary" : "border border-border-strong")} />
            <span className="font-serif text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">{item.included ? "포함됨" : "예정"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Scene 3 — 펼쳐본 매거진 미리보기 (Cover + Taste spread + Travel spread)
function SpreadPreviewScene() {
  return (
    <section className="border-t border-border-strong bg-background px-5 py-12">
      <Kicker>A Look Inside</Kicker>
      <p className="mt-2 text-2xl font-black leading-8 tracking-[-0.02em] text-text-primary">펼쳐보면, 이런 페이지들이 있어요.</p>

      <div className="relative mx-auto mt-10 h-64 max-w-xs">
        <div className="absolute left-0 top-4 w-[62%] origin-top-left border border-border-strong bg-background p-2.5 shadow-subtle" style={{ transform: "rotate(-7deg)" }}>
          <p className="text-[9px] font-black">PERSONAL MAGAZINE</p>
          <div className="mt-1.5 aspect-[4/5] border border-border-strong bg-tag-fill" />
        </div>
        <div className="absolute left-[30%] top-0 w-[62%] origin-top border border-border-strong bg-background p-2.5 shadow-subtle" style={{ transform: "rotate(2deg)" }}>
          <p className="font-serif text-[8px] font-bold uppercase tracking-[0.14em] text-primary">TASTE</p>
          <div className="mt-1.5 flex gap-1">
            <div className="aspect-[4/5] w-[65%] border border-border-strong bg-tag-fill" />
            <div className="aspect-square w-[32%] border border-border-strong bg-tag-fill" />
          </div>
        </div>
        <div className="absolute left-[58%] top-6 w-[58%] origin-top-right border border-border-strong bg-background p-2.5 shadow-subtle" style={{ transform: "rotate(8deg)" }}>
          <p className="font-serif text-[8px] font-bold uppercase tracking-[0.14em] text-text-muted">JOURNEY</p>
          <div className="mt-1.5 aspect-[4/5] border border-border-strong bg-tag-fill" />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ROOT
// ============================================================
export function EditorialSystemPrototype() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <GrainDefs />
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — EDITORIAL FRAME SYSTEM (production 미연결 · 이미지 미생성)
      </div>
      <div className="mx-auto max-w-md">
        <HomepageHero />
        <GrowingMagazineScene />
        <SpreadPreviewScene />

        <div id="cover-section" className="border-t-2 border-text-primary">
          <Cover />
        </div>

        <MeStory />
        <TasteCollage />
        <FoodHero />
        <TravelCinematic />
        <StyleFashion />
        <LoveHumanStory />
        <WorkReport />

        <div className="flex items-center justify-between border-t border-border-strong px-5 py-6">
          <SignatureMark />
          <span className="font-serif text-[10px] font-bold text-text-muted">PERSONAL MAGAZINE · ISSUE 001</span>
        </div>
      </div>
    </div>
  );
}

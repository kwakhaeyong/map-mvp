"use client";

// PERSONAL MAGAZINE — FAST PRODUCT CONCEPT PROTOTYPE(2026-08) — dev-only.
// 기존 Result 화면을 고치는 작업이 아니다. 상위 제품 개념을 "질문에
// 답할수록 나만의 Magazine이 만들어지는 서비스"로 바꿨을 때, 홈페이지와
// 각 주제의 "첫 결과 화면"이 어떻게 보여야 하는지를 실제 코드로 빠르게
// 증명하는 용도다. 문항·채점·생성 로직·analytics는 전혀 쓰지 않는다 —
// 화면 문법만 검증한다.

type Grammar = "portrait" | "object" | "collage" | "landscape";
type ShelfStatus = "published" | "next" | "unpublished";
type SealTone = "light" | "dark";

type Topic = {
  id: string;
  code: string;
  sectionLabel: string;
  title: string;
  emotion: string;
  caption: string;
  grammar: Grammar;
  status: ShelfStatus;
  page: string;
  labelTextClass: string;
  artBg: string;
  sealTone: SealTone;
  // portrait
  silhouetteFillClass?: string;
  paired?: boolean;
  // object
  objectFillClass?: string;
  objectStrokeClass?: string;
  // collage
  collageTones?: string[];
  // landscape
  bandFillClass?: string;
  // giant letter bleed
  giantLetterClass?: string;
};

const TOPICS: Topic[] = [
  {
    id: "me",
    code: "ME",
    sectionLabel: "ME · 나를 소개하면",
    title: "이번 호의 주인공",
    emotion: "이번 호의 주인공은 나예요.",
    caption: "나라는 사람을 한 문장으로 편집한다면",
    grammar: "portrait",
    status: "published",
    page: "p. 01",
    labelTextClass: "text-text-primary",
    artBg: "bg-background-subtle",
    sealTone: "dark",
    silhouetteFillClass: "fill-text-primary",
    giantLetterClass: "text-text-primary",
  },
  {
    id: "taste",
    code: "TASTE",
    sectionLabel: "TASTE · 취향",
    title: "내가 좋아하는 것들의 지도",
    emotion: "내가 좋아하는 것들이 한눈에 보여요.",
    caption: "음식 · 물건 · 장소 · 취향의 조각들",
    grammar: "collage",
    status: "published",
    page: "p. 02",
    labelTextClass: "text-editorial-clay",
    artBg: "bg-background-subtle",
    sealTone: "light",
    collageTones: ["bg-editorial-clay", "bg-editorial-moss", "bg-background", "bg-editorial-clay"],
  },
  {
    id: "food",
    code: "FOOD",
    sectionLabel: "FOOD · 미식",
    title: "내 취향을 접시에 담는다면",
    emotion: "먹는 것에도 내 취향이 다 드러나요.",
    caption: "한 접시로 보는 나의 미식 취향",
    grammar: "object",
    status: "unpublished",
    page: "p. 03",
    labelTextClass: "text-editorial-turmeric",
    artBg: "bg-background-subtle",
    sealTone: "dark",
    objectFillClass: "fill-editorial-turmeric",
    objectStrokeClass: "stroke-editorial-turmeric",
    giantLetterClass: "text-editorial-turmeric",
  },
  {
    id: "travel",
    code: "TRAVEL",
    sectionLabel: "TRAVEL · 여행",
    title: "내가 떠나고 싶은 세계",
    emotion: "떠나는 방식에도 내가 보여요.",
    caption: "다음 여정이 시작되는 지평선",
    grammar: "landscape",
    status: "next",
    page: "p. 04",
    labelTextClass: "text-editorial-slate",
    artBg: "bg-editorial-slate",
    sealTone: "light",
    bandFillClass: "fill-background",
    giantLetterClass: "text-background",
  },
  {
    id: "style",
    code: "STYLE",
    sectionLabel: "STYLE · 스타일",
    title: "나를 입는 방식",
    emotion: "고르는 것 하나하나가 곧 나예요.",
    caption: "질감과 실루엣으로 보는 나",
    grammar: "collage",
    status: "unpublished",
    page: "p. 05",
    labelTextClass: "text-text-primary",
    artBg: "bg-text-primary",
    sealTone: "light",
    collageTones: ["bg-background", "bg-text-primary", "bg-background-subtle", "bg-background"],
  },
  {
    id: "love",
    code: "LOVE",
    sectionLabel: "LOVE · 이상형",
    title: "내가 끌리는 사람과 분위기",
    emotion: "끌리는 데도 나만의 결이 있어요.",
    caption: "둘이 있을 때 완성되는 장면",
    grammar: "portrait",
    status: "unpublished",
    page: "p. 06",
    labelTextClass: "text-editorial-burgundy",
    artBg: "bg-editorial-burgundy",
    sealTone: "light",
    silhouetteFillClass: "fill-background",
    paired: true,
    giantLetterClass: "text-background",
  },
  {
    id: "work",
    code: "WORK",
    sectionLabel: "WORK · 일할 때의 나",
    title: "다음 장면의 나",
    emotion: "일하는 방식에도 내가 보여요.",
    caption: "다음 장면을 준비하는 도시의 밤",
    grammar: "landscape",
    status: "unpublished",
    page: "p. 07",
    labelTextClass: "text-editorial-navy",
    artBg: "bg-editorial-navy",
    sealTone: "light",
    bandFillClass: "fill-background",
    giantLetterClass: "text-background",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ── 종이 질감(grain) — 그라디언트가 아니라 SVG feTurbulence 노이즈.
// 필터 정의를 페이지에 딱 한 번만 두고(GrainDefs), 모든 사용처는 같은
// id를 CSS filter로 참조만 한다 — id 충돌 없이 여러 곳에서 재사용 가능. ──
function GrainDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="magsys-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
      </filter>
    </svg>
  );
}
function GrainPatch({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cx("pointer-events-none absolute inset-0", className ?? "opacity-[0.05]")} style={{ filter: "url(#magsys-grain)" }} />
  );
}

// ── Living Map 서명 모티프(seal) — 계산이 아니라 브랜드 흔적으로만
// 축소 재사용. tone으로 밝은/어두운 배경 둘 다 대응한다. ──
function ContourSeal({ tone = "light", className }: { tone?: SealTone; className?: string }) {
  const strokeClass = tone === "light" ? "stroke-background" : "stroke-text-primary";
  const dotClass = tone === "light" ? "fill-background" : "fill-text-primary";
  return (
    <svg viewBox="0 0 40 40" className={cx("size-7", className)} aria-hidden="true">
      <path d="M6 26 C10 18, 16 14, 24 12 S 34 8, 36 5" className={cx("fill-none", strokeClass)} strokeWidth="1.2" strokeDasharray="1 3.5" strokeLinecap="round" opacity={0.85} />
      <circle cx="6" cy="26" r="2" className={dotClass} opacity={0.85} />
      <circle cx="36" cy="5" r="1.6" className={dotClass} opacity={0.55} />
    </svg>
  );
}

function GiantLetter({ topic, position }: { topic: Topic; position: "top-left" | "top-right" | "bottom-center" }) {
  if (!topic.giantLetterClass) return null;
  const posClass =
    position === "top-left"
      ? "-left-3 -top-7"
      : position === "top-right"
        ? "-right-4 -top-7"
        : "-bottom-9 left-1/2 -translate-x-1/2";
  return (
    <span aria-hidden="true" className={cx("pointer-events-none absolute select-none font-serif text-[7.5rem] font-black leading-none opacity-[0.12]", posClass, topic.giantLetterClass)}>
      {topic.code[0]}
    </span>
  );
}

// ============================================================
// COVER GRAMMAR — TYPE A: PORTRAIT (인물/상징 실루엣 + 타이틀 겹침)
// ============================================================
function PortraitArt({ topic }: { topic: Topic }) {
  return (
    <div className={cx("relative aspect-[3/4] w-full overflow-hidden", topic.artBg)}>
      <GrainPatch />
      <GiantLetter topic={topic} position="top-left" />
      <svg viewBox="0 0 100 130" className="absolute inset-x-0 bottom-0 h-[90%] w-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {topic.paired ? (
          <>
            <path
              d="M18,132 Q18,82 34,60 Q42,49 42,36 Q42,16 29,16 Q16,16 16,36 Q16,49 24,60 Q8,82 8,132 Z"
              className={topic.silhouetteFillClass}
              fillOpacity={0.55}
            />
            <path
              d="M82,132 Q82,80 66,58 Q58,47 58,34 Q58,14 71,14 Q84,14 84,34 Q84,47 76,58 Q92,80 92,132 Z"
              className={topic.silhouetteFillClass}
              fillOpacity={0.9}
            />
          </>
        ) : (
          <path
            d="M50,132 Q50,76 66,54 Q76,42 76,27 Q76,4 50,4 Q24,4 24,27 Q24,42 34,54 Q50,76 50,132 Z"
            className={topic.silhouetteFillClass}
            fillOpacity={0.85}
          />
        )}
      </svg>
      <ContourSeal tone={topic.sealTone} className="absolute right-3 top-3" />
    </div>
  );
}

// ============================================================
// COVER GRAMMAR — TYPE B: SINGLE OBJECT (오브젝트 하나를 크게)
// ============================================================
function ObjectArt({ topic }: { topic: Topic }) {
  return (
    <div className={cx("relative aspect-[3/4] w-full overflow-hidden", topic.artBg)}>
      <GrainPatch />
      <GiantLetter topic={topic} position="top-right" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <ellipse cx="50" cy="62" rx="36" ry="28" className={topic.objectFillClass} fillOpacity={0.9} />
        <ellipse cx="50" cy="56" rx="27" ry="20" className="fill-background" fillOpacity={0.95} />
        <circle cx="50" cy="56" r="9" className={topic.objectFillClass} fillOpacity={0.45} />
        <line x1="38" y1="18" x2="34" y2="32" className={topic.objectStrokeClass} strokeWidth="1.6" strokeLinecap="round" opacity={0.7} />
        <line x1="50" y1="14" x2="50" y2="30" className={topic.objectStrokeClass} strokeWidth="1.6" strokeLinecap="round" opacity={0.7} />
        <line x1="62" y1="18" x2="66" y2="32" className={topic.objectStrokeClass} strokeWidth="1.6" strokeLinecap="round" opacity={0.7} />
      </svg>
      <ContourSeal tone={topic.sealTone} className="absolute left-3 top-3" />
    </div>
  );
}

// ============================================================
// COVER GRAMMAR — TYPE C: COLLAGE (3~5개 크롭 겹침)
// ============================================================
function CollageArt({ topic }: { topic: Topic }) {
  const tones = topic.collageTones ?? [];
  const shapes = [
    { w: 48, h: 56, top: 4, left: 4, rot: -5 },
    { w: 40, h: 46, top: 32, left: 46, rot: 4 },
    { w: 34, h: 40, top: 2, left: 56, rot: 6 },
    { w: 30, h: 32, top: 56, left: 10, rot: -3 },
  ];
  return (
    <div className={cx("relative aspect-[3/4] w-full overflow-hidden", topic.artBg)}>
      <GrainPatch />
      {shapes.map((s, i) => (
        <div
          key={i}
          className={cx("absolute overflow-hidden rounded-medium border border-border", tones[i % tones.length])}
          style={{ width: `${s.w}%`, height: `${s.h}%`, top: `${s.top}%`, left: `${s.left}%`, transform: `rotate(${s.rot}deg)` }}
        >
          <div className="absolute right-0 top-0 h-3 w-3 bg-background opacity-70" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
        </div>
      ))}
      <ContourSeal tone={topic.sealTone} className="absolute right-3 top-3" />
    </div>
  );
}

// ============================================================
// COVER GRAMMAR — TYPE D: LANDSCAPE (풀블리드 씬 + 타이포)
// ============================================================
function LandscapeArt({ topic }: { topic: Topic }) {
  return (
    <div className={cx("relative aspect-[3/4] w-full overflow-hidden", topic.artBg)}>
      <GrainPatch />
      <GiantLetter topic={topic} position="bottom-center" />
      <svg viewBox="0 0 100 30" className="absolute inset-x-0 top-0 h-1/3 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,20 Q30,4 55,14 T100,8" className="fill-none stroke-background" strokeWidth="0.6" strokeDasharray="1 2.6" opacity={0.65} />
      </svg>
      <svg viewBox="0 0 100 100" className="absolute inset-x-0 bottom-0 h-2/3 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,58 L20,38 L38,50 L58,26 L78,42 L100,28 L100,100 L0,100 Z" className={topic.bandFillClass} fillOpacity={0.3} />
        <path d="M0,72 L24,54 L44,64 L64,42 L84,58 L100,48 L100,100 L0,100 Z" className={topic.bandFillClass} fillOpacity={0.55} />
        <path d="M0,86 L22,72 L46,80 L68,62 L90,76 L100,68 L100,100 L0,100 Z" className={topic.bandFillClass} fillOpacity={0.9} />
      </svg>
      <ContourSeal tone={topic.sealTone} className="absolute right-3 top-3" />
    </div>
  );
}

function renderArt(topic: Topic) {
  switch (topic.grammar) {
    case "portrait":
      return <PortraitArt topic={topic} />;
    case "object":
      return <ObjectArt topic={topic} />;
    case "collage":
      return <CollageArt topic={topic} />;
    case "landscape":
      return <LandscapeArt topic={topic} />;
  }
}

function ShelfStatusPill({ status }: { status: ShelfStatus }) {
  if (status === "published") {
    return <span className="whitespace-nowrap rounded-pill bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-primary-foreground">발행됨</span>;
  }
  if (status === "next") {
    return <span className="whitespace-nowrap rounded-pill border border-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-primary">다음 호</span>;
  }
  return <span className="whitespace-nowrap rounded-pill bg-tag-fill px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-text-muted">미발행</span>;
}

// ============================================================
// SECTION 1 — HOMEPAGE HERO
// ============================================================
function HomepageHero() {
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-10">
      <GrainPatch className="opacity-[0.045]" />
      <div aria-hidden="true" className="absolute -left-10 top-24 size-40 rounded-full bg-editorial-clay opacity-[0.10] blur-2xl" />
      <div aria-hidden="true" className="absolute -right-14 bottom-4 size-48 rounded-full bg-editorial-slate opacity-[0.10] blur-2xl" />

      <div className="relative mx-auto max-w-[15.5rem]">
        <div aria-hidden="true" className="absolute inset-0 rounded-large border border-border bg-surface-elevated shadow-subtle" style={{ transform: "rotate(-6deg) translate(-10px, 12px)" }} />
        <div aria-hidden="true" className="absolute inset-0 rounded-large border border-border bg-surface-elevated shadow-subtle" style={{ transform: "rotate(4deg) translate(9px, 7px)" }} />

        <div className="relative overflow-hidden rounded-large border border-border-strong bg-text-primary text-background shadow-floating">
          <GrainPatch className="opacity-[0.07]" />
          <div className="relative flex items-center justify-between px-4 pt-4">
            <span className="text-sm font-black tracking-[-0.01em]">MAP Magazine</span>
            <span className="font-serif text-[9px] font-bold uppercase tracking-[0.16em] opacity-70">Personal · 2026</span>
          </div>
          <div className="relative mt-8 px-4">
            <p className="font-serif text-[11px] italic opacity-70">이번 호의 주인공</p>
            <h1 className="-mt-1 text-4xl font-black leading-[1.05] tracking-[-0.02em]">OOO 님</h1>
          </div>
          <ul className="relative mt-6 flex flex-wrap gap-x-3 gap-y-1 px-4 text-[10px] font-bold uppercase tracking-[0.04em] opacity-80">
            {TOPICS.map((t) => (
              <li key={t.id}>{t.code}</li>
            ))}
          </ul>
          <div className="relative mt-8 flex items-center justify-between px-4 pb-4">
            <ContourSeal tone="light" />
            <span className="font-serif text-[10px] font-bold opacity-60">Vol. 01</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-xs text-center">
        <p className="text-xl font-black leading-8 tracking-[-0.02em] text-text-primary">나를 한 권으로 만들면, 이런 모습.</p>
        <p className="mt-3 text-sm font-bold leading-6 text-text-secondary">한 주제를 끝낼 때마다, 나에 관한 페이지가 하나씩 만들어집니다.</p>
        <a
          href="#shelf"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-pill bg-primary px-8 text-sm font-black text-primary-foreground shadow-floating"
        >
          내 Magazine 시작하기
        </a>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 2 — MAGAZINE SHELF (목차 / 책장)
// ============================================================
function MagazineShelf() {
  return (
    <section id="shelf" className="border-t-2 border-border-strong bg-background-subtle px-5 py-10">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Your Magazine</p>
      <p className="mt-1 text-xl font-black tracking-[-0.02em] text-text-primary">한 권이 이렇게 채워져요.</p>
      <ol className="mt-6 flex flex-col">
        {TOPICS.map((t, i) => (
          <li key={t.id}>
            <a href={`#cover-${t.id}`} className="flex items-baseline gap-3 border-b border-border py-3">
              <span className="font-serif text-xs font-bold text-text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-sm font-black text-text-primary">{t.code}</span>
              <span aria-hidden="true" className="mx-1 flex-1 self-center border-b border-dotted border-border-strong" />
              <ShelfStatusPill status={t.status} />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ============================================================
// SECTION 3 — TOPIC COVER (7개 첫 화면)
// ============================================================
function TopicCoverCard({ topic }: { topic: Topic }) {
  return (
    <section id={`cover-${topic.id}`} className="pt-10">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-black tracking-[-0.01em] text-text-primary">MAP Magazine</span>
        <span className="font-serif text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Personal Edition · 2026 · {topic.page}</span>
      </div>
      <div className="relative mt-3 overflow-hidden rounded-large border border-border">{renderArt(topic)}</div>
      <div className="relative -mx-1 -mt-6 rounded-medium border border-border bg-surface-elevated p-4 shadow-subtle">
        <p className={cx("font-serif text-[11px] font-bold uppercase tracking-[0.16em]", topic.labelTextClass)}>{topic.sectionLabel}</p>
        <h3 className="mt-1 text-2xl font-black leading-8 tracking-[-0.02em] text-text-primary">{topic.title}</h3>
        <p className="mt-1 text-sm font-bold text-text-secondary">{topic.emotion}</p>
        <p className="mt-2 font-serif text-xs italic text-text-muted">{topic.caption}</p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <ShelfStatusPill status={topic.status} />
          <span className="flex items-center gap-1.5 font-serif text-[10px] font-bold text-text-muted">
            <ContourSeal tone="dark" className="size-4" />
            Living Map 서명
          </span>
        </div>
      </div>
    </section>
  );
}

export function PersonalMagazineSystemPrototype() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <GrainDefs />
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background-subtle px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — PERSONAL MAGAZINE SYSTEM (production 미연결)
      </div>
      <div className="mx-auto max-w-md">
        <HomepageHero />
        <MagazineShelf />
        <div className="px-5 pb-16">
          {TOPICS.map((t) => (
            <TopicCoverCard key={t.id} topic={t} />
          ))}
        </div>
      </div>
    </div>
  );
}

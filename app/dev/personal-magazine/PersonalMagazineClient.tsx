"use client";

// PERSONAL MAGAZINE CONCEPT PROTOTYPE(2026-08) — dev-only, production과
// 완전히 분리된 실험. "결과지를 받는다"가 아니라 "나를 다룬 잡지
// 한 호가 발행된다"는 경험을 검증한다. 기존 Result 컴포넌트(TasteCard/
// TasteResultBlocks) 구조·클래스를 하나도 재사용하지 않는다 — 이번
// 지시가 명시적으로 "기존 UI를 성역으로 두지 마라"이기 때문이다.
// 대신 순수 계산 로직(좌표 배치)만 이 파일 안에 최소 형태로 복제했다
// (production 파일을 이번 라운드에 전혀 건드리지 않기 위해서다).
//
// 문항·데이터·태그 매핑·analytics·generation 로직은 전혀 사용하지
// 않는다 — 이 라우트는 mock TasteResult 하나만 가지고 화면 문법을
// 검증하는 용도다.

import { useId, useMemo, useState } from "react";

type MatrixPoint = { label: string; description: string; x: number; y: number };
type TasteMock = {
  title: string;
  oneLiner: string;
  statusLabel: string;
  tags: string[];
  patterns: string[];
  matrix: { xAxisLabel: { low: string; high: string }; yAxisLabel: { low: string; high: string }; types: MatrixPoint[] };
  tasteCore: { certain: string[]; conditional: string[]; indifferent: string[] };
  tasteMap: { expand: string[]; avoid: string[] };
  selfReflection: { awareness: string[]; blindSpots: string[] };
};

// 실제 taste-generator.ts가 만드는 것과 같은 모양의 mock — 문항/생성
// 로직은 안 쓰지만, 화면이 실제 데이터 형태와 어긋나지 않는지 검증하기
// 위해 실제 TasteResult 타입 구조를 그대로 따른다.
const MOCK: TasteMock = {
  title: "조용히 몰입하는 수집가",
  oneLiner: "고요한 몰입 속에서 나만의 결을 쌓아가는 사람",
  statusLabel: "취향 지도 완성",
  tags: ["미니멀", "차분함", "깊은 몰입", "혼자만의시간"],
  patterns: [
    "혼자 있는 시간을 통해 에너지를 얻는 편이에요.",
    "한 번 빠지면 깊게 파는 편이에요.",
    "새로운 걸 우연히 만나면 안지만, 정말 남는 건 시간이 지나 다시 돌아와서 깊게 보는 아이템이에요.",
  ],
  matrix: {
    xAxisLabel: { low: "익숙함", high: "낯섦" },
    yAxisLabel: { low: "가벼움", high: "깊음" },
    types: [
      { label: "몰입형", description: "하나를 깊게 파는 편", x: 20, y: 30 },
      { label: "탐험형", description: "새로운 걸 찾는 편", x: 72, y: 18 },
      { label: "감성형", description: "분위기에 끌리는 편", x: 40, y: 82 },
      { label: "실용형", description: "쓸모를 따지는 편", x: 85, y: 68 },
    ],
  },
  tasteCore: {
    certain: ["필름 카메라로 순간을 기록하는 것", "조용한 카페에서 혼자 책 읽기", "오래된 레코드판 모으기"],
    conditional: ["사람 많은 페스티벌", "새로운 동네 탐방"],
    indifferent: ["유행하는 챌린지", "실시간 인기 콘텐츠"],
  },
  tasteMap: { expand: ["필름 사진", "손글씨 저널링", "빈티지 소품 수집"], avoid: ["시끄러운 공간", "빠르게 소비되는 숏폼"] },
  selfReflection: {
    awareness: ["조용한 몰입을 좋아하는 편이에요.", "혼자 있는 시간을 소중히 여겨요."],
    blindSpots: [
      "생각보다 새로운 자극에도 잘 반응해요.",
      "완전히 혼자만 있는 건 아니에요.",
      "당신의 취향에는 뚜렷한 점이 '무엇을 좋아하냐'보다 '어떻게 끝기느냐'에 가까워요.",
    ],
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ── 좌표 계산(프로덕션 TasteResultBlocks.tsx의 spreadMatrixPoints/
// closedSmoothPath/centroidOf/angleSortedOrder와 완전히 같은 로직의
// 최소 복제) — 이번 라운드는 production 파일을 전혀 건드리지 않기로
// 했으므로 export를 늘리는 대신 여기 그대로 옮겨 적었다. 계산 방식·
// 결과값은 원본과 동일하다(같은 입력이면 같은 출력).
const clampPercent = (value: number) => Math.min(96, Math.max(4, value));
type Plotted = MatrixPoint & { plotX: number; plotY: number };
function spreadMatrixPoints(points: MatrixPoint[]): Plotted[] {
  const minDistance = 14;
  const placed: Plotted[] = points.map((point) => ({ ...point, plotX: point.x, plotY: 100 - point.y }));
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dx = placed[j].plotX - placed[i].plotX;
        const dy = placed[j].plotY - placed[i].plotY;
        const distance = Math.hypot(dx, dy) || 0.001;
        if (distance < minDistance) {
          const push = (minDistance - distance) / 2;
          const unitX = dx / distance;
          const unitY = dy / distance;
          placed[i].plotX -= unitX * push;
          placed[i].plotY -= unitY * push;
          placed[j].plotX += unitX * push;
          placed[j].plotY += unitY * push;
        }
      }
    }
  }
  return placed.map((point) => ({ ...point, plotX: clampPercent(point.plotX), plotY: clampPercent(point.plotY) }));
}
function centroidOf(points: { plotX: number; plotY: number }[]) {
  const x = points.reduce((sum, point) => sum + point.plotX, 0) / points.length;
  const y = points.reduce((sum, point) => sum + point.plotY, 0) / points.length;
  return { x, y };
}
function angleSortedOrder<T extends { plotX: number; plotY: number }>(points: T[]): T[] {
  const centroid = centroidOf(points);
  return [...points].sort((a, b) => Math.atan2(a.plotY - centroid.y, a.plotX - centroid.x) - Math.atan2(b.plotY - centroid.y, b.plotX - centroid.x));
}
function closedSmoothPath(points: { plotX: number; plotY: number }[]): string {
  const n = points.length;
  if (n < 3) return "";
  let d = `M ${points[0].plotX} ${points[0].plotY} `;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1.plotX + (p2.plotX - p0.plotX) / 6;
    const c1y = p1.plotY + (p2.plotY - p0.plotY) / 6;
    const c2x = p2.plotX - (p3.plotX - p1.plotX) / 6;
    const c2y = p2.plotY - (p3.plotY - p1.plotY) / 6;
    d += `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.plotX} ${p2.plotY} `;
  }
  return `${d}Z`;
}

// pickDiscoveries — 프로덕션 DiscoveriesSection과 완전히 같은 소스
// (awareness[0]/patterns[0]/blindSpots[0])·같은 순서. 문장을 새로
// 짓지 않는다.
function pickDiscoveries(mock: TasteMock) {
  const sources: { role: string; text?: string }[] = [
    { role: "내가 아는 나", text: mock.selfReflection.awareness[0] },
    { role: "반복되는 나", text: mock.patterns[0] },
    { role: "내가 놓친 나", text: mock.selfReflection.blindSpots[0] },
  ];
  return sources.filter((d): d is { role: string; text: string } => Boolean(d.text));
}

// ── 브랜드 서명: Living Map 등고선을 작은 seal/route로만 쓴다(§2) ──
function ContourSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx("size-8", className)} aria-hidden="true">
      <path
        d="M6 26 C10 18, 16 14, 24 12 S 34 8, 36 5"
        className="fill-none stroke-primary-foreground"
        strokeWidth="1.2"
        strokeDasharray="1 3.5"
        strokeLinecap="round"
      />
      <circle cx="6" cy="26" r="2" className="fill-primary-foreground" />
      <circle cx="36" cy="5" r="1.6" className="fill-editorial-clay" />
    </svg>
  );
}

// ── organic color field: 그라디언트가 아니라 유기적 도형(territory
// 언어 재사용) + geometric crop(clip-path) 조합. §6의 "1/2/3/6" 방향. ──
function OrganicField({
  tone,
  className,
  crop = false,
}: {
  tone: "ink" | "clay" | "moss";
  className?: string;
  crop?: boolean;
}) {
  const filterId = useId();
  const fill = tone === "ink" ? "fill-primary" : tone === "clay" ? "fill-editorial-clay" : "fill-editorial-moss";
  const bg = tone === "ink" ? "bg-primary" : tone === "clay" ? "bg-editorial-clay" : "bg-editorial-moss";
  return (
    <div className={cx("relative overflow-hidden", bg, className)} style={crop ? { clipPath: "polygon(0 0, 100% 0, 100% 84%, 0 100%)" } : undefined}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <filter id={`field-blur-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <path
          d="M -10 40 C 10 10, 45 5, 60 20 S 100 35, 110 60 C 95 90, 55 105, 30 90 S -15 70, -10 40 Z"
          className={fill}
          fillOpacity={0.5}
          filter={`url(#field-blur-${filterId})`}
        />
        <path
          d="M 20 90 C 10 60, 30 30, 55 25 S 95 15, 100 -5"
          className="fill-none stroke-primary-foreground"
          strokeWidth="0.6"
          strokeOpacity={0.4}
          strokeDasharray="0.8 3"
        />
      </svg>
    </div>
  );
}

// ============================================================
// COVER
// ============================================================
function Cover({ mock, onShare }: { mock: TasteMock; onShare: () => void }) {
  return (
    <section className="relative flex flex-col bg-background px-5 pb-8 pt-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-black tracking-[-0.02em] text-text-primary">MAP</span>
        <span className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Taste Issue 001</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-serif text-[10px] italic text-text-muted">Vol. 01 · 2026</span>
        <button type="button" onClick={onShare} aria-label="이 호 공유하기" className="grid size-8 place-items-center rounded-full border border-border text-text-muted">
          <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth={1.8}>
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.2 10.8 15.8 6.2M8.2 13.2 15.8 17.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* editorial visual — organic field + geometric crop + route line, 큰 배경 숫자 */}
      <div className="relative mt-5 h-56 w-full">
        <OrganicField tone="clay" crop className="h-full w-full rounded-medium" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-3 -left-2 font-serif text-[7rem] font-bold leading-none text-primary-foreground opacity-15">
          01
        </span>
        <ContourSeal className="absolute right-3 top-3" />
        <p className="absolute bottom-4 left-4 max-w-[70%] font-serif text-[11px] italic leading-4 text-primary-foreground opacity-80">
          요즘 내가 자꾸 끌리는 것들 — 한 사람의 취향을 따라가는 이번 호.
        </p>
      </div>

      {/* headline이 비주얼과 겹치도록 음수 마진으로 끌어올림 */}
      <h1 className="relative -mt-8 text-balance break-keep pr-6 text-[2.6rem] font-black leading-[1.05] tracking-[-0.03em] text-text-primary">
        {mock.title}
      </h1>
      <p className="mt-3 text-base font-bold leading-6 text-text-secondary">{mock.oneLiner}</p>
      <p className="mt-1 text-xs font-semibold text-text-muted">{mock.statusLabel}</p>

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
        {mock.tags.map((tag) => (
          <span key={tag} className="text-xs font-bold text-primary">
            #{tag}
          </span>
        ))}
      </div>

      <div aria-hidden="true" className="mt-6 h-px w-full bg-border" />
      <p className="mt-3 font-serif text-[10px] italic tracking-[0.02em] text-text-muted">A Personal Issue — Made From Your Answers</p>

      <p className="mt-8 text-center text-[11px] font-semibold text-text-muted">↓ THE TASTE EDIT</p>
    </section>
  );
}

// ============================================================
// SECTION 2 — THE TASTE EDIT (discoveries as feature story)
// ============================================================
function TasteEdit({ mock }: { mock: TasteMock }) {
  const discoveries = pickDiscoveries(mock);
  return (
    <section className="bg-background px-5 py-10">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-editorial-clay">The Taste Edit</p>
      <h2 className="mt-1 text-3xl font-black leading-9 tracking-[-0.02em] text-text-primary">03 Things We Found</h2>
      <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">따로 답한 문항들을 모아보니, 이런 게 보였어요.</p>

      {/* 01 — pull quote */}
      {discoveries[0] ? (
        <div className="mt-9">
          <p className="font-serif text-[11px] font-bold text-text-muted">01</p>
          <div className="mt-2 flex gap-2">
            <span aria-hidden="true" className="font-serif text-6xl font-bold leading-none text-editorial-clay">“</span>
            <p className="pt-3 text-2xl font-black leading-8 tracking-[-0.02em] text-text-primary">{discoveries[0].text}</p>
          </div>
          <p className="mt-2 font-serif text-xs italic text-text-muted">{discoveries[0].role}</p>
        </div>
      ) : null}

      {/* 02 — small visual + text */}
      {discoveries[1] ? (
        <div className="mt-10 flex gap-4">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-medium">
            <OrganicField tone="moss" className="h-full w-full" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-serif text-[11px] font-bold text-text-muted">02</p>
            <p className="mt-1 text-base font-black leading-6 text-text-primary">{discoveries[1].text}</p>
            <p className="mt-1 font-serif text-xs italic text-text-muted">{discoveries[1].role}</p>
          </div>
        </div>
      ) : null}

      {/* 03 — climax, full-bleed dramatic composition */}
      {discoveries[2] ? (
        <div className="relative -mx-5 mt-10 overflow-hidden bg-primary px-8 py-10 text-primary-foreground">
          <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-8 -top-8 size-40 opacity-20" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="fill-none stroke-primary-foreground" strokeWidth="1" />
            <circle cx="50" cy="50" r="30" className="fill-none stroke-primary-foreground" strokeWidth="1" />
          </svg>
          <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-editorial-clay">03 · The Unexpected Find</p>
          <p className="mt-3 text-3xl font-black leading-[1.15] tracking-[-0.02em]">{discoveries[2].text}</p>
          <p className="mt-3 font-serif text-xs italic text-primary-foreground-soft">{discoveries[2].role}</p>
        </div>
      ) : null}
    </section>
  );
}

// ============================================================
// SECTION 3 — CENTER SPREAD (Living MY MAP)
// ============================================================
function CenterSpread({ mock }: { mock: TasteMock }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(mock.matrix.types);
  const centroid = centroidOf(placed);
  const order = angleSortedOrder(placed);
  const territoryPath = closedSmoothPath(order);

  return (
    <section className="relative -mx-0 flex flex-col gap-6 bg-primary px-5 py-14 text-primary-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-foreground-soft"
        style={{ writingMode: "vertical-rl" }}
      >
        Center Spread
      </div>
      <div className="text-center">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-clay">Center Spread</p>
        <p className="mt-1 text-2xl font-black tracking-[-0.02em]">Your Taste Territory</p>
        <p className="mt-1 text-sm font-bold text-primary-foreground-soft">내 안의 여러 모습이 만든 지형이에요.</p>
      </div>

      <div className="mx-auto w-full max-w-none">
        <p className="mb-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em] text-primary-foreground-soft">
          <span aria-hidden="true">▲</span> {mock.matrix.yAxisLabel.high}
        </p>
        <div className="flex items-center gap-2">
          <p className="w-12 shrink-0 text-right text-[11px] font-black leading-tight text-primary-foreground-soft">{mock.matrix.xAxisLabel.low}</p>
          <div className="relative aspect-square flex-1">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
              <defs>
                <filter id={`spread-glow-${filterId}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3.5" />
                </filter>
              </defs>
              <path d={territoryPath} className="fill-primary-foreground" fillOpacity={0.26} filter={`url(#spread-glow-${filterId})`} />
              <path d={territoryPath} className="fill-none stroke-primary-foreground" strokeWidth="0.7" strokeOpacity={0.85} />
              <circle cx={centroid.x} cy={centroid.y} r="1" className="fill-primary-foreground" fillOpacity={0.8} />
              {placed.map((point, index) => (
                <g key={index}>
                  <title>{point.label}</title>
                  <circle cx={point.plotX} cy={point.plotY} r="3.2" className="fill-primary-foreground stroke-primary" strokeWidth="0.8" />
                  <text x={point.plotX} y={point.plotY} textAnchor="middle" dominantBaseline="central" className="fill-primary font-black" style={{ fontSize: "4px" }}>
                    {index + 1}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <p className="w-12 shrink-0 text-left text-[11px] font-black leading-tight text-primary-foreground-soft">{mock.matrix.xAxisLabel.high}</p>
        </div>
        <p className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em] text-primary-foreground-soft">
          <span aria-hidden="true">▼</span> {mock.matrix.yAxisLabel.low}
        </p>
      </div>

      <ul className="mx-auto flex w-full max-w-xs flex-col gap-2">
        {mock.matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-xs font-semibold leading-6 text-primary-foreground-soft">
            <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-pill border border-primary-foreground-soft text-[10px] font-black text-primary-foreground">
              {index + 1}
            </span>
            <span>
              <span className="font-black text-primary-foreground">{point.label}</span> — {point.description}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs font-semibold text-primary-foreground-soft">이 지형은 나만의 것이에요 — 친구는 완전히 다르게 나와요.</p>
    </section>
  );
}

// ============================================================
// SECTION 4 — EDITORIAL NOTES (deep dive)
// ============================================================
function NoteRow({ index, title, preview, children }: { index: number; title: string; preview?: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border py-4">
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="flex min-w-0 flex-1 gap-3">
          <span aria-hidden="true" className="shrink-0 font-serif text-sm font-bold text-editorial-clay">
            {String(index).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black text-text-primary">{title}</span>
            {!expanded && preview ? <span className="mt-0.5 block truncate text-xs font-medium text-text-muted">{preview}</span> : null}
          </span>
        </span>
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-text-muted">
          {expanded ? "—" : "→"}
        </span>
      </button>
      {expanded ? <div className="mt-3 flex flex-col gap-2 pl-7 text-sm font-medium leading-6 text-text-secondary">{children}</div> : null}
    </div>
  );
}

function EditorialNotes({ mock }: { mock: TasteMock }) {
  return (
    <section className="bg-background px-5 py-10">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-editorial-moss">Notes</p>
      <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-text-primary">Behind The Taste</h2>
      <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">원하는 만큼만 펼쳐서 읽어보세요.</p>

      <div className="mt-6">
        <NoteRow index={1} title="반복해서 고르는 것" preview={mock.tasteCore.certain[0]}>
          {mock.tasteCore.certain.map((item, i) => (
            <p key={i}>· {item}</p>
          ))}
        </NoteRow>
        <NoteRow index={2} title="상황에 따라 달라지는 나" preview={mock.tasteCore.conditional[0]}>
          {mock.tasteCore.conditional.map((item, i) => (
            <p key={i}>· {item}</p>
          ))}
        </NoteRow>
        <NoteRow index={3} title="넓혀볼 것 / 굳이 안 맞출 것" preview={mock.tasteMap.expand[0]}>
          <p className="font-black text-success">넓혀볼 만한 방향</p>
          {mock.tasteMap.expand.map((item, i) => (
            <p key={i}>· {item}</p>
          ))}
          <p className="mt-2 font-black text-error">안 맞을 방향</p>
          {mock.tasteMap.avoid.map((item, i) => (
            <p key={i}>· {item}</p>
          ))}
        </NoteRow>
        <NoteRow index={4} title="내가 설명하지 못했던 이유" preview={mock.selfReflection.blindSpots[0]}>
          {mock.selfReflection.blindSpots.map((item, i) => (
            <p key={i}>· {item}</p>
          ))}
        </NoteRow>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 5 — BACK COVER / SHARE
// ============================================================
function MiniCover({ mock }: { mock: TasteMock }) {
  return (
    <div className="relative w-40 shrink-0 overflow-hidden rounded-medium border border-border shadow-floating">
      <OrganicField tone="clay" className="h-16 w-full" />
      <div className="bg-surface-elevated p-2.5">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-text-muted">Taste Issue 001</p>
        <p className="mt-0.5 text-sm font-black leading-4 text-text-primary">{mock.title}</p>
      </div>
    </div>
  );
}

function BackCover({
  mock,
  onShare,
  onCopy,
  onSave,
  onCreateYourIssue,
  shareLabel,
}: {
  mock: TasteMock;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onCreateYourIssue: () => void;
  shareLabel: string;
}) {
  return (
    <section className="bg-background px-5 py-10">
      <p className="font-serif text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Back Cover</p>
      <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-text-primary">이번 호가 준비됐어요</h2>
      <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">친구에게 이 호를 보내볼까요?</p>

      <div className="mt-5 flex items-center gap-3">
        <MiniCover mock={mock} />
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {mock.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[11px] font-bold text-primary">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <button type="button" onClick={onShare} className="mt-6 w-full rounded-pill bg-primary py-4 text-base font-extrabold text-primary-foreground">
        {shareLabel}
      </button>
      <p className="mt-1.5 text-center font-serif text-[10px] italic text-text-muted">Share This Issue</p>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCopy} className="flex-1 rounded-pill border border-border py-3 text-sm font-extrabold text-text-primary">
          링크 복사
        </button>
        <button type="button" onClick={onSave} className="flex-1 rounded-pill border border-border py-3 text-sm font-extrabold text-text-primary">
          이미지로 저장
        </button>
      </div>

      <button type="button" onClick={onCreateYourIssue} className="mt-6 w-full text-sm font-extrabold text-text-secondary underline underline-offset-2">
        다음 호 만들기 — Create Your Issue
      </button>

      <div aria-hidden="true" className="mt-8 h-px w-full bg-border" />
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">MAP Decision — Issue 001</p>
    </section>
  );
}

export function PersonalMagazinePrototype() {
  const [toast, setToast] = useState<string | null>(null);
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  };
  const mock = useMemo(() => MOCK, []);

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <div className="sticky top-0 z-50 border-b border-dashed border-border-strong bg-background-subtle/95 px-3 py-2 text-center text-[11px] font-bold text-text-muted backdrop-blur">
        DEV PROTOTYPE — PERSONAL MAGAZINE CONCEPT (production 미연결)
      </div>
      <div className="mx-auto max-w-md">
        <Cover mock={mock} onShare={() => flash("공유 준비 (프로토타입)")} />
        <TasteEdit mock={mock} />
        <CenterSpread mock={mock} />
        <EditorialNotes mock={mock} />
        <BackCover
          mock={mock}
          shareLabel="이 호 공유하기"
          onShare={() => flash("공유 준비 (프로토타입)")}
          onCopy={() => flash("링크 복사됨 (프로토타입)")}
          onSave={() => flash("이미지 저장 (프로토타입)")}
          onCreateYourIssue={() => flash("다음 호로 이동 (프로토타입)")}
        />
      </div>
      {toast ? (
        <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-pill bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-floating">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

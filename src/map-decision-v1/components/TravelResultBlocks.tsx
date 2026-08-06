import type { ReactNode } from "react";
import { TravelFit, TravelMatrix, TravelMatrixPoint, TravelResult, TravelRoadmap, TravelSelfReflection } from "../types";
import { Card } from "./ui/primitives";

// 여행 스타일 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트
// 모음. TasteResultBlocks.tsx와 같은 원리(생성 상태·공유 버튼 없는
// "use client" 불필요 파일)이지만, 다른 여섯 주제 코드를 건드리지
// 않기 위해 별도 파일로 새로 작성했다 — 라이브 결과 화면
// (TravelCard.tsx)과 공유 읽기 전용 화면(app/r/[id]/page.tsx, 다음
// 작업) 둘 다에서 재사용할 예정이다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// TasteResultBlocks.tsx의 SectionHeader와 같은 이유(PR #150)로 영문
// eyebrow 텍스트 대신 작은 색상 바를 쓴다.
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

const NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: "criteria", label: "기준" },
  { id: "patterns", label: "패턴" },
  { id: "matrix", label: "매트릭스" },
  { id: "fit", label: "적합" },
  { id: "reflection", label: "성찰" },
  { id: "roadmap", label: "로드맵" },
];

// 이유·구현 방식은 TasteResultBlocks.tsx의 같은 이름 컴포넌트와
// 동일하다(구조를 통일하기 위해 그대로 복제) — 주석은 그쪽에 적었다.
function SectionNav() {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background py-2">
      <div className="flex gap-1.5 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex min-h-8 shrink-0 items-center rounded-pill border border-border bg-surface-elevated px-1.5 text-xs font-bold text-text-secondary shadow-subtle transition-colors hover:text-text-primary"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// 다른 다섯 주제와 태그 축 일부를 공유하는 사전을 재사용하므로 시각적
// 표현도 TasteTagRow(TasteResultBlocks.tsx)와 동일하게 맞춘다 — 클래스는
// 그대로 복사했다(디자인 토큰만 참조하므로 다른 파일을 건드리지 않는다).
export function TravelTagRow({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className={cx("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center rounded-pill bg-tag-fill px-2.5 py-1 text-xs font-extrabold text-text-primary">
          {tag}
        </span>
      ))}
    </div>
  );
}

function HeroHeader({ result }: { result: TravelResult }) {
  return (
    <Card id="summary" className="scroll-mt-6 p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        여행 스타일 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      <TravelTagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

type CriteriaTone = "strong" | "medium" | "light";
const CRITERIA_TIER_CLASS: Record<CriteriaTone, string> = {
  strong: "border-primary bg-ink-wash",
  medium: "border-border-strong bg-ink-wash",
  light: "border-dashed border-border bg-surface",
};

function CriteriaTier({ label, items, tone }: { label: string; items: string[]; tone: CriteriaTone }) {
  return (
    <div className={cx("rounded-medium border p-3", CRITERIA_TIER_CLASS[tone])}>
      <p className="text-xs font-black text-text-primary">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-xs font-bold leading-5 text-text-primary">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TravelCriteriaSection({ travelCriteria }: { travelCriteria: TravelResult["travelCriteria"] }) {
  return (
    <Card id="criteria" className="scroll-mt-16 flex flex-col gap-4">
      <SectionHeader title="여행에서 포기 못 하는 것" description="답변에서 드러난 우선순위를 세 단계로 나눠봤어요." />
      <div className="grid gap-3 sm:grid-cols-3">
        <CriteriaTier label="포기 못 하는 것" items={travelCriteria.mustHave} tone="strong" />
        <CriteriaTier label="있으면 좋은 것" items={travelCriteria.niceToHave} tone="medium" />
        <CriteriaTier label="없어도 되는 것" items={travelCriteria.optional} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card id="patterns" className="scroll-mt-16 flex flex-col gap-3">
      <SectionHeader title="반복되는 여행 패턴" description="답변을 가로질러 반복되는 방식이에요." />
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <blockquote key={index} className="rounded-medium border border-border bg-surface-elevated p-3 text-sm font-bold leading-6 text-text-primary">
            “{item}”
          </blockquote>
        ))}
      </div>
    </Card>
  );
}

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = TravelMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: TravelMatrixPoint[]): PlottedMatrixPoint[] {
  const minDistance = 14;
  const placed: PlottedMatrixPoint[] = points.map((point) => ({ ...point, plotX: point.x, plotY: 100 - point.y }));

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

// 다른 다섯 주제의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다
// (design-check #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지
// 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: TravelMatrix }) {
  const placed = spreadMatrixPoints(matrix.types);
  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="mb-1 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.high}</p>
      <div className="flex items-center gap-2">
        <p className="w-12 shrink-0 text-right text-[11px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <rect x="1" y="1" width="98" height="98" rx="4" className="fill-none stroke-border" strokeWidth="1" />
            <line x1="50" y1="1" x2="50" y2="99" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="1" y1="50" x2="99" y2="50" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            {placed.map((point, index) => (
              <g key={index}>
                <title>{point.label}</title>
                <circle
                  cx={point.plotX}
                  cy={point.plotY}
                  r="4.2"
                  className="fill-primary stroke-surface"
                  fillOpacity={MATRIX_POINT_OPACITY[index % MATRIX_POINT_OPACITY.length]}
                  strokeWidth="0.8"
                />
                <text
                  x={point.plotX}
                  y={point.plotY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cx(MATRIX_POINT_NUMBER_CLASS[index % MATRIX_POINT_NUMBER_CLASS.length], "font-black")}
                  style={{ fontSize: "4px" }}
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="w-12 shrink-0 text-left text-[11px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.high}</p>
      </div>
      <p className="mt-1 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.low}</p>
    </div>
  );
}

function MatrixSection({ matrix }: { matrix: TravelMatrix }) {
  return (
    <Card id="matrix" className="scroll-mt-16 flex flex-col gap-4">
      <SectionHeader title="나의 여러 모습" description="답변에서 나온 4가지 여행 모습을 놓고 봤어요." />
      <MatrixChart matrix={matrix} />
      <ul className="flex flex-col gap-2">
        {matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-sm font-semibold text-text-secondary">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border border-border bg-surface-elevated text-[11px] font-black text-text-primary">
              {index + 1}
            </span>
            <span>
              <span className="font-black text-text-primary">{point.label}</span> — {point.description}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TravelFitSection({ travelFit }: { travelFit: TravelFit }) {
  return (
    <Card id="fit" className="scroll-mt-16 flex flex-col gap-4">
      <SectionHeader title="잘 맞는 방식, 안 맞는 방식" description="답변 패턴을 근거로 짚어본 여행 방식이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            잘 맞는 방식
          </p>
          <ul className="mt-1.5 space-y-1">
            {travelFit.goodFit.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-error">
            <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            안 맞는 방식
          </p>
          <ul className="mt-1.5 space-y-1">
            {travelFit.poorFit.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

// 다른 다섯 주제의 SelfReflectionSection과 완전히 같은 발상(반전 배경으로
// 강조)이라 시각 스타일도 그대로 가져왔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: TravelSelfReflection }) {
  return (
    <div
      id="reflection"
      className="scroll-mt-16 flex flex-col gap-7 rounded-large border-2 border-primary bg-primary p-5 text-primary-foreground shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary-foreground" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-primary-foreground sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-primary-foreground-soft">답변을 모아서 본 나의 여행 방식이에요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-foreground-soft">내가 알아채고 있는 것</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-primary-foreground-wash bg-primary-foreground-wash p-4 sm:p-5">
          {selfReflection.awareness.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-primary-foreground sm:text-lg sm:leading-8">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-foreground-soft">잘 안 보이는 부분</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-primary-foreground-wash-strong p-4 sm:p-5">
          {selfReflection.blindSpots.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-primary-foreground-strong sm:text-lg sm:leading-8">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoadmapSection({ roadmap }: { roadmap: TravelRoadmap }) {
  return (
    <Card id="roadmap" className="scroll-mt-16 flex flex-col gap-4">
      <SectionHeader title="로드맵" description="바로 시도해볼 것부터 30일 계획까지예요." />
      <div className="rounded-medium border border-primary bg-surface p-3">
        <p className="text-xs font-black text-primary">24시간 안에</p>
        <p className="mt-1 text-sm font-bold leading-6 text-text-primary">{roadmap.firstAction}</p>
      </div>
      <ol className="flex flex-col gap-4">
        {roadmap.phases.map((phase, index) => (
          <li key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-pill border border-primary bg-surface-elevated text-xs font-black text-primary">
                {index + 1}
              </span>
              {index < roadmap.phases.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="pb-1">
              <p className="text-sm font-black text-text-primary">{phase.label}</p>
              <ul className="mt-1 space-y-1">
                {phase.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="text-xs font-semibold leading-5 text-text-secondary">
                    · {action}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function TravelResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: TravelResult;
  afterHero?: ReactNode;
  afterReflection?: ReactNode;
  showHero?: boolean;
}) {
  return (
    <>
      {showHero ? <HeroHeader result={result} /> : null}
      {afterHero}
      <SectionNav />
      <TravelCriteriaSection travelCriteria={result.travelCriteria} />
      <PatternsSection items={result.patterns} />
      <MatrixSection matrix={result.matrix} />
      <TravelFitSection travelFit={result.travelFit} />
      <SelfReflectionSection selfReflection={result.selfReflection} />
      {afterReflection}
      <RoadmapSection roadmap={result.roadmap} />
    </>
  );
}

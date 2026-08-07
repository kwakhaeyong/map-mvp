import type { ReactNode } from "react";
import { TasteMap, TasteMatrix, TasteMatrixPoint, TasteResult, TasteRoadmap, TasteSelfReflection } from "../types";
import { Card } from "./ui/primitives";

// 취향 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트 모음.
// WorkResultBlocks.tsx와 같은 원리(생성 상태·공유 버튼 없는 "use client"
// 불필요 파일)이지만, 다른 다섯 주제 코드를 건드리지 않기 위해 별도
// 파일로 새로 작성했다 — 라이브 결과 화면(TasteCard.tsx)과 공유
// 읽기 전용 화면(app/r/[id]/page.tsx, 다음 작업) 둘 다에서 재사용할
// 예정이다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// WorkResultBlocks.tsx의 SectionHeader와 같은 이유(PR #150)로 영문
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


// 다른 네 주제와 태그 축 일부를 공유하는 사전을 재사용하므로 시각적
// 표현도 WorkTagRow(WorkResultBlocks.tsx)와 동일하게 맞춘다 — 클래스는
// 그대로 복사했다(디자인 토큰만 참조하므로 다른 파일을 건드리지 않는다).
export function TasteTagRow({ tags, className }: { tags: string[]; className?: string }) {
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

function HeroHeader({ result }: { result: TasteResult }) {
  return (
    <Card className="p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        취향 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      <TasteTagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

type CoreTone = "strong" | "medium" | "light";
const CORE_TIER_CLASS: Record<CoreTone, string> = {
  strong: "border-primary bg-ink-wash",
  medium: "border-border-strong bg-ink-wash",
  light: "border-dashed border-border bg-surface",
};

function CoreTier({ label, items, tone }: { label: string; items: string[]; tone: CoreTone }) {
  return (
    <div className={cx("rounded-medium border p-3", CORE_TIER_CLASS[tone])}>
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

function TasteCoreSection({ tasteCore }: { tasteCore: TasteResult["tasteCore"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="내 취향의 중심" description="답변에서 드러난 확실함의 정도를 세 단계로 나눠봤어요." />
      <div className="grid gap-3 sm:grid-cols-3">
        <CoreTier label="확실한 것" items={tasteCore.certain} tone="strong" />
        <CoreTier label="상황 따라 다른 것" items={tasteCore.conditional} tone="medium" />
        <CoreTier label="안 끌리는 것" items={tasteCore.indifferent} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="반복되는 취향 패턴" description="답변을 가로질러 반복되는 결이에요." />
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <blockquote key={index} className="rounded-medium border border-border border-l-4 border-l-primary bg-surface-elevated p-3 text-sm font-bold leading-6 text-text-primary">
            {item}
          </blockquote>
        ))}
      </div>
    </Card>
  );
}

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = TasteMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: TasteMatrixPoint[]): PlottedMatrixPoint[] {
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

// 다른 네 주제의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다
// (design-check #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지
// 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: TasteMatrix }) {
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

function MatrixSection({ matrix }: { matrix: TasteMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="나의 여러 모습" description="답변에서 나온 4가지 취향 모습을 놓고 봤어요." />
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

function TasteMapSection({ tasteMap }: { tasteMap: TasteMap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="넓혀볼 방향, 안 맞을 방향" description="답변 패턴을 근거로 짚어본 방향이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            넓혀볼 만한 방향
          </p>
          <ul className="mt-1.5 space-y-1">
            {tasteMap.expand.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-error">
            <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            안 맞을 방향
          </p>
          <ul className="mt-1.5 space-y-1">
            {tasteMap.avoid.map((item, index) => (
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

// 다른 네 주제의 SelfReflectionSection과 완전히 같은 발상(반전 배경으로
// 강조)이라 시각 스타일도 그대로 가져왔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: TasteSelfReflection }) {
  return (
    <div
      className="flex flex-col gap-7 rounded-large border-2 border-primary bg-primary p-5 text-primary-foreground shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary-foreground" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-primary-foreground sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-primary-foreground-soft">답변을 모아서 본 나의 취향이에요.</p>
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

function RoadmapSection({ roadmap }: { roadmap: TasteRoadmap }) {
  return (
    <Card className="flex flex-col gap-4">
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

export function TasteResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: TasteResult;
  afterHero?: ReactNode;
  afterReflection?: ReactNode;
  showHero?: boolean;
}) {
  return (
    <>
      {showHero ? <HeroHeader result={result} /> : null}
      {afterHero}
      <TasteCoreSection tasteCore={result.tasteCore} />
      <PatternsSection items={result.patterns} />
      <MatrixSection matrix={result.matrix} />
      <TasteMapSection tasteMap={result.tasteMap} />
      <SelfReflectionSection selfReflection={result.selfReflection} />
      {afterReflection}
      <RoadmapSection roadmap={result.roadmap} />
    </>
  );
}

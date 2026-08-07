import type { ReactNode } from "react";
import { SelfIntroMatrix, SelfIntroMatrixPoint, SelfIntroResult, SelfIntroRoadmap, SelfIntroTraits, IdealTypeSelfReflection } from "../types";
import { Card } from "./ui/primitives";

// 나 소개·성격 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트
// 모음. IdealTypeResultBlocks.tsx와 같은 원리(생성 상태·공유 버튼 없는
// "use client" 불필요 파일)이지만, 이상형 코드를 건드리지 않기 위해
// 별도 파일로 새로 작성했다 — 라이브 결과 화면(SelfIntroCard.tsx)과
// 공유 읽기 전용 화면(app/r/[id]/page.tsx) 둘 다에서 재사용한다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// IdealTypeResultBlocks.tsx의 SectionHeader와 같은 이유로 영문 eyebrow
// 텍스트("Values"·"Patterns" 등) 대신 작은 색상 바를 쓴다 — 바로
// 아래의 한글 제목과 겹쳐 정체 모를 영문 코드명으로 보이던 문제를
// 없애면서, 위계 구분 역할은 그대로 유지한다.
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// 이상형과 완전히 같은 4축·18개 태그 사전을 재사용하므로 시각적 표현도
// TagRow(IdealTypeResultBlocks.tsx)와 동일하게 맞춘다 — 다만 그 컴포넌트는
// export 돼 있지 않아(파일 내부용) 여기서 새로 작성했다. 클래스는
// 그대로 복사했다(디자인 토큰만 참조하므로 이상형 파일을 건드리지 않는다).
export function SelfIntroTagRow({ tags, className }: { tags: string[]; className?: string }) {
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

function HeroHeader({ result }: { result: SelfIntroResult }) {
  return (
    <Card className="p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        나 소개 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      <SelfIntroTagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

type ValueTone = "strong" | "medium" | "light";
const VALUE_TIER_CLASS: Record<ValueTone, string> = {
  strong: "border-primary bg-ink-wash",
  medium: "border-border-strong bg-ink-wash",
  light: "border-dashed border-border bg-surface",
};

function ValueTier({ label, items, tone }: { label: string; items: string[]; tone: ValueTone }) {
  return (
    <div className={cx("rounded-medium border p-3", VALUE_TIER_CLASS[tone])}>
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

function CoreValuesSection({ coreValues }: { coreValues: SelfIntroResult["coreValues"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="핵심 가치관" description="답변에서 추론한 우선순위를 세 단계로 나눠봤어요." />
      <div className="grid gap-3 sm:grid-cols-3">
        <ValueTier label="꼭 지키는 것" items={coreValues.mustKeep} tone="strong" />
        <ValueTier label="중요하게 여기는 것" items={coreValues.important} tone="medium" />
        <ValueTier label="유연하게 넘어가는 것" items={coreValues.flexible} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="반복되는 패턴" description="답변을 가로질러 반복되는 행동이에요." />
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

type PlottedMatrixPoint = SelfIntroMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: SelfIntroMatrixPoint[]): PlottedMatrixPoint[] {
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

// 이상형의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다(design-check
// #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: SelfIntroMatrix }) {
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

function MatrixSection({ matrix }: { matrix: SelfIntroMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="나의 여러 모습" description="답변에서 나온 4가지 내 모습을 놓고 봤어요." />
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

function TraitsSection({ traits }: { traits: SelfIntroTraits }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="특징" description="이 사람과 지낼 때 참고하면 좋을 점이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            강점
          </p>
          <ul className="mt-1.5 space-y-1">
            {traits.strengths.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-error">
            <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            주의점
          </p>
          <ul className="mt-1.5 space-y-1">
            {traits.cautions.map((item, index) => (
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

// 이상형의 SelfReflectionSection과 완전히 같은 발상(반전 배경으로 강조,
// docs/NASOGAE_DESIGN.md 4번)이라 시각 스타일도 그대로 가져왔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: IdealTypeSelfReflection }) {
  return (
    <div
      className="flex flex-col gap-7 rounded-large border-2 border-primary bg-primary p-5 text-primary-foreground shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary-foreground" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-primary-foreground sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-primary-foreground-soft">행동 답변을 모아서 본 나의 모습이에요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-foreground-soft">내가 주고 있는 것</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-primary-foreground-wash bg-primary-foreground-wash p-4 sm:p-5">
          {selfReflection.whatYouOffer.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-primary-foreground sm:text-lg sm:leading-8">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary-foreground-soft">보완할 부분</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-primary-foreground-wash-strong p-4 sm:p-5">
          {selfReflection.whatToImprove.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-primary-foreground-strong sm:text-lg sm:leading-8">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoadmapSection({ roadmap }: { roadmap: SelfIntroRoadmap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="다음 행동" description="바로 시도해볼 것부터 30일 계획까지예요." />
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
              {/* 체크박스 모양(빈 사각형, 채우기 없음)은 순수 시각 표현이다 —
                  클릭 상태를 저장할 수단이 없어 실제로 체크되지는 않는다.
                  아이콘을 li 밖에 두고 텍스트를 span으로 감싸 flex로 배치한
                  것은, 항목이 두 줄로 넘어갈 때 둘째 줄이 아이콘 아래(왼쪽
                  끝)가 아니라 첫 줄 텍스트 시작 위치에 맞춰 정렬되게 하기
                  위해서다 — text-indent가 아니라 flex 자식 정렬이라야
                  줄바꿈된 텍스트가 자연스럽게 첫 줄과 같은 지점에서
                  시작한다. */}
              <ul className="mt-1 space-y-2">
                {phase.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start gap-1.5 text-xs font-semibold leading-5 text-text-secondary">
                    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" aria-hidden="true">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="3" className="fill-none stroke-primary" strokeWidth="1.5" />
                    </svg>
                    <span>{action}</span>
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

export function SelfIntroResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: SelfIntroResult;
  afterHero?: ReactNode;
  afterReflection?: ReactNode;
  showHero?: boolean;
}) {
  return (
    <>
      {showHero ? <HeroHeader result={result} /> : null}
      {afterHero}
      <CoreValuesSection coreValues={result.coreValues} />
      <PatternsSection items={result.patterns} />
      <MatrixSection matrix={result.matrix} />
      <TraitsSection traits={result.traits} />
      <SelfReflectionSection selfReflection={result.selfReflection} />
      {afterReflection}
      <RoadmapSection roadmap={result.roadmap} />
    </>
  );
}

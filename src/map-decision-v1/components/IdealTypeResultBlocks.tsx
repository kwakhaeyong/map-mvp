import { resolveSilhouetteParts } from "../engine/ideal-type-silhouette";
import { IdealTypeFlags, IdealTypeMatrix, IdealTypeMatrixPoint, IdealTypeResult, IdealTypeRoadmap, IdealTypeSelfReflection, IdealTypeSilhouetteLabels } from "../types";
import { CombinedSilhouette } from "./IdealTypeVisualParts";
import { Card } from "./ui/primitives";

// 이상형 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트 모음.
// 생성 상태 관리(useState/useEffect)나 공유 버튼 같은 상호작용은 여기
// 없다 — 그래서 이 파일은 "use client"가 필요 없고, 라이브 결과 화면
// (IdealTypeCard.tsx)과 공유 링크 읽기 전용 화면(app/r/[id]/page.tsx)
// 둘 다에서 그대로 재사용한다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <div>
        <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

const NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: "silhouette", label: "실루엣" },
  { id: "criteria", label: "기준" },
  { id: "patterns", label: "패턴" },
  { id: "matrix", label: "매트릭스" },
  { id: "flags", label: "신호등" },
  { id: "reflection", label: "성찰" },
  { id: "roadmap", label: "로드맵" },
];

function SectionNav({ showSilhouette }: { showSilhouette: boolean }) {
  const items = showSilhouette ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.id !== "silhouette");
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="inline-flex min-h-8 items-center rounded-pill border border-border bg-surface-elevated px-3 text-xs font-bold text-text-secondary shadow-subtle transition-colors hover:text-text-primary"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

// result.silhouette가 있어도(라벨 5개는 존재해도) 아주 오래된 공유
// 링크가 지금은 없는 옛날 라벨을 들고 있으면 resolveSilhouetteParts가
// null을 돌려준다 — 이때는 깨진 그림 대신 이 섹션 자체를 생략하고
// 나머지 텍스트 결과는 그대로 보여준다(런타임 안전장치).
function SilhouetteSection({ labels }: { labels: IdealTypeSilhouetteLabels }) {
  const parts = resolveSilhouetteParts(labels);
  if (!parts) return null;
  return (
    <Card id="silhouette" className="scroll-mt-6 flex flex-col items-center gap-3">
      <div className="flex w-full items-start gap-2">
        <span className="text-lg" aria-hidden="true">🎨</span>
        <div>
          <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">외모 취향 실루엣</h2>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">퀴즈에서 직접 고른 그림 그대로예요.</p>
        </div>
      </div>
      <CombinedSilhouette parts={parts} />
      <p className="break-keep text-center text-xs font-bold leading-5 text-text-secondary">
        {labels.hairStyle} · {labels.hairColor} · {labels.clothingStyle} · {labels.accessory} · {labels.colorImpression}
      </p>
    </Card>
  );
}

// MBTI의 "ENFP"처럼 친구끼리 바로 비교할 수 있는 공용 태그 — 고유한
// title/oneLiner 바로 아래, 폰 화면 스크롤 없이 첫 화면에서 보이는
// 위치에 둔다. result.tags가 없는(이 기능 이전에 만들어진) 결과·공유
// 링크는 그냥 이 줄만 생략되고 나머지는 그대로 보인다.
function TagRow({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-pill border border-border/60 bg-surface/70 px-2.5 py-1 text-xs font-extrabold text-text-primary"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function HeroHeader({ result }: { result: IdealTypeResult }) {
  return (
    <Card id="summary" className="scroll-mt-6 bg-gradient-to-br from-value via-feeling to-action p-5">
      <span className="inline-flex items-center rounded-pill border border-border/60 bg-surface-elevated/80 px-3 py-1 text-xs font-extrabold text-text-primary">
        💘 이상형 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary/90">{result.oneLiner}</p>
      <TagRow tags={result.tags ?? []} />
    </Card>
  );
}

type CriteriaTone = "strong" | "medium" | "light";
const CRITERIA_TIER_CLASS: Record<CriteriaTone, string> = {
  strong: "border-primary bg-value/70",
  medium: "border-border-strong bg-feeling/50",
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

function CriteriaSection({ criteria }: { criteria: IdealTypeResult["criteria"] }) {
  return (
    <Card id="criteria" className="scroll-mt-6 flex flex-col gap-4">
      <SectionHeader icon="📋" title="이상형 기준" description="답변에서 우선순위를 세 단계로 나눠봤어요." />
      <div className="grid gap-3 sm:grid-cols-3">
        <CriteriaTier label="필수" items={criteria.mustHave} tone="strong" />
        <CriteriaTier label="선호" items={criteria.niceToHave} tone="medium" />
        <CriteriaTier label="타협 가능" items={criteria.canCompromise} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card id="patterns" className="scroll-mt-6 flex flex-col gap-3">
      <SectionHeader icon="🔁" title="끌림 패턴" description="답변을 가로질러 반복되는 경향이에요." />
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

// 진로 결과 화면(FinalResultBlocks.tsx)의 2x2 매트릭스와 같은 방식 —
// 점끼리 너무 가까우면 숫자가 겹치니 살짝 밀어내는 단순 반발 알고리즘.
// (최대 4개뿐이라 O(n^2)이어도 비용 무시 가능한 수준.)
const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = IdealTypeMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: IdealTypeMatrixPoint[]): PlottedMatrixPoint[] {
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

// 리터럴 클래스 문자열로만 참조한다 — 동적으로 조합하면 Tailwind JIT
// 스캐너가 소스에서 문자열을 못 찾아 클래스가 생성되지 않는다.
const MATRIX_POINT_FILL_CLASS = ["fill-value", "fill-feeling", "fill-action", "fill-uncertainty"];

function MatrixChart({ matrix }: { matrix: IdealTypeMatrix }) {
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
                  className={cx(MATRIX_POINT_FILL_CLASS[index % MATRIX_POINT_FILL_CLASS.length], "stroke-surface")}
                  strokeWidth="0.8"
                />
                <text x={point.plotX} y={point.plotY} textAnchor="middle" dominantBaseline="central" className="fill-text-primary font-black" style={{ fontSize: "4px" }}>
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

function MatrixSection({ matrix }: { matrix: IdealTypeMatrix }) {
  return (
    <Card id="matrix" className="scroll-mt-6 flex flex-col gap-4">
      <SectionHeader icon="📍" title="끌림 × 관계 적합도" description="답변에서 나온 4가지 상대 유형을 놓고 봤어요." />
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

function FlagsSection({ flags }: { flags: IdealTypeFlags }) {
  return (
    <Card id="flags" className="scroll-mt-6 flex flex-col gap-4">
      <SectionHeader icon="🚦" title="신호등" description="실제로 만날 때 참고할 신호들이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-option/60 bg-option/40 p-3">
          <p className="text-xs font-black text-success">🟢 좋은 신호</p>
          <ul className="mt-1.5 space-y-1">
            {flags.green.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-risk/60 bg-risk/50 p-3">
          <p className="text-xs font-black text-error">🔴 주의 신호</p>
          <ul className="mt-1.5 space-y-1">
            {flags.red.map((item, index) => (
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

// ★가장 강조하는 섹션★ — 킬러 요소라 다른 카드보다 테두리·배경을
// 눈에 띄게 다르게 만든다(진로 결과의 "핵심 메시지·통찰" 카드와 같은
// border-primary + bg-surface-elevated 강조 처리를 그대로 따른다).
function SelfReflectionSection({ selfReflection }: { selfReflection: IdealTypeSelfReflection }) {
  return (
    <Card id="reflection" className="scroll-mt-6 flex flex-col gap-4 border-2 border-primary bg-surface-elevated shadow-floating">
      <SectionHeader icon="✨" title="자기 성찰" description="이상형 답변을 뒤집어서 본 나의 모습이에요." />
      <div className="rounded-medium border border-value bg-value/50 p-3">
        <p className="text-xs font-black text-text-primary">내가 줄 수 있는 것</p>
        <ul className="mt-1.5 space-y-1.5">
          {selfReflection.whatYouOffer.map((item, index) => (
            <li key={index} className="text-sm font-bold leading-6 text-text-primary">
              · {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-medium border border-action bg-action/50 p-3">
        <p className="text-xs font-black text-text-primary">내가 보완할 부분</p>
        <ul className="mt-1.5 space-y-1.5">
          {selfReflection.whatToImprove.map((item, index) => (
            <li key={index} className="text-sm font-bold leading-6 text-text-primary">
              · {item}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function RoadmapSection({ roadmap }: { roadmap: IdealTypeRoadmap }) {
  return (
    <Card id="roadmap" className="scroll-mt-6 flex flex-col gap-4">
      <SectionHeader icon="🗺️" title="로드맵" description="바로 시작할 수 있는 것부터 30일 계획까지예요." />
      <div className="rounded-medium border border-primary bg-surface p-3">
        <p className="text-xs font-black text-primary">⚡ 24시간 안에</p>
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

// 라이브 결과 화면과 공유 읽기 전용 화면이 공통으로 쓰는 전체 블록
// 묶음. 공유하기/다시 만들기 같은 버튼은 호출부가 각자 다르게 붙인다.
export function IdealTypeResultBlocks({ result }: { result: IdealTypeResult }) {
  return (
    <>
      <HeroHeader result={result} />
      <SectionNav showSilhouette={Boolean(result.silhouette)} />
      {result.silhouette ? <SilhouetteSection labels={result.silhouette} /> : null}
      <CriteriaSection criteria={result.criteria} />
      <PatternsSection items={result.attractionPatterns} />
      <MatrixSection matrix={result.matrix} />
      <FlagsSection flags={result.flags} />
      <SelfReflectionSection selfReflection={result.selfReflection} />
      <RoadmapSection roadmap={result.roadmap} />
    </>
  );
}

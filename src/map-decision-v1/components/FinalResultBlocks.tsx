"use client";

import { nodeLabels } from "../engine/thinking-extractor";
import { FactorMatrixBlock, FinalResult, InsightBlock, MapSession, NodeKind, ResultBlockKey, ScenarioBlock, TimelineBlock } from "../types";
import { Badge, Button, Card, ReflectionCard } from "./ui/primitives";

export type BlockRegenControls = { onRegenerate: () => void; isRegenerating: boolean; error: string | null };

function RegenerateButton({ onRegenerate, isRegenerating }: { onRegenerate: () => void; isRegenerating: boolean }) {
  return (
    <Button variant="secondary" size="sm" className="shrink-0" onClick={onRegenerate} disabled={isRegenerating}>
      {isRegenerating ? "다시 만드는 중…" : "다시 생성"}
    </Button>
  );
}

function BlockHeader({
  title,
  description,
  regen,
}: {
  title: string;
  description: string;
  regen: BlockRegenControls;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em]">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{description}</p>
        </div>
        <RegenerateButton onRegenerate={regen.onRegenerate} isRegenerating={regen.isRegenerating} />
      </div>
      {regen.error ? <p className="mt-3 text-sm font-bold text-error">{regen.error}</p> : null}
    </div>
  );
}

type BadgeTone = "default" | "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action" | "success" | "error";

const KIND_TONE: Record<NodeKind, BadgeTone> = {
  topic: "default",
  trigger: "fact",
  fact: "fact",
  emotion: "feeling",
  person: "default",
  value: "value",
  reason: "fact",
  constraint: "risk",
  option: "option",
  benefit: "option",
  risk: "risk",
  missing: "uncertainty",
  direction: "action",
  action: "action",
  correction: "default",
};

// Tailwind's build-time scanner only picks up class names it can see as
// complete literal strings in the source, so a template-interpolated
// `fill-${tone}` would silently produce no CSS. Each value below must stay a
// full, literal class name for that reason.
const KIND_FILL_CLASS: Record<NodeKind, string> = {
  topic: "fill-text-muted",
  trigger: "fill-fact",
  fact: "fill-fact",
  emotion: "fill-feeling",
  person: "fill-text-muted",
  value: "fill-value",
  reason: "fill-fact",
  constraint: "fill-risk",
  option: "fill-option",
  benefit: "fill-option",
  risk: "fill-risk",
  missing: "fill-uncertainty",
  direction: "fill-action",
  action: "fill-action",
  correction: "fill-text-muted",
};

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedFactor = FactorMatrixBlock["factors"][number] & { plotX: number; plotY: number };

// Full text labels floating next to each dot collide whenever two factors
// sit close together. Instead, dots only carry a small number, the real text
// lives in the legend list below, and this nudges near-coincident dots apart
// so the numbers themselves stay legible — a few passes of simple pairwise
// repulsion, not a general-purpose layout engine (at most 8 factors, so the
// O(n^2) cost is negligible).
function resolveOverlaps(factors: FactorMatrixBlock["factors"]): PlottedFactor[] {
  const minDistance = 12;
  const points: PlottedFactor[] = factors.map((factor) => ({ ...factor, plotX: factor.x, plotY: 100 - factor.y }));

  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[j].plotX - points[i].plotX;
        const dy = points[j].plotY - points[i].plotY;
        const distance = Math.hypot(dx, dy) || 0.001;
        if (distance < minDistance) {
          const push = (minDistance - distance) / 2;
          const unitX = dx / distance;
          const unitY = dy / distance;
          points[i].plotX -= unitX * push;
          points[i].plotY -= unitY * push;
          points[j].plotX += unitX * push;
          points[j].plotY += unitY * push;
        }
      }
    }
  }

  return points.map((point) => ({ ...point, plotX: clampPercent(point.plotX), plotY: clampPercent(point.plotY) }));
}

function FactorMatrixChart({ block }: { block: FactorMatrixBlock }) {
  const placed = resolveOverlaps(block.factors);
  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-1 text-center text-xs font-black text-text-muted">{block.yAxisLabel.high}</p>
      <div className="flex items-center gap-2">
        <p className="w-14 shrink-0 text-right text-xs font-black leading-tight text-text-muted">{block.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <rect x="1" y="1" width="98" height="98" rx="4" className="fill-none stroke-border" strokeWidth="1" />
            <line x1="50" y1="1" x2="50" y2="99" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="1" y1="50" x2="99" y2="50" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            {placed.map((factor, index) => (
              <g key={factor.id}>
                <title>{factor.text}</title>
                <circle
                  cx={factor.plotX}
                  cy={factor.plotY}
                  r="3.6"
                  className={`${KIND_FILL_CLASS[factor.kind]} stroke-surface`}
                  strokeWidth="0.8"
                />
                <text x={factor.plotX} y={factor.plotY} textAnchor="middle" dominantBaseline="central" className="fill-text-primary font-black" style={{ fontSize: "3.8px" }}>
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="w-14 shrink-0 text-left text-xs font-black leading-tight text-text-muted">{block.xAxisLabel.high}</p>
      </div>
      <p className="mt-1 text-center text-xs font-black text-text-muted">{block.yAxisLabel.low}</p>
    </div>
  );
}

function FactorMatrixCard({ block, regen }: { block: FactorMatrixBlock; regen: BlockRegenControls }) {
  return (
    <Card id="factors" className="scroll-mt-6">
      <BlockHeader title="요인과 2x2 매트릭스" description="대화에서 드러난 요인들을 두 기준으로 놓고 봤어요." regen={regen} />
      <div className="mt-8">
        <FactorMatrixChart block={block} />
      </div>
      {block.factors.length > 0 ? (
        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {block.factors.map((factor, index) => (
            <li key={factor.id} className="flex items-start gap-2 text-sm font-semibold text-text-secondary">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border border-border bg-surface-elevated text-[11px] font-black text-text-primary">
                {index + 1}
              </span>
              <Badge tone={KIND_TONE[factor.kind]} className="mt-0.5 shrink-0">
                {nodeLabels[factor.kind]}
              </Badge>
              <span>{factor.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function ScenarioCards({ block, regen }: { block: ScenarioBlock; regen: BlockRegenControls }) {
  return (
    <Card id="scenarios" className="scroll-mt-6">
      <BlockHeader title="시나리오 비교" description="정답을 고르는 게 아니라, 방향별 장단점을 나란히 뒀어요." regen={regen} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {block.scenarios.map((scenario) => {
          const isClosestFit = block.closestFit?.scenarioId === scenario.id;
          return (
            <div
              key={scenario.id}
              className={`rounded-large border p-4 ${isClosestFit ? "border-primary bg-surface-elevated shadow-floating" : "border-border bg-surface"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black">{scenario.name}</h3>
                {isClosestFit ? <Badge tone="success">가장 가까운 방향</Badge> : null}
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">{scenario.summary}</p>
              <div className="mt-3">
                <p className="text-xs font-black text-text-muted">좋은 점</p>
                <ul className="mt-1 space-y-1 text-sm font-semibold text-text-secondary">
                  {scenario.pros.map((pro, index) => (
                    <li key={index}>· {pro}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <p className="text-xs font-black text-text-muted">걸리는 점</p>
                <ul className="mt-1 space-y-1 text-sm font-semibold text-text-secondary">
                  {scenario.cons.map((con, index) => (
                    <li key={index}>· {con}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
      {block.closestFit ? (
        <ReflectionCard className="mt-6">
          <p className="text-sm font-black text-text-primary">가장 가까운 방향에 대한 생각</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">{block.closestFit.reasoning}</p>
        </ReflectionCard>
      ) : (
        <p className="mt-6 text-sm font-semibold text-text-muted">아직 하나를 더 가깝다고 말하기엔 근거가 부족해요. 더 이야기하면 선명해질 수 있어요.</p>
      )}
    </Card>
  );
}

function TimelineSteps({ block, regen }: { block: TimelineBlock; regen: BlockRegenControls }) {
  return (
    <Card id="timeline" className="scroll-mt-6">
      <BlockHeader title="타임라인과 액션 플랜" description="이야기한 내용을 바탕으로 단계별 행동을 정리했어요." regen={regen} />
      <ol className="mt-6 space-y-4">
        {block.phases.map((phase, index) => (
          <li key={phase.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="grid size-8 shrink-0 place-items-center rounded-pill border border-primary bg-surface-elevated text-sm font-black text-primary">
                {index + 1}
              </span>
              {index < block.phases.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="pb-2">
              <p className="font-black">{phase.label}</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-text-secondary">
                {phase.actions.map((action, actionIndex) => (
                  <li key={actionIndex}>· {action}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function InsightCallout({ block, regen }: { block: InsightBlock; regen: BlockRegenControls }) {
  return (
    <Card id="insights" className="scroll-mt-6 border-primary/40 bg-surface-elevated">
      <BlockHeader title="핵심 메시지·통찰" description="혼자서는 잘 안 보였을 수 있는 관점이에요." regen={regen} />
      <ul className="mt-6 space-y-3">
        {block.messages.map((message, index) => (
          <li key={index} className="rounded-medium border border-border bg-surface p-4 text-sm font-bold leading-7 text-text-primary">
            {message}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const NAV_ITEMS: Array<{ id: string; label: string }> = [
  { id: "factors", label: "요인" },
  { id: "scenarios", label: "시나리오" },
  { id: "timeline", label: "타임라인" },
  { id: "insights", label: "통찰" },
];

export function FinalResultSection({
  result,
  regenControls,
}: {
  result: FinalResult;
  regenControls: Record<ResultBlockKey, BlockRegenControls>;
}) {
  return (
    <section className="mt-8" aria-label="최종 결과">
      <div className="flex flex-wrap gap-2 print:hidden">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex min-h-9 items-center rounded-pill border border-border bg-surface-elevated px-4 text-sm font-bold text-text-secondary shadow-subtle transition-colors hover:text-text-primary"
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="mt-4 space-y-6">
        <FactorMatrixCard block={result.factorMatrix} regen={regenControls.factorMatrix} />
        <ScenarioCards block={result.scenarios} regen={regenControls.scenarios} />
        <TimelineSteps block={result.timeline} regen={regenControls.timeline} />
        <InsightCallout block={result.insights} regen={regenControls.insights} />
      </div>
    </section>
  );
}

// Shown instead of FinalResultSection when the AI call for the full 4-block
// result has no key or keeps failing. Deliberately a separate, much simpler
// component rather than FinalResultSection with empty blocks — scenarios,
// timeline, and insights genuinely can't be produced by rules, so we say so
// instead of faking placeholders in cards that otherwise look AI-generated.
export function FallbackSummaryCard({ session, onRetry }: { session: MapSession; onRetry: () => void }) {
  const factors = session.nodes.filter((node) => node.kind !== "missing" && node.kind !== "topic").slice(0, 10);
  const missing = session.nodes.filter((node) => node.kind === "missing");

  return (
    <Card className="mt-8">
      <Badge tone="uncertainty">AI 연결 없음</Badge>
      <h2 className="mt-3 text-xl font-black tracking-[-0.02em]">지금은 AI 연결이 없어 간단 정리만 보여드려요</h2>
      <p className="mt-1 text-sm font-semibold text-text-secondary">
        나눈 대화에서 요인과 확인할 정보만 간단히 정리했어요. 시나리오 비교·타임라인·통찰처럼 더 깊은 분석은 AI가 연결되면 제공돼요.
      </p>

      {factors.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-black text-text-muted">요인</p>
          <ul className="mt-2 space-y-2">
            {factors.map((node) => (
              <li key={node.id} className="flex items-start gap-2 text-sm font-semibold text-text-secondary">
                <Badge tone={KIND_TONE[node.kind]} className="mt-0.5 shrink-0">
                  {node.label}
                </Badge>
                <span>{node.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-black text-text-muted">확인할 정보</p>
          <ul className="mt-2 space-y-1 text-sm font-semibold text-text-secondary">
            {missing.map((node) => (
              <li key={node.id}>· {node.text}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {factors.length === 0 && missing.length === 0 ? (
        <p className="mt-6 text-sm font-semibold text-text-muted">아직 정리할 만한 내용이 적어요. 조금 더 이야기해보세요.</p>
      ) : null}

      <Button className="mt-6" variant="secondary" onClick={onRetry}>
        다시 시도하기
      </Button>
    </Card>
  );
}

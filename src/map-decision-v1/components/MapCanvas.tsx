import { useMemo, useState } from "react";
import { MapNode, MapRelation, MapSession, NodeKind } from "../types";
import { Badge, Button, Card, EmptyState, MapLegend, MapNode as MapNodePrimitive } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 44) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

const nodeType: Partial<Record<NodeKind, "topic" | "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action">> = {
  topic: "topic", trigger: "uncertainty", fact: "fact", emotion: "feeling", person: "feeling", value: "value", reason: "fact", constraint: "uncertainty", option: "option", benefit: "option", risk: "risk", missing: "uncertainty", direction: "action", action: "action", correction: "value",
};

const sampleNodes: MapNode[] = [
  { id: "sample-topic", kind: "topic", label: "핵심 주제", text: "이직할까?", confidence: "user", createdAt: "" },
  { id: "sample-fact", kind: "fact", label: "내가 말한 상황", text: "성장감이 줄어든 일", confidence: "user", createdAt: "" },
  { id: "sample-value", kind: "value", label: "중요한 기준", text: "안정과 성장 사이", confidence: "ai", createdAt: "" },
  { id: "sample-option", kind: "option", label: "가능한 방향", text: "바로 옮기기보다 확인하기", confidence: "ai", createdAt: "" },
  { id: "sample-missing", kind: "missing", label: "확인할 내용", text: "다른 팀 기회와 생활비", confidence: "ai", createdAt: "" },
];

type Point = { x: number; y: number };
type PlacedNode = { node: MapNode; point: Point; relation?: MapRelation; delay: string };

const layoutRings = {
  desktop: [
    { x: 50, y: 18 }, { x: 76, y: 30 }, { x: 80, y: 56 }, { x: 64, y: 78 },
    { x: 36, y: 78 }, { x: 20, y: 56 }, { x: 24, y: 30 }, { x: 50, y: 86 },
    { x: 88, y: 43 }, { x: 12, y: 43 },
  ],
  mobile: [
    { x: 50, y: 16 }, { x: 78, y: 34 }, { x: 72, y: 66 }, { x: 50, y: 84 },
    { x: 28, y: 66 }, { x: 22, y: 34 },
  ],
};

function relationClass(node: MapNode, relation?: MapRelation) {
  if (relation?.strength === "accent" || node.kind === "action" || node.kind === "direction") return "stroke-primary stroke-[2.6]";
  if (relation?.strength === "dotted" || node.kind === "missing" || node.kind === "risk") return "stroke-uncertainty stroke-[2] [stroke-dasharray:2_3]";
  if (node.confidence === "ai") return "stroke-border-strong stroke-[1.8] [stroke-dasharray:6_4] opacity-80";
  return "stroke-border-strong stroke-[1.9]";
}

function edgePath(from: Point, to: Point, index: number) {
  const curve = index % 2 === 0 ? 6 : -6;
  const control: Point = { x: (from.x + to.x) / 2 + curve, y: (from.y + to.y) / 2 - curve };
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

function getViewport(zoom: number, compact: boolean, result: boolean) {
  if (zoom === 0) return "0 0 100 100";
  const size = result ? 86 : compact ? 90 : 82;
  const half = size / 2;
  return `${50 - half} ${50 - half} ${size} ${size}`;
}

export function MapCanvas({ session, sample = false, className, compact = false, result = false }: { session: MapSession; sample?: boolean; className?: string; compact?: boolean; result?: boolean }) {
  const [zoom, setZoom] = useState(0);
  const realNodes = session.nodes.length ? session.nodes : [];
  const nodes = sample ? (realNodes.length ? realNodes : sampleNodes) : realNodes;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outerLimit = result ? 10 : compact ? 5 : 8;
  const outer = nodes.filter((node) => node.id !== center?.id).slice(0, outerLimit);
  const h = result ? "h-[34rem] sm:h-[38rem]" : compact ? "h-[17rem] sm:h-[20rem]" : "h-[30rem]";
  const centerPoint = { x: 50, y: compact ? 52 : 50 };
  const viewport = getViewport(zoom, compact, result);
  const visibleLabel = outer.length ? `${outer.length + 1}개 조각` : "비어 있음";

  const placedNodes = useMemo<PlacedNode[]>(() => outer.map((node, index) => ({
    node,
    point: (compact ? layoutRings.mobile : layoutRings.desktop)[index % (compact ? layoutRings.mobile.length : layoutRings.desktop.length)],
    relation: session.relations.find((rel) => rel.to === node.id || (rel.from === node.id && rel.to === center?.id)),
    delay: `${Math.min(index * 60, 360)}ms`,
  })), [center?.id, compact, outer, session.relations]);

  return (
    <Card className={cx("thinking-map overflow-hidden p-4 sm:p-6", className)} aria-label="실시간 생각 MAP">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><p className="kicker">보이는 흐름</p><h2 className="mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl">말하면 생각이 보입니다.</h2></div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!compact ? <Badge tone={outer.length ? "success" : "default"}>{outer.length ? "흐름 정리 중" : visibleLabel}</Badge> : null}
          {!compact && center ? <div className="flex gap-2" aria-label="MAP 보기 조절"><Button size="sm" variant={zoom ? "secondary" : "primary"} onClick={() => setZoom(0)}>Fit View</Button><Button size="sm" variant={zoom ? "primary" : "secondary"} onClick={() => setZoom((value) => value ? 0 : 1)}>Zoom</Button></div> : null}
        </div>
      </div>
      <div className={cx("relative overflow-hidden rounded-large border border-border bg-surface shadow-subtle", h)}>
        {center ? <>
          <svg className="absolute inset-0 h-full w-full transition-all duration-slow ease-emphasized motion-reduce:transition-none" viewBox={viewport} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {placedNodes.map(({ node, point, relation, delay }, index) => <path key={node.id} d={edgePath(centerPoint, point, index)} className={cx("map-edge fill-none", relationClass(node, relation))} strokeLinecap="round" style={{ animationDelay: delay }} />)}
          </svg>
          <MapNodeView node={center} x={centerPoint.x} y={centerPoint.y} center compact={compact} delay="0ms" />
          {placedNodes.map(({ node, point, delay }) => <MapNodeView key={node.id} node={node} x={point.x} y={point.y} compact={compact} delay={delay} />)}
        </> : <div className="absolute inset-0 grid place-items-center p-8"><EmptyState><p className="font-extrabold text-text-primary">아직 MAP이 비어 있어요.</p><p className="mt-2">첫 이야기를 하면 중심 노드와 관계가 여기에서 자라납니다.</p></EmptyState></div>}
      </div>
      {!compact ? <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><MapLegend items={["fact", "feeling", "option", "uncertainty", "risk", "action"]} /><p className="text-xs font-bold text-text-muted">확정 관계는 실선, 추정·확인 필요 관계는 점선으로 표시돼요.</p></div> : null}
    </Card>
  );
}

function MapNodeView({ node, x, y, center = false, compact = false, delay = "0ms" }: { node: MapNode; x: number; y: number; center?: boolean; compact?: boolean; delay?: string }) {
  const w = center ? (compact ? "w-44 sm:w-52" : "w-56 sm:w-64") : (compact ? "w-32 sm:w-36" : "w-40 sm:w-48");
  return (
    <MapNodePrimitive type={nodeType[node.kind] || "fact"} className={cx("map-node-enter absolute -translate-x-1/2 -translate-y-1/2 text-center", w, center && "border-2", node.confidence === "ai" && "border-dashed")} style={{ left: `${x}%`, top: `${y}%`, animationDelay: delay }}>
      <p className="text-[11px] font-black uppercase tracking-[-0.01em] text-text-secondary">{node.label}</p>
      <p className={cx("mt-1 whitespace-normal break-keep font-extrabold leading-snug", center ? "text-base sm:text-lg" : "text-xs sm:text-sm")}>{shorten(node.text, center ? 64 : compact ? 28 : 36)}</p>
    </MapNodePrimitive>
  );
}

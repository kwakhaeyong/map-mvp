import { MapNode, MapRelation, MapSession, NodeKind } from "../types";
import { Badge, Card, EmptyState, MapLegend, MapNode as MapNodePrimitive } from "./ui/primitives";

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

const positions = [
  { x: 50, y: 20 }, { x: 77, y: 34 }, { x: 72, y: 68 }, { x: 28, y: 68 }, { x: 23, y: 34 }, { x: 50, y: 82 }, { x: 84, y: 52 }, { x: 16, y: 52 },
];

function relationClass(node: MapNode, relation?: MapRelation) {
  if (relation?.strength === "accent" || node.kind === "action" || node.kind === "direction") return "stroke-primary stroke-[2.4]";
  if (relation?.strength === "dotted" || node.kind === "missing" || node.kind === "risk") return "stroke-uncertainty stroke-[1.8] [stroke-dasharray:3_4]";
  return "stroke-border-strong stroke-[1.7]";
}

export function MapCanvas({ session, sample = false, className, compact = false, result = false }: { session: MapSession; sample?: boolean; className?: string; compact?: boolean; result?: boolean }) {
  const realNodes = session.nodes.length ? session.nodes : [];
  const nodes = sample ? (realNodes.length ? realNodes : sampleNodes) : realNodes;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outer = nodes.filter((node) => node.id !== center?.id).slice(0, compact ? 5 : 8);
  const h = result ? "h-[34rem] sm:h-[38rem]" : compact ? "h-[20rem] sm:h-[22rem]" : "h-[30rem]";

  return (
    <Card className={cx("thinking-map overflow-hidden p-4 sm:p-5", className)} aria-label="실시간 생각 MAP">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="kicker">보이는 흐름</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">말하면 생각이 보입니다.</h2></div>
        <Badge tone={outer.length ? "success" : "default"}>{outer.length ? `${outer.length + 1}개 조각` : "비어 있음"}</Badge>
      </div>
      <div className={cx("relative overflow-hidden rounded-large border border-border bg-surface", h)}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {center ? outer.map((node, index) => <line key={node.id} x1="50" y1="50" x2={positions[index].x} y2={positions[index].y} className={relationClass(node, session.relations.find((rel) => rel.to === node.id))} strokeLinecap="round" />) : null}
        </svg>
        {center ? <MapNodeView node={center} x={50} y={50} center compact={compact} /> : <div className="absolute inset-0 grid place-items-center p-8"><EmptyState>첫 이야기를 하면 생각의 중심이 나타나요.</EmptyState></div>}
        {outer.map((node, index) => <MapNodeView key={node.id} node={node} x={positions[index].x} y={positions[index].y} compact={compact} />)}
      </div>
      <div className="mt-4"><MapLegend items={["fact", "feeling", "option", "uncertainty", "risk", "action"]} /></div>
    </Card>
  );
}

function MapNodeView({ node, x, y, center = false, compact = false }: { node: MapNode; x: number; y: number; center?: boolean; compact?: boolean }) {
  const w = center ? (compact ? "w-44 sm:w-48" : "w-52 sm:w-60") : (compact ? "w-28 sm:w-32" : "w-36 sm:w-40");
  return (
    <MapNodePrimitive type={nodeType[node.kind] || "fact"} className={cx("absolute -translate-x-1/2 -translate-y-1/2 text-center", w, center && "border-2", node.confidence === "ai" && "border-dashed")} style={{ left: `${x}%`, top: `${y}%` }}>
      <p className="text-[11px] font-extrabold text-text-secondary">{node.label}</p>
      <p className={cx("mt-1 whitespace-normal break-keep font-extrabold leading-snug", center ? "text-base sm:text-lg" : "text-xs sm:text-sm")}>{shorten(node.text, center ? 54 : 28)}</p>
    </MapNodePrimitive>
  );
}

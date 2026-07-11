import { MapNode, MapSession, NodeKind } from "../types";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 44) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

const nodeTone: Record<NodeKind, { fill: string; border: string; text: string; ring?: string }> = {
  topic: { fill: "#15213b", border: "#15213b", text: "#ffffff" },
  trigger: { fill: "#fff0c9", border: "#f0c76f", text: "#5f420f" },
  fact: { fill: "#dcedff", border: "#9bc9f4", text: "#17375f" },
  emotion: { fill: "#eee7ff", border: "#c8b9ff", text: "#392b71" },
  person: { fill: "#eee7ff", border: "#c8b9ff", text: "#392b71" },
  value: { fill: "#eee7ff", border: "#c8b9ff", text: "#392b71" },
  reason: { fill: "#dcedff", border: "#9bc9f4", text: "#17375f" },
  constraint: { fill: "#fff0c9", border: "#f0c76f", text: "#5f420f" },
  option: { fill: "#dcf8ee", border: "#91d9bf", text: "#164b3b" },
  benefit: { fill: "#dcf8ee", border: "#91d9bf", text: "#164b3b" },
  risk: { fill: "#ffe1dc", border: "#f3a79b", text: "#6b221a" },
  missing: { fill: "#fff0c9", border: "#f0c76f", text: "#5f420f", ring: "6 5" },
  direction: { fill: "#e5e8ff", border: "#8f94f4", text: "#25226d" },
  action: { fill: "#15213b", border: "#15213b", text: "#ffffff" },
  correction: { fill: "#f7e4ff", border: "#dda7f8", text: "#57266b" },
};

const sampleNodes: MapNode[] = [
  { id: "sample-fact", kind: "fact", label: "사실", text: "지금 말한 상황", confidence: "user", createdAt: "" },
  { id: "sample-value", kind: "value", label: "지금 마음", text: "중요한 기준", confidence: "ai", createdAt: "" },
  { id: "sample-option", kind: "option", label: "선택지", text: "가능한 방향", confidence: "ai", createdAt: "" },
  { id: "sample-missing", kind: "missing", label: "확인할 내용", text: "더 알아볼 부분", confidence: "ai", createdAt: "" },
  { id: "sample-action", kind: "action", label: "다음 행동", text: "24시간 첫 행동", confidence: "ai", createdAt: "" },
];

const positions = [
  { x: 50, y: 15 }, { x: 78, y: 35 }, { x: 70, y: 70 }, { x: 30, y: 72 }, { x: 18, y: 38 }, { x: 50, y: 86 }, { x: 86, y: 60 }, { x: 14, y: 64 },
];

export function MapCanvas({ session, sample = false, className, compact = false }: { session: MapSession; sample?: boolean; className?: string; compact?: boolean }) {
  const nodes = sample ? [...session.nodes.slice(0, 1), ...sampleNodes] : session.nodes;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outer = nodes.filter((node) => node.id !== center?.id).slice(0, compact ? 5 : 8);
  const h = compact ? 390 : 520;

  return (
    <section className={cx("thinking-map map-card overflow-hidden p-4 sm:p-5", className)} aria-label="실시간 생각 MAP">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="kicker">보이는 흐름</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">말하면 생각이 보입니다.</h2></div>
        <span className="rounded-full border border-[var(--map-line)] bg-white/70 px-3 py-1 text-xs font-bold text-[var(--map-muted)]">{outer.length ? `${outer.length + 1}개 조각` : "비어 있음"}</span>
      </div>
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--map-line)] bg-white/65" style={{ height: h }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {outer.map((node, index) => <line key={node.id} x1="50" y1="50" x2={positions[index].x} y2={positions[index].y} className={cx("map-line", (node.kind === "missing" || node.kind === "risk") && "map-line-dotted")} />)}
        </svg>
        {center ? <MapNodeView node={center} x={50} y={50} center compact={compact} /> : <div className="absolute inset-0 grid place-items-center p-8 text-center"><p className="max-w-xs text-lg font-semibold leading-8 text-[var(--map-muted)]">첫 이야기를 하면 생각의 중심이 나타나요.</p></div>}
        {outer.map((node, index) => <MapNodeView key={node.id} node={node} x={positions[index].x} y={positions[index].y} compact={compact} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[var(--map-muted)]">
        <span>파랑=사실</span><span>라벤더=마음/기준</span><span>민트=선택지</span><span>점선=확인 필요</span><span>네이비=행동</span>
      </div>
    </section>
  );
}

function MapNodeView({ node, x, y, center = false, compact = false }: { node: MapNode; x: number; y: number; center?: boolean; compact?: boolean }) {
  const tone = nodeTone[node.kind];
  const w = center ? (compact ? 190 : 230) : (compact ? 128 : 156);
  return (
    <article className="map-node absolute -translate-x-1/2 -translate-y-1/2 rounded-[22px] border px-3 py-3 text-center" style={{ left: `${x}%`, top: `${y}%`, width: w, background: tone.fill, borderColor: tone.border, color: tone.text, borderStyle: tone.ring ? "dashed" : "solid" }}>
      <p className="truncate text-[11px] font-extrabold opacity-75">{node.label}</p>
      <p className={cx("mt-1 break-keep font-extrabold leading-snug", center ? "text-base sm:text-lg" : "text-xs sm:text-sm")}>{shorten(node.text, center ? 54 : 30)}</p>
    </article>
  );
}

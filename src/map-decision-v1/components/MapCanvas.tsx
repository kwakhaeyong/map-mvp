import { MapNode, MapSession, NodeKind } from "../types";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 58) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

const nodeClass: Record<NodeKind, string> = {
  topic: "bg-slate-950 text-white border-slate-950", trigger: "bg-amber-50 text-amber-950 border-amber-200", emotion: "bg-rose-50 text-rose-950 border-rose-200", person: "bg-violet-50 text-violet-950 border-violet-200", value: "bg-blue-50 text-blue-950 border-blue-200", reason: "bg-sky-50 text-sky-950 border-sky-200", constraint: "bg-orange-50 text-orange-950 border-orange-200", option: "bg-emerald-50 text-emerald-950 border-emerald-200", benefit: "bg-teal-50 text-teal-950 border-teal-200", risk: "bg-red-50 text-red-950 border-red-200", missing: "bg-stone-50 text-stone-950 border-dashed border-stone-300", direction: "bg-indigo-50 text-indigo-950 border-indigo-200", action: "bg-lime-50 text-lime-950 border-lime-200", correction: "bg-fuchsia-50 text-fuchsia-950 border-fuchsia-200",
};

const sampleNodes: MapNode[] = [
  { id: "sample-value", kind: "value", label: "가치", text: "중요한 기준", confidence: "ai", createdAt: "" },
  { id: "sample-risk", kind: "risk", label: "리스크", text: "걸리는 부분", confidence: "ai", createdAt: "" },
  { id: "sample-action", kind: "action", label: "행동", text: "24시간 첫 행동", confidence: "ai", createdAt: "" },
];

export function MapCanvas({ session, sample = false, className }: { session: MapSession; sample?: boolean; className?: string }) {
  const nodes = sample ? [...session.nodes, ...sampleNodes] : session.nodes;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outer = nodes.filter((node) => node.id !== center?.id).slice(0, 8);
  const positions = [[13,18],[71,16],[8,48],[72,48],[18,76],[64,76],[41,9],[42,84]];

  return (
    <section className={cx("relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white bg-white/85 p-4 shadow-2xl shadow-slate-200/70", className)} aria-label="실시간 생각 MAP">
      <div className="absolute inset-6 rounded-[1.5rem] border border-dashed border-slate-200" />
      <svg className="absolute inset-0 h-full w-full" aria-label="MAP 관계선">
        {outer.map((node, index) => (
          <line key={node.id} x1="50%" y1="50%" x2={`${positions[index][0] + 8}%`} y2={`${positions[index][1] + 6}%`} stroke={node.kind === "risk" || node.kind === "missing" ? "#94a3b8" : "#2563eb"} strokeWidth={node.kind === "value" || node.kind === "action" ? 3 : 1.7} strokeDasharray={node.kind === "risk" || node.kind === "missing" ? "6 7" : ""} />
        ))}
      </svg>
      <article className="absolute left-1/2 top-1/2 z-10 w-[72%] max-w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] bg-slate-950 p-5 text-white shadow-2xl">
        <p className="text-xs font-black text-blue-200">핵심 주제</p>
        <h3 className="mt-2 text-xl font-black leading-snug">{center ? shorten(center.text, 76) : "첫 이야기를 하면 중심 노드가 생겨요"}</h3>
      </article>
      {outer.map((node, index) => (
        <article key={node.id} className={cx("absolute z-20 w-[12.25rem] rounded-2xl border p-3 shadow-xl transition", nodeClass[node.kind])} style={{ left: `${positions[index][0]}%`, top: `${positions[index][1]}%` }}>
          <p className="text-[0.68rem] font-black opacity-70">{node.label} · {node.confidence === "confirmed" ? "확인됨" : node.confidence === "user" ? "직접 말함" : "AI 해석"}</p>
          <p className="mt-1 text-sm font-black leading-5">{shorten(node.text)}</p>
        </article>
      ))}
    </section>
  );
}

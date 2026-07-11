import { MapNode, MapSession, NodeKind } from "../types";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 58) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

const nodeClass: Record<NodeKind, string> = {
  topic: "bg-slate-950 text-white border-slate-950",
  trigger: "bg-amber-50 text-amber-950 border-amber-200",
  fact: "bg-white text-slate-950 border-slate-200",
  emotion: "bg-rose-50 text-rose-950 border-rose-200",
  person: "bg-violet-50 text-violet-950 border-violet-200",
  value: "bg-blue-50 text-blue-950 border-blue-200",
  reason: "bg-sky-50 text-sky-950 border-sky-200",
  constraint: "bg-orange-50 text-orange-950 border-orange-200",
  option: "bg-emerald-50 text-emerald-950 border-emerald-200",
  benefit: "bg-teal-50 text-teal-950 border-teal-200",
  risk: "bg-red-50 text-red-950 border-red-200",
  missing: "bg-stone-50 text-stone-950 border-dashed border-stone-300",
  direction: "bg-indigo-50 text-indigo-950 border-indigo-200",
  action: "bg-lime-50 text-lime-950 border-lime-200",
  correction: "bg-fuchsia-50 text-fuchsia-950 border-fuchsia-200",
};

const sampleNodes: MapNode[] = [
  { id: "sample-value", kind: "value", label: "가치", text: "중요한 기준", confidence: "ai", createdAt: "" },
  { id: "sample-risk", kind: "risk", label: "리스크", text: "걸리는 부분", confidence: "ai", createdAt: "" },
  { id: "sample-option", kind: "option", label: "선택지", text: "가능한 방향", confidence: "ai", createdAt: "" },
  { id: "sample-action", kind: "action", label: "다음 행동", text: "24시간 첫 행동", confidence: "ai", createdAt: "" },
];

function confidenceLabel(node: MapNode) {
  if (node.confidence === "confirmed") return "확인됨";
  if (node.confidence === "user") return "직접 말함";
  return "정리된 내용";
}

export function MapCanvas({ session, sample = false, className, compact = false }: { session: MapSession; sample?: boolean; className?: string; compact?: boolean }) {
  const nodes = sample ? [...session.nodes, ...sampleNodes] : session.nodes;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outer = nodes.filter((node) => node.id !== center?.id).slice(0, compact ? 4 : 8);

  return (
    <section className={cx("thinking-map rounded-[1.75rem] border border-white bg-white/90 p-4 shadow-xl shadow-slate-200/60 sm:p-5", className)} aria-label="실시간 생각 MAP">
      <div className="rounded-[1.35rem] border border-slate-100 bg-white/80 p-4">
        <p className="text-xs font-extrabold text-blue-700">실시간 생각 MAP</p>
        <article className="mt-3 rounded-[1.25rem] bg-slate-950 p-4 text-white shadow-lg">
          <p className="text-[0.7rem] font-extrabold text-blue-200">핵심 주제</p>
          <h3 className="mt-1 text-lg font-black leading-snug sm:text-xl">{center ? shorten(center.text, 72) : "첫 이야기를 하면 중심 노드가 생겨요"}</h3>
        </article>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {outer.map((node) => {
          const relation = session.relations.find((item) => item.to === node.id);
          return (
            <article key={node.id} className={cx("min-w-0 overflow-hidden rounded-2xl border p-3 shadow-sm", nodeClass[node.kind])}>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="truncate text-[0.68rem] font-extrabold opacity-75">{node.label} · {confidenceLabel(node)}</p>
                <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-black", relation?.strength === "dotted" ? "border border-current bg-white/40" : "bg-white/55")}>{relation?.kind || "영향"}</span>
              </div>
              <p className="mt-2 break-keep text-sm font-black leading-5">{shorten(node.text, compact ? 36 : 54)}</p>
            </article>
          );
        })}
      </div>

      {outer.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm font-bold leading-6 text-slate-500">
          편하게 말하면 핵심, 감정, 선택지, 리스크, 다음 행동이 이 안에 차분히 쌓여요.
        </div>
      ) : null}
    </section>
  );
}

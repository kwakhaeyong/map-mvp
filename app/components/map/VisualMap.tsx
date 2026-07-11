import type { VisualMapResult } from "../../lib/mapResult";
import { MapNode } from "./MapNode";

interface VisualMapProps {
  result: VisualMapResult;
}

function Connector({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`mx-auto h-8 w-px bg-gradient-to-b from-slate-200 to-slate-300 ${className}`} />;
}

export function VisualMap({ result }: VisualMapProps) {
  const sideNodes = [result.importance, result.concern, result.alternatives].filter(Boolean);
  const detailNodes = [result.strengths, result.weaknesses].filter(Boolean);

  return (
    <section className="rounded-[2.5rem] border border-slate-100 bg-white/90 p-4 shadow-2xl shadow-slate-100 sm:p-6">
      <div className="mx-auto max-w-5xl">
        {result.topic ? (
          <div className="mx-auto max-w-xl">
            <MapNode label={result.topic.label} value={result.topic.value} tone="core" />
          </div>
        ) : null}

        {sideNodes.length > 0 ? <Connector /> : null}

        {sideNodes.length > 0 ? (
          <div className="relative grid gap-4 md:grid-cols-3 md:gap-5">
            <div aria-hidden="true" className="absolute left-1/2 top-[-1rem] hidden h-px w-2/3 -translate-x-1/2 bg-slate-200 md:block" />
            {sideNodes.map((node) => node ? <MapNode key={node.key} label={node.label} value={node.value} tone="side" /> : null)}
          </div>
        ) : null}

        {detailNodes.length > 0 ? (
          <>
            <Connector />
            <div className="grid gap-4 md:grid-cols-2 md:px-20">
              {detailNodes.map((node) => node ? <MapNode key={node.key} label={node.label} value={node.value} tone="side" /> : null)}
            </div>
          </>
        ) : null}

        {result.realisticChoice ? (
          <>
            <Connector />
            <div className="mx-auto max-w-2xl">
              <MapNode label={result.realisticChoice.label} value={result.realisticChoice.value} tone="choice" />
            </div>
          </>
        ) : null}

        {result.firstAction ? (
          <>
            <Connector />
            <div className="mx-auto max-w-xl">
              <MapNode label={result.firstAction.label} value={result.firstAction.value} tone="action" />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

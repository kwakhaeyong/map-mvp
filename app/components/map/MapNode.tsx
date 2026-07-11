"use client";

import { useState } from "react";

interface MapNodeProps {
  label: string;
  value: string;
  tone?: "core" | "side" | "choice" | "action" | "default";
}

const toneClasses = {
  core: "border-slate-900 bg-slate-950 text-white shadow-slate-300/70",
  side: "border-slate-200 bg-white text-slate-700 shadow-slate-100",
  choice: "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-950 shadow-fuchsia-100/70",
  action: "border-sky-100 bg-sky-50 text-sky-950 shadow-sky-100/70",
  default: "border-slate-200 bg-white text-slate-700 shadow-slate-100",
};

export function MapNode({ label, value, tone = "default" }: MapNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > 110;

  return (
    <article className={`rounded-[1.6rem] border p-4 shadow-xl ${toneClasses[tone]}`}>
      <p className={`text-xs font-black uppercase tracking-[0.18em] ${tone === "core" ? "text-white/55" : "text-slate-400"}`}>
        {label}
      </p>
      <p
        className="mt-2 whitespace-pre-line text-base font-extrabold leading-7 tracking-[-0.035em]"
        style={expanded || !isLong ? undefined : { display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {value}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className={`mt-3 text-sm font-black ${tone === "core" ? "text-white/75" : "text-slate-500"}`}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}
    </article>
  );
}

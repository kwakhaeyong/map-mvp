"use client";

import { ReactNode, useState } from "react";
import { TasteResult } from "../../../src/map-decision-v1/types";
import { Button, Card } from "../../../src/map-decision-v1/components/ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type RequestState = "idle" | "loading" | "success" | "error";

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-xs font-semibold text-text-muted">(없음)</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li key={index} className="text-sm font-semibold leading-6 text-text-primary">
          · {item}
        </li>
      ))}
    </ul>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-sm font-black uppercase tracking-[0.06em] text-text-muted">{title}</h2>
      {children}
    </Card>
  );
}

// 8개 필드(title/oneLiner/tasteCore/patterns/matrix/tasteMap/
// selfReflection/roadmap)를 그대로 펼쳐 보여준다 — 문장을 요약하거나
// 다시 쓰지 않는다. raw JSON은 <details>로 접어둔다.
function ResultView({ result }: { result: TasteResult }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2 border-primary bg-ink-wash">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-text-muted">title</p>
        <p className="text-xl font-black tracking-[-0.02em]">{result.title}</p>
        <p className="text-xs font-black uppercase tracking-[0.08em] text-text-muted">oneLiner</p>
        <p className="text-base font-bold leading-7">{result.oneLiner}</p>
        {result.statusLabel ? <p className="text-xs font-semibold text-text-secondary">{result.statusLabel}</p> : null}
        {result.tags && result.tags.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {result.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-pill bg-tag-fill px-2.5 py-1 text-xs font-extrabold text-text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </Card>

      <ResultSection title="tasteCore">
        <p className="text-xs font-black text-text-secondary">certain</p>
        <BulletList items={result.tasteCore.certain} />
        <p className="mt-2 text-xs font-black text-text-secondary">conditional</p>
        <BulletList items={result.tasteCore.conditional} />
        <p className="mt-2 text-xs font-black text-text-secondary">indifferent</p>
        <BulletList items={result.tasteCore.indifferent} />
      </ResultSection>

      <ResultSection title="patterns">
        <BulletList items={result.patterns} />
      </ResultSection>

      <ResultSection title="matrix">
        <p className="text-xs font-semibold text-text-secondary">
          x축: {result.matrix.xAxisLabel.low} ↔ {result.matrix.xAxisLabel.high} · y축: {result.matrix.yAxisLabel.low} ↔{" "}
          {result.matrix.yAxisLabel.high}
        </p>
        <ul className="mt-1 flex flex-col gap-1.5">
          {result.matrix.types.map((point, index) => (
            <li key={index} className="text-sm font-semibold leading-6 text-text-primary">
              · <span className="font-black">{point.label}</span> (x={point.x}, y={point.y}) — {point.description}
            </li>
          ))}
        </ul>
      </ResultSection>

      <ResultSection title="tasteMap">
        <p className="text-xs font-black text-text-secondary">넓혀볼 방향(expand)</p>
        <BulletList items={result.tasteMap.expand} />
        <p className="mt-2 text-xs font-black text-text-secondary">안 맞을 방향(avoid)</p>
        <BulletList items={result.tasteMap.avoid} />
      </ResultSection>

      <ResultSection title="selfReflection">
        <p className="text-xs font-black text-text-secondary">awareness</p>
        <BulletList items={result.selfReflection.awareness} />
        <p className="mt-2 text-xs font-black text-text-secondary">blindSpots</p>
        <BulletList items={result.selfReflection.blindSpots} />
      </ResultSection>

      <ResultSection title="roadmap">
        <p className="text-sm font-bold leading-6">{result.roadmap.firstAction}</p>
        {result.roadmap.phases.map((phase, index) => (
          <div key={index} className="mt-2">
            <p className="text-xs font-black text-text-secondary">{phase.label}</p>
            <BulletList items={phase.actions} />
          </div>
        ))}
      </ResultSection>

      <details className="rounded-large border border-border bg-surface p-4 shadow-subtle">
        <summary className="cursor-pointer text-sm font-black">raw JSON 보기</summary>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs font-mono leading-5 text-text-secondary">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function ResultWowReviewClient() {
  const [state, setState] = useState<RequestState>("idle");
  const [result, setResult] = useState<TasteResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generate = async () => {
    setState("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/review-taste-a", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.result) {
        setErrorMessage(data.error === "not_found" ? "이 도구는 production에서 사용할 수 없어요." : "생성에 실패했어요. 다시 시도해주세요.");
        setState("error");
        return;
      }
      setResult(data.result);
      setState("success");
    } catch {
      setErrorMessage("요청 중 오류가 발생했어요. 네트워크 상태를 확인하고 다시 시도해주세요.");
      setState("error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={generate}
        disabled={state === "loading"}
        className={cx(state === "loading" && "opacity-70")}
      >
        {state === "loading" ? "생성 중이에요 (최대 2~3분)…" : result ? "다시 생성" : "Persona A 결과 생성"}
      </Button>

      {state === "error" && errorMessage ? <p className="text-sm font-bold text-error">{errorMessage}</p> : null}

      {result ? <ResultView result={result} /> : null}
    </div>
  );
}

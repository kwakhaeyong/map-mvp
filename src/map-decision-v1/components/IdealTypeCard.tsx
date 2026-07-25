"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { now } from "../engine/session";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { Button, Card } from "./ui/primitives";

// ★임시 렌더★ — 이번 단계는 7요소 결과 "내용"이 실제로 잘 나오는지
// 확인하는 게 목표라, 폰 한 화면에 맞추는 카드 디자인은 다음 단계로
// 미룬다. 지금은 스크롤되는 화면에 각 요소를 순서대로 텍스트로만
// 나열한다.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-sm font-black text-text-muted">{title}</h2>
      {children}
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, index) => (
        <li key={index} className="text-sm font-bold leading-6 text-text-primary">
          · {item}
        </li>
      ))}
    </ul>
  );
}

function IdealTypeCardBody({ session, onReset }: { session: MapSession; onReset: () => void }) {
  const result = session.idealTypeResult!;
  const [shared, setShared] = useState(false);

  const share = async () => {
    const shareText = `내 이상형은 "${result.title}"\n${result.oneLiner}\n\nMAP Decision에서 만들어봤어요 →`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "내 이상형 카드", text: shareText });
        return;
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 클립보드 복사로 조용히 대체.
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      // 클립보드 접근이 막힌 환경 — 조용히 무시(결과 화면 자체는 이미 보임).
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="bg-gradient-to-br from-value via-feeling to-action p-5">
        <span className="inline-flex items-center rounded-pill border border-border/60 bg-surface-elevated/80 px-3 py-1 text-xs font-extrabold text-text-primary">
          💘 이상형 카드 (임시 화면)
        </span>
        <h1 className="mt-3 text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">{result.title}</h1>
        <p className="mt-1.5 text-sm font-bold leading-6 text-text-primary/90">{result.oneLiner}</p>
      </Card>

      <Section title="이상형 기준">
        <p className="text-xs font-black text-text-muted">필수</p>
        <BulletList items={result.criteria.mustHave} />
        <p className="mt-2 text-xs font-black text-text-muted">선호</p>
        <BulletList items={result.criteria.niceToHave} />
        <p className="mt-2 text-xs font-black text-text-muted">타협 가능</p>
        <BulletList items={result.criteria.canCompromise} />
      </Section>

      <Section title="끌림 패턴">
        <BulletList items={result.attractionPatterns} />
      </Section>

      <Section title={`끌림 × 관계 적합도 (${result.matrix.xAxisLabel.low} → ${result.matrix.xAxisLabel.high} / ${result.matrix.yAxisLabel.low} → ${result.matrix.yAxisLabel.high})`}>
        <div className="flex flex-col gap-2">
          {result.matrix.types.map((point, index) => (
            <div key={index} className="rounded-medium border border-border/50 bg-surface-elevated/60 p-2.5">
              <p className="text-sm font-black text-text-primary">
                {point.label} <span className="font-semibold text-text-muted">(x:{point.x}, y:{point.y})</span>
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-secondary">{point.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="신호등">
        <p className="text-xs font-black text-text-muted">🟢 좋은 신호</p>
        <BulletList items={result.flags.green} />
        <p className="mt-2 text-xs font-black text-text-muted">🔴 주의 신호</p>
        <BulletList items={result.flags.red} />
      </Section>

      <Section title="✨ 자기 성찰">
        <p className="text-xs font-black text-text-muted">내가 줄 수 있는 것</p>
        <BulletList items={result.selfReflection.whatYouOffer} />
        <p className="mt-2 text-xs font-black text-text-muted">내가 보완할 부분</p>
        <BulletList items={result.selfReflection.whatToImprove} />
      </Section>

      <Section title="로드맵">
        <p className="text-xs font-black text-text-muted">24시간 안에</p>
        <p className="text-sm font-bold leading-6 text-text-primary">{result.roadmap.firstAction}</p>
        <div className="mt-2 flex flex-col gap-2">
          {result.roadmap.phases.map((phase, index) => (
            <div key={index}>
              <p className="text-xs font-black text-text-muted">{phase.label}</p>
              <BulletList items={phase.actions} />
            </div>
          ))}
        </div>
      </Section>

      <div className="flex gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={share}>
          {shared ? "복사됨!" : "공유하기"}
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={onReset}>
          ✨ 너도 만들어봐
        </Button>
      </div>
    </div>
  );
}

export function IdealTypeCard({
  session,
  setSession,
  onContinue,
  onReset,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onContinue: () => void;
  onReset: () => void;
}) {
  const [generationState, setGenerationState] = useState<"idle" | "loading" | "error" | "fallback">("idle");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const generate = () => {
    setGenerationState("loading");
    setGenerationError(null);
    fetch("/api/generate-idealtype-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.blocked) {
          if (data.reason === "generation_failed") {
            setGenerationState("fallback");
            return;
          }
          setGenerationError(data.message as string);
          setGenerationState("error");
          return;
        }
        setSession((previous) => ({ ...previous, idealTypeResult: data.result, updatedAt: now() }));
        setGenerationState("idle");
      })
      .catch(() => {
        setGenerationState("fallback");
      });
  };

  useEffect(() => {
    if (session.idealTypeResult || attemptedRef.current) return;
    attemptedRef.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button type="button" onClick={onContinue} className="text-xs font-black text-text-muted hover:text-text-primary">
            다시 만들기
          </button>
        </div>
        {session.idealTypeResult ? (
          <IdealTypeCardBody session={session} onReset={onReset} />
        ) : generationState === "loading" ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">이상형 카드를 만들고 있어요…</p>
          </Card>
        ) : generationState === "fallback" ? (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">지금은 카드를 만들 수 없어요. 잠시 후 다시 시도해 주세요.</p>
            <Button variant="primary" onClick={generate}>다시 시도</Button>
          </Card>
        ) : (
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-extrabold text-text-secondary">{generationError ?? "카드를 만들 수 없어요."}</p>
            <Button variant="primary" onClick={generate}>다시 시도</Button>
          </Card>
        )}
      </div>
    </main>
  );
}

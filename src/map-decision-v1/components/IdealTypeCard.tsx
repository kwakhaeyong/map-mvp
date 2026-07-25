"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { now } from "../engine/session";
import { IdealTypeAxisKey, MapSession } from "../types";
import { Brand } from "./Landing";
import { Button, Card } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 리터럴 클래스 문자열로만 참조한다 — `bg-${key}`처럼 동적으로 조합하면
// Tailwind JIT 스캐너가 소스에서 문자열을 못 찾아 클래스가 생성되지 않는다.
const AXIS_META: Record<IdealTypeAxisKey, { label: string; icon: string; chipClassName: string }> = {
  appearance: { label: "분위기", icon: "✨", chipClassName: "bg-option" },
  personality: { label: "성격", icon: "💫", chipClassName: "bg-feeling" },
  values: { label: "가치관", icon: "🧭", chipClassName: "bg-value" },
  relationship: { label: "연애 방식", icon: "💬", chipClassName: "bg-action" },
  lifestyle: { label: "라이프스타일", icon: "🌤️", chipClassName: "bg-uncertainty" },
};

const AXIS_ORDER: IdealTypeAxisKey[] = ["appearance", "personality", "values", "relationship", "lifestyle"];

function IdealTypeCardBody({ session, onReset }: { session: MapSession; onReset: () => void }) {
  const result = session.idealTypeResult!;
  const [shared, setShared] = useState(false);

  const share = async () => {
    const shareText = `내 이상형은 "${result.title}"\n\nMAP Decision에서 만들어봤어요 →`;
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
    <div className="flex flex-col gap-4">
      <Card className="bg-gradient-to-br from-value via-feeling to-action p-5">
        <span className="inline-flex items-center rounded-pill border border-border/60 bg-surface-elevated/80 px-3 py-1 text-xs font-extrabold text-text-primary">
          💘 이상형 카드
        </span>
        <h1 className="mt-3 text-balance break-keep text-2xl font-black leading-8 tracking-[-0.03em] text-text-primary">{result.title}</h1>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {AXIS_ORDER.map((key, index) => {
            const meta = AXIS_META[key];
            const isLast = index === AXIS_ORDER.length - 1;
            return (
              <div key={key} className={cx("rounded-medium border border-border/50 bg-surface-elevated/90 p-3", isLast && "col-span-2")}>
                <div className="flex items-center gap-1.5">
                  <span className={cx("grid size-6 place-items-center rounded-pill text-xs", meta.chipClassName)} aria-hidden="true">
                    {meta.icon}
                  </span>
                  <span className="text-[11px] font-black text-text-muted">{meta.label}</span>
                </div>
                <p className="mt-1.5 text-sm font-bold leading-5 text-text-primary">{result[key]}</p>
              </div>
            );
          })}
        </div>
      </Card>

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
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="flex w-full max-w-sm items-center justify-between px-1 pb-3">
        <Brand />
        <button type="button" onClick={onContinue} className="text-xs font-black text-text-muted hover:text-text-primary">
          다시 만들기
        </button>
      </div>
      <div className="w-full max-w-sm">
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

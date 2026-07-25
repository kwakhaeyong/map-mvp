"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { now } from "../engine/session";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { IdealTypeResultBlocks } from "./IdealTypeResultBlocks";
import { Button, Card } from "./ui/primitives";

// 시각 블록(헤더·매트릭스 그림·자기 성찰 등)은 IdealTypeResultBlocks.tsx로
// 분리했다 — 공유 링크 읽기 전용 화면(app/r/[id]/page.tsx)과 여기서
// 똑같이 재사용한다. 이 파일은 "내 결과를 생성·공유·다시 만들기" 같은
// 상호작용(생성 상태 관리, 공유 API 호출)만 담당한다.

function IdealTypeCardBody({ session, onReset }: { session: MapSession; onReset: () => void }) {
  const result = session.idealTypeResult!;
  const [shareState, setShareState] = useState<"idle" | "creating" | "copied" | "error">("idle");
  const [shareError, setShareError] = useState<string | null>(null);

  // 공유하기를 눌렀을 때만 서버에 저장 요청을 보낸다 — 카드를 만든다고
  // 자동으로 저장되지 않는다. 서버는 이 결과(JSON)만 저장하고, 대화
  // 원문은 절대 받지도 저장하지도 않는다.
  const share = async () => {
    setShareState("creating");
    setShareError(null);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: session.topicId ?? "idealType", result }),
      });
      const data = await response.json();
      if (data.blocked) {
        setShareError(data.message as string);
        setShareState("error");
        return;
      }
      const shareUrl = `${window.location.origin}${data.url}`;
      const shareText = `내 이상형은 "${result.title}"\n${result.oneLiner}\n\n${shareUrl}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: "내 이상형 카드", text: shareText, url: shareUrl });
          setShareState("idle");
          return;
        } catch {
          // 사용자가 공유를 취소한 경우 등 — 클립보드 복사로 조용히 대체.
        }
      }
      try {
        await navigator.clipboard.writeText(shareText);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 2000);
      } catch {
        setShareState("idle");
      }
    } catch {
      setShareError("네트워크 문제로 링크를 만들지 못했어요.");
      setShareState("error");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <IdealTypeResultBlocks result={result} />

      {shareError ? <p className="text-center text-xs font-bold text-error">{shareError}</p> : null}
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" className="flex-1" onClick={share} disabled={shareState === "creating"}>
          {shareState === "creating" ? "링크 만드는 중…" : shareState === "copied" ? "복사됨!" : "공유하기"}
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

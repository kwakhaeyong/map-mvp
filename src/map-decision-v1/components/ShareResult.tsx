"use client";

import { useState } from "react";
import { Card } from "./ui/primitives";

// 공유 버튼을 쓰는 화면(이상형 카드, 진로 결과)이 늘어나면서 "서버에
// 저장 요청 보내고, 링크 만들어지면 공유 시트 열거나 클립보드로 복사"
// 로직이 두 번 이상 필요해졌다 — 그 부분만 여기로 뽑아 재사용한다.
// 화면마다 버튼 배치/문구는 다를 수 있어서 버튼 자체는 각자 그리고,
// 여기서는 상태(shareState)와 실행 함수(share)만 내준다.
export const SHARE_NOTICE = "🔗 링크를 아는 사람은 누구나 볼 수 있어요 · 90일 후 자동 삭제돼요";

export type ShareState = "idle" | "creating" | "copied" | "shared" | "error";

export function useShareResult({
  topicId,
  result,
  quizDepth,
  shareTitle = "MAP Decision",
  buildShareText,
}: {
  topicId: string;
  result: unknown;
  // 이상형 퀴즈를 심화(선택 8문항)까지 답하고 만든 결과인지 — 공유
  // 페이지에서 "🔍 심층 분석 포함" 배지를 보여줄지 판단하는 데 쓴다.
  // 진로 결과 등 이 개념이 없는 화면에서는 그냥 생략하면 된다.
  quizDepth?: "quick" | "deep";
  shareTitle?: string;
  buildShareText: (shareUrl: string) => string;
}) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);

  const share = async () => {
    setShareState("creating");
    setShareError(null);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, result, quizDepth }),
      });
      const data = await response.json();
      if (data.blocked) {
        setShareError(data.message as string);
        setShareState("error");
        return;
      }
      const shareUrl = `${window.location.origin}${data.url}`;
      setSharedUrl(shareUrl);
      const shareText = buildShareText(shareUrl);
      if (navigator.share) {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          setShareState("shared");
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

  return { shareState, shareError, sharedUrl, share };
}

export function ShareStatusCard({
  shareState,
  shareError,
  sharedUrl,
}: {
  shareState: ShareState;
  shareError: string | null;
  sharedUrl: string | null;
}) {
  return (
    <>
      {shareError ? <p className="text-center text-xs font-bold text-error">{shareError}</p> : null}
      {sharedUrl ? (
        <Card className="flex flex-col gap-1 py-3 text-center">
          <p className="text-xs font-extrabold text-text-primary">
            {shareState === "copied" ? "링크가 복사됐어요!" : "링크가 만들어졌어요!"}
          </p>
          <p className="break-all text-xs text-text-muted">{sharedUrl}</p>
        </Card>
      ) : null}
      <p className="text-center text-xs font-semibold text-text-muted">{SHARE_NOTICE}</p>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/primitives";

// 공유 버튼을 쓰는 화면(이상형 카드, 진로 결과)이 늘어나면서 "서버에
// 저장 요청 보내고, 링크 만들어지면 공유 시트 열거나 클립보드로 복사"
// 로직이 두 번 이상 필요해졌다 — 그 부분만 여기로 뽑아 재사용한다.
// 화면마다 버튼 배치/문구는 다를 수 있어서 버튼 자체는 각자 그리고,
// 여기서는 상태(shareState)와 실행 함수(share/copyLink)만 내준다.
export const SHARE_NOTICE = "🔗 링크를 아는 사람은 누구나 볼 수 있어요 · 90일 후 자동 삭제돼요";

export type ShareState = "idle" | "creating" | "copied" | "shared" | "error";

// navigator.share()는 사용자 탭(클릭)으로 생긴 "일시적 활성화"가 살아있는
// 동안 호출해야 브라우저가 공유 시트를 띄운다. 링크를 매번 새로 만들면
// 그 앞에 fetch 왕복(느릴 때는 활성화가 만료될 수 있음)이 매번 끼어들고,
// 하루 공유 횟수 한도도 금방 소진된다 — 이미 만든 링크가 있고 결과가
// 그대로면 두 번째 탭부터는 서버 호출 없이 곧장 navigator.share()를
// 호출해서 두 문제를 동시에 없앤다.
export function useShareResult({
  topicId,
  result,
  signature,
  blockSignatures,
  quizDepth,
  shareTitle = "MAP Decision",
  buildShareText,
}: {
  topicId: string;
  result: unknown;
  // /api/share가 "이 서버가 실제로 만든 결과인가"를 확인하는 데 쓰는
  // 서명(engine/result-signature.ts) — 생성 라우트 응답에서 그대로
  // 받아 세션에 저장해뒀다가, 공유할 때만 여기로 실어 보낸다.
  // 이상형·나소개는 결과 전체에 대한 서명 하나(signature), 진로는
  // 블록별 재생성이 가능해 블록마다 독립된 서명 묶음(blockSignatures)을
  // 쓴다 — 화면마다 자기가 가진 것만 넘기면 된다.
  signature?: string | null;
  blockSignatures?: Record<string, string | null | undefined>;
  // 이상형 퀴즈를 심화(선택 6문항)까지 답하고 만든 결과인지 — 공유
  // 페이지에서 "🔍 심층 분석 포함" 배지를 보여줄지 판단하는 데 쓴다.
  // 진로 결과 등 이 개념이 없는 화면에서는 그냥 생략하면 된다.
  quizDepth?: "quick" | "deep";
  shareTitle?: string;
  buildShareText: (shareUrl: string) => string;
}) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  // navigator.share 존재 여부는 서버(SSR)에서 알 수 없다 — 마운트 후에
  // 확인해서 하이드레이션 불일치 없이 반영한다(voice/use-web-speech.ts의
  // supported 판단과 같은 방식).
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // 지금 sharedUrl이 어떤 topicId/result/quizDepth로 만들어졌는지 기억해서,
  // 그 값이 그대로면(예: 같은 결과를 다시 공유) 서버를 다시 호출하지 않는다.
  // "6개 더 답하기"처럼 결과 자체가 바뀌면 키가 달라져 새로 만든다.
  const sharedForKeyRef = useRef<string | null>(null);
  const sharedUrlRef = useRef<string | null>(null);

  const ensureShareUrl = async (): Promise<string | null> => {
    const key = JSON.stringify({ topicId, result, quizDepth, signature, blockSignatures });
    if (sharedUrlRef.current && sharedForKeyRef.current === key) {
      return sharedUrlRef.current;
    }
    setShareState("creating");
    setShareError(null);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, result, quizDepth, signature, blockSignatures }),
      });
      const data = await response.json();
      if (data.blocked) {
        setShareError(data.message as string);
        setShareState("error");
        return null;
      }
      const url = `${window.location.origin}${data.url}`;
      sharedForKeyRef.current = key;
      sharedUrlRef.current = url;
      setSharedUrl(url);
      // 이 함수를 부르고 나서 "shared"/"copied" 같은 더 구체적인 상태로
      // 넘어가는 건 호출한 쪽(share/copyLink)의 몫이다 — 그런데
      // useImageShare처럼 그런 후속 처리가 없는 호출자도 있어서, 여기서
      // 일단 "idle"로 되돌려놔야 "creating"에 계속 멈춰 있지 않는다.
      // share()/copyLink()는 바로 다음 줄에서 자기 상태로 다시 덮어쓰므로
      // 기존 동작에는 영향이 없다.
      setShareState("idle");
      return url;
    } catch {
      setShareError("네트워크 문제로 링크를 만들지 못했어요.");
      setShareState("error");
      return null;
    }
  };

  const share = async () => {
    const url = await ensureShareUrl();
    if (!url) return;
    try {
      await navigator.share({ title: shareTitle, text: buildShareText(url), url });
      setShareState("shared");
    } catch {
      // 사용자가 시트를 닫았거나 호출이 막힌 경우 — 링크는 이미 만들어져
      // 있으니 버튼을 그대로 다시 누르면(재사용 경로라 서버 호출 없이)
      // 바로 재시도된다. 조용히 클립보드로 대체하지 않는다(복사는 별도
      // 버튼의 역할).
      setShareState("idle");
    }
  };

  const copyLink = async () => {
    const url = await ensureShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(buildShareText(url));
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // 클립보드 API 자체를 못 쓰는 환경 — sharedUrl이 이미 화면에
      // 선택 가능한 텍스트로 노출되므로(ShareStatusCard) 직접 복사할 수 있다.
      setShareState("idle");
    }
  };

  return { shareState, shareError, sharedUrl, canNativeShare, share, copyLink, ensureShareUrl };
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
  // 링크가 이미 만들어졌으면 그게 먼저다 — 그 위에 빨간 한도/에러 문구가
  // 뜨면 성공한 결과가 실패처럼 보인다. 링크가 있으면 에러는 아예 감춘다
  // (링크 재사용 덕분에, 링크가 있는 상태에서 같은 결과로 다시 한도에
  // 걸릴 일도 없다).
  return (
    <>
      {sharedUrl ? (
        <Card className="flex flex-col gap-1 py-3 text-center">
          <p className="text-xs font-extrabold text-text-primary">
            {shareState === "copied" ? "링크가 복사됐어요!" : shareState === "shared" ? "공유했어요!" : "링크가 만들어졌어요!"}
          </p>
          <p className="select-all break-all text-xs text-text-muted">{sharedUrl}</p>
        </Card>
      ) : shareError ? (
        <p className="text-center text-xs font-bold text-error">{shareError}</p>
      ) : null}
      <p className="text-center text-xs font-semibold text-text-muted">{SHARE_NOTICE}</p>
    </>
  );
}

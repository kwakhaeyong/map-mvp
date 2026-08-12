"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { Card } from "./ui/primitives";

// 공유 버튼을 쓰는 화면(이상형 카드, 진로 결과)이 늘어나면서 "서버에
// 저장 요청 보내고, 링크 만들어지면 공유 시트 열거나 클립보드로 복사"
// 로직이 두 번 이상 필요해졌다 — 그 부분만 여기로 뽑아 재사용한다.
// 화면마다 버튼 배치/문구는 다를 수 있어서 버튼 자체는 각자 그리고,
// 여기서는 상태(shareState)와 실행 함수(share/copyLink)만 내준다.
export const SHARE_NOTICE = "링크를 아는 사람은 누구나 볼 수 있어요 · 90일 후 자동 삭제돼요";

export type ShareState = "idle" | "creating" | "copied" | "shared" | "error";

// 사용자가 공유 시트를 그냥 닫은 경우(취소) — 실패가 아니다. 오류
// 메시지를 띄우지 않고 조용히 idle로 돌아가야 한다. 브라우저별로
// DOMException 또는 평범한 Error로 올 수 있어 name만 본다.
// ImageShare.tsx도 파일 공유 실패 처리에 이 판정을 그대로 재사용한다.
export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException || error instanceof Error) && error.name === "AbortError";
}

// FINAL SHARE E2E BUG FIX(2026-08) — Preview/개발 환경에서만 실패
// 단계·error.name/message를 콘솔에 남긴다. production 사용자에게는
// 어떤 개발 정보도 노출하지 않는다 — production 판별 기준은
// app/layout.tsx의 metadataBase와 동일하게 mapdecision.com 여부다
// (클라이언트 전용 판별이라 새 환경변수를 추가하지 않는다).
export function logShareDiagnostic(step: string, error: unknown): void {
  if (typeof window === "undefined" || window.location.hostname === "mapdecision.com") return;
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.warn(`[share] ${step} failed: ${name} — ${message}`);
}

// navigator.share()에 url을 별도 필드로 넘길 때 text 안에 같은 링크가
// 또 들어 있으면, 안드로이드 시스템 공유 시트가 "다시 시도하세요.
// 공유할 수 있는 일부 방법만 표시됩니다" 경고와 함께 대상 앱 목록을
// 필터링한다(문서화된 Web Share API 동작 — url과 text에 링크가
// 중복되면 링크를 못 받는 앱까지 걸러내려다 이렇게 된다). 이 함수는
// buildShareText(url)의 결과에서 끝에 붙은 url만 떼어 title/본문
// 텍스트만 남긴다 — 링크는 url 필드 하나로만 전달하기 위해서다.
// buildShareText가 다른 이유로 필요한 곳(clipboard 복사, 파일 공유의
// text — 둘 다 별도 url 필드가 없어 링크가 텍스트 안에 있어야 한다)은
// 그대로 fullText를 쓴다.
export function stripTrailingUrl(fullText: string, url: string): string {
  return fullText.endsWith(url) ? fullText.slice(0, fullText.length - url.length).trimEnd() : fullText;
}

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
  // 예전에 심화(선택) 문항까지 답하고 만든 결과인지 — 공유 페이지에서
  // "🔍 심층 분석 포함" 배지를 보여줄지 판단하는 데 쓴다. 이상형
  // (quizVersion 11)·나 소개(quizVersion 2) 둘 다 심화 경로를 없애
  // 이제 항상 undefined다. 진로 결과 등 이 개념이 없는 화면에서는
  // 그냥 생략하면 된다.
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
    // share_attempt(NEXT CYCLE — MINIMUM PRODUCT ANALYTICS, 2026-08) —
    // 이 함수는 canNativeShare가 true일 때만 버튼에 연결되므로(각
    // *Card.tsx의 onClick={canNativeShare ? share : copyLink} 참고)
    // method는 항상 "native"다. 결과(성공/실패)와 무관하게 "시도했다"는
    // 사실 자체를 남긴다 — 링크 생성(ensureShareUrl) 전에 찍어서 링크
    // 생성이 실패해도 "시도"는 셈에 들어간다.
    track("share_attempt", { topicId, method: "native" });
    const url = await ensureShareUrl();
    if (!url) return;
    const fullText = buildShareText(url);
    try {
      // url을 text에 중복해서 넣지 않는다 — 위 stripTrailingUrl 주석 참고.
      await navigator.share({ title: shareTitle, text: stripTrailingUrl(fullText, url), url });
      // share_success — navigator.share()가 reject 없이 끝났다는 뜻이다.
      // 이게 "상대방이 실제로 열어봤다"까지 보장하진 않는다 — 브라우저가
      // "공유 동작이 끝났다"고 판단한 시점일 뿐이라는 한계를 그대로
      // 알린다(과장하지 않는다).
      track("share_success", { topicId, method: "native" });
      setShareState("shared");
    } catch (error) {
      if (isAbortError(error)) {
        // 사용자가 시트를 닫은 것 — 오류가 아니다. share_success도 찍지
        // 않는다(성공이 아니므로) — 링크는 이미 만들어져 있으니 버튼을
        // 그대로 다시 누르면(재사용 경로라 서버 호출 없이) 바로
        // 재시도된다.
        setShareState("idle");
        return;
      }
      logShareDiagnostic("navigator.share(url)", error);
      // 네이티브 공유 자체가 실패했다 — 사용자를 빈손으로 남기지 않고
      // 링크 복사로 안전하게 대체한다(진행 원칙 C: URL 공유도 실패하면
      // 링크 복사로 대체).
      try {
        await navigator.clipboard.writeText(fullText);
        // 여기서는 method를 "copy"로 남긴다 — 실제로 성공한 수단이
        // native가 아니라 클립보드 복사이기 때문이다(성공을 과장하지
        // 않는다는 원칙 — 시도한 수단과 실제 성공한 수단이 다를 수 있다).
        track("share_success", { topicId, method: "copy" });
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 2000);
      } catch (clipboardError) {
        logShareDiagnostic("clipboard fallback", clipboardError);
        setShareError("공유하지 못했어요. 위 링크를 직접 복사해 주세요.");
        setShareState("error");
      }
    }
  };

  const copyLink = async () => {
    // share_attempt — copyLink는 canNativeShare가 false일 때(또는 "링크
    // 복사" 보조 버튼으로) 쓰이므로 method는 항상 "copy"다.
    track("share_attempt", { topicId, method: "copy" });
    const url = await ensureShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(buildShareText(url));
      // share_success — clipboard.writeText()가 resolve했다는 것은 실제로
      // 클립보드에 써졌다는 뜻이라, native 공유와 달리 모호함이 없다.
      track("share_success", { topicId, method: "copy" });
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // 클립보드 API 자체를 못 쓰는 환경 — sharedUrl이 이미 화면에
      // 선택 가능한 텍스트로 노출되므로(ShareStatusCard) 직접 복사할 수 있다.
      // 여기서는 success를 찍지 않는다(실제 복사가 확정되지 않았으므로).
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

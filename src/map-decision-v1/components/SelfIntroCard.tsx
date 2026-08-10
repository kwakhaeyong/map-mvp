"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { getIdealTypeTags } from "../engine/ideal-type-tags";
import { now } from "../engine/session";
import { resolveTopic } from "../engine/topics";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { GenerationWaitCard } from "./GenerationProgress";
import { SelfIntroResultBlocks } from "./SelfIntroResultBlocks";
import { ShareStatusCard, useShareResult } from "./ShareResult";
import { ImageSaveModal, useImageShare } from "./ImageShare";
import { Button, Card } from "./ui/primitives";

// 나 소개·성격 결과의 실제 구성 순서(자기 발견 엔진 프롬프트 기준:
// 패턴 → 매트릭스 배치 → 자기성찰 → 나머지 필드 정리)와 대응하는 대기
// 문구. 이상형(IdealTypeCard.tsx)과 같은 원리 — 실제로 나오는 항목만
// 순서대로 쓴다.
const SELF_INTRO_GENERATION_STAGES = [
  "답변을 읽고 있어요",
  "반복되는 패턴을 찾는 중이에요",
  "나의 여러 모습을 배치하고 있어요",
  "당신에 대한 통찰을 정리하고 있어요",
  "마무리하고 있어요",
];

function SelfIntroCardBody({
  session,
  setSession,
  onReset,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onReset: () => void;
}) {
  const result = session.selfIntroResult!;

  const { shareState, shareError, sharedUrl, canNativeShare, share, copyLink, ensureShareUrl } = useShareResult({
    topicId: session.topicId ?? "selfIntro",
    result,
    signature: session.selfIntroResultSignature,
    quizDepth: session.selfIntroQuizDepth,
    shareTitle: "내 소개 카드",
    buildShareText: (shareUrl) => `이거 완전 내 얘기래\n\n${shareUrl}`,
  });

  const { imageState, imageError, modalOpen, previewUrl, closeModal, handleTap: saveImage } = useImageShare({
    ensureShareUrl,
    shareTitle: "내 소개 카드",
    buildShareText: (shareUrl) => `이거 완전 내 얘기래\n\n${shareUrl}`,
  });

  return (
    <div className="flex flex-col gap-3">
      <SelfIntroResultBlocks result={result} />

      <ShareStatusCard shareState={shareState} shareError={shareError} sharedUrl={sharedUrl} />
      <div className="flex gap-2">
        {canNativeShare ? (
          <Button variant="secondary" size="lg" className="flex-1" onClick={share} disabled={shareState === "creating"}>
            {shareState === "creating" ? "링크 만드는 중…" : "카톡·인스타로 공유"}
          </Button>
        ) : null}
        <Button variant={canNativeShare ? "ghost" : "secondary"} size="lg" className="flex-1" onClick={copyLink} disabled={shareState === "creating"}>
          {shareState === "creating" ? "링크 만드는 중…" : shareState === "copied" ? "복사됨!" : "링크 복사"}
        </Button>
      </div>
      <Button
        variant={imageState === "ready" ? "primary" : "secondary"}
        size="lg"
        onClick={saveImage}
        disabled={imageState === "preparing-link" || imageState === "preparing-image"}
      >
        {imageState === "preparing-link"
          ? "링크 확인 중…"
          : imageState === "preparing-image"
            ? "이미지 만드는 중…"
            : imageState === "ready"
              ? "한 번 더 눌러 저장"
              : "이미지로 저장"}
      </Button>
      {imageError ? <p className="text-center text-xs font-bold text-error">{imageError}</p> : null}
      <Button variant="primary" size="lg" onClick={onReset}>
        너도 만들어봐
      </Button>
      <p className="text-center text-xs font-semibold text-text-muted">
        <a href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
          개인정보처리방침
        </a>
        <span className="mx-1.5">·</span>
        <a href="/terms" className="underline underline-offset-2 hover:text-text-primary">
          이용약관
        </a>
      </p>
      <ImageSaveModal open={modalOpen} previewUrl={previewUrl} onClose={closeModal} />
    </div>
  );
}

// 이상형(IdealTypeCard.tsx)과 같은 이유로 이 화면의 배경만 크림 톤
// (bg-background)으로 맞춘다 — body 자체를 바꾸지 않아 퀴즈 진행
// 화면·랜딩·진로 결과 화면은 전혀 영향받지 않는다.
export function SelfIntroCard({
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
  const [attempt, setAttempt] = useState(0);
  const attemptedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  // IdealTypeCard.tsx의 isResuming과 같은 목적·같은 원리 — 마운트
  // 시점에 이미 pendingResultGeneration이 true였는지 딱 한 번만
  // 계산한다(탭이 배경에서 폐기됐다가 새로고침으로 돌아온 경우만 true).
  const [isResuming] = useState(() => Boolean(session.pendingResultGeneration));

  // 대기 화면에 "몇 개 답했는지" 보여줄 때 36을 하드코딩하지 않고
  // topics.ts의 실제 축 구성(전부 필수)에서 계산한다.
  const answeredCount = resolveTopic(session.topicId).axes?.filter((axis) => axis.required).length ?? 0;

  const generate = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerationState("loading");
    setGenerationError(null);
    setAttempt((count) => count + 1);
    setSession((previous) => ({ ...previous, pendingResultGeneration: true }));
    fetch("/api/generate-self-intro-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.blocked) {
          setSession((previous) => ({ ...previous, pendingResultGeneration: false }));
          if (data.reason === "generation_failed") {
            setGenerationState("fallback");
            return;
          }
          setGenerationError(data.message as string);
          setGenerationState("error");
          return;
        }
        setSession((previous) => ({
          ...previous,
          selfIntroResult: data.result,
          selfIntroResultSignature: data.signature,
          pendingResultGeneration: false,
          updatedAt: now(),
        }));
        setGenerationState("idle");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setSession((previous) => ({ ...previous, pendingResultGeneration: false }));
        setGenerationState("fallback");
      });
  };

  useEffect(() => {
    if (session.selfIntroResult || attemptedRef.current) return;
    attemptedRef.current = true;
    generate();
    // 언마운트 시 진행 중인 요청을 취소한다 — 새로고침/탭 중복/뒤로가기
    // 왕복 등으로 이 화면이 다시 마운트되면 attemptedRef가 새 인스턴스라
    // generate()가 또 호출되는데, 이전 요청을 그대로 두면 같은 답변으로
    // 두 개의 생성 요청이 겹쳐 실행된다(서버 쪽 중복 방지는
    // generation-cache.ts의 마커가 맡는다 — 이 abort는 클라이언트가 더는
    // 관심 없는 요청을 정리하는 것뿐이다).
    return () => controllerRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh bg-background px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button
            type="button"
            onClick={() => {
              setSession((previous) => ({ ...previous, pendingResultGeneration: false }));
              onContinue();
            }}
            className="text-xs font-black text-text-muted hover:text-text-primary"
          >
            다시 만들기
          </button>
        </div>
        {session.selfIntroResult ? (
          <SelfIntroCardBody session={session} setSession={setSession} onReset={onReset} />
        ) : generationState === "loading" ? (
          <GenerationWaitCard
            key={attempt}
            stages={SELF_INTRO_GENERATION_STAGES}
            onRetry={generate}
            tags={getIdealTypeTags(session.quizAnswers, "selfIntro")}
            answeredCount={answeredCount}
            resuming={isResuming}
          />
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

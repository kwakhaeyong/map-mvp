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
import { Badge, Button, Card } from "./ui/primitives";

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

// 필수 34문항만 답하고 결과를 본 사람에게 "6개 더 답하기"를 안내한다.
// 이상형은 quizVersion 11에서 심화 경로 자체를 없애 이 배너가 없다.
function DeepenResultBanner({ onDeepen }: { onDeepen: () => void }) {
  return (
    <Card className="flex flex-col gap-3 text-sm">
      <p className="font-extrabold text-text-primary">
        이 결과는 34개 답변으로 만들었어요. 6개를 더 답하면 앞으로 어떤 상황에서 어떻게 행동할지 전망하거나, 예전과 달라진 점을 짚어주는 통찰이 추가돼요.
      </p>
      <Button type="button" variant="secondary" onClick={onDeepen}>
        6개 더 답하기
      </Button>
    </Card>
  );
}

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

  // "6개 더 답하기"를 누르면 심화 문항 시작 지점으로 곧장 이동한다.
  // 이상형은 quizVersion 11에서 심화 경로 자체를 없애 이 기능이 없다
  // (TopicQuiz.tsx가 topic.id로 필드 이름만 구분해서 쓴다).
  const deepenAnswers = () => {
    const topic = resolveTopic(session.topicId);
    const requiredCount = (topic.axes ?? []).filter((axis) => axis.required).length;
    setSession((current) => ({
      ...current,
      stage: "conversation",
      quizStep: requiredCount + 2,
      selfIntroResuming: true,
      updatedAt: now(),
    }));
  };

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
      {session.selfIntroQuizDepth === "deep" ? (
        <Badge tone="success" className="self-start">
          심층 분석 포함
        </Badge>
      ) : null}
      <SelfIntroResultBlocks result={result} />

      {session.selfIntroQuizDepth === "quick" ? <DeepenResultBanner onDeepen={deepenAnswers} /> : null}

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

  const topicAxes = resolveTopic(session.topicId).axes ?? [];
  const requiredAxisCount = topicAxes.filter((axis) => axis.required).length;
  const answeredCount = session.selfIntroQuizDepth === "deep" ? topicAxes.length : requiredAxisCount;

  const generate = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerationState("loading");
    setGenerationError(null);
    setAttempt((count) => count + 1);
    fetch("/api/generate-self-intro-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
      signal: controller.signal,
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
        setSession((previous) => ({ ...previous, selfIntroResult: data.result, selfIntroResultSignature: data.signature, updatedAt: now() }));
        setGenerationState("idle");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setGenerationState("fallback");
      });
  };

  useEffect(() => {
    if (session.selfIntroResult || attemptedRef.current) return;
    attemptedRef.current = true;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh bg-background px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button type="button" onClick={onContinue} className="text-xs font-black text-text-muted hover:text-text-primary">
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
            tags={getIdealTypeTags(session.quizAnswers)}
            answeredCount={answeredCount}
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

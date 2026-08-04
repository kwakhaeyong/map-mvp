"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getIdealTypeTags } from "../engine/ideal-type-tags";
import { now } from "../engine/session";
import { resolveTopic } from "../engine/topics";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { GenerationWaitCard } from "./GenerationProgress";
import { IdealTypeResultBlocks } from "./IdealTypeResultBlocks";
import { ShareStatusCard, useShareResult } from "./ShareResult";
import { ImageSaveModal, useImageShare } from "./ImageShare";
import { Badge, Button, Card } from "./ui/primitives";

// 이상형 결과의 실제 구성 순서(발견 엔진 프롬프트 기준: 끌림 패턴 →
// 매트릭스 배치 → 자기성찰 → 나머지 필드 정리)와 대응하는 대기 문구.
// 아무 문구나 넣지 않는다 — 결과에 실제로 나오는 항목만 순서대로 쓴다.
const IDEAL_TYPE_GENERATION_STAGES = [
  "답변을 읽고 있어요",
  "끌림 패턴을 찾는 중이에요",
  "상대 유형을 배치하고 있어요",
  "당신 자신에 대한 통찰을 정리하고 있어요",
  "마무리하고 있어요",
];

// 시각 블록(헤더·매트릭스 그림·자기 성찰 등)은 IdealTypeResultBlocks.tsx로
// 분리했다 — 공유 링크 읽기 전용 화면(app/r/[id]/page.tsx)과 여기서
// 똑같이 재사용한다. 공유 API 호출/상태 관리는 ShareResult.tsx로 뽑아
// 진로 결과 화면(Result.tsx)과 같이 쓴다. 이 파일은 "내 결과를 생성·
// 다시 만들기" 같은 이 화면만의 상호작용만 담당한다.

// 필수 34문항만 답하고 결과를 본 사람에게 "6개 더 답하기"를 안내한다.
// 건너뛴 걸 탓하는 표현("아쉽네요" 등)은 쓰지 않고, 6개를 더 답하면
// 구체적으로 뭐가 달라지는지만 말한다 — 결정 화면(TopicQuiz.tsx의
// DecisionStep)과 같은 내용을 결과 화면에서 다시 한 번 짚어주는 것.
function DeepenResultBanner({ onDeepen }: { onDeepen: () => void }) {
  return (
    <Card className="flex flex-col gap-3 text-sm">
      <p className="font-extrabold text-text-primary">
        이 결과는 34개 답변으로 만들었어요. 6개를 더 답하면 앞으로 어떤 사람에게 끌릴지 전망하거나, 예전과 달라진 점을 짚어주는 통찰이 추가돼요.
      </p>
      <Button type="button" variant="secondary" onClick={onDeepen}>
        6개 더 답하기
      </Button>
    </Card>
  );
}

// 친구의 공유 카드(/r/{id})를 타고 들어와 퀴즈를 마친 사람에게만 보인다
// (session.compareWithId). 그 친구의 태그는 서버가 이미 알고 있는 값
// (공유 레코드)을 그대로 쓰고, 여기서는 "내" 태그 4개만 쿼리로 실어
// 보낸다 — 이 화면(궁합 보기)은 아직 내가 공유하지 않은 결과로도 볼 수
// 있어야 해서(공유 버튼을 먼저 누를 필요 없이), 태그를 URL에 직접
// 담아 보내는 방식을 쓴다.
//
// 궁합 화면 하단 CTA("내 결과 친구에게 보내기")가 내(B) 공유 링크를
// 보내려면 그 링크가 미리 있어야 한다 — 그래서 버튼을 누르는 시점에
// ensureShareUrl()로 내 링크를 먼저 만들고(이미 있으면 재사용, #106의
// 패턴과 동일), 거기서 뽑은 id를 myId 쿼리로 같이 실어 보낸다. 링크
// 생성이 실패해도(한도 초과 등) 궁합 보기 자체는 막지 않는다 — myId
// 없이 이동하면 궁합 화면이 알아서 예전 CTA로 대체한다.
//
// 배너를 6블록 뒤에서 상단(이상형 카드 바로 아래)으로 옮기면서 문구도
// 손봤다 — "공유 링크로 여기까지 왔다면"은 이미 그렇게 온 사람에게
// 조건을 다시 확인시키는 어색한 표현이라 단정형으로 바꿨다. 친구(A)의
// 타이틀은 /api/share/[id]로 따로 물어봐서(마운트 시 1회) 문구에
// 넣는다 — A의 타이틀은 /r/{id}를 열면 누구나 이미 보는 정보라(card.png·
// 본문 전부에 노출) 새로 유출되는 게 아니다. 요청이 실패하거나 아직
// 응답 전이면 타이틀 없는 문구로 조용히 대체한다.
function CompatibilityBanner({
  withId,
  tags,
  ensureShareUrl,
}: {
  withId: string;
  tags: string[];
  ensureShareUrl: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [friendTitle, setFriendTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/share/${withId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.title === "string") setFriendTitle(data.title);
      })
      .catch(() => {
        // 실패해도 조용히 무시 — 타이틀 없는 문구로 대체된다.
      });
    return () => {
      cancelled = true;
    };
  }, [withId]);

  const handleClick = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    for (const tag of tags) params.append("tag", tag);
    const myUrl = await ensureShareUrl();
    const myId = myUrl ? new URL(myUrl).pathname.split("/r/")[1] : undefined;
    if (myId) params.set("myId", myId);
    router.push(`/r/${withId}/match?${params.toString()}`);
  };

  return (
    <Card className="flex flex-col gap-3 text-sm">
      <p className="font-extrabold text-text-primary">
        {friendTitle ? `"${friendTitle}"을 찾는 친구와의 궁합이에요.` : "친구 링크로 왔네요. 둘이 어디가 통하는지 볼까요?"}
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-pill border border-primary bg-primary px-5 text-sm font-extrabold text-primary-foreground shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating disabled:opacity-60"
      >
        {loading ? "준비하는 중…" : "궁합 보기"}
      </button>
    </Card>
  );
}

function IdealTypeCardBody({
  session,
  setSession,
  onReset,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onReset: () => void;
}) {
  const result = session.idealTypeResult!;

  // "6개 더 답하기"를 누르면 대화(퀴즈) 화면으로 돌아가되, 처음부터가
  // 아니라 심화 문항 시작 지점으로 곧장 이동한다. 필수 34문항 답변은
  // session.messages에 이미 남아 있으니 그대로 유지된다.
  const deepenAnswers = () => {
    const topic = resolveTopic(session.topicId);
    const requiredCount = (topic.axes ?? []).filter((axis) => axis.required).length;
    setSession((current) => ({
      ...current,
      stage: "conversation",
      quizStep: requiredCount + 2,
      idealTypeResuming: true,
      updatedAt: now(),
    }));
  };

  // 공유하기를 눌렀을 때만 서버에 저장 요청을 보낸다 — 카드를 만든다고
  // 자동으로 저장되지 않는다. 서버는 이 결과(JSON)만 저장하고, 대화
  // 원문은 절대 받지도 저장하지도 않는다.
  const { shareState, shareError, sharedUrl, canNativeShare, share, copyLink, ensureShareUrl } = useShareResult({
    topicId: session.topicId ?? "idealType",
    result,
    signature: session.idealTypeResultSignature,
    quizDepth: session.idealTypeQuizDepth,
    shareTitle: "내 이상형 카드",
    // 결과 내용(제목·한줄설명)은 절대 넣지 않는다 — /r/[id]의 OG 문구와
    // 같은 이유(app/layout.tsx 주석 참고)로, 공유 문구에 결과가 들어가면
    // 카톡 대화 로그에 그 사람 결과가 그대로 남는다. 테스터가 실제로
    // 공유하며 썼던 말("야 이게 내 이상형이래")을 고정 문구로 채워두고,
    // 카톡에서 보내기 전에 자유롭게 고쳐 쓸 수 있게 한다.
    buildShareText: (shareUrl) => `야 이게 내 이상형이래\n\n${shareUrl}`,
  });

  // "이미지로 저장"도 위와 같은 이유로 결과 내용 없이 같은 고정 문구를 쓴다.
  // "이미지로 저장"은 위 useShareResult가 만든 ensureShareUrl을 그대로
  // 쓴다 — 이미 "공유" 버튼으로 링크를 만들었다면 새로 만들지 않고
  // 그 링크의 카드 이미지만 받아온다(하루 공유 한도가 이중으로 깎이지
  // 않는다).
  const { imageState, imageError, modalOpen, previewUrl, closeModal, handleTap: saveImage } = useImageShare({
    ensureShareUrl,
    shareTitle: "내 이상형 카드",
    // 결과 내용(제목·한줄설명)은 절대 넣지 않는다 — /r/[id]의 OG 문구와
    // 같은 이유(app/layout.tsx 주석 참고)로, 공유 문구에 결과가 들어가면
    // 카톡 대화 로그에 그 사람 결과가 그대로 남는다. 테스터가 실제로
    // 공유하며 썼던 말("야 이게 내 이상형이래")을 고정 문구로 채워두고,
    // 카톡에서 보내기 전에 자유롭게 고쳐 쓸 수 있게 한다.
    buildShareText: (shareUrl) => `야 이게 내 이상형이래\n\n${shareUrl}`,
  });

  return (
    <div className="flex flex-col gap-3">
      {session.idealTypeQuizDepth === "deep" ? (
        <Badge tone="success" className="self-start">
          심층 분석 포함
        </Badge>
      ) : null}
      <IdealTypeResultBlocks
        result={result}
        afterHero={
          session.compareWithId && (result.tags ?? []).length > 0 ? (
            <CompatibilityBanner withId={session.compareWithId} tags={result.tags!} ensureShareUrl={ensureShareUrl} />
          ) : null
        }
      />

      {session.idealTypeQuizDepth === "quick" ? <DeepenResultBanner onDeepen={deepenAnswers} /> : null}

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
      <a href="/privacy" className="text-center text-xs font-semibold text-text-muted underline underline-offset-2 hover:text-text-primary">
        개인정보처리방침
      </a>
      <ImageSaveModal open={modalOpen} previewUrl={previewUrl} onClose={closeModal} />
    </div>
  );
}

// 이 화면(생성 대기·에러·완성 결과 전부)의 배경을 카드 이미지·/r/{id}와
// 같은 크림 톤(bg-background)으로 맞춘다 — 예전엔 앱 공통 배경(연보라
// 그라데이션, globals.css의 body)을 그대로 썼는데, 카드·공유 화면이
// 초대장 컨셉으로 바뀐 뒤 이 화면만 남아 한 흐름 안에서 브랜드가 두 개로
// 보였다. body 자체를 바꾸지 않고 이 컴포넌트의 <main>에만 불투명한
// bg-background를 얹는 방식이라(/r/{id}의 page.tsx와 같은 패턴)
// 퀴즈 진행 화면(TopicQuiz.tsx)·랜딩·진로 결과 화면은 전혀 영향받지
// 않는다(전부 별도의 <main>을 쓴다).
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
  const [attempt, setAttempt] = useState(0);
  const attemptedRef = useRef(false);
  // 대기 화면에 "다시 시도" 버튼이 뜬 채로 원래 요청이 아직 응답을
  // 기다리는 중일 수 있다(오래 걸려서 재시도한 경우) — 재시도 시 이전
  // 요청을 취소해서, 나중에 도착한 응답이 방금 시작한 새 요청 결과를
  // 덮어쓰는 경쟁 상태를 막는다.
  const controllerRef = useRef<AbortController | null>(null);

  // 대기 화면에 "몇 개 답했는지" 보여줄 때 34/40을 하드코딩하지 않고
  // topics.ts의 실제 축 구성에서 계산한다 — DeepenResultBanner가 "34개
  // 답변으로 만들었어요"를 계산하는 것과 같은 방식.
  const topicAxes = resolveTopic(session.topicId).axes ?? [];
  const requiredAxisCount = topicAxes.filter((axis) => axis.required).length;
  const answeredCount = session.idealTypeQuizDepth === "deep" ? topicAxes.length : requiredAxisCount;

  const generate = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerationState("loading");
    setGenerationError(null);
    setAttempt((count) => count + 1);
    fetch("/api/generate-idealtype-result", {
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
        setSession((previous) => ({ ...previous, idealTypeResult: data.result, idealTypeResultSignature: data.signature, updatedAt: now() }));
        setGenerationState("idle");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
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
    <main className="min-h-dvh bg-background px-4 py-4 pb-safe-bottom pt-safe-top text-text-primary">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button type="button" onClick={onContinue} className="text-xs font-black text-text-muted hover:text-text-primary">
            다시 만들기
          </button>
        </div>
        {session.idealTypeResult ? (
          <IdealTypeCardBody session={session} setSession={setSession} onReset={onReset} />
        ) : generationState === "loading" ? (
          <GenerationWaitCard
            key={attempt}
            stages={IDEAL_TYPE_GENERATION_STAGES}
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

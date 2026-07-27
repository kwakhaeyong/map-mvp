"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { now } from "../engine/session";
import { isReadyForResult } from "../engine/readiness";
import { MapOutputType, MapSession, NodeKind, ResultBlockKey } from "../types";
import {
  demoPaymentProvider,
  localAuthProvider,
  plannedPaymentProviders,
} from "../engine/integration-providers";
import { BlockRegenControls, FallbackSummaryCard, FinalResultSection } from "./FinalResultBlocks";
import { GenerationWaitCard } from "./GenerationProgress";
import { MapCanvas } from "./MapCanvas";
import { ShareStatusCard, useShareResult } from "./ShareResult";
import {
  Badge,
  Button,
  Card,
  ReflectionCard,
  ResultActionBar,
  Toast,
} from "./ui/primitives";

function shorten(text: string, length = 90) {
  return text.trim().length > length
    ? `${text.trim().slice(0, length)}…`
    : text.trim();
}

// 진로 결과의 실제 4블록 생성 순서(final-result-generator.ts의
// factor_matrix → scenarios → timeline → insights)와 대응하는 대기 문구.
// 아무 문구나 넣지 않는다 — 결과에 실제로 나오는 블록만 순서대로 쓴다.
const CAREER_GENERATION_STAGES = [
  "이야기한 내용을 읽고 있어요",
  "핵심 요인을 정리하는 중이에요",
  "가능한 시나리오를 만들고 있어요",
  "실행 계획을 짜는 중이에요",
  "새로운 관점을 찾고 있어요",
  "마무리하고 있어요",
];

export function Result({
  session,
  setSession,
  onContinue,
  onReset,
  onSelectType,
  onRealStart,
  saveState = "saved",
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onContinue: () => void;
  onReset: () => void;
  onSelectType: (type: MapOutputType) => void;
  onRealStart: () => void;
  saveState?: "loading" | "saved" | "saving";
}) {
  const byKind = (kind: NodeKind) =>
    session.nodes
      .filter((node) => node.kind === kind)
      .map((node) => node.text)
      .join("\n") || "아직 더 이야기하면 선명해져요.";
  const direction =
    byKind("direction") !== "아직 더 이야기하면 선명해져요."
      ? byKind("direction")
      : "결론을 서두르기보다 확인할 내용을 채우며 움직이는 방향";
  const safeReset = () => {
    if (
      session.isDemo ||
      window.confirm("새 MAP을 만들까요? 취소하면 지금 결과로 돌아옵니다.")
    )
      onReset();
  };

  const [generationState, setGenerationState] = useState<"idle" | "loading" | "error" | "fallback" | "too_early">(() =>
    session.isDemo || session.result ? "idle" : isReadyForResult(session) ? "idle" : "too_early",
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const attemptedRef = useRef(false);
  // 대기 화면에 "다시 시도" 버튼이 뜬 채로 원래 요청이 아직 응답을
  // 기다리는 중일 수 있다(오래 걸려서 재시도한 경우) — 재시도 시 이전
  // 요청을 취소해서, 나중에 도착한 응답이 방금 시작한 새 요청 결과를
  // 덮어쓰는 경쟁 상태를 막는다.
  const controllerRef = useRef<AbortController | null>(null);

  const generateResult = () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setGenerationState("loading");
    setGenerationError(null);
    setAttempt((count) => count + 1);
    fetch("/api/generate-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.blocked) {
          // "generation_failed" means the AI itself is unavailable (no key,
          // or the call kept failing after the server's own retry) — that's
          // the one case honest enough to show a rule-based fallback for.
          // Other blocked reasons (rate limit, payload too large) are
          // deliberate blocks, not AI unavailability, so they keep the
          // plain error message instead.
          if (data.reason === "generation_failed") {
            setGenerationState("fallback");
            return;
          }
          setGenerationError(data.message as string);
          setGenerationState("error");
          return;
        }
        setSession((previous) => ({ ...previous, result: data.result, updatedAt: now() }));
        setGenerationState("idle");
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setGenerationState("fallback");
      });
  };

  useEffect(() => {
    if (session.isDemo || session.result || attemptedRef.current) return;
    if (!isReadyForResult(session)) {
      setGenerationState("too_early");
      return;
    }
    attemptedRef.current = true;
    generateResult();
    // Runs once per Result mount — session.result caches the outcome so a
    // remount (e.g. leaving and reopening this screen) never re-triggers a
    // paid Sonnet call for content that's already been generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [regeneratingBlock, setRegeneratingBlock] = useState<ResultBlockKey | null>(null);
  const [blockErrors, setBlockErrors] = useState<Partial<Record<ResultBlockKey, string>>>({});

  const regenerateBlock = (block: ResultBlockKey) => {
    setRegeneratingBlock(block);
    setBlockErrors((previous) => ({ ...previous, [block]: undefined }));
    fetch("/api/generate-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, block }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.blocked) {
          setBlockErrors((previous) => ({ ...previous, [block]: data.message as string }));
          return;
        }
        setSession((previous) =>
          previous.result
            ? { ...previous, result: { ...previous.result, [block]: data.value, generatedAt: now() }, updatedAt: now() }
            : previous,
        );
      })
      .catch(() => {
        setBlockErrors((previous) => ({ ...previous, [block]: "네트워크 문제로 다시 만들지 못했어요." }));
      })
      .finally(() => setRegeneratingBlock(null));
  };

  const regenControls: Record<ResultBlockKey, BlockRegenControls> = {
    factorMatrix: { onRegenerate: () => regenerateBlock("factorMatrix"), isRegenerating: regeneratingBlock === "factorMatrix", error: blockErrors.factorMatrix ?? null },
    scenarios: { onRegenerate: () => regenerateBlock("scenarios"), isRegenerating: regeneratingBlock === "scenarios", error: blockErrors.scenarios ?? null },
    timeline: { onRegenerate: () => regenerateBlock("timeline"), isRegenerating: regeneratingBlock === "timeline", error: blockErrors.timeline ?? null },
    insights: { onRegenerate: () => regenerateBlock("insights"), isRegenerating: regeneratingBlock === "insights", error: blockErrors.insights ?? null },
  };

  // 카드를 만든다고 자동으로 공유되지 않는다 — 공유하기를 눌렀을 때만
  // 서버에 저장 요청을 보낸다. IdealTypeCard.tsx와 같은 훅(ShareResult.tsx)을
  // 써서 공유 API 호출/상태 관리 로직을 두 벌로 만들지 않는다.
  const { shareState, shareError, sharedUrl, canNativeShare, share, copyLink } = useShareResult({
    topicId: session.topicId ?? "career",
    result: session.result,
    shareTitle: "내 MAP 결과",
    buildShareText: (shareUrl) =>
      `내 MAP 결과: ${session.preferredMapType === "decision" ? "Decision MAP" : "Thinking MAP"}\n현재 가까운 방향은 ${shorten(direction, 60)}입니다.\n\n${shareUrl}`,
  });

  return (
    <main className="min-h-dvh px-4 py-5 pb-safe-bottom pt-safe-top text-text-primary sm:py-8 print:bg-surface-elevated">
      <section className="map-container">
        <Toast className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <span>{saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</span>
          <Button variant="secondary" onClick={onContinue}>
            대화로 돌아가기
          </Button>
        </Toast>
        <header className="rounded-large border border-border bg-surface p-5 shadow-floating backdrop-blur-xl sm:p-8 print:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="kicker">
                이야기해주신 내용을 한 장으로 정리했어요.
              </p>
              <h1 className="mt-2 text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                {session.preferredMapType === "decision"
                  ? "Decision MAP"
                  : "Thinking MAP"}
              </h1>
              <p className="mt-4 break-keep text-lg font-medium leading-8 text-text-secondary">
                현재 가까운 방향은{" "}
                <strong className="font-extrabold text-text-primary">
                  {shorten(direction, 62)}
                </strong>
                입니다. 정답을 대신 고르지 않고, 말한 내용과 확인할 내용을
                나눠두었어요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 print:hidden sm:flex sm:flex-wrap">
              <Button onClick={onContinue}>더 이야기하기</Button>
              <details className="relative">
                <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-pill border border-border bg-surface-elevated px-4 text-sm font-bold shadow-subtle">
                  더 보기
                </summary>
                <div className="absolute right-0 z-20 mt-2 grid w-52 gap-2 rounded-large border border-border bg-surface-elevated p-3 shadow-modal">
                  <Button variant="secondary" onClick={onContinue}>
                    특정 내용 수정하기
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    저장 / 내보내기
                  </Button>
                  <Button variant="ghost" onClick={safeReset}>
                    {session.isDemo ? "처음으로" : "새 MAP 만들기"}
                  </Button>
                </div>
              </details>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <Button
              variant={
                session.preferredMapType !== "decision"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => onSelectType("thinking")}
            >
              Thinking MAP
            </Button>
            <Button
              variant={
                session.preferredMapType === "decision"
                  ? "primary"
                  : "secondary"
              }
              onClick={() => onSelectType("decision")}
            >
              Decision MAP
            </Button>
            <Badge tone="default">
              처음에는 기술 유형을 고르지 않아도 돼요
            </Badge>
          </div>
        </header>

        <div className="mt-8">
          <MapCanvas session={session} result onStartExample={onRealStart} />
        </div>

        {!session.isDemo ? (
          session.result ? (
            <FinalResultSection result={session.result} regenControls={regenControls} />
          ) : generationState === "loading" ? (
            <div className="mt-8">
              <GenerationWaitCard key={attempt} stages={CAREER_GENERATION_STAGES} onRetry={generateResult} />
            </div>
          ) : generationState === "fallback" ? (
            <FallbackSummaryCard session={session} onRetry={generateResult} />
          ) : generationState === "error" ? (
            <Card className="mt-8">
              <p className="font-black text-error">{generationError}</p>
              <Button className="mt-3" variant="secondary" onClick={generateResult}>
                다시 시도하기
              </Button>
            </Card>
          ) : generationState === "too_early" ? (
            <Card className="mt-8 text-center">
              <p className="font-black">조금 더 이야기해주시면 결과가 더 정확해요.</p>
              <p className="mt-2 text-sm font-semibold text-text-secondary">
                지금은 대화가 짧아서, 몇 마디만 더 나누면 훨씬 선명한 결과를 만들 수 있어요.
              </p>
            </Card>
          ) : null
        ) : null}

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <ResultCard
            title="내가 직접 말한 내용"
            body={
              session.nodes
                .filter((node) => node.confidence !== "ai")
                .slice(0, 7)
                .map((node) => `• ${node.label}: ${node.text}`)
                .join("\n") || "아직 직접 말한 조각이 적어요."
            }
          />
          <ResultCard
            title="대화를 통해 정리된 내용"
            body={`지금 보이는 흐름은 ${session.preferredMapType === "decision" ? "선택지와 걸리는 부분" : "핵심과 마음의 기준"}을 중심으로 정리되어 있어요.\n\n현재 가까운 방향: ${shorten(direction)}`}
          />
          <ResultCard title="아직 확인할 내용" body={byKind("missing")} />
          <ResultCard title="현재 가까운 방향" body={direction} />
          <ResultCard
            title="24시간 안에 할 첫 행동"
            body={
              byKind("action") !== "아직 더 이야기하면 선명해져요."
                ? byKind("action")
                : "오늘 안에 확인할 정보 하나를 적고, 믿을 만한 사람 한 명에게 지금 고민을 10분만 설명해보세요."
            }
          />
          <ResultCard title="걸리는 부분" body={byKind("risk")} />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2 print:hidden">
          <ReflectionCard>
            <h2 className="text-xl font-extrabold">
              이 MAP을 다른 기기에서도 다시 보고 싶나요?
            </h2>
            <p className="mt-2 font-medium leading-7 text-text-secondary">
              지금은 로그인 없이 이 기기에만 저장할 수 있어요. Google, Apple,
              Kakao, Naver 저장은 실제 인증 백엔드 연결 후 공개합니다.
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() =>
                localAuthProvider
                  .saveCurrentDevice(session)
                  .then((result) => window.alert(result.message))
              }
            >
              지금은 이 기기에만 저장
            </Button>
          </ReflectionCard>
          <ReflectionCard>
            <h2 className="text-xl font-extrabold">프리미엄 내보내기 감사</h2>
            <p className="mt-2 font-medium leading-7 text-text-secondary">
              결제 성공을 흉내 내지 않습니다. 취소하면 이 결과 화면으로
              돌아옵니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {plannedPaymentProviders.map((provider) => (
                <Badge key={provider.id}>{provider.label} 준비 중</Badge>
              ))}
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() =>
                demoPaymentProvider
                  .requestUpgrade("프리미엄 내보내기")
                  .then((result) => window.alert(result.message))
              }
            >
              연동 요구사항 보기
            </Button>
          </ReflectionCard>
        </section>

        {/* 공유 버튼은 이상형 카드(IdealTypeCard.tsx)와 같은 위치 규칙을
            따른다 — 결과 블록 바로 아래가 아니라, 화면 맨 아래 액션
            영역 근처. 4블록 밑에 있으면 페이지 중간에 묻혀서 못 찾는다는
            피드백 때문에 옮겼다. */}
        {!session.isDemo && session.result ? (
          <div className="mt-8 flex flex-col gap-3 print:hidden">
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
            <a href="/privacy" className="text-center text-xs font-semibold text-text-muted underline underline-offset-2 hover:text-text-primary">
              개인정보처리방침
            </a>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs font-semibold leading-[1.45] text-text-muted">
          MAP Decision은 의사결정을 돕는 참고 도구이며, 제공되는 분석과
          추천은 조언일 뿐 확정된 답이 아닙니다. 건강·법률·재무·진로 등
          중요한 결정은 반드시 전문가와 상의하세요.
          <span className="mx-1.5">·</span>
          <a href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
            개인정보처리방침
          </a>
          <span className="mx-1.5">·</span>
          <a href="/terms" className="underline underline-offset-2 hover:text-text-primary">
            이용약관
          </a>
        </p>

        {/* ResultActionBar는 sticky bottom-4라 스크롤 중 화면 하단에
            떠 있는 상태로 계속 보인다 — 바로 위 콘텐츠(공유 영역·디스클레이머)가
            그 밑에 깔려 가려지지 않도록 여백을 넉넉히 둔다. 버튼이 두 줄로
            접히는 좁은 화면 기준 실측 높이(약 126px)에 여유를 두고, 노치·
            홈 인디케이터가 있는 기기의 실제 안전 영역(env(safe-area-inset-bottom))
            만큼 더 얹는다 — 데스크톱 브라우저 에뮬레이션은 이 값을 0으로
            돌려주기 때문에 로컬 스크린샷만으로는 실기기 여유분까지
            확인할 수 없어서, 계산으로 미리 여유를 확보해둔다. */}
        <div className="h-[calc(9rem+env(safe-area-inset-bottom))] print:hidden" aria-hidden="true" />

        <ResultActionBar className="pb-safe-bottom print:hidden">
          <Button onClick={onContinue}>더 이야기하기</Button>
          <Button variant="secondary" onClick={onContinue}>
            특정 내용 수정하기
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            저장 / 내보내기
          </Button>
          <Button variant="ghost" onClick={safeReset}>
            새 MAP 만들기
          </Button>
          {session.isDemo ? (
            <Button variant="secondary" onClick={onRealStart}>
              직접 해보기
            </Button>
          ) : null}
        </ResultActionBar>
      </section>
    </main>
  );
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <ReflectionCard className="min-h-full">
      <h2 className="text-lg font-black tracking-[-0.02em]">{title}</h2>
      <p className="mt-3 whitespace-pre-line break-keep font-medium leading-7 text-text-secondary">
        {body}
      </p>
    </ReflectionCard>
  );
}

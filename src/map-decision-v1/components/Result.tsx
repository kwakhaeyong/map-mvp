"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { now } from "../engine/session";
import { MapOutputType, MapSession, NodeKind, ResultBlockKey } from "../types";
import {
  demoPaymentProvider,
  localAuthProvider,
  plannedPaymentProviders,
} from "../engine/integration-providers";
import { BlockRegenControls, FallbackSummaryCard, FinalResultSection } from "./FinalResultBlocks";
import { MapCanvas } from "./MapCanvas";
import {
  Badge,
  Button,
  Card,
  ReflectionCard,
  ResultActionBar,
  Toast,
} from "./ui/primitives";

const MIN_USER_TURNS_FOR_RESULT = 3;

function shorten(text: string, length = 90) {
  return text.trim().length > length
    ? `${text.trim().slice(0, length)}…`
    : text.trim();
}

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

  const userTurns = session.messages.filter((message) => message.role === "user").length;
  const [generationState, setGenerationState] = useState<"idle" | "loading" | "error" | "fallback" | "too_early">(() =>
    session.isDemo || session.result ? "idle" : userTurns < MIN_USER_TURNS_FOR_RESULT ? "too_early" : "idle",
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  const generateResult = () => {
    setGenerationState("loading");
    setGenerationError(null);
    fetch("/api/generate-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
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
      .catch(() => {
        setGenerationState("fallback");
      });
  };

  useEffect(() => {
    if (session.isDemo || session.result || attemptedRef.current) return;
    if (userTurns < MIN_USER_TURNS_FOR_RESULT) {
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
            <Card className="mt-8 text-center">
              <p className="font-black">정리하고 있어요…</p>
              <p className="mt-2 text-sm font-semibold text-text-secondary">
                이야기한 내용을 바탕으로 한 장의 결과를 만드는 중이에요. 몇십 초 정도 걸릴 수 있어요.
              </p>
            </Card>
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

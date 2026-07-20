"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { localConversationProvider } from "../engine/local-conversation-provider";
import { extractThinking } from "../engine/thinking-extractor";
import { createId, now } from "../engine/session";
import { MapNode, MapRelation, MapSession, Message } from "../types";
import { useWebSpeech } from "../voice/use-web-speech";
import { Brand } from "./Landing";
import { MapCanvas } from "./MapCanvas";
import {
  BottomSheet,
  Button,
  Card,
  CheckpointCard,
  EmptyState,
  MessageBubble,
  ResponseChip,
  Textarea,
  Toast,
  VoiceButton,
} from "./ui/primitives";

export function Conversation({
  session,
  setSession,
  onFinish,
  onReset,
  onRealStart,
  onDemoChoice,
  saveState,
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onFinish: () => void;
  onReset: () => void;
  onRealStart: () => void;
  onDemoChoice: () => void;
  saveState: "loading" | "saved" | "saving";
}) {
  const safeReset = () => {
    if (
      session.isDemo ||
      window.confirm(
        "새 MAP을 만들까요? 지금 내용은 이 브라우저에 저장되어 있어요. 새로 시작할까요?",
      )
    )
      onReset();
  };
  const [draft, setDraftState] = useState(session.localDraft || "");
  const [correction, setCorrection] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const setDraft = (value: string | ((current: string) => string)) =>
    setDraftState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      setSession((previous) => ({
        ...previous,
        localDraft: next,
        updatedAt: now(),
      }));
      return next;
    });
  const speech = useWebSpeech((text) =>
    setDraft((current) => `${current}${current ? " " : ""}${text}`),
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        submit();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "m") {
        event.preventDefault();
        onFinish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const submit = async (text = draft, isCorrection = false) => {
    const clean = text.trim();
    if (!clean) return;
    setDraft("");
    setCorrection("");
    setNotice(null);

    const requestSession = session;
    const userMessage: Message = {
      id: createId("user"),
      role: "user",
      text: clean,
      timestamp: now(),
    };
    setSession((previous) => ({
      ...previous,
      localDraft: "",
      messages: [...previous.messages, userMessage],
      updatedAt: now(),
    }));

    setIsExtracting(true);
    let extracted: { nodes: MapNode[]; relations: MapRelation[] };
    let guidanceMessage: string | null = null;
    try {
      const response = await fetch("/api/extract-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, session: requestSession, correction: isCorrection }),
      });
      const data = await response.json();
      if (data.blocked) {
        setIsExtracting(false);
        setNotice(data.message as string);
        return;
      }
      extracted = { nodes: data.nodes, relations: data.relations };
      guidanceMessage = data.guidanceMessage ?? null;
    } catch {
      // Offline or the server route itself is unreachable — fall back to the
      // fully local rule-based extractor so the conversation never breaks.
      extracted = extractThinking(clean, requestSession, isCorrection);
    }
    setIsExtracting(false);

    setSession((previous) => {
      const intermediate: MapSession = {
        ...previous,
        checkpointStatus: isCorrection ? "confirmed" : previous.checkpointStatus,
        nodes: [...previous.nodes, ...extracted.nodes],
        relations: [...previous.relations, ...extracted.relations],
        updatedAt: now(),
      };
      const aiMessage: Message = guidanceMessage
        ? { id: createId("ai"), role: "ai", provider: "local", timestamp: now(), text: guidanceMessage }
        : localConversationProvider.nextReply(intermediate, clean);
      return { ...intermediate, messages: [...intermediate.messages, aiMessage] };
    });
  };

  return (
    <main className="min-h-dvh text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 pt-safe-top backdrop-blur">
        <div className="mx-auto flex map-container flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Brand />
            <Button
              className="lg:hidden"
              size="sm"
              variant="secondary"
              onClick={() => setMapOpen(true)}
            >
              MAP 열기
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {session.isDemo ? (
              <Button variant="secondary" onClick={onRealStart}>
                직접 해보기
              </Button>
            ) : null}
            <Button variant="secondary" onClick={safeReset}>
              {session.isDemo ? "처음으로" : "새 MAP"}
            </Button>
            <Button onClick={onFinish}>현재 MAP 보기</Button>
          </div>
        </div>
      </header>
      <section className="mx-auto grid map-container gap-5 px-4 py-4 sm:py-5 lg:grid-cols-[minmax(0,58%)_minmax(22rem,42%)]">
        <section
          className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-floating sm:min-h-[76vh]"
          aria-label="MAP 대화"
        >
          <StatusBar saveState={saveState} />
          {session.isDemo ? (
            <Card className="mx-4 mt-4 p-4">
              <p className="font-extrabold">30초 체험 중</p>
              <p className="mt-1 text-sm font-semibold text-text-secondary">
                로그인, 마이크, 입력 없이 MAP이 자라는 흐름을 볼 수 있어요.
              </p>
            </Card>
          ) : null}
          <div className="px-3 pt-3 sm:px-4 sm:pt-4 lg:hidden">
            <button
              className="w-full touch-manipulation text-left"
              onClick={() => setMapOpen(true)}
              aria-label="현재 MAP 전체 보기"
            >
              <MapCanvas session={session} compact />
            </button>
          </div>
          <div className="overscroll-contain flex-1 space-y-4 overflow-y-auto p-3 scroll-pb-40 sm:p-6">
            {session.messages.length === 0 ? (
              <EmptyState>
                <p className="font-extrabold text-text-primary">
                  아직 시작 전이에요.
                </p>
                <p className="mt-2">
                  편하게 한 문장만 말하면 현재 MAP에 바로 나타나요.
                </p>
              </EmptyState>
            ) : null}
            {session.messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role === "user" ? "user" : "assistant"}
              >
                <p className="whitespace-pre-line">{message.text}</p>
                {message.checkpoint ? (
                  <CheckpointControls setSession={setSession} />
                ) : null}
              </MessageBubble>
            ))}
            <div ref={endRef} />
          </div>
          {session.checkpointStatus === "correcting" ? (
            <CheckpointCard className="mx-3 mb-3 p-4 sm:mx-4">
              <label className="text-sm font-black" htmlFor="correction">
                어떤 부분이 달랐나요?
              </label>
              <Textarea
                id="correction"
                className="mt-2 min-h-20"
                value={correction}
                onChange={(event) => setCorrection(event.target.value)}
                placeholder="예: 성장보다 안정이 더 중요한 것 같아요."
              />
              <Button className="mt-2" onClick={() => submit(correction, true)}>
                수정 반영하기
              </Button>
            </CheckpointCard>
          ) : null}
          <ResponseChips
            session={session}
            onPick={(text) =>
              session.isDemo
                ? onDemoChoice()
                : setDraft((current) => (current ? `${current} ${text}` : text))
            }
          />
          {notice ? (
            <p className="border-t border-border px-3 py-2 text-sm font-bold text-error sm:px-4">
              {notice}
            </p>
          ) : null}
          <Composer
            draft={draft}
            setDraft={setDraft}
            speech={speech}
            onSubmit={() => submit()}
            onFinish={onFinish}
            disabled={Boolean(session.isDemo)}
            onRealStart={onRealStart}
            isExtracting={isExtracting}
          />
        </section>
        <aside className="hidden lg:block">
          <MapCanvas session={session} />
          <p className="mt-3 rounded-medium bg-surface p-3 text-sm font-bold text-text-muted">
            작성 내용은 이 브라우저에 임시 저장돼요. 말할수록 보이는 흐름이
            자라납니다.
          </p>
        </aside>
      </section>
      {mapOpen ? (
        <BottomSheet className="inset-0 z-50 flex h-dvh flex-col overflow-hidden rounded-none p-4 pt-safe-top lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-black">현재 MAP</p>
            <Button onClick={() => setMapOpen(false)}>닫기</Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <MapCanvas session={session} result />
          </div>
        </BottomSheet>
      ) : null}
    </main>
  );
}

function CheckpointControls({
  setSession,
}: {
  setSession: Dispatch<SetStateAction<MapSession>>;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        onClick={() =>
          setSession((session) => ({
            ...session,
            checkpointStatus: "confirmed",
            messages: [
              ...session.messages,
              {
                id: createId("ai"),
                role: "ai",
                provider: "local",
                text: "좋아요. 확인된 이해로 표시해둘게요. 이제 빠진 정보와 다음 행동을 더 선명하게 볼 수 있어요.",
                timestamp: now(),
              },
            ],
            nodes: session.nodes.map((node) => ({
              ...node,
              confidence:
                node.confidence === "user" ? "confirmed" : node.confidence,
            })),
          }))
        }
      >
        맞아요
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          setSession((session) => ({
            ...session,
            checkpointStatus: "correcting",
          }))
        }
      >
        조금 달라요
      </Button>
    </div>
  );
}

function Composer({
  draft,
  setDraft,
  speech,
  onSubmit,
  onFinish,
  disabled,
  onRealStart,
  isExtracting,
}: {
  draft: string;
  setDraft: (value: string | ((current: string) => string)) => void;
  speech: ReturnType<typeof useWebSpeech>;
  onSubmit: () => void;
  onFinish: () => void;
  disabled: boolean;
  onRealStart: () => void;
  isExtracting: boolean;
}) {
  return (
    <div className="sticky bottom-0 rounded-b-large border-t border-border bg-surface-elevated p-3 pb-safe-bottom shadow-floating sm:p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black">
            {isExtracting
              ? "생각을 정리하고 있어요…"
              : speech.listening
                ? "듣고 있어요"
                : "말하거나 입력해 주세요"}
          </p>
          <p className="text-sm font-bold text-text-muted">
            {speech.listening
              ? `편하게 계속 말해 주세요 · ${speech.seconds}초`
              : "말한 내용은 확인하고 수정할 수 있어요"}
          </p>
          {speech.interimTranscript ? (
            <p className="mt-1 text-sm font-bold text-primary">
              {speech.interimTranscript}
            </p>
          ) : null}
          {speech.error ? (
            <p className="mt-1 text-sm font-bold text-error">{speech.error}</p>
          ) : null}
          {!speech.supported ? (
            <p className="mt-1 text-sm font-bold text-text-secondary">
              음성 미지원 브라우저라 텍스트 입력으로 이어갈게요.
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <VoiceButton
            aria-label={speech.listening ? "녹음 중지" : "마이크로 말하기"}
            listening={speech.listening}
            onClick={speech.listening ? speech.stop : speech.start}
            disabled={disabled}
          >
            {speech.listening ? "멈추기" : "말하기"}
          </VoiceButton>
          {speech.listening ? (
            <Button variant="secondary" onClick={speech.cancel}>
              취소
            </Button>
          ) : null}
        </div>
      </div>
      {disabled ? (
        <Button className="w-full" onClick={onRealStart}>
          직접 해보기
        </Button>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold leading-[1.45] text-text-muted">
            입력 내용은 AI 분석이 켜진 경우 Anthropic(미국) 서버로 전송될 수
            있어요. 꺼져 있으면 기기 안에서만 처리됩니다.
          </p>
          <Textarea
            className="max-h-48 min-h-20 resize-none sm:min-h-24"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="예: 이직을 고민하고 있는데 사람들은 좋고 성장하는 느낌은 없어요."
          />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:flex sm:justify-between">
            <Button variant="secondary" onClick={onFinish}>
              MAP 미리보기
            </Button>
            <Button disabled={!draft.trim() || isExtracting} onClick={onSubmit}>
              {isExtracting ? "정리 중…" : "보내기"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ResponseChips({
  session,
  onPick,
}: {
  session: MapSession;
  onPick: (text: string) => void;
}) {
  const demoChips = [
    "성장감이 제일 걸려요",
    "생활비가 부담돼요",
    "먼저 확인해볼게요",
  ];
  const chips = session.isDemo
    ? demoChips.slice(session.demoStep || 0, (session.demoStep || 0) + 1)
    : [
        "이 부분이 제일 마음에 걸려요",
        "아직 확인할 정보가 있어요",
        "지금 마음은 이쪽에 가까워요",
      ];
  if (!chips.length) return null;
  return (
    <div className="border-t border-border px-3 py-3 sm:px-4">
      <p className="mb-2 text-xs font-black text-text-muted">
        {session.isDemo
          ? "하나를 눌러 흐름을 이어보세요"
          : "가볍게 이어서 말하기"}
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <ResponseChip key={chip} onClick={() => onPick(chip)}>
            {chip}
          </ResponseChip>
        ))}
      </div>
    </div>
  );
}

function StatusBar({
  saveState,
}: {
  saveState: "loading" | "saved" | "saving";
}) {
  const label =
    saveState === "loading"
      ? "저장 상태 확인 중"
      : saveState === "saving"
        ? "자동 저장 중"
        : "자동 저장됨";
  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
      <Toast className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span>{label}</span>
        <span className="text-xs text-text-muted">
          Ctrl/⌘+Enter 보내기 · Ctrl/⌘+M 현재 MAP
        </span>
      </Toast>
    </div>
  );
}

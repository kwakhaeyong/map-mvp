"use client";

import { useEffect, useState } from "react";
import { TOPICS, TopicConfig } from "../engine/topics";
import { Badge, Button, Toast } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="MAP Decision">
      <span className="grid size-10 place-items-center rounded-medium border border-primary bg-surface-elevated text-sm font-black text-primary shadow-floating">
        M
      </span>
      <span className="text-base font-black tracking-[-0.03em]">MAP Decision</span>
    </div>
  );
}

// 진로·이상형만 실제로 연결돼 있다(engine/topics.ts의 implemented 참고).
// 나머지는 완성되는 대로 이 목록 구성을 바꿀 필요 없이 topics.ts의
// implemented만 true로 바꾸면 된다.
const DEPTH_TOPIC_IDS = ["career", "jobChange", "bigDecision"];
const VIRAL_TOPIC_IDS = ["idealType", "selfIntro", "loveStyle", "compatibility", "taste", "travelStyle"];
const SAFETY_NET_TOPIC_ID = "freeform";

function TopicCard({
  topic,
  onStart,
  onLocked,
}: {
  topic: TopicConfig;
  onStart: (topicId: string) => void;
  onLocked: (topic: TopicConfig) => void;
}) {
  const disabled = !topic.implemented;
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={() => (disabled ? onLocked(topic) : onStart(topic.id))}
      className={cx(
        "group relative flex min-h-[132px] flex-col items-start gap-2 rounded-large border border-border bg-surface p-4 text-left shadow-subtle transition duration-normal ease-emphasized",
        disabled ? "opacity-60" : "hover:-translate-y-1 hover:border-border-strong hover:shadow-floating",
      )}
    >
      {disabled ? (
        <span className="absolute right-3 top-3 rounded-pill border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-black text-text-muted">
          준비 중
        </span>
      ) : null}
      <span className="grid size-11 place-items-center rounded-medium bg-background-subtle text-xl" aria-hidden="true">
        {topic.icon}
      </span>
      <span className="text-base font-black tracking-[-0.02em]">{topic.name}</span>
      <span className="text-xs font-semibold leading-5 text-text-secondary">{topic.oneLiner}</span>
    </button>
  );
}

function TopicSection({
  kicker,
  ids,
  onStart,
  onLocked,
}: {
  kicker: string;
  ids: string[];
  onStart: (topicId: string) => void;
  onLocked: (topic: TopicConfig) => void;
}) {
  return (
    <section className="map-container py-3">
      <p className="mb-3 px-1 text-xs font-black uppercase tracking-[-0.01em] text-text-muted">{kicker}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ids.map((id) => (
          <TopicCard key={id} topic={TOPICS[id]} onStart={onStart} onLocked={onLocked} />
        ))}
      </div>
    </section>
  );
}

export function Landing({
  hasDraft,
  onStart,
  onResume,
  onDemo,
  saveState = "saved",
}: {
  hasDraft: boolean;
  onStart: (topicId?: string) => void;
  onResume: () => void;
  onDemo: () => void;
  saveState?: "loading" | "saved" | "saving";
}) {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleLocked = (topic: TopicConfig) => setNotice(`${topic.name}은(는) 아직 준비 중이에요. 곧 만나요!`);
  const safetyNetTopic = TOPICS[SAFETY_NET_TOPIC_ID];

  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge tone={saveState === "saving" ? "default" : "success"}>{saveState === "loading" ? "불러오는 중" : saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</Badge>
          {hasDraft ? <Button variant="secondary" onClick={onResume}>이어서 하기</Button> : null}
        </div>
      </header>

      <section className="map-container pb-2 pt-8 text-center sm:pt-14">
        <p className="kicker">MAP Decision</p>
        <h1 className="mt-3 text-balance break-keep text-[1.9rem] font-black leading-[1.18] tracking-[-0.04em] sm:text-4xl">
          말하면 정리되는 나의 MAP
        </h1>
        <p className="mx-auto mt-3 max-w-md break-keep text-sm font-semibold leading-6 text-text-secondary sm:text-base">
          지금 궁금한 나를 골라보세요. 대화 몇 마디면 충분해요.
        </p>
        <button
          type="button"
          onClick={onDemo}
          className="mt-4 text-xs font-black text-text-muted underline underline-offset-2 hover:text-text-primary"
        >
          30초 체험 먼저 볼까요? →
        </button>
      </section>

      <TopicSection kicker="차근차근, 깊이 있게" ids={DEPTH_TOPIC_IDS} onStart={onStart} onLocked={handleLocked} />
      <TopicSection kicker="가볍게, 빠르게" ids={VIRAL_TOPIC_IDS} onStart={onStart} onLocked={handleLocked} />

      <section className="map-container py-3">
        <button
          type="button"
          onClick={() => handleLocked(safetyNetTopic)}
          className="flex w-full flex-col items-start gap-1 rounded-large border border-dashed border-border-strong bg-surface/60 p-4 text-left transition hover:border-primary-border-soft"
        >
          <span className="text-xs font-black text-text-muted">딱 맞는 게 없나요?</span>
          <span className="text-sm font-bold">
            {safetyNetTopic.icon} 자유롭게 이야기해도 괜찮아요 — {safetyNetTopic.name}
          </span>
          <Badge className="mt-1" tone="default">준비 중</Badge>
        </button>
      </section>

      {notice ? (
        <div className="map-container pb-2 pt-1">
          <Toast role="status">{notice}</Toast>
        </div>
      ) : null}

      <p className="map-container pb-10 pt-8 text-center text-xs font-semibold text-text-muted">
        <a href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
          개인정보처리방침
        </a>
        <span className="mx-1.5">·</span>
        <a href="/terms" className="underline underline-offset-2 hover:text-text-primary">
          이용약관
        </a>
      </p>
    </main>
  );
}

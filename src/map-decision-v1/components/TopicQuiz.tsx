"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { createId, now } from "../engine/session";
import { resolveTopic } from "../engine/topics";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { Badge, Button, Textarea } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function AxisStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
}: {
  question: string;
  options: string[];
  onSubmit: (answerText: string) => void;
  onBack: () => void;
  showBack: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");

  const toggle = (option: string) => {
    setSelected((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
  };

  const submit = () => {
    const answer = [selected.join(", "), customText.trim()].filter(Boolean).join(". ");
    onSubmit(answer);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <Button key={option} type="button" variant={isSelected ? "primary" : "secondary"} size="md" onClick={() => toggle(option)}>
              {option}
            </Button>
          );
        })}
      </div>
      {showCustom ? (
        <Textarea
          autoFocus
          value={customText}
          onChange={(event) => setCustomText(event.target.value)}
          placeholder="더 자세히 적어볼까요? (선택)"
          className="min-h-20"
        />
      ) : (
        <button type="button" onClick={() => setShowCustom(true)} className="self-start text-xs font-black text-text-muted underline underline-offset-2 hover:text-text-primary">
          + 더 자세히 (선택)
        </button>
      )}
      <div className="mt-1 flex items-center justify-between gap-3">
        {showBack ? (
          <button type="button" onClick={onBack} className="text-xs font-black text-text-muted hover:text-text-primary">
            ← 이전
          </button>
        ) : (
          <span />
        )}
        <Button type="button" variant="primary" size="lg" onClick={submit}>
          다음
        </Button>
      </div>
    </div>
  );
}

function ClosingStep({ prompt, onSubmit, onBack }: { prompt: string; onSubmit: (answerText: string) => void; onBack: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{prompt}</h2>
      <Textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="자유롭게 적어주세요 (선택)" className="min-h-28" />
      <div className="mt-1 flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="text-xs font-black text-text-muted hover:text-text-primary">
          ← 이전
        </button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="lg" onClick={() => onSubmit("")}>
            건너뛰기
          </Button>
          <Button type="button" variant="primary" size="lg" onClick={() => onSubmit(text.trim())}>
            결과 만들기
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TopicQuiz({
  session,
  setSession,
  onFinish,
  onReset,
  saveState = "saved",
}: {
  session: MapSession;
  setSession: Dispatch<SetStateAction<MapSession>>;
  onFinish: () => void;
  onReset: () => void;
  saveState?: "loading" | "saved" | "saving";
}) {
  const topic = resolveTopic(session.topicId);
  const axes = topic.axes ?? [];
  const step = session.quizStep ?? 0;
  const isClosingStep = step >= axes.length;
  const totalSteps = axes.length + 1;

  const commitAnswer = (questionText: string, answerText: string) => {
    setSession((current) => {
      const timestamp = now();
      const nextMessages = answerText
        ? [
            ...current.messages,
            { id: createId("ai"), role: "ai" as const, provider: "local" as const, timestamp, text: questionText },
            { id: createId("user"), role: "user" as const, timestamp, text: answerText },
          ]
        : current.messages;
      return { ...current, messages: nextMessages, quizStep: (current.quizStep ?? 0) + 1, updatedAt: timestamp };
    });
  };

  const goBack = () => {
    setSession((current) => ({ ...current, quizStep: Math.max(0, (current.quizStep ?? 0) - 1) }));
  };

  const handleExit = () => {
    if (window.confirm("나가면 지금까지 답변이 사라져요. 나갈까요?")) onReset();
  };

  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge tone={saveState === "saving" ? "default" : "success"}>{saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</Badge>
          <button type="button" onClick={handleExit} className="text-xs font-black text-text-muted hover:text-text-primary">
            나가기
          </button>
        </div>
      </header>

      <section className="map-container pt-6">
        <div className="h-1.5 w-full overflow-hidden rounded-pill bg-background-subtle">
          <div className="h-full rounded-pill bg-primary transition-all duration-normal ease-emphasized" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs font-black text-text-muted">
          {Math.min(step + 1, totalSteps)}/{totalSteps} · 자동 저장됨
        </p>
      </section>

      <section className={cx("map-container flex flex-col gap-6 pb-10 pt-8")}>
        {isClosingStep ? (
          <ClosingStep
            prompt={topic.closingPrompt ?? "더 하고 싶은 말이 있나요?"}
            onBack={goBack}
            onSubmit={(answerText) => {
              commitAnswer(topic.closingPrompt ?? "더 하고 싶은 말이 있나요?", answerText);
              onFinish();
            }}
          />
        ) : (
          <AxisStep
            key={axes[step].id}
            question={axes[step].question}
            options={axes[step].options}
            showBack={step > 0}
            onBack={goBack}
            onSubmit={(answerText) => commitAnswer(axes[step].question, answerText)}
          />
        )}
      </section>
    </main>
  );
}

"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { createId, now } from "../engine/session";
import { resolveTopic, TopicChoice, TopicOption } from "../engine/topics";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { Badge, Button, Textarea } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MAX_SELECTIONS = 3;

function OptionChip({
  choice,
  isSelected,
  isDisabled,
  compact,
  onClick,
}: {
  choice: TopicChoice;
  isSelected: boolean;
  isDisabled: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cx(
        "flex flex-col items-start gap-0.5 rounded-large border px-4 text-left transition-all duration-normal ease-emphasized disabled:pointer-events-none",
        compact ? "py-2" : "py-3",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-subtle"
          : "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating",
        isDisabled && !isSelected && "opacity-40",
      )}
    >
      <span className={cx("font-extrabold tracking-[-0.01em]", compact ? "text-sm" : "text-base")}>{choice.label}</span>
      <span className={cx("text-xs font-medium", isSelected ? "text-primary-foreground/80" : "text-text-muted")}>{choice.description}</span>
    </button>
  );
}

function AxisStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string) => void;
  onBack: () => void;
  showBack: boolean;
}) {
  const [selected, setSelected] = useState<TopicChoice[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState("");

  const atCap = selected.length >= MAX_SELECTIONS;

  const isChoiceSelected = (choice: TopicChoice) => selected.some((item) => item.label === choice.label);

  const toggle = (choice: TopicChoice) => {
    setSelected((current) => {
      if (current.some((item) => item.label === choice.label)) return current.filter((item) => item.label !== choice.label);
      if (current.length >= MAX_SELECTIONS) return current;
      return [...current, choice];
    });
  };

  const submit = () => {
    const rankedLines = selected.map((choice, index) => `${index + 1}순위: ${choice.label} — ${choice.description}`);
    const extra = customText.trim();
    const answer = [...rankedLines, extra ? `추가로 적은 말: ${extra}` : null].filter(Boolean).join("\n");
    onSubmit(answer);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <p className="text-xs font-black text-text-muted">
        최대 {MAX_SELECTIONS}개까지 고를 수 있어요 · 먼저 고른 게 더 중요해요 · {selected.length}/{MAX_SELECTIONS} 선택
      </p>
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const isSelected = isChoiceSelected(option);
          const isExpanded = expanded[option.label] ?? false;
          return (
            <div key={option.label} className="flex flex-col gap-2">
              <div className="flex items-stretch gap-2">
                <div className="flex-1">
                  <OptionChip choice={option} isSelected={isSelected} isDisabled={atCap && !isSelected} onClick={() => toggle(option)} />
                </div>
                {option.subOptions && option.subOptions.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((current) => ({ ...current, [option.label]: !isExpanded }))}
                    className="shrink-0 rounded-large border border-border bg-surface px-3 text-xs font-black text-text-muted hover:border-border-strong hover:text-text-primary"
                  >
                    {isExpanded ? "접기 ▲" : "더보기 ▾"}
                  </button>
                ) : null}
              </div>
              {isExpanded && option.subOptions ? (
                <div className="ml-3 flex flex-col gap-2 border-l-2 border-border pl-3">
                  {option.subOptions.map((sub) => (
                    <OptionChip
                      key={sub.label}
                      choice={sub}
                      isSelected={isChoiceSelected(sub)}
                      isDisabled={atCap && !isChoiceSelected(sub)}
                      compact
                      onClick={() => toggle(sub)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
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
        <Button type="button" variant="primary" size="lg" onClick={submit} disabled={selected.length === 0}>
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

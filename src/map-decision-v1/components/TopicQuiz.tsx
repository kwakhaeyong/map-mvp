"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { createId, now } from "../engine/session";
import { resolveTopic, TopicAxis, TopicChoice, TopicOption } from "../engine/topics";
import { MapSession } from "../types";
import { Brand } from "./Landing";
import { Badge, Button, Textarea } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const MAX_SELECTIONS = 3;

// 세부 선택지(subOptions)를 골랐어도 태그 매핑(ideal-type-tags.ts)은
// 그 부모 칩의 라벨만 안다 — 세부까지 사전에 다 넣으면 어휘가 너무
// 커져서 "공용 언어" 역할을 못 한다. 그래서 여기서 항상 최상위 라벨로
// 되돌려 session.quizAnswers에 기록한다.
function resolveTopLevelLabel(label: string, options: TopicOption[]): string {
  for (const option of options) {
    if (option.label === label) return option.label;
    if (option.subOptions?.some((sub) => sub.label === label)) return option.label;
  }
  return label;
}

function uniqueInOrder(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

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
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
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
    const topLevelLabels = uniqueInOrder(selected.map((choice) => resolveTopLevelLabel(choice.label, options)));
    onSubmit(answer, topLevelLabels);
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

// 양자택일형은 우선순위를 가려내는 게 목적이라 복수 선택을 허용하면
// 의미가 없어진다 — AxisStep과 달리 딱 하나만 고를 수 있고, 세부
// 선택지도 없다(둘 중 하나를 강제하는 질문에 "더 자세히"가 끼어들면
// 오히려 선택을 흐리게 만든다).
function BinaryStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
}) {
  const [selected, setSelected] = useState<TopicChoice | null>(null);

  const submit = () => {
    if (!selected) return;
    onSubmit(`${selected.label} — ${selected.description}`, [selected.label]);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <p className="text-xs font-black text-text-muted">둘 중 하나만 골라주세요</p>
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <OptionChip
            key={option.label}
            choice={option}
            isSelected={selected?.label === option.label}
            isDisabled={false}
            onClick={() => setSelected(option)}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        {showBack ? (
          <button type="button" onClick={onBack} className="text-xs font-black text-text-muted hover:text-text-primary">
            ← 이전
          </button>
        ) : (
          <span />
        )}
        <Button type="button" variant="primary" size="lg" onClick={submit} disabled={!selected}>
          다음
        </Button>
      </div>
    </div>
  );
}

// 필수 12문항을 다 마친 직후 나오는 갈림길 화면 — 여기서 끝내도 결과를
// 만들 수 있지만, 8개를 더 답하면 결과의 어디가 구체적으로 달라지는지를
// 여기서 정확히 말해준다("더 정확해진다" 같은 막연한 말 대신).
function DecisionStep({ onQuick, onDeep, onBack }: { onQuick: () => void; onDeep: () => void; onBack: () => void }) {
  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">여기까지만 해도 결과가 나와요</h2>
      <div className="break-keep text-sm font-semibold leading-7 text-text-secondary">
        <p>8개를 더 답하면, 지금 답변만으로는 알 수 없는 것들이 결과에 들어가요.</p>
        <ul className="mt-2 space-y-1">
          <li>· 앞으로 어떤 사람에게 끌릴지 전망하는 문장이 추가돼요</li>
          <li>· 예전과 지금 달라진 점을 짚어주는 통찰이 들어가요</li>
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="primary" size="lg" onClick={onDeep}>
          8개 더 답하기 · 약 1분
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={onQuick}>
          지금 결과 보기
        </Button>
      </div>
      <button type="button" onClick={onBack} className="self-start text-xs font-black text-text-muted hover:text-text-primary">
        ← 이전
      </button>
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

// 필수 문항을 다 마치면 "지금 결과 보기"로 곧장 마무리 질문(closing)으로
// 건너뛸 수도, "8개 더"로 심화(선택) 문항을 이어갈 수도 있다. 이 갈림길이
// 있어서 quizStep을 axes 배열 인덱스로 그대로 못 쓰고, 아래처럼 구간별로
// 해석한다:
//   0 .. requiredAxes.length-1      필수 문항
//   requiredAxes.length             결정 화면
//   requiredAxes.length+1           마무리 질문(빠른 경로 — 심화를 건너뜀)
//   requiredAxes.length+2 .. +1+optionalAxes.length   심화(선택) 문항
//   requiredAxes.length+2+optionalAxes.length         마무리 질문(심화 경로)
// "빠른 경로"와 "심화 경로"의 마무리 질문에 서로 다른 인덱스를 줘서,
// 뒤로가기(quizStep-1)가 항상 올바른 이전 화면으로 돌아가게 만든다 —
// 어느 경로로 왔는지 별도로 기억할 필요가 없다.
type QuizPhase =
  | { kind: "required"; axis: TopicAxis; index: number }
  | { kind: "decision" }
  | { kind: "optional"; axis: TopicAxis; index: number }
  | { kind: "closing" };

function resolvePhase(step: number, requiredAxes: TopicAxis[], optionalAxes: TopicAxis[]): QuizPhase {
  const requiredCount = requiredAxes.length;
  const optionalCount = optionalAxes.length;
  if (step < requiredCount) return { kind: "required", axis: requiredAxes[step], index: step };
  if (step === requiredCount) return { kind: "decision" };
  if (step === requiredCount + 1) return { kind: "closing" };
  const optionalIndex = step - (requiredCount + 2);
  if (optionalIndex >= 0 && optionalIndex < optionalCount) return { kind: "optional", axis: optionalAxes[optionalIndex], index: optionalIndex };
  return { kind: "closing" };
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
  const requiredAxes = axes.filter((axis) => axis.required);
  const optionalAxes = axes.filter((axis) => !axis.required);

  // 축 구성이 개편되면(topics.ts의 quizVersion 참고) 예전에 저장된
  // quizStep은 완전히 다른 문항을 가리키게 된다 — 진행 중이던 세션이
  // 그 상태 그대로 화면에 뜨면 몇 번째인지도, 무슨 질문인지도 안 맞게
  // 섞인다. 버전이 다르면 안전하게 처음부터 다시 시작시킨다(완료된
  // 결과는 quizStep과 무관하게 idealTypeResult에 따로 저장돼 있어
  // 영향받지 않는다).
  const isStaleQuizProgress =
    topic.quizVersion !== undefined && session.quizStep !== undefined && session.quizVersion !== topic.quizVersion;

  useEffect(() => {
    if (!isStaleQuizProgress) return;
    setSession((current) => ({
      ...current,
      messages: [],
      quizStep: 0,
      quizVersion: topic.quizVersion,
      quizAnswers: {},
      idealTypeResuming: false,
      updatedAt: now(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaleQuizProgress]);

  const step = isStaleQuizProgress ? 0 : (session.quizStep ?? 0);
  const phase = resolvePhase(step, requiredAxes, optionalAxes);

  // axisId/selectedTopLevelLabels는 이 답변이 실제 TopicAxis(topics.ts)에
  // 묶여 있을 때만 넘어온다(마무리 질문 같은 자유 서술에는 없음) — 있을
  // 때만 session.quizAnswers에 기록해서 공유 태그(ideal-type-tags.ts)가
  // 나중에 코드로 결정적으로 매핑할 수 있게 한다.
  const commitAnswer = (questionText: string, answerText: string, axisId?: string, selectedTopLevelLabels?: string[]) => {
    setSession((current) => {
      const timestamp = now();
      const nextMessages = answerText
        ? [
            ...current.messages,
            { id: createId("ai"), role: "ai" as const, provider: "local" as const, timestamp, text: questionText },
            { id: createId("user"), role: "user" as const, timestamp, text: answerText },
          ]
        : current.messages;
      const nextQuizAnswers =
        axisId && selectedTopLevelLabels && selectedTopLevelLabels.length > 0
          ? { ...current.quizAnswers, [axisId]: selectedTopLevelLabels }
          : current.quizAnswers;
      return { ...current, messages: nextMessages, quizAnswers: nextQuizAnswers, quizStep: (current.quizStep ?? 0) + 1, updatedAt: timestamp };
    });
  };

  const goBack = () => {
    setSession((current) => ({ ...current, quizStep: Math.max(0, (current.quizStep ?? 0) - 1) }));
  };

  const jumpTo = (nextStep: number) => {
    setSession((current) => ({ ...current, quizStep: nextStep, updatedAt: now() }));
  };

  // 결과를 이미 본 뒤 "8개 더 답하기"로 돌아온 경우(session.idealTypeResuming)
  // 마지막 심화 문항을 답하면 마무리 질문을 또 묻지 않고 곧장 결과를
  // 다시 만든다 — 마무리 질문은 처음 퀴즈를 마칠 때 이미 한 번 답했다.
  const finishResumedDeepDive = () => {
    setSession((current) => ({
      ...current,
      idealTypeQuizDepth: "deep",
      idealTypeResuming: false,
      idealTypeResult: undefined,
      updatedAt: now(),
    }));
    onFinish();
  };

  const handleExit = () => {
    if (window.confirm("나가면 지금까지 답변이 사라져요. 나갈까요?")) onReset();
  };

  let progressLabel: string;
  let progressPercent: number;
  let progressHint: string | null = null;
  if (phase.kind === "required") {
    progressLabel = `${phase.index + 1}/${requiredAxes.length}`;
    progressPercent = ((phase.index + 1) / requiredAxes.length) * 100;
    if (phase.index === 0 && optionalAxes.length > 0) {
      progressHint = `${requiredAxes.length}개 질문에 답하면 결과가 나와요. 더 깊이 알고 싶으면 ${optionalAxes.length}개를 추가로 답할 수 있어요.`;
    }
  } else if (phase.kind === "optional") {
    progressLabel = `심화 ${phase.index + 1}/${optionalAxes.length}`;
    progressPercent = ((phase.index + 1) / optionalAxes.length) * 100;
  } else if (phase.kind === "decision") {
    progressLabel = "필수 질문 완료";
    progressPercent = 100;
  } else {
    progressLabel = "마지막 질문";
    progressPercent = 100;
  }

  const currentAxis = phase.kind === "required" || phase.kind === "optional" ? phase.axis : null;

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
          <div className="h-full rounded-pill bg-primary transition-all duration-normal ease-emphasized" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="mt-2 text-xs font-black text-text-muted">
          {progressLabel} · {phase.kind === "optional" ? "여기서 나가도 지금까지 답한 건 저장돼요" : "자동 저장됨"}
        </p>
        {progressHint ? <p className="mt-0.5 text-xs font-semibold text-text-secondary">{progressHint}</p> : null}
      </section>

      <section className={cx("map-container flex flex-col gap-6 pb-10 pt-8")}>
        {phase.kind === "decision" ? (
          <DecisionStep
            onBack={goBack}
            onQuick={() => jumpTo(requiredAxes.length + 1)}
            onDeep={() => jumpTo(requiredAxes.length + 2)}
          />
        ) : phase.kind === "closing" ? (
          <ClosingStep
            prompt={topic.closingPrompt ?? "더 하고 싶은 말이 있나요?"}
            onBack={goBack}
            onSubmit={(answerText) => {
              commitAnswer(topic.closingPrompt ?? "더 하고 싶은 말이 있나요?", answerText);
              if (optionalAxes.length > 0) {
                const depth = step === requiredAxes.length + 1 ? "quick" : "deep";
                setSession((current) => ({ ...current, idealTypeQuizDepth: depth }));
              }
              onFinish();
            }}
          />
        ) : currentAxis?.type === "binary" ? (
          <BinaryStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              const isLastOptionalWhileResuming = session.idealTypeResuming && phase.kind === "optional" && phase.index === optionalAxes.length - 1;
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis ? (
          <AxisStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              const isLastOptionalWhileResuming = session.idealTypeResuming && phase.kind === "optional" && phase.index === optionalAxes.length - 1;
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

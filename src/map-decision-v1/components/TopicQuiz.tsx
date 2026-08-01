"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { createId, now } from "../engine/session";
import { resolveTopic, TopicAxis, TopicChoice, TopicOption } from "../engine/topics";
import { MapSession } from "../types";
import { useWebSpeech } from "../voice/use-web-speech";
import { Brand } from "./Landing";
import { Badge, Button, Textarea, VoiceButton } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 이상형이 아니라 지금 사용자 자신에 대해 묻는 문항(topics.ts의
// axis.aboutSelf) 위에 붙이는 작은 라벨. "이 답이 자기성찰에 쓰인다"는
// 설명은 일부러 넣지 않는다 — 그 반전 구조가 결과의 재미 포인트라,
// 여기서 미리 알려주면 김이 샌다. 전환이 있다는 것만 표시한다.
function SelfQuestionLabel() {
  return <p className="text-[11px] font-black uppercase tracking-[0.08em] text-text-muted">나에 대해</p>;
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

// 단일 선택 문항(binary/quickTap/scenario/slider)이 공유하는 "고르면
// 바로 다음으로" 동작. 선택 즉시 넘기면 방금 고른 항목이 눈에 보일
// 틈도 없이 화면이 바뀌어 "내가 뭘 눌렀는지" 확인할 수가 없다 —
// 200~300ms(여기서는 250ms, 그 사이 값) 동안 선택된 상태를 먼저
// 보여준 뒤에 넘어간다. requireConfirm이 true인 동안(심화 재방문의
// 마지막 문항 — 결과 재생성을 곧장 트리거하는 유일한 경로라 명시적
// 확인이 필요하다)은 자동으로 넘어가지 않고 pending만 갱신한다 —
// 선택을 자유롭게 바꾼 뒤 별도 "다음" 버튼을 눌러야 한다.
const AUTO_ADVANCE_DELAY_MS = 250;

function useAutoAdvance(onAdvance: (choice: TopicChoice) => void, requireConfirm: boolean) {
  const [pending, setPending] = useState<TopicChoice | null>(null);
  // 연속 탭 방지: 자동 전환이 이미 예약된 뒤에는 잠가서 두 번 넘어가거나
  // 답이 중복 기록되는 걸 막는다. requireConfirm 모드에서는 예약이
  // 없으니(사용자가 직접 "다음"을 눌러야 진짜로 넘어감) 이 값이 절대
  // true가 되지 않고, 그래서 마음이 바뀌면 자유롭게 다시 고를 수 있다.
  const advancingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const pick = (choice: TopicChoice) => {
    if (advancingRef.current) return;
    setPending(choice);
    if (requireConfirm) return;
    advancingRef.current = true;
    timeoutRef.current = window.setTimeout(() => onAdvance(choice), AUTO_ADVANCE_DELAY_MS);
  };

  const confirm = () => {
    if (!pending || advancingRef.current) return;
    advancingRef.current = true;
    onAdvance(pending);
  };

  return { pending, pick, confirm };
}

// 자동으로 넘어가는 문항일수록 "잘못 눌렀을 때 되돌아갈 방법"이 더
// 잘 보여야 한다 — 다른 문항의 옅은 텍스트 링크 대신 테두리가 있는
// 알약 버튼으로 톤을 높였다.
function EnhancedBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="self-start rounded-pill border border-border bg-surface px-4 py-2 text-xs font-black text-text-secondary shadow-subtle transition-colors hover:border-border-strong hover:text-text-primary"
    >
      ← 이전
    </button>
  );
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
      <span className={cx("text-xs font-medium", isSelected ? "text-primary-foreground-soft" : "text-text-muted")}>{choice.description}</span>
    </button>
  );
}

// 3개를 다 고른 뒤 자동으로 넘긴다 — 단, 아래 조건을 모두 만족할 때만.
// 하나라도 어긋나면 "다음"을 직접 눌러야 한다.
//   1) 선택 개수가 MAX_SELECTIONS(3)에 도달했을 때
//   2) "+ 더 자세히" 텍스트란이 비어있을 때 — 이미 뭔가 적은 사람은
//      더 쓸 의도가 있으니 끊으면 안 된다
//   3) "더보기" 하위 선택지가 펼쳐져 있지 않을 때 — 펼친 사람은 방금
//      고른 걸 바꾸려는 중일 수 있다
// 단일 선택(250ms)보다 지연을 길게(650ms, 500~800ms 권장 범위의
// 중간) 뒀다 — 3개를 다 고른 직후는 "아 이거 아닌데" 하고 마음이
// 바뀔 가능성이 단일 선택 한 번보다 높다고 판단했다.
const MULTI_SELECT_AUTO_ADVANCE_DELAY_MS = 650;

function AxisStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
  aboutSelf,
  requireConfirm,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  aboutSelf?: boolean;
  // 심화 재방문의 마지막 문항일 때만 true — 다른 네 가지 단일 선택
  // 컴포넌트의 같은 이름 prop과 동일한 뜻이다. idealType의 마지막
  // 심화 축("socialCircle")이 하필 이 다중 선택(preference) 타입이라,
  // 이 문항에서도 자동 넘김이 finishResumedDeepDive()(결과 재생성)를
  // 곧장 트리거하지 않도록 반드시 필요하다.
  requireConfirm: boolean;
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

  // 매 렌더마다 세 조건을 다시 확인해서, 조건을 만족할 때만 예약하고
  // 그렇지 않으면(effect의 cleanup이 이전 예약을 지운 채로) 아무것도
  // 예약하지 않는다 — 그래서 "지연 중 취소"를 별도 취소 함수 없이,
  // 조건이 깨지는 모든 경우(선택 해제·더보기 펼침·텍스트 입력)에
  // 자동으로 처리된다. deps에 selected/customText/expanded 전부를
  // 넣어서 셋 중 무엇이 바뀌어도 다시 평가한다.
  useEffect(() => {
    const anyExpanded = Object.values(expanded).some(Boolean);
    const shouldAutoAdvance = !requireConfirm && selected.length === MAX_SELECTIONS && customText.trim() === "" && !anyExpanded;
    if (!shouldAutoAdvance) return;
    const timeoutId = window.setTimeout(submit, MULTI_SELECT_AUTO_ADVANCE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, customText, expanded]);

  return (
    <div className="flex w-full flex-col gap-5">
      {aboutSelf ? <SelfQuestionLabel /> : null}
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
  requireConfirm,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  // 심화 재방문의 마지막 문항일 때만 true — 결과 재생성을 곧장
  // 트리거하는 유일한 경로라 자동으로 넘기지 않고 명시적 확인을 받는다.
  requireConfirm: boolean;
}) {
  const { pending, pick, confirm } = useAutoAdvance(
    (choice) => onSubmit(`${choice.label} — ${choice.description}`, [choice.label]),
    requireConfirm,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <p className="text-xs font-black text-text-muted">둘 중 하나만 골라주세요</p>
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <OptionChip
            key={option.label}
            choice={option}
            isSelected={pending?.label === option.label}
            isDisabled={pending !== null && pending.label !== option.label}
            onClick={() => pick(option)}
          />
        ))}
      </div>
      {requireConfirm ? (
        <div className="mt-1 flex items-center justify-between gap-3">
          {showBack ? <EnhancedBackButton onBack={onBack} /> : <span />}
          <Button type="button" variant="primary" size="lg" onClick={confirm} disabled={!pending}>
            다음
          </Button>
        </div>
      ) : showBack ? (
        <EnhancedBackButton onBack={onBack} />
      ) : null}
    </div>
  );
}

// 빠른 탭형은 문항 수가 많아진 만큼(필수 12→30) 속도가 핵심이다 — 단일
// 선택 + 세부 선택지 없음 + 고르는 즉시 자동으로 다음 문항으로 넘어간다
// ("다음" 버튼이 없다). description을 라벨 아래 작은 글씨로 같이
// 보여준다 — "키워드만 고르는 방식"이라는 테스터 피드백에 대응한
// 것으로, 이미 데이터에 있던 설명을 노출만 시켰을 뿐 새로 쓰지 않았다.
function QuickTapStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
  aboutSelf,
  requireConfirm,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  aboutSelf?: boolean;
  requireConfirm: boolean;
}) {
  const { pending, pick, confirm } = useAutoAdvance(
    (choice) => onSubmit(`${choice.label} — ${choice.description}`, [choice.label]),
    requireConfirm,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      {aboutSelf ? <SelfQuestionLabel /> : null}
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = pending?.label === option.label;
          const isLocked = pending !== null && !isSelected;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => pick(option)}
              disabled={isLocked}
              className={cx(
                "group flex flex-col items-center gap-0.5 rounded-large border px-4 py-4 text-center transition-all duration-normal ease-emphasized disabled:pointer-events-none",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                  : "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-border-strong hover:bg-primary hover:text-primary-foreground hover:shadow-floating",
                isLocked && "opacity-40",
              )}
            >
              <span className={cx("text-sm font-extrabold tracking-[-0.01em]", isSelected ? "text-primary-foreground" : "text-text-primary group-hover:text-primary-foreground")}>
                {option.label}
              </span>
              <span
                className={cx(
                  "text-[11px] font-medium transition-colors duration-normal ease-emphasized",
                  isSelected ? "text-primary-foreground-soft" : "text-text-muted group-hover:text-primary-foreground-soft",
                )}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      {requireConfirm ? (
        <div className="mt-1 flex items-center justify-between gap-3">
          {showBack ? <EnhancedBackButton onBack={onBack} /> : <span />}
          <Button type="button" variant="primary" size="lg" onClick={confirm} disabled={!pending}>
            다음
          </Button>
        </div>
      ) : showBack ? (
        <EnhancedBackButton onBack={onBack} />
      ) : null}
    </div>
  );
}

// 상황 제시형 — 동작은 quickTap과 같다(단일 선택 + 자동 다음 넘김).
// 다만 특성을 직접 묻지 않고 구체적 상황에서의 반응을 고르는 문항이라,
// quickTap과 달리 설명(description)까지 화면에 보여준다 — 반응들이
// 서로 미묘하게 갈려서 라벨만으로는 고르기 어렵기 때문이다.
function ScenarioStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
  aboutSelf,
  requireConfirm,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  aboutSelf?: boolean;
  requireConfirm: boolean;
}) {
  const { pending, pick, confirm } = useAutoAdvance(
    (choice) => onSubmit(`${choice.label} — ${choice.description}`, [choice.label]),
    requireConfirm,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      {aboutSelf ? <SelfQuestionLabel /> : null}
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <OptionChip
            key={option.label}
            choice={option}
            isSelected={pending?.label === option.label}
            isDisabled={pending !== null && pending.label !== option.label}
            onClick={() => pick(option)}
          />
        ))}
      </div>
      {requireConfirm ? (
        <div className="mt-1 flex items-center justify-between gap-3">
          {showBack ? <EnhancedBackButton onBack={onBack} /> : <span />}
          <Button type="button" variant="primary" size="lg" onClick={confirm} disabled={!pending}>
            다음
          </Button>
        </div>
      ) : showBack ? (
        <EnhancedBackButton onBack={onBack} />
      ) : null}
    </div>
  );
}

// 슬라이더형 — 양 끝 사이의 정도를 고른다(binaryWarmth처럼 강제
// 양자택일로 자르기 애매한 축). options가 이미 "한쪽 끝 → 반반 →
// 반대쪽 끝" 순서로 정렬돼 있다고 가정하고 가로 트랙 위에 점으로
// 늘어놓는다. 동작은 quickTap과 같다(단일 선택 + 자동 다음 넘김). 원
// 각각에 라벨을 달아서(예전엔 양 끝 2개만 보이고 가운데 3개는
// title 속성에만 있어 터치 화면에서는 아예 안 보였다) 뭘 고르는지
// 모른 채 탭하는 일이 없게 한다.
function SliderStep({
  question,
  options,
  onSubmit,
  onBack,
  showBack,
  requireConfirm,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  requireConfirm: boolean;
}) {
  const { pending, pick, confirm } = useAutoAdvance(
    (choice) => onSubmit(`${choice.label} — ${choice.description}`, [choice.label]),
    requireConfirm,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-1">
          {options.map((option) => {
            const isSelected = pending?.label === option.label;
            const isLocked = pending !== null && !isSelected;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => pick(option)}
                disabled={isLocked}
                aria-label={option.label}
                title={option.label}
                className={cx(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-normal ease-emphasized disabled:pointer-events-none",
                  !isLocked && "hover:scale-110",
                  isLocked && "opacity-40",
                )}
              >
                <span
                  className={cx(
                    "h-6 w-6 rounded-full border-2 border-primary transition-colors duration-normal ease-emphasized",
                    isSelected ? "bg-primary" : "bg-surface hover:bg-primary",
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="h-1 w-full rounded-pill bg-background-subtle" />
        <div className="flex items-start justify-between gap-1 text-center">
          {options.map((option) => (
            <span key={option.label} className="flex-1 break-keep text-[11px] font-bold leading-snug text-text-secondary">
              {option.label}
            </span>
          ))}
        </div>
        <p className="text-center text-xs font-semibold text-text-muted">원을 탭해서 골라주세요</p>
      </div>
      {requireConfirm ? (
        <div className="mt-1 flex items-center justify-between gap-3">
          {showBack ? <EnhancedBackButton onBack={onBack} /> : <span />}
          <Button type="button" variant="primary" size="lg" onClick={confirm} disabled={!pending}>
            다음
          </Button>
        </div>
      ) : showBack ? (
        <EnhancedBackButton onBack={onBack} />
      ) : null}
    </div>
  );
}

// 순위 매기기 — 옵션 전체를 원하는 순서대로 탭해서 고른다("제일 좋은
// 것"만이 아니라 전체 우선순위를 알아낼 목적). 탭한 순서대로 번호가
// 매겨지고, 이미 고른 항목을 다시 탭하면 순위에서 뺄 수 있다. 전부
// 고른 뒤에만 "다음"이 눌린다.
function RankingStep({
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
  const [order, setOrder] = useState<TopicChoice[]>([]);

  const rankOf = (choice: TopicChoice) => {
    const index = order.findIndex((item) => item.label === choice.label);
    return index === -1 ? null : index + 1;
  };

  const toggle = (choice: TopicChoice) => {
    setOrder((current) => {
      if (current.some((item) => item.label === choice.label)) return current.filter((item) => item.label !== choice.label);
      return [...current, choice];
    });
  };

  const submit = () => {
    const rankedLines = order.map((choice, index) => `${index + 1}순위: ${choice.label} — ${choice.description}`);
    const topLevelLabels = uniqueInOrder(order.map((choice) => resolveTopLevelLabel(choice.label, options)));
    onSubmit(rankedLines.join("\n"), topLevelLabels);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <p className="text-xs font-black text-text-muted">순서대로 탭해서 골라주세요 · {order.length}/{options.length} 선택 · 다시 탭하면 빼져요</p>
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const rank = rankOf(option);
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => toggle(option)}
              className={cx(
                "flex items-center gap-3 rounded-large border px-4 py-3 text-left transition-all duration-normal ease-emphasized",
                rank
                  ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                  : "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating",
              )}
            >
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
                  rank ? "bg-primary-foreground-wash text-primary-foreground" : "bg-background-subtle text-text-muted",
                )}
              >
                {rank ?? ""}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-extrabold tracking-[-0.01em]">{option.label}</span>
                <span className={cx("text-xs font-medium", rank ? "text-primary-foreground-soft" : "text-text-muted")}>{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        {showBack ? (
          <button type="button" onClick={onBack} className="text-xs font-black text-text-muted hover:text-text-primary">
            ← 이전
          </button>
        ) : (
          <span />
        )}
        <Button type="button" variant="primary" size="lg" onClick={submit} disabled={order.length < options.length}>
          다음
        </Button>
      </div>
    </div>
  );
}

// 짧은 자유 서술 — 경험형 문항 바로 뒤에 배치돼 "왜 그랬는지"까지
// 재료로 확보한다. 부담을 낮추려고 입력창을 짧게(2~3줄) 보여주고,
// 건너뛰기를 항상 허용한다. reflection 문항은 태그 매핑(ideal-type
// -tags.ts)과 무관해서 selectedTopLevelLabels 없이 답변 텍스트만
// commitAnswer로 넘긴다.
//
// 음성 입력은 Conversation.tsx와 같은 훅(useWebSpeech)·같은 패턴을
// 그대로 쓴다 — 타이핑은 한두 줄에서 멈추지만 말은 자연스럽게 길어져서,
// 문항을 사건을 소환하는 방향으로 바꾼 것과 같이 가야 이탈을 늘리지
// 않는다. 미지원/거부 시 마이크 버튼 자체를 렌더링하지 않아 조용히
// 타이핑으로 폴백되고, 변환된 텍스트는 그대로 textarea 값이라 자유롭게
// 고쳐 쓸 수 있다. 글자 수 게이트는 두지 않는다 — 건너뛰기는 항상 허용.
function ReflectionStep({
  question,
  placeholder,
  onSubmit,
  onBack,
  showBack,
  isFirst,
  aboutSelf,
}: {
  question: string;
  placeholder?: string;
  onSubmit: (answerText: string) => void;
  onBack: () => void;
  showBack: boolean;
  // 자유 서술 문항이 처음 나오는 지점에서만 전송 안내를 보여준다 — 이
  // 컴포넌트는 문항마다(경험형 뒤에 최대 8번) 반복해서 쓰이는데, 매번
  // 보여주면 방해가 되니 한 번만 짚어준다.
  isFirst: boolean;
  aboutSelf?: boolean;
}) {
  const [text, setText] = useState("");
  const speech = useWebSpeech((heard) => setText((current) => `${current}${current ? " " : ""}${heard}`));
  return (
    <div className="flex w-full flex-col gap-5">
      {aboutSelf ? <SelfQuestionLabel /> : null}
      <h2 className="text-balance break-keep whitespace-pre-line text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      {isFirst ? (
        <p className="-mt-2 text-xs font-semibold text-text-muted">
          여기 적어주신 내용은 카드를 만들 때 분석을 위해 Anthropic(미국) 서버로 전송돼요.
        </p>
      ) : null}
      <Textarea
        autoFocus
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder ?? "생각나는 대로 편하게 적어주세요 (선택)"}
        className="min-h-16"
        rows={3}
      />
      {speech.supported ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 break-keep">
            <p className="text-xs font-semibold text-text-muted">
              {speech.listening ? `듣고 있어요 · ${speech.seconds}초` : "말로 답해도 돼요"}
            </p>
            {speech.error ? <p className="text-xs font-semibold text-error">{speech.error}</p> : null}
          </div>
          <VoiceButton
            type="button"
            listening={speech.listening}
            variant="outline"
            onClick={speech.listening ? speech.stop : speech.start}
            className="shrink-0 whitespace-nowrap"
          >
            {speech.listening ? "멈추기" : "말하기"}
          </VoiceButton>
        </div>
      ) : null}
      <div className="mt-1 flex items-center justify-between gap-3">
        {showBack ? (
          <button type="button" onClick={onBack} className="text-xs font-black text-text-muted hover:text-text-primary">
            ← 이전
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {/* 건너뛰기는 없애지 않되(막으면 이탈함) 시각적 우선순위를
              낮췄다 — "다음"과 크기·톤이 같으면 "둘 다 동등한 선택"으로
              읽힌다. 텍스트 링크로만 톤을 낮추고, 탭하기엔 충분한
              여백(py-3)은 유지해서 찾기 어렵게 만들지 않는다. */}
          <button
            type="button"
            onClick={() => onSubmit("")}
            className="rounded-pill px-2 py-3 text-sm font-bold text-text-muted underline underline-offset-2 hover:text-text-primary"
          >
            건너뛰기
          </button>
          <Button type="button" variant="primary" size="lg" onClick={() => onSubmit(text.trim())}>
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}

// 필수 34문항을 다 마친 직후 나오는 갈림길 화면 — 여기서 끝내도 결과를
// 만들 수 있지만, 6개를 더 답하면 결과의 어디가 구체적으로 달라지는지를
// 여기서 정확히 말해준다("더 정확해진다" 같은 막연한 말 대신).
function DecisionStep({ onQuick, onDeep, onBack }: { onQuick: () => void; onDeep: () => void; onBack: () => void }) {
  return (
    <div className="flex w-full flex-col gap-5">
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">여기까지만 해도 결과가 나와요</h2>
      <div className="break-keep text-sm font-semibold leading-7 text-text-secondary">
        <p>6개를 더 답하면, 지금 답변만으로는 알 수 없는 것들이 결과에 들어가요.</p>
        <ul className="mt-2 space-y-1">
          <li>· 앞으로 어떤 사람에게 끌릴지 전망하는 문장이 추가돼요</li>
          <li>· 예전과 지금 달라진 점을 짚어주는 통찰이 들어가요</li>
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="primary" size="lg" onClick={onDeep}>
          6개 더 답하기 · 약 1분
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
// 건너뛸 수도, "6개 더"로 심화(선택) 문항을 이어갈 수도 있다. 이 갈림길이
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

// 결과 화면 블록 이름을 그대로 옮긴 것 — AI가 만드는 문구가 아니라
// IdealTypeResultBlocks.tsx/SelfIntroResultBlocks.tsx의 SectionHeader
// title과 정확히 같은 문자열이다(둘 중 하나가 바뀌면 여기도 맞춰 바꿔야
// 한다). 퀴즈 화면에 "완주하면 이런 걸 받는다"를 상시 노출해 완주
// 동기를 준다 — 문항 자체를 늘리거나 바꾸지 않고 화면에만 추가하는
// 정보라 topics.ts(문항·선택지)는 건드리지 않는다.
const RESULT_BLOCK_PREVIEW: Record<string, string[]> = {
  idealType: ["이상형 기준", "끌림 패턴", "끌림 × 관계 적합도", "신호등", "자기 성찰", "로드맵"],
  selfIntro: ["핵심 가치관", "반복되는 패턴", "나의 여러 모습", "특징", "자기 성찰", "로드맵"],
};

// 기본은 접힌 한 줄 요약 — 문항을 밀어내지 않으면서 "완주하면 이만큼
// 받는다"는 걸 계속 인지시킨다. 펼치면 블록 이름을 그대로 보여준다.
//
// PR #137 배포 후 오너가 실제로 완주하면서 이 요소를 알아채지 못했다는
// 피드백을 받아 두 가지를 조정했다: (1) 바로 위 진행률 줄(text-xs·
// text-text-muted/text-text-secondary)과 글자 크기·색이 사실상
// 같아서 "그냥 메타 텍스트 중 하나"로 묻혔다 — text-sm·text-text-primary·
// bg-surface-elevated·shadow-subtle로 한 단계만 올려서 문항 제목
// (text-xl)과 완전히 겹치지 않으면서도 주변 두 줄보다는 눈에 띄게
// 했다. (2) 첫 문항에서만 펼친 채로 시작해서 "이게 뭔지" 한 번은
// 확실히 보여주고, 두 번째 문항으로 넘어가면 자동으로 접는다 — 그
// 뒤로는 기존처럼 탭해서 여닫는 한 줄 요약으로 돌아간다.
function CompletionPreview({ blocks, autoExpandFirst }: { blocks: string[]; autoExpandFirst: boolean }) {
  const [expanded, setExpanded] = useState(autoExpandFirst);
  useEffect(() => {
    if (!autoExpandFirst) setExpanded(false);
  }, [autoExpandFirst]);
  if (blocks.length === 0) return null;
  return (
    <div className="mt-3 rounded-large border border-border-strong bg-surface-elevated px-4 py-2.5 shadow-subtle">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-extrabold text-text-primary"
      >
        <span>완주하면 {blocks.length}가지를 받아요</span>
        <span aria-hidden="true">{expanded ? "▲" : "▾"}</span>
      </button>
      {expanded ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {blocks.map((block) => (
            <Badge key={block}>{block}</Badge>
          ))}
        </div>
      ) : null}
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
  const requiredAxes = axes.filter((axis) => axis.required);
  const optionalAxes = axes.filter((axis) => !axis.required);

  // topics.ts의 "quiz" inputMode 주제는 지금 이상형(idealType)과 나
  // 소개·성격(selfIntro) 둘이다 — 결과·진행도를 서로 다른 session
  // 필드에 저장해야 두 주제를 오가며 진행해도 결과가 서로 안 덮어써진다.
  // topic.id별로 필드 이름만 바꾸고 그 외 로직은 완전히 동일하다 —
  // 이상형은 지금까지와 정확히 같은 필드 이름(idealTypeResult 등)을
  // 그대로 쓰므로 이 분기가 생겨도 이상형 쪽 동작은 바뀌지 않는다.
  const resultField: "selfIntroResult" | "idealTypeResult" = topic.id === "selfIntro" ? "selfIntroResult" : "idealTypeResult";
  const depthField: "selfIntroQuizDepth" | "idealTypeQuizDepth" = topic.id === "selfIntro" ? "selfIntroQuizDepth" : "idealTypeQuizDepth";
  const resumingField: "selfIntroResuming" | "idealTypeResuming" = topic.id === "selfIntro" ? "selfIntroResuming" : "idealTypeResuming";

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
      [resumingField]: false,
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
      // "이전"으로 되돌아가 같은 axisId를 다시 답한 경우, 그 축의 예전
      // 질문·답변 쌍을 먼저 지운다 — 남겨두면 자기성찰 블록(답변 교차
      // 분석)이 옛 답과 새 답을 진짜 모순으로 착각할 수 있다. 나머지
      // 메시지의 순서는 그대로 두고 해당 쌍만 제거·교체한다(quizAnswers가
      // 이미 axisId로 덮어쓰는 것과 같은 방식).
      const baseMessages = axisId ? current.messages.filter((message) => message.axisId !== axisId) : current.messages;
      const nextMessages = answerText
        ? [
            ...baseMessages,
            { id: createId("ai"), role: "ai" as const, provider: "local" as const, timestamp, text: questionText, axisId },
            { id: createId("user"), role: "user" as const, timestamp, text: answerText, axisId },
          ]
        : baseMessages;
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

  // 결과를 이미 본 뒤 "6개 더 답하기"로 돌아온 경우(session.idealTypeResuming)
  // 마지막 심화 문항을 답하면 마무리 질문을 또 묻지 않고 곧장 결과를
  // 다시 만든다 — 마무리 질문은 처음 퀴즈를 마칠 때 이미 한 번 답했다.
  const finishResumedDeepDive = () => {
    setSession((current) => ({
      ...current,
      [depthField]: "deep",
      [resumingField]: false,
      [resultField]: undefined,
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
    progressLabel = `${phase.index + 1} / ${requiredAxes.length}`;
    progressPercent = ((phase.index + 1) / requiredAxes.length) * 100;
    if (phase.index === 0 && optionalAxes.length > 0) {
      progressHint = `${requiredAxes.length}개 질문에 답하면 결과가 나와요. 더 깊이 알고 싶으면 ${optionalAxes.length}개를 추가로 답할 수 있어요.`;
    }
  } else if (phase.kind === "optional") {
    progressLabel = `심화 ${phase.index + 1} / ${optionalAxes.length}`;
    progressPercent = ((phase.index + 1) / optionalAxes.length) * 100;
  } else if (phase.kind === "decision") {
    progressLabel = "필수 질문 완료";
    progressPercent = 100;
  } else {
    progressLabel = "마지막 질문";
    progressPercent = 100;
  }

  const currentAxis = phase.kind === "required" || phase.kind === "optional" ? phase.axis : null;
  // 자유 서술형(reflection) 문항 중 실제로 맨 처음 나오는 것 하나의 id만
  // 기억해서, TopicQuiz.tsx 전체에서 전송 안내를 딱 한 번만 보여준다.
  const firstReflectionAxisId = axes.find((axis) => axis.type === "reflection")?.id;
  // 심화 재방문(6개 더 답하기로 돌아온 상태)의 마지막 문항 — 이 문항의
  // 답을 확정하면 finishResumedDeepDive()가 곧바로 결과 재생성을
  // 트리거한다(마무리 질문 화면을 거치지 않는 유일한 경로). 단일 선택
  // 문항(binary/quickTap/scenario/slider)의 자동 다음 넘김이 이 지점에서는
  // 꺼지고 명시적 "다음" 확인으로 바뀌는 기준이 된다 — 예전엔 각 분기마다
  // onSubmit 안에서 따로 계산했는데, 렌더링 시점에도 필요해져서(requireConfirm
  // prop) 한 곳으로 모았다.
  const isLastOptionalWhileResuming = Boolean(session[resumingField]) && phase.kind === "optional" && phase.index === optionalAxes.length - 1;

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
        <CompletionPreview
          blocks={RESULT_BLOCK_PREVIEW[topic.id] ?? []}
          autoExpandFirst={phase.kind === "required" && phase.index === 0}
        />
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
                setSession((current) => ({ ...current, [depthField]: depth }));
              }
              onFinish();
            }}
          />
        ) : currentAxis?.type === "quickTap" ? (
          <QuickTapStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            aboutSelf={currentAxis.aboutSelf}
            requireConfirm={isLastOptionalWhileResuming}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis?.type === "binary" ? (
          <BinaryStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            requireConfirm={isLastOptionalWhileResuming}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis?.type === "scenario" ? (
          <ScenarioStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            aboutSelf={currentAxis.aboutSelf}
            requireConfirm={isLastOptionalWhileResuming}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis?.type === "slider" ? (
          <SliderStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            requireConfirm={isLastOptionalWhileResuming}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis?.type === "ranking" ? (
          <RankingStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis?.type === "reflection" ? (
          <ReflectionStep
            key={currentAxis.id}
            question={currentAxis.question}
            placeholder={currentAxis.placeholder}
            showBack={step > 0}
            isFirst={currentAxis.id === firstReflectionAxisId}
            aboutSelf={currentAxis.aboutSelf}
            onBack={goBack}
            onSubmit={(answerText) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : currentAxis ? (
          <AxisStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            aboutSelf={currentAxis.aboutSelf}
            requireConfirm={isLastOptionalWhileResuming}
            onBack={goBack}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
              if (isLastOptionalWhileResuming) finishResumedDeepDive();
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

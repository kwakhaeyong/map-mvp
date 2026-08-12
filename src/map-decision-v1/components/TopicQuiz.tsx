"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { now } from "../engine/session";
import { applyQuizAnswer, pruneFromStep } from "../engine/quiz-answer";
import { resolveTopic, TopicAxis, TopicChoice, TopicOption } from "../engine/topics";
import { useAutoAdvance } from "../hooks/use-auto-advance";
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

// FIRST FUN MVP(2026-08) — taste의 tasteRecent(Q2) 문항 전용 전환 라벨.
// Q1(tasteMode, Landing Hero)이 "생각"을 묻고 바로 다음인 이 문항이
// "실제 행동"을 묻는다는 관계만 짧게 짚어준다 — 답변을 해석하거나
// 성격을 판단하는 문장은 아니다. SelfQuestionLabel과 같은 자리·같은
// 역할(문항 위 작은 라벨)이지만, taste 전용이라는 걸 구분하려고
// text-primary로 톤만 다르게 뒀다.
function RealityCheckLabel() {
  return <p className="text-[11px] font-black uppercase tracking-[0.08em] text-primary">이번엔 실제로</p>;
}

const MAX_SELECTIONS = 3;

// 세부 선택지(subOptions)를 골랐어도 태그 매핑(ideal-type-tags.ts)은
// 그 부모 칩의 라벨만 안다 — 세부까지 사전에 다 넣으면 어휘가 너무
// 커져서 "공용 언어" 역할을 못 한다. 그래서 여기서 항상 최상위 라벨로
// 되돌려 session.quizAnswers에 기록한다. tagLabel이 있는 옵션(topics.ts
// 참고 — 화면에 보여주는 label과 태그 매핑이 찾는 문자열이 다른 경우)은
// label 대신 tagLabel을 기록해서 매핑이 계속 원래 값을 찾게 한다.
function resolveTopLevelLabel(label: string, options: TopicOption[]): string {
  for (const option of options) {
    if (option.label === label) return option.tagLabel ?? option.label;
    if (option.subOptions?.some((sub) => sub.label === label)) return option.tagLabel ?? option.label;
  }
  return label;
}

function uniqueInOrder(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
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
        // VISUAL DESIGN PASS v1(2026-08) — Landing의 TopicCard 호버
        // 톤(옅은 ink-wash 틴트 + primary-border-soft 테두리, 강한
        // shadow-floating 대신 shadow-subtle)과 맞춰서, 랜딩에서 퀴즈로
        // 넘어와도 "다른 사람이 만든 화면"처럼 느껴지지 않게 한다. 선택
        // 로직·문구·비활성 처리는 그대로다.
        "flex flex-col items-start gap-0.5 rounded-large border px-4 text-left transition-all duration-normal ease-emphasized disabled:pointer-events-none",
        compact ? "py-2" : "py-3",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-subtle"
          : "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-primary-border-soft hover:bg-ink-wash hover:shadow-subtle",
        isDisabled && !isSelected && "opacity-40",
      )}
    >
      <span className={cx("font-extrabold tracking-[-0.01em]", compact ? "text-sm" : "text-base")}>{choice.label}</span>
      <span className={cx("text-xs font-medium", isSelected ? "text-primary-foreground-soft" : "text-text-muted")}>{choice.description}</span>
    </button>
  );
}

// FIRST FUN 2차 보완(2026-08) — taste의 Stack(다중 선택) 문항 7개
// 전용 카드. 기존 OptionChip(왼쪽 정렬 목록 행)과 달리 선택 전에도
// 면적이 큰 카드로 보여주고, 뽑힌 순서는 카드 모서리에 붙는 숫자
// 스티커로만 표시한다 — checkbox 원 대신이라 "설문 체크리스트"보다
// "카드를 쌓는" 인상에 가깝다. 뽑히기 전에는 배지 자체를 렌더링하지
// 않는다(절대 위치라 카드 높이에 영향 없음).
function StackCard({
  choice,
  isSelected,
  isDisabled,
  orderNumber,
  onClick,
}: {
  choice: TopicChoice;
  isSelected: boolean;
  isDisabled: boolean;
  orderNumber: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cx(
        // VISUAL DESIGN PASS v1(2026-08) — OptionChip과 같은 이유로 호버
        // 톤을 ink-wash/primary-border-soft로 맞춘다.
        "relative flex flex-col items-start gap-1 rounded-large border px-4 py-5 text-left transition-all duration-normal ease-emphasized disabled:pointer-events-none",
        isSelected
          ? "scale-[1.02] border-primary bg-primary text-primary-foreground shadow-floating"
          : "border-border bg-surface text-text-primary shadow-subtle hover:-translate-y-0.5 hover:scale-[1.01] hover:border-primary-border-soft hover:bg-ink-wash hover:shadow-subtle",
        isDisabled && !isSelected && "opacity-40",
      )}
    >
      {orderNumber ? (
        <span
          aria-hidden="true"
          className="absolute -left-2 -top-2 flex size-7 items-center justify-center rounded-full border-2 border-primary bg-primary-foreground text-sm font-black text-primary shadow-subtle"
        >
          {orderNumber}
        </span>
      ) : null}
      <span className="text-base font-extrabold tracking-[-0.01em]">{choice.label}</span>
      <span className={cx("text-xs font-medium", isSelected ? "text-primary-foreground-soft" : "text-text-muted")}>{choice.description}</span>
    </button>
  );
}

// 카드를 2열로 늘어놔도 읽기 불편하지 않은 질문만 2열로 두고, 선택지
// 설명이 긴 질문(lifestyle·tasteGuilty)은 1열로 남긴다 — "무조건
// 2열로 강제하지 않는다"는 지시에 따른 문항별 고정값. 글자 수를 매
// 렌더마다 계산하는 대신 이미 확정된 7문항 각각을 직접 판단해 표로
// 박아뒀다 — 문항이 바뀌지 않는 한 다시 계산할 이유가 없다.
const STACK_CARD_COLUMNS: Record<string, 1 | 2> = {
  tasteRecent: 2,
  tasteMood: 2,
  tasteSpace: 2,
  tasteAesthetic: 2,
  lifestyle: 1,
  tasteGuilty: 1,
  tasteWhy: 2,
};

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
  realityCheck,
  stackColumns,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  aboutSelf?: boolean;
  // 다른 네 가지 단일 선택 컴포넌트의 같은 이름 prop과 동일한 뜻이다.
  // 지금은 호출부가 항상 false만 넘겨 이 분기가 실행되지 않지만
  // (심화 재방문 시 결과 재생성을 곧장 트리거하던 흐름이 있었으나
  // 이상형·나 소개 둘 다 심화 경로 자체를 없애며 그 흐름이 제거됨),
  // prop 자체는 재사용 가능하게 남겨둔다.
  requireConfirm: boolean;
  // FIRST FUN MVP(2026-08) — taste의 tasteRecent(Q2)에만 켜지는 전환
  // 라벨("이번엔 실제로")만 담당한다. 카드 표현 자체는 stackColumns가
  // 맡는다(2차 보완 이후).
  realityCheck?: boolean;
  // FIRST FUN 2차 보완(2026-08) — taste의 Stack 문항 7개(tasteRecent·
  // tasteMood·tasteSpace·tasteAesthetic·lifestyle·tasteGuilty·tasteWhy)
  // 에만 켜진다. 1이면 세로 카드 1열, 2면 2열 그리드로 StackCard를
  // 그린다. undefined면(다른 5개 주제 전부 + 위 7개가 아닌 호출부)
  // 기존 OptionChip 세로 목록 그대로다 — 다중 선택·자동 진행(650ms)·
  // 커스텀 입력·subOptions 로직은 이 값과 무관하게 전혀 바뀌지 않는다.
  stackColumns?: 1 | 2;
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
      {realityCheck ? <RealityCheckLabel /> : null}
      <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
      <p className="text-xs font-black text-text-muted">
        최대 {MAX_SELECTIONS}개까지 고를 수 있어요 · 먼저 고른 게 더 중요해요 · {selected.length}/{MAX_SELECTIONS} 선택
      </p>
      {stackColumns ? (
        <div className={cx("grid gap-3", stackColumns === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {options.map((option) => {
            const isSelected = isChoiceSelected(option);
            const selectionIndex = selected.findIndex((item) => item.label === option.label);
            const orderNumber = selectionIndex === -1 ? null : selectionIndex + 1;
            return (
              <StackCard
                key={option.label}
                choice={option}
                isSelected={isSelected}
                isDisabled={atCap && !isSelected}
                orderNumber={orderNumber}
                onClick={() => toggle(option)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {options.map((option) => {
            const isSelected = isChoiceSelected(option);
            const isExpanded = expanded[option.label] ?? false;
            return (
              <div key={option.label} className="flex flex-col gap-2">
                <div className="flex items-stretch gap-2">
                  <div className="flex-1">
                    <OptionChip
                      choice={option}
                      isSelected={isSelected}
                      isDisabled={atCap && !isSelected}
                      onClick={() => toggle(option)}
                    />
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
      )}
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

// FIRST FUN MVP(2026-08) — BinaryStep의 "Versus" 표현에서만 쓰는 큰
// 대결형 블록. 기존 OptionChip(왼쪽 정렬 목록형)과 달리 가운데 정렬 +
// 큰 패딩으로 "둘 중 하나"라는 긴장감을 준다. pick만 받고 선택/자동
// 진행 로직은 그대로 BinaryStep의 useAutoAdvance가 갖고 있다.
function VersusOption({
  choice,
  isSelected,
  isDisabled,
  onClick,
}: {
  choice: TopicChoice;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cx(
        "flex flex-col items-center gap-1 rounded-large border px-5 py-6 text-center transition-all duration-normal ease-emphasized disabled:pointer-events-none sm:py-7",
        isSelected
          ? "scale-[1.02] border-primary bg-primary text-primary-foreground shadow-floating"
          : "border-border bg-surface text-text-primary shadow-subtle hover:-translate-y-0.5 hover:border-border-strong hover:shadow-floating",
        isDisabled && !isSelected && "opacity-40",
      )}
    >
      <span className={cx("text-base font-extrabold tracking-[-0.01em] sm:text-lg", isSelected ? "text-primary-foreground" : "text-text-primary")}>
        {choice.label}
      </span>
      <span className={cx("text-xs font-medium", isSelected ? "text-primary-foreground-soft" : "text-text-muted")}>{choice.description}</span>
    </button>
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
  versus,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  // 지금은 호출부가 항상 false만 넘긴다 — AxisStep의 같은 이름 prop
  // 주석 참고.
  requireConfirm: boolean;
  // FIRST FUN MVP(2026-08) — taste 전용 "Versus" 표현. 선택/자동 진행
  // 로직(useAutoAdvance, 250ms)은 그대로 두고 레이아웃만 위아래 대결
  // 구도로 바꾼다. taste가 아닌 다른 5개 주제 호출부는 이 값을 넘기지
  // 않아 기존 세로 목록 그대로다.
  versus?: boolean;
}) {
  const { pending, pick, confirm } = useAutoAdvance(
    (choice) => onSubmit(`${choice.label} — ${choice.description}`, [choice.label]),
    requireConfirm,
  );

  if (versus && options.length === 2) {
    const [left, right] = options;
    return (
      <div className="flex w-full flex-col gap-5">
        <h2 className="text-balance break-keep text-xl font-black leading-8 tracking-[-0.03em]">{question}</h2>
        <p className="text-xs font-black text-text-muted">둘 중 하나만 골라주세요</p>
        <div className="flex flex-col gap-3">
          <VersusOption
            choice={left}
            isSelected={pending?.label === left.label}
            isDisabled={pending !== null && pending.label !== left.label}
            onClick={() => pick(left)}
          />
          <div aria-hidden="true" className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-black tracking-[0.14em] text-text-muted">VS</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <VersusOption
            choice={right}
            isSelected={pending?.label === right.label}
            isDisabled={pending !== null && pending.label !== right.label}
            onClick={() => pick(right)}
          />
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
  tasteVariant,
}: {
  question: string;
  options: TopicOption[];
  onSubmit: (answerText: string, selectedTopLevelLabels: string[]) => void;
  onBack: () => void;
  showBack: boolean;
  aboutSelf?: boolean;
  requireConfirm: boolean;
  // FIRST FUN MVP(2026-08) — Landing.tsx REAL Q1 히어로에서 검증된
  // "누르고 싶은 타일" 톤(패딩 확대·선택 시 확대+코너 점)을 taste의
  // 본 퀴즈 QuickTapStep에도 입힌다. 새 아이콘은 추가하지 않는다(이번
  // 라운드에서 그래픽 자산은 늘리지 않기로 함). taste가 아닌 다른 5개
  // 주제 호출부는 이 값을 넘기지 않아 기존 2열 그리드 그대로다.
  tasteVariant?: boolean;
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
                "group relative flex flex-col items-center text-center transition-all duration-normal ease-emphasized disabled:pointer-events-none",
                tasteVariant ? "gap-1.5 rounded-large border px-4 py-6 sm:py-7" : "gap-0.5 rounded-large border px-4 py-4",
                isSelected
                  ? cx("border-primary bg-primary text-primary-foreground shadow-subtle", tasteVariant && "scale-[1.03] shadow-floating")
                  : cx(
                      "border-border bg-surface text-text-primary hover:-translate-y-0.5 hover:border-border-strong hover:bg-primary hover:text-primary-foreground hover:shadow-floating",
                      tasteVariant && "hover:scale-[1.01]",
                    ),
                isLocked && "opacity-40",
              )}
            >
              {tasteVariant ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute right-3 top-3 size-2 rounded-full bg-primary-foreground transition-all duration-normal ease-emphasized",
                    isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0",
                  )}
                />
              ) : null}
              <span
                className={cx(
                  tasteVariant ? "text-base font-extrabold tracking-[-0.01em] sm:text-lg" : "text-sm font-extrabold tracking-[-0.01em]",
                  isSelected ? "text-primary-foreground" : "text-text-primary group-hover:text-primary-foreground",
                )}
              >
                {option.label}
              </span>
              <span
                className={cx(
                  tasteVariant ? "text-xs font-medium" : "text-[11px] font-medium",
                  "transition-colors duration-normal ease-emphasized",
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
// 건너뛸 수도, "6개 더"로 심화(선택) 문항을 이어갈 수도 있는 주제를 위한
// 갈림길 인코딩이다 — 지금은 이상형(quizVersion 11)·나 소개(quizVersion 2)
// 둘 다 심화 경로를 없애 optionalAxes가 항상 빈 배열이라 아래 갈림길
// 자체가 발생하지 않지만, 나중에 심화(선택) 구간을 쓰는 주제가 다시
// 생기면 이 인코딩이 그대로 재사용된다. optionalAxes.length > 0일 때
// quizStep을 axes 배열 인덱스로 그대로 못 쓰고, 아래처럼 구간별로 해석한다:
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
  // 심화(선택) 문항이 아예 없는 주제(지금은 이상형·나 소개 둘 다)는
  // 필수/심화 갈림길 자체가 의미가 없으므로 "결정 화면"을 건너뛰고
  // 곧장 마무리 질문으로 간다.
  if (optionalCount === 0) return { kind: "closing" };
  if (step === requiredCount) return { kind: "decision" };
  if (step === requiredCount + 1) return { kind: "closing" };
  const optionalIndex = step - (requiredCount + 2);
  if (optionalIndex >= 0 && optionalIndex < optionalCount) return { kind: "optional", axis: optionalAxes[optionalIndex], index: optionalIndex };
  return { kind: "closing" };
}

// 마무리 질문(closing)은 topics.ts의 axis가 아니라 topic.closingPrompt
// 고정 문자열이라 axisId가 없었다 — 그래서 "이전"으로 되돌아갔다가 다시
// 답해도 옛 메시지가 안 지워지고 쌓였다. 다른 문항과 같은 방식으로
// 정리할 수 있게 이 화면 안에서만 쓰는 고정 id를 하나 준다(topics.ts는
// 건드리지 않는다 — 실제 axis가 아니라 이 컴포넌트 내부 부기용 값).
const CLOSING_AXIS_ID = "closing";

// 결과 화면 블록 이름을 그대로 옮긴 것 — AI가 만드는 문구가 아니라
// IdealTypeResultBlocks.tsx/SelfIntroResultBlocks.tsx의 SectionHeader
// title과 정확히 같은 문자열이다(둘 중 하나가 바뀌면 여기도 맞춰 바꿔야
// 한다). 퀴즈 화면에 "완주하면 이런 걸 받는다"를 상시 노출해 완주
// 동기를 준다 — 문항 자체를 늘리거나 바꾸지 않고 화면에만 추가하는
// 정보라 topics.ts(문항·선택지)는 건드리지 않는다.
const RESULT_BLOCK_PREVIEW: Record<string, string[]> = {
  idealType: ["이상형 기준", "끌림 패턴", "끌림 × 관계 적합도", "신호등", "자기 성찰", "다음 행동"],
  selfIntro: ["핵심 가치관", "반복되는 패턴", "나의 여러 모습", "특징", "자기 성찰", "다음 행동"],
};

// 필수 문항을 마친 뒤 "지금 결과 보기"(quick)로 끝냈는지 "6개 더"(deep)로
// 심화까지 마쳤는지 — /r/{id} 공유 화면의 "심층 분석 포함" 배지 표시용
// (MapSession.idealTypeQuizDepth/selfIntroQuizDepth, IdealTypeCard.tsx·
// SelfIntroCard.tsx가 공유 시 그대로 읽어 보낸다). 새 주제를 추가해도
// 이 맵에 등록하기 전까지는 존재하지 않는 topic.id로 조회되어 undefined가
// 나오고, 아래 호출부가 그 경우 아무 필드도 쓰지 않는다 — RESULT_BLOCK_
// PREVIEW와 같은 "모르는 topic.id는 안전하게 아무 일도 안 한다" 패턴이다.
// (예전엔 "selfIntro가 아니면 idealType"으로 가정하는 3항 연산자였는데,
// 그러면 3번째 주제가 idealType의 필드를 잘못 덮어썼다 — 이 맵으로 대체.)
const DEPTH_FIELD_BY_TOPIC: Partial<Record<string, "selfIntroQuizDepth" | "idealTypeQuizDepth">> = {
  idealType: "idealTypeQuizDepth",
  selfIntro: "selfIntroQuizDepth",
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
      updatedAt: now(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaleQuizProgress]);

  const step = isStaleQuizProgress ? 0 : (session.quizStep ?? 0);
  const phase = resolvePhase(step, requiredAxes, optionalAxes);

  // quiz_start(FIRST CLICK MVP, 2026-08 / FIRST ACTION MVP 보완, 2026-08) —
  // "TopicQuiz 화면에서 실제 진행이 시작된 시점"에만 찍는다. 대부분의
  // 주제는 이 시점이 곧 Q1 화면(step === 0)이지만, taste는 진입 경로가
  // 둘이라 하나의 고정 step으로 정할 수 없다:
  //   1) Landing.tsx REAL Q1 히어로 — tasteMode(Q1)를 이미 답으로 받아
  //      TopicQuiz가 quizStep: 1(Q2)부터 마운트된다. 이 경로에서는 Q2
  //      화면(step === 1)이 "TopicQuiz에서 실제로 진행이 시작된 시점"이다.
  //      Q1은 이미 랜딩에서 답했으니 Q1에서 다시 찍으면 이중 계산이 된다.
  //   2) MapDecisionProduct.tsx의 generic start("taste")(그리드 클릭·
  //      NextMapPrompt "다음 MAP 유도" 추천 등) — ProfileStep을 거치지
  //      않고 TopicQuiz가 실제 Q1(tasteMode)부터 정상적으로 시작한다
  //      (start() 함수 근처 주석 참고). 이 경로에서는 Q1 화면
  //      (step === 0)이 진행 시작 시점이다 — 나머지 5개 주제와 동일.
  // 새 session 필드를 추가하지 않고, 이미 있는
  // session.quizAnswers["tasteMode"] 존재 여부로 두 경로를 구분한다 —
  // 1번 경로는 마운트 시점에 이미 그 값이 채워져 있고(Landing의
  // startTasteFirstAnswer가 quizStep과 quizAnswers를 함께 세팅), 2번
  // 경로는 마운트 시점에 비어 있다(아직 아무것도 안 답함). 컴포넌트가
  // 처음 렌더될 때의 이 값으로 quizStartStep을 정하므로, 사용자가 그
  // 뒤 실제로 Q1에 답해 quizAnswers.tasteMode가 채워지더라도(2번 경로)
  // 이미 한 번 찍은 뒤라 재계산이 다시 영향을 주지 않는다(아래
  // trackedRef 가드).
  // trackedRef는 React 18 StrictMode(개발 모드에서 마운트 직후 effect를
  // 한 번 더 실행)로 인한 중복 호출만 막는다 — 컴포넌트 인스턴스당 최대
  // 1회만 보내면 되고, 뒤로 가기로 그 step에 다시 도달해도(이미 한 번
  // 찍었으므로) 다시 찍지 않는다.
  const tasteAnsweredViaHero = topic.id === "taste" && Boolean(session.quizAnswers?.tasteMode);
  const quizStartStep = topic.id === "taste" ? (tasteAnsweredViaHero ? 1 : 0) : 0;
  const quizStartTrackedRef = useRef(false);
  useEffect(() => {
    if (quizStartTrackedRef.current || step !== quizStartStep) return;
    quizStartTrackedRef.current = true;
    track("quiz_start", { topicId: topic.id });
  }, [step, topic.id, quizStartStep]);

  // quiz_progress(NEXT CYCLE — MINIMUM PRODUCT ANALYTICS, 2026-08) — 문항마다
  // 찍지 않고 25/50/75% 세 지점만 본다(30~100명 규모 테스트에 그 이상은
  // 과하다는 지시). 진행률은 하드코딩된 문항 수가 아니라 requiredAxes.length
  // 대비 step 비율로 계산한다 — 6개 완성형 퀴즈 주제 전부 optionalAxes가
  // 항상 빈 배열이라(topics.ts 전수 확인) "필수만 있는 진행률"이 곧 실제
  // 진행률과 같다. trackedThresholdsRef가 한 번 찍은 지점을 기억해 뒤로
  // 갔다 다시 진행해도(= step이 줄었다 다시 늘어도) 중복 발생하지 않는다
  // (quizStartTrackedRef와 같은, 이 파일에 이미 있던 방식 그대로).
  const progressTrackedThresholdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const total = requiredAxes.length;
    if (total === 0) return;
    const progressPercent = (step / total) * 100;
    for (const threshold of [25, 50, 75]) {
      if (progressPercent < threshold || progressTrackedThresholdsRef.current.has(threshold)) continue;
      progressTrackedThresholdsRef.current.add(threshold);
      track("quiz_progress", { topicId: topic.id, progress: threshold });
    }
  }, [step, topic.id, requiredAxes.length]);

  // axisId/selectedTopLevelLabels는 이 답변이 실제 TopicAxis(topics.ts)에
  // 묶여 있을 때만 넘어온다(마무리 질문 같은 자유 서술에는 없음) — 있을
  // 때만 session.quizAnswers에 기록해서 공유 태그(ideal-type-tags.ts)가
  // 나중에 코드로 결정적으로 매핑할 수 있게 한다. 실제 변환 로직은
  // engine/quiz-answer.ts의 applyQuizAnswer로 옮겨졌다 — Landing.tsx의
  // REAL Q1 히어로도 같은 함수를 호출해서 이 화면과 완전히 같은 모양의
  // 답변 데이터를 만든다(자세한 이유는 그 파일의 주석 참고).
  const commitAnswer = (questionText: string, answerText: string, axisId?: string, selectedTopLevelLabels?: string[]) => {
    setSession((current) => applyQuizAnswer(current, questionText, answerText, axisId, selectedTopLevelLabels, requiredAxes, optionalAxes));
  };

  const goBack = () => {
    setSession((current) => {
      const nextStep = Math.max(0, (current.quizStep ?? 0) - 1);
      const pruned = pruneFromStep(current, nextStep, requiredAxes, optionalAxes);
      return { ...pruned, quizStep: nextStep, updatedAt: now() };
    });
  };

  const jumpTo = (nextStep: number) => {
    setSession((current) => {
      const pruned = pruneFromStep(current, nextStep, requiredAxes, optionalAxes);
      return { ...pruned, quizStep: nextStep, updatedAt: now() };
    });
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
              commitAnswer(topic.closingPrompt ?? "더 하고 싶은 말이 있나요?", answerText, CLOSING_AXIS_ID);
              const depthField = DEPTH_FIELD_BY_TOPIC[topic.id];
              if (optionalAxes.length > 0 && depthField) {
                const depth = step === requiredAxes.length + 1 ? "quick" : "deep";
                setSession((current) => ({ ...current, [depthField]: depth }));
              }
              // quiz_complete(FIRST CLICK MVP, 2026-08) — 마무리 질문
              // 제출 버튼 클릭이라 클릭 한 번당 정확히 한 번만 실행된다
              // (useEffect가 아니라 이벤트 핸들러라 StrictMode 이중 호출
              // 대상이 아니다). 6개 완성형 퀴즈 주제 전부 심화 구간이
              // 없어(optionalAxes 항상 빈 배열) closing이 유일한 종료
              // 지점이다 — career는 이 컴포넌트를 쓰지 않아 대상이 아니다.
              track("quiz_complete", { topicId: topic.id });
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
            requireConfirm={false}
            tasteVariant={topic.id === "taste"}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
            }}
          />
        ) : currentAxis?.type === "binary" ? (
          <BinaryStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            requireConfirm={false}
            versus={topic.id === "taste"}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
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
            requireConfirm={false}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
            }}
          />
        ) : currentAxis?.type === "slider" ? (
          <SliderStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            onBack={goBack}
            requireConfirm={false}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
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
            }}
          />
        ) : currentAxis ? (
          <AxisStep
            key={currentAxis.id}
            question={currentAxis.question}
            options={currentAxis.options}
            showBack={step > 0}
            aboutSelf={currentAxis.aboutSelf}
            requireConfirm={false}
            realityCheck={topic.id === "taste" && currentAxis.id === "tasteRecent"}
            stackColumns={topic.id === "taste" ? STACK_CARD_COLUMNS[currentAxis.id] : undefined}
            onBack={goBack}
            onSubmit={(answerText, selectedTopLevelLabels) => {
              commitAnswer(currentAxis.question, answerText, currentAxis.id, selectedTopLevelLabels);
            }}
          />
        ) : null}
      </section>
    </main>
  );
}

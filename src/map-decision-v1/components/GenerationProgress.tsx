"use client";

import { useEffect, useState } from "react";
import { TagRow } from "./IdealTypeResultBlocks";
import { Button, Card } from "./ui/primitives";

// AI 생성 중에는 실제 진행률(%)을 알 방법이 없다 — 시간 기반으로 숫자를
// 올리면 사용자가 금방 눈치채고 오히려 못 믿게 된다. 그래서 숫자 대신,
// 결과에 실제로 들어가는 항목 순서대로 문구를 바꿔 보여준다. 문구 전환은
// 정해진 시간마다 다음 단계로 넘어가되(서버가 단계별 진행을 알려줄 방법이
// 없으므로), 마지막 문구에 도달한 뒤에는 실제로 끝나거나 실패할 때까지
// 그 문구를 그대로 유지한다 — 단계가 다 끝났는데 화면만 도는 상태를 피한다.
//
// 프로덕션 실측 생성 시간 약 144초(2026-08-09, effort=high 기준).
// STAGE_INTERVAL_MS: 5단계 × 27초 = 135초로, 마지막 단계에서 약 10초
// 정지한다.
const STAGE_INTERVAL_MS = 27_000;
// 정상 범위의 최대치(135초)를 넘어선 뒤에야 "조금 더 걸리고 있어요"
// 안내가 뜨도록 3분(180초)으로 잡았다 — 예전 2분(120초)은 133초짜리
// 정상 생성도 이상 상황으로 잘못 안내했다.
const DELAYED_AFTER_MS = 180_000; // 3분 경과
// DELAYED_AFTER_MS와의 1분 간격은 그대로 유지한다.
const RETRY_AFTER_MS = 240_000; // 4분 경과

// 실측 약 144초에 맞춰 "2분 30초"로 표현한다.
export const GENERATION_ESTIMATE_TEXT = "보통 2분 30초 정도 걸려요";
const DELAYED_TEXT = "조금 더 걸리고 있어요. 화면을 닫지 마세요.";
const SAVED_REASSURANCE_TEXT = "답변은 이미 저장돼 있어요";
// 태그 순차 강조가 다음 태그로 넘어가는 간격. 너무 빠르면 산만하고
// 너무 느리면 "멈췄다"는 인상을 다시 준다 — animate-pulse(2s 주기)보다
// 느긋하게, 부드러운 색 전환(TagRow의 duration-700)만으로 충분히
// 눈에 띄되 튀지 않게 골랐다.
const TAG_HIGHLIGHT_INTERVAL_MS = 1600;
// docs/MAP_CONSTITUTION.md의 Core statement를 그대로 인용한다 — 새로
// 지어내는 카피가 아니라 이미 정해둔 서비스 정체성 문구를 재사용한다.
const BRAND_STATEMENT = "정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.";

export function GenerationWaitCard({
  stages,
  onRetry,
  tags,
  answeredCount,
}: {
  stages: string[];
  onRetry: () => void;
  // 이상형 퀴즈에서만 쓴다. 공유 태그(ideal-type-tags.ts)는 AI 호출 없이
  // 퀴즈 답변만으로 코드가 결정적으로 정하는 값이라, 결과가 오기 전에
  // 미리 보여줘도 최종 결과에 실제로 붙는 태그와 항상 똑같다 — 같은
  // session.quizAnswers를 같은 함수(getIdealTypeTags)에 넣은 값이라
  // 달라질 수가 없다. 진로 결과처럼 태그 개념이 없는 화면은 생략하면 된다.
  tags?: string[];
  // 실제로 답한 문항 수(세션에서 계산해 넘겨받음, 여기서 하드코딩하지
  // 않는다). 태그와 마찬가지로 확정된 사실만 보여준다.
  answeredCount?: number;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
    // key prop(호출부에서 매 시도마다 attempt 번호를 넘김)으로 이 컴포넌트
    // 자체를 새로 마운트시켜 재시도 시 타이머를 처음부터 다시 센다.
  }, []);

  const stageIndex = Math.min(stages.length - 1, Math.floor(elapsedMs / STAGE_INTERVAL_MS));
  const isDelayed = elapsedMs >= DELAYED_AFTER_MS;
  const canRetry = elapsedMs >= RETRY_AFTER_MS;
  // 5단계 문구가 다 끝나 마지막 문구에 멈춰 있는 정지 구간(108초 이후 —
  // 실측 최저치인 100~101초 근처라, 가장 빠른 생성은 이 구간에 거의
  // 들어가지 않고 끝난다). 이 구간에서만 태그를 하나씩 순서대로 옅게
  // 강조해 "화면이 멈추지 않았다"를 보여준다 — 진행률이나 남은 시간을
  // 아는 척하지 않는 순수 시각 신호다.
  const isFrozenStage = stageIndex === stages.length - 1;
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  useEffect(() => {
    if (!isFrozenStage || !tags || tags.length === 0) return;
    const timer = setInterval(() => {
      setActiveTagIndex((index) => (index + 1) % tags.length);
    }, TAG_HIGHLIGHT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isFrozenStage, tags]);

  return (
    <div className="flex min-h-[65dvh] flex-col gap-3">
      {tags && tags.length > 0 ? (
        <Card className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs font-extrabold text-text-secondary">당신의 태그는 이미 나왔어요</p>
          <TagRow tags={tags} className="justify-center" activeIndex={isFrozenStage ? activeTagIndex : undefined} />
          {answeredCount ? (
            <p className="text-[11px] font-medium text-text-muted">{answeredCount}개 답변을 반영해서 만들고 있어요</p>
          ) : null}
        </Card>
      ) : null}
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm font-extrabold text-text-secondary">{stages[stageIndex]}</p>
        <p className="text-xs font-semibold text-text-muted">{isDelayed ? DELAYED_TEXT : GENERATION_ESTIMATE_TEXT}</p>
        <p className="text-[11px] font-medium text-text-muted">{SAVED_REASSURANCE_TEXT}</p>
        {canRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        ) : null}
      </Card>
      <p className="mt-auto pb-2 text-center text-[11px] font-medium text-text-muted">{BRAND_STATEMENT}</p>
    </div>
  );
}

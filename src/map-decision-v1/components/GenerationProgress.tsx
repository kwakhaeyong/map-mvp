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
const STAGE_INTERVAL_MS = 12_000;
const DELAYED_AFTER_MS = 120_000; // 2분 경과
const RETRY_AFTER_MS = 180_000; // 3분 경과

export const GENERATION_ESTIMATE_TEXT = "보통 1~2분 정도 걸려요";
const DELAYED_TEXT = "조금 더 걸리고 있어요. 화면을 닫지 마세요.";
const SAVED_REASSURANCE_TEXT = "답변은 이미 저장돼 있어요";

export function GenerationWaitCard({
  stages,
  onRetry,
  tags,
}: {
  stages: string[];
  onRetry: () => void;
  // 이상형 퀴즈에서만 쓴다. 공유 태그(ideal-type-tags.ts)는 AI 호출 없이
  // 퀴즈 답변만으로 코드가 결정적으로 정하는 값이라, 결과가 오기 전에
  // 미리 보여줘도 최종 결과에 실제로 붙는 태그와 항상 똑같다 — 같은
  // session.quizAnswers를 같은 함수(getIdealTypeTags)에 넣은 값이라
  // 달라질 수가 없다. 진로 결과처럼 태그 개념이 없는 화면은 생략하면 된다.
  tags?: string[];
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

  return (
    <div className="flex flex-col gap-3">
      {tags && tags.length > 0 ? (
        <Card className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs font-extrabold text-text-secondary">당신의 태그는 이미 나왔어요</p>
          <TagRow tags={tags} className="justify-center" />
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
    </div>
  );
}

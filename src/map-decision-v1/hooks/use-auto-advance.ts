import { useEffect, useRef, useState } from "react";
import { TopicChoice } from "../engine/topics";

// TopicQuiz.tsx가 쓰던 "고르면 바로 다음으로" 훅을 그대로 옮긴 것 —
// FIRST ACTION MVP(2026-08)에서 Landing.tsx의 REAL Q1 히어로도 같은
// 선택 → 강조 → 자동 전환 감각을 써야 해서 컴포넌트 밖으로 뺐다.
// 동작은 이전과 완전히 같다(로직 변경 없음, 파일만 이동).
//
// 선택 즉시 넘기면 방금 고른 항목이 눈에 보일 틈도 없이 화면이
// 바뀌어 "내가 뭘 눌렀는지" 확인할 수가 없다 — 200~300ms(여기서는
// 250ms, 그 사이 값) 동안 선택된 상태를 먼저 보여준 뒤에 넘어간다.
// requireConfirm이 true인 동안은 자동으로 넘어가지 않고 pending만
// 갱신한다.
export const AUTO_ADVANCE_DELAY_MS = 250;

export function useAutoAdvance(onAdvance: (choice: TopicChoice) => void, requireConfirm: boolean) {
  const [pending, setPending] = useState<TopicChoice | null>(null);
  // 연속 탭 방지: 자동 전환이 이미 예약된 뒤에는 잠가서 두 번 넘어가거나
  // 답이 중복 기록되는 걸 막는다.
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

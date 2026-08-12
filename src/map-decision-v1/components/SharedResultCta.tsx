"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";
import Link from "next/link";

// app/r/[id]/page.tsx는 async 서버 컴포넌트라 onClick 핸들러(friend_cta_click)와
// useEffect(shared_view)를 그 파일 안에 직접 둘 수 없다 — 이 세 컴포넌트만
// 그 목적으로 여기로 옮겼다. href 계산(ctaHref)·버튼 스타일(PRIMARY_CTA_CLASS)
// 자체는 원래 page.tsx에 있던 것을 그대로 옮긴 것뿐, 동작은 바꾸지 않았다.

export const PRIMARY_CTA_CLASS =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-pill border border-primary bg-primary px-6 text-base font-extrabold tracking-[-0.01em] text-primary-foreground shadow-subtle transition-all duration-normal ease-emphasized hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-floating active:translate-y-0";

// topicId가 있으면 "/?start=<topicId>"로 보내 랜딩(종류 선택 화면)을
// 건너뛰고 같은 주제의 퀴즈/대화를 곧장 시작한다(MapDecisionProduct.tsx의
// 마운트 effect가 이 쿼리 파라미터를 읽는다). topicId를 모르는 상황
// (레이아웃을 모르는 결과, 링크 만료 등)에서는 그냥 "/"로 보낸다.
//
// withId(이 카드의 공유 ID)가 같이 있으면 "&with=<id>"도 붙인다 — 지금
// 이 카드(A)를 보고 있는 사람(B)이 퀴즈를 마치면 자기 결과 화면에서
// "친구와의 궁합 보기" 배너를 볼 수 있게 하는 용도다(궁합 기능).
// topicId가 없을 때는 애초에 "/"로만 보내므로 with도 같이 생략된다.
function ctaHref(topicId?: string, withId?: string) {
  if (!topicId) return "/";
  const params = new URLSearchParams({ start: topicId });
  if (withId) params.set("with", withId);
  return `/?${params.toString()}`;
}

// NEXT CYCLE — MINIMUM PRODUCT ANALYTICS(2026-08) — friend_cta_click을
// 여기서 찍는다. share id(withId 쪽의 "with" 파라미터가 아니라 이 카드
// 자체의 id) 는 넘기지 않는다 — 분석에 필요한 건 어떤 주제였는지뿐이다.
function trackFriendCtaClick(topicId?: string) {
  track("friend_cta_click", { topicId: topicId ?? "unknown" });
}

// VIRAL/FRIEND EXPERIENCE REBUILD(2026-08) — label을 선택적으로 받게
// 확장했다. 기본값("너도 만들어봐")은 그대로라 이걸 넘기지 않는
// 이상형·나소개·친구·일할 때의 나·여행 스타일 5개 분기는 문구·동작이
// 하나도 안 바뀐다 — 취향 분기에서만 더 구체적인 문구("나는 어떻게
// 나올까?")를 넘겨서 쓴다(app/r/[id]/page.tsx §6 참고).
export function TryItCta({ topicId, withId, label = "너도 만들어봐" }: { topicId?: string; withId?: string; label?: string }) {
  return (
    <Link href={ctaHref(topicId, withId)} className={PRIMARY_CTA_CLASS} onClick={() => trackFriendCtaClick(topicId)}>
      {label}
    </Link>
  );
}

// 자기성찰 블록(가장 감정적으로 몰입되는 지점) 바로 다음에 놓는 두 번째
// CTA. 맨 아래 CTA(강조 버튼)와 똑같이 생기면 같은 걸 두 번 보여주는
// 것처럼 느껴져서, 여기는 테두리만 있는 은은한 카드형으로 차등을 둔다.
// TryItCta와 같은 이유로 label/microcopy를 선택적으로 받게 확장했다.
export function MidResultCta({
  topicId,
  withId,
  label = "나도 이런 발견, 해보고 싶다면?",
  microcopy,
}: {
  topicId?: string;
  withId?: string;
  label?: string;
  microcopy?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {microcopy ? <p className="text-center text-xs font-semibold text-text-muted">{microcopy}</p> : null}
      <Link
        href={ctaHref(topicId, withId)}
        // #116: border-primary/30, bg-primary/5, hover:bg-primary/10이 이 커스텀
        // 색엔 슬래시 투명도 클래스가 생성되지 않아 실제로는 늘 투명이었다 —
        // 같은 값의 ink-wash 토큰으로 대체한다.
        className="flex items-center justify-between gap-3 rounded-large border border-ink-wash-border bg-ink-wash px-5 py-4 text-sm font-extrabold text-primary transition-colors hover:bg-ink-wash-border"
        onClick={() => trackFriendCtaClick(topicId)}
      >
        <span>{label}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

// NEXT CYCLE — MINIMUM PRODUCT ANALYTICS(2026-08) — /r/[id]가 실제로
// 지원되는 결과 형태로 정상 렌더링됐을 때만 한 번 찍는다(만료·저장소
// 장애·미지원 레이아웃 화면에서는 호출하지 않는다 — page.tsx가 지원되는
// 분기에서만 이 컴포넌트를 렌더링한다). trackedRef는 이 파일의 다른
// 트래커들과 같은 이유로(StrictMode 이중 마운트 방지) 둔다. share id는
// prop으로도 받지 않는다 — topicId 외에는 analytics에 넣지 않는다.
export function ShareViewTracker({ topicId }: { topicId?: string }) {
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track("shared_view", { topicId: topicId ?? "unknown" });
  }, [topicId]);
  return null;
}

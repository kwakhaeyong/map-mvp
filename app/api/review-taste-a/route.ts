import { NextResponse } from "next/server";
import { buildReviewPersonaSession } from "../../../src/map-decision-v1/engine/review-fixtures";
import { generateTasteResult } from "../../../src/map-decision-v1/engine/taste-generator";

// RESULT WOW 검증 전용 — Preview/개발 환경에서만 동작하는 dev 도구다.
// 오너가 매번 20문항을 다시 풀거나 터미널에서 API 키를 입력하지 않고,
// 고정된 Persona A 입력으로 "지금 이 브랜치의 taste-generator"가 실제로
// 무엇을 만드는지 클릭 한 번으로 확인하기 위한 라우트다.
//
// production에서는 차단한다. NODE_ENV가 아니라 VERCEL_ENV로 판단하는
// 이유: Vercel은 Preview 배포도 최적화 빌드(NODE_ENV=production)로
// 돌기 때문에, app/dev/card-preview처럼 NODE_ENV만 보면 Preview에서도
// 막혀 이 도구의 존재 목적(Preview에서 오너가 클릭)이 깨진다. VERCEL_ENV는
// Production/Preview/개발(미설정)을 정확히 구분해준다.
function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

// generateTasteResult 1회가 실측 최대 150초 안팎 걸릴 수 있어(taste-generator.ts
// 주석 참고), 다른 결과 생성 라우트와 같은 값으로 넉넉히 늘린다.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// 이 라우트는 사용자용 생성 한도(rate-limit.ts)·캐시(generation-cache.ts)·
// 공유 서명(result-signature.ts)을 전혀 거치지 않는다 — 실제 서비스
// 사용자의 생성 횟수와 무관한 내부 검증 도구이기 때문이다. API 키는
// generateTasteResult 내부(서버 전용 모듈)에서만 읽고, 이 라우트는 그
// 값을 직접 다루지 않는다 — 응답 바디에도 키를 넣지 않는다.
// RESULT GENERATION FAILURE 조사(2026-08)로 추가: 이 라우트는 애초에
// production에서 막혀 있으니(isBlocked), 생성기가 왜 실패했는지(category)
// ·몇 번 시도했는지(attempts)를 그대로 응답에 실어도 안전하다 — 오너가
// Preview에서 "결과 생성에 실패했습니다" 한 줄 대신 실제 원인을 바로 볼
// 수 있게 하는 게 이 진단 필드의 목적이다. production 사용자 라우트
// (app/api/generate-taste-result/route.ts)는 이 필드들을 응답에 절대
// 넣지 않는다 — 서버 로그로만 남긴다.
export async function POST() {
  if (isBlocked()) {
    return NextResponse.json({ ok: false, category: "blocked_in_production" as const, attempts: 0 }, { status: 404 });
  }

  const requestStartedAt = Date.now();
  const session = buildReviewPersonaSession("A");
  const outcome = await generateTasteResult(session, { requestStartedAt });
  // GENERATION BUDGET 조사(2026-08)로 추가 — generateTasteResult가 반환한
  // 진단 정보(마지막 시도의 stop_reason/토큰 수/effort)에, 이 라우트만
  // 아는 값(전체 소요 시간 = 재시도·backoff까지 포함한 실제 체감 시간)을
  // 더해 그대로 응답에 싣는다.
  const totalDurationMs = Date.now() - requestStartedAt;

  if (!outcome.result) {
    return NextResponse.json(
      {
        ok: false,
        category: outcome.category,
        attempts: outcome.attempts,
        countsAsFailure: outcome.countsAsFailure,
        diagnostics: outcome.diagnostics,
        totalDurationMs,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, result: outcome.result, attempts: outcome.attempts, diagnostics: outcome.diagnostics, totalDurationMs });
}

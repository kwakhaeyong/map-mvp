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
export async function POST() {
  if (isBlocked()) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = buildReviewPersonaSession("A");
  const outcome = await generateTasteResult(session);

  if (!outcome.result) {
    return NextResponse.json(
      { error: "generation_failed", countsAsFailure: outcome.countsAsFailure },
      { status: 502 },
    );
  }

  return NextResponse.json({ result: outcome.result });
}

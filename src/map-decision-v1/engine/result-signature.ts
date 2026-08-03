import { createHmac, timingSafeEqual } from "crypto";
import { ResultBlockKey } from "../types";

// "/api/share가 클라이언트가 보낸 result를 형태(shape)만 검증하고 그대로
// 저장한다 — 형태만 맞으면 임의 텍스트를 mapdecision.com/r/{id}에 올릴 수
// 있다"는 문제를 막는다. share-validation.ts의 형태 검증은 그대로 두고,
// 이 파일은 그 위에 "이 결과를 실제로 우리 서버(생성 라우트)가 만들었는가"
// 를 검증하는 층을 하나 더 얹는다.
//
// 생성 라우트(generate-idealtype-result 등)가 결과를 응답할 때 이 파일의
// signResult()로 서명을 같이 내려주고, 클라이언트는 그 서명을 그대로
// 들고 있다가 "공유하기"를 누를 때만 /api/share로 실어 보낸다.
// /api/share는 verifyResultSignature()로 그 서명이 실제로 서버가 만든
// 내용과 일치하는지 재계산해서 확인한다 — 서버만 아는 비밀키
// (RESULT_SIGNING_SECRET 환경변수) 없이는 위조할 수 없다.

// generation-cache.ts의 stableStringify와 같은 이유로 이 파일에도 둔다 —
// 객체 키 순서가 달라도 항상 같은 문자열이 나와야 서명이 안정적이다.
// 두 파일이 쓰임새(캐시 키 vs 서명)가 달라 공용으로 뽑지 않고 각자
// 작게 유지한다.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

// 진로 결과는 블록(factorMatrix/scenarios/timeline/insights)마다 따로
// 재생성할 수 있어(app/api/generate-result/route.ts의 block 분기), 결과
// 전체가 아니라 블록 단위로 서명한다 — 생성 라우트와 공유 라우트
// (app/api/share/route.ts) 양쪽이 이 함수로 정확히 같은 scope 문자열을
// 만들어야 하므로 한 곳에만 둔다.
export function careerBlockScope(block: ResultBlockKey): string {
  return `career:${block}`;
}

function getSigningSecret(): string | null {
  const secret = process.env.RESULT_SIGNING_SECRET;
  return secret && secret.length > 0 ? secret : null;
}

// scope: 이 서명이 정확히 무엇에 대한 것인지 못박는 문자열이다
// (예: "idealType", "selfIntro", 진로는 블록마다 "career:factorMatrix" 등).
// scope 없이 내용만 서명하면, 한 자리에서 받은 정상 서명을 다른 자리에
// (예: 다른 사람의 selfIntro 결과를, 형태만 비슷한 내 idealType 결과에)
// 그대로 옮겨 붙이는 재사용 공격이 가능해진다.
export function signResult(scope: string, payload: unknown): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const canonical = `${scope}:${stableStringify(payload)}`;
  return createHmac("sha256", secret).update(canonical).digest("hex");
}

// 비밀키가 없으면(RESULT_SIGNING_SECRET 미설정) 어떤 서명도 검증할 수
// 없으므로 항상 실패(false)로 처리한다 — fail-closed. 레이트리밋이
// Redis 장애 시 "확인 못 하면 막는다"로 비용을 방어하는 것과 같은
// 이유다: 이 검증은 순수 최적화가 아니라 보안 통제라, 확인 못 한다고
// 그냥 통과시키면 이 기능 자체가 없는 것과 같아진다. 서명 없이도
// 저장이 되던 지금 상태와 똑같이 돌아가 버리기 때문이다.
export function verifyResultSignature(scope: string, payload: unknown, signature: unknown): boolean {
  const secret = getSigningSecret();
  if (!secret) return false;
  if (typeof signature !== "string" || signature.length === 0) return false;

  const canonical = `${scope}:${stableStringify(payload)}`;
  const expected = createHmac("sha256", secret).update(canonical).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  // 길이가 다르면 timingSafeEqual이 예외를 던진다 — 그 전에 걸러낸다.
  // (서명 위조 시도가 흔히 빈 문자열이나 엉뚱한 길이일 수 있어, 여기서
  // false를 반환해도 "길이가 맞았는지"는 별도 타이밍 공격 표면이 되지
  // 않는다 — 어차피 실제 서명 없이는 올바른 길이도 맞히기 어렵다.)
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

import { GenerationTopic } from "./generation-cache";

// 결과 생성이 실제로 얼마나 걸리는지 조사하기 위한 계측 전용 로그.
// 성능을 바꾸지 않고 관찰만 한다 — 언제 부를지는 각 생성기/API
// 라우트가 정하고, 이 파일은 "어떤 형식으로 한 줄에 남길지"만 정한다.
// 6개 생성기·6개 라우트가 전부 이 두 함수만 거치게 해서 형식이
// 갈라지지 않게 한다.
//
// Vercel Runtime Logs에서 주제별로 필터링할 수 있도록 접두어에 항상
// [generation-timing:<topic>] / [api-timing:<topic>] 형식을 쓴다 —
// 예: "generation-timing:idealType"으로 검색하면 이상형 주제의 생성기
// 계측 로그만 걸러낼 수 있다.
//
// 절대 넣지 않는 것: 사용자가 입력한 답변·자유 서술 텍스트, AI가 생성한
// 결과 본문. 여기 남기는 값은 전부 수치·카테고리(경과 시간, 시도 번호,
// 결과 종류, 토큰 수, effort 값, 캐시 히트 여부)뿐이다.

export type GenerationAttemptOutcome =
  | { kind: "success"; outputTokens: number | null; thinkingTokens: number | null }
  | { kind: "truncated"; outputTokens: number | null; thinkingTokens: number | null }
  | { kind: "schema_invalid"; outputTokens: number | null; thinkingTokens: number | null }
  | { kind: "api_error" };

// elapsedMs는 이 시도 하나의 소요 시간이 아니라, 생성 시작(재시도 루프
// 진입 전) 시각부터 이 시도가 끝난 시점까지 누적 경과 시간이다 — 시도가
// 2번째면 1차 시도에 걸린 시간까지 포함된 값이 찍힌다. 재시도가
// 전체 대기 시간을 얼마나 늘리는지는 1차 시도 로그의 elapsedMs와
// 2차 시도 로그의 elapsedMs를 빼서 바로 알 수 있다.
export function logGenerationAttempt(params: {
  topic: GenerationTopic;
  attempt: number;
  generationStartedAt: number;
  effort: string;
  outcome: GenerationAttemptOutcome;
}): void {
  const { topic, attempt, generationStartedAt, effort, outcome } = params;
  const elapsedMs = Date.now() - generationStartedAt;
  const outputTokens = outcome.kind === "api_error" ? null : outcome.outputTokens;
  const thinkingTokens = outcome.kind === "api_error" ? null : outcome.thinkingTokens;
  console.log(
    `[generation-timing:${topic}] attempt=${attempt} elapsedMs=${elapsedMs} outcome=${outcome.kind} effort=${effort} outputTokens=${outputTokens ?? "null"} thinkingTokens=${thinkingTokens ?? "null"}`,
  );
}

// API 라우트가 요청을 받은 시점부터 응답을 돌려주기 직전까지 걸린
// 전체 시간. cache="hit"이면 Anthropic을 아예 호출하지 않고 끝난
// 요청이라는 뜻이라, elapsedMs가 크게 나오면 캐시 조회(Redis 왕복)나
// 그 앞단(레이트리밋 예약 등)이 원인이라는 걸 바로 구분할 수 있다.
export function logGenerationRequest(params: {
  topic: GenerationTopic;
  requestStartedAt: number;
  cache: "hit" | "miss" | "unknown";
  outcome: string;
}): void {
  const { topic, requestStartedAt, cache, outcome } = params;
  const elapsedMs = Date.now() - requestStartedAt;
  console.log(`[api-timing:${topic}] outcome=${outcome} elapsedMs=${elapsedMs} cache=${cache}`);
}

// 같은 답변으로 겹쳐 들어온 요청 중 누가 실제로 생성을 맡았는지 남기는
// 계측 로그(generation-cache.ts의 acquireGenerationMarker/
// waitForCachedGeneration 참고). outcome 세 가지:
// - "acquired": 이 요청이 마커를 획득해 생성을 직접 담당함(waitedMs=0).
// - "wait_hit": 마커를 못 얻어 대기하다가, 먼저 온 요청이 채운 캐시를
//   받음(waitedMs=실제로 기다린 시간).
// - "wait_timeout": 마커를 못 얻어 최대 시간(90초)까지 기다렸지만 캐시가
//   안 채워져 직접 생성으로 넘어감(waitedMs≈90000).
export type GenerationMarkerOutcome = "acquired" | "wait_hit" | "wait_timeout";

export function logGenerationMarker(params: {
  topic: GenerationTopic;
  outcome: GenerationMarkerOutcome;
  waitedMs: number;
}): void {
  const { topic, outcome, waitedMs } = params;
  console.log(`[generation-marker:${topic}] outcome=${outcome} waitedMs=${waitedMs}`);
}

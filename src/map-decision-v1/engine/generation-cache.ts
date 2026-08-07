import { createHash } from "crypto";
import { MapSession } from "../types";
import { getRedisClient } from "./redis-client";

// 결과 생성 멱등 캐시. 페이지가 완전히 새로 로드되면(iOS Safari가 백그라운드
// 탭을 메모리에서 내리는 경우 등) 진행 중이던 생성 상태(컴포넌트 로컬
// state — generationState/attempt)는 사라지고, 재마운트된 화면은
// session.idealTypeResult가 아직 없으니 처음부터 다시 generate()를
// 부른다(IdealTypeCard.tsx의 useEffect). 그때마다 reserveGenerationSlot이
// 소모되고 Anthropic이 다시 호출된다 — 답변은 그대로인데 결과만 다시
// 만드는 낭비다. 이 파일은 "같은 사람이 같은 답변으로 다시 요청했다"를
// 감지해서 이미 만든 결과를 재사용하게 한다.
//
// 클라이언트 쪽 재요청 동작(재마운트 시 무조건 generate() 호출)은 이번에
// 건드리지 않는다 — 서버가 그 재요청을 받아내는 쪽만 고친다.

const GENERATION_CACHE_TTL_SECONDS = 30 * 60; // 30분 — 아래 computeGenerationCacheKey 주석 참고

export type GenerationTopic = "idealType" | "selfIntro" | "friendship" | "work" | "taste" | "travelStyle";

// 객체 키 순서에 관계없이 항상 같은 문자열이 나오게 하는 정규화 —
// session.quizAnswers는 JS 객체라 키 순서가 원칙적으로 보장되지 않는다.
// 같은 답변이라도 세션이 어떤 경로로 재구성됐는지에 따라 키 순서가
// 달라질 수 있으므로, 여기서 재귀적으로 키를 정렬해 항상 동일한 문자열을
// 만든다(배열은 순서가 의미 있으므로 정렬하지 않는다).
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

// 캐시 키 = 실제로 결과를 결정하는 값(대화 전문 + 퀴즈 답변)의 해시.
// session.startedAt(밀리초 타임스탬프) 같은 값을 키로 쓰지 않는다 — 그런
// 값은 추측 가능해서, 남의 startedAt을 대충 맞춰 넣으면 그 사람의 결과를
// 가로챌 수 있다(reserveGenerationSlot이 세션 슬롯 키로 startedAt을 쓰는
// 것과 헷갈리지 말 것 — 그건 레이트리밋 용도라 추측당해도 카운터 오염
// 정도지 결과 유출이 아니다). 반면 34~40개 문항의 실제 답변 조합을
// 통째로 맞히는 건 사실상 불가능하다(축마다 선택지 4~6개, 다중 선택
// 축은 순서까지 있어 조합이 기하급수적으로 늘어난다) — 그 사람이 실제로
// 고른 답을 이미 알고 있는 게 아니라면 같은 해시를 만들 수 없다.
// topic을 해시에도, 캐시 키 접두어에도 넣어 이상형/나소개/친구·인간관계
// 결과가 서로 섞이지 않게 한다(요청대로 이중으로 넣었다 — 접두어만으로
// 실질적으로 충분하지만, 해시 자체도 주제별로 달라지게 해서 우연히 같은
// 로직으로 여러 캐시 조회 함수를 섞어 써도 안전하게 한다).
export function computeGenerationCacheKey(topic: GenerationTopic, session: MapSession): string {
  const canonicalInput = stableStringify({
    topic,
    messages: (session.messages ?? []).map((message) => ({ role: message.role, text: message.text })),
    quizAnswers: session.quizAnswers ?? {},
  });
  const hash = createHash("sha256").update(canonicalInput).digest("hex");
  return `gen-cache:${topic}:${hash}`;
}

// Redis 연결이 없거나 명령이 실패하면 캐시를 조용히 건너뛰고 기존 경로
// (레이트리밋 → 생성)로 그대로 진행한다. 레이트리밋의 fail-closed와는
// 다른 성격이다 — 레이트리밋은 "확인 못 하면 막아야" 비용 방어가
// 성립하지만, 이 캐시는 순수 최적화라 "확인 못 하면 그냥 새로 만든다"가
// 안전한 기본값이다(기존 동작 그대로 유지되는 것과 같다).
export async function getCachedGeneration<T>(cacheKey: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    // @upstash/redis는 저장된 값이 JSON으로 파싱 가능하면 자동으로 파싱해
    // 돌려주기도 해서, 문자열/객체 둘 다 들어올 수 있다(share-store.ts의
    // getShare와 같은 처리).
    const raw = await redis.get<T | string>(cacheKey);
    if (!raw) return null;
    return typeof raw === "string" ? (JSON.parse(raw) as T) : raw;
  } catch (error) {
    console.error("[generation-cache] read failed", error);
    return null;
  }
}

// 생성 성공 시에만 호출한다(실패는 캐시하지 않는다 — 호출부 책임).
// 대화 원문(session.messages)이 아니라 생성된 결과(result)만 저장한다.
//
// TTL 30분: 이 캐시의 목적은 "백그라운드 전환 → 페이지 리로드 → 재요청"을
// 몇 분 안에 받아내는 것뿐이다. 앱 자체 문구(GENERATION_ESTIMATE_TEXT)가
// "보통 1~2분"이라 하고, 재시도 버튼도 3분(RETRY_AFTER_MS)에 뜨는 걸 보면
// 정상 시나리오의 대기는 길어야 수 분이다. 실측 사례(여러 번 리셋되며
// 체감 5~10분)까지 여유 있게 덮으면서도, 개인 결과 데이터를 필요 이상
// 오래 두지 않도록 1시간보다 짧게(30분) 잡았다.
export async function setCachedGeneration(cacheKey: string, result: unknown): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.set(cacheKey, JSON.stringify(result), { ex: GENERATION_CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("[generation-cache] write failed", error);
  }
}

// 생성이 "지금 진행 중"임을 나타내는 마커. 위 캐시(getCachedGeneration/
// setCachedGeneration)는 완성된 결과만 알고, 진행 중인 생성에 대해서는
// 아무것도 모른다 — 그래서 같은 답변으로 두 요청이 겹치면(재마운트·
// 새로고침·탭 중복 등으로) 첫 요청이 아직 캐시를 채우기 전까지는 둘 다
// 캐시 미스를 보고 각자 생성을 시작해버린다(실제 프로덕션에서 취향
// 결과가 이렇게 두 번 생성된 사고가 있었다). 이 마커는 SET NX(키가
// 없을 때만 성공하는 원자적 쓰기)로 "내가 먼저 왔다"를 표시해서, 뒤따라
// 들어온 요청이 새로 생성하는 대신 잠깐 기다리게 한다.
const GENERATION_MARKER_TTL_SECONDS = 3 * 60; // 3분 — 아래 acquireGenerationMarker 주석 참고

function generationMarkerKey(cacheKey: string): string {
  return `${cacheKey}:in-progress`;
}

// SET NX EX로 마커를 원자적으로 건다 — Redis는 명령을 하나씩 순서대로
// 처리하므로, 두 요청이 정확히 같은 순간에 이 명령을 보내도 Upstash가
// 둘 중 하나에게만 "OK"를 주고 나머지에게는 null을 준다(키가 이미
// 있으므로 SET이 적용되지 않음) — 그래서 정확히 하나의 요청만 true를
// 받는다.
//
// TTL 3분: 실측 결과(프로덕션 로그) 생성 1회는 보통 100~135초 걸린다.
// 서버가 도중에 죽거나 함수가 타임아웃돼 releaseGenerationMarker가 아예
// 호출되지 못하는 최악의 경우에도, 이 마커가 영원히 남아 다음 요청들을
// 무한정 기다리게 만들면 안 된다 — 실제 생성 시간보다 여유 있게, 하지만
// 무한정 길지는 않게 3분으로 잡았다.
//
// Redis 연결이 없으면(로컬 개발 등) 캐시 자체가 이미 꺼져 있는 상태이므로
// (getCachedGeneration이 항상 null을 준다), 마커도 항상 "내가 획득했다"로
// 취급해 기존 동작(매번 새로 생성)을 그대로 유지한다. 마커 쓰기 자체가
// 실패해도(네트워크 오류 등) 마찬가지로 "획득했다"로 처리한다 — 조율에
// 실패했다고 사용자를 막을 이유는 없다(캐시 읽기 실패 시 처리와 같은
// fail-open 원칙, 위 getCachedGeneration 주석 참고). 이 함수가 false를
// 반환하는 경우는 오직 "다른 요청이 실제로 이 답변을 생성 중"일 때뿐이다.
export async function acquireGenerationMarker(cacheKey: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return true;
  try {
    const result = await redis.set(generationMarkerKey(cacheKey), "1", { nx: true, ex: GENERATION_MARKER_TTL_SECONDS });
    return result === "OK";
  } catch (error) {
    console.error("[generation-cache] marker acquire failed", error);
    return true;
  }
}

// acquireGenerationMarker가 true를 반환한 요청만 호출한다. 생성이
// 성공하든 실패하든, 도중에 예외가 나든 반드시 호출돼야 하므로 호출부는
// 항상 finally 블록에서 이 함수를 부른다 — 안 그러면 그 답변은 마커
// TTL(3분)이 끝날 때까지 다른 요청들이 계속 대기하게 된다.
export async function releaseGenerationMarker(cacheKey: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(generationMarkerKey(cacheKey));
  } catch (error) {
    console.error("[generation-cache] marker release failed", error);
  }
}

const MARKER_WAIT_POLL_INTERVAL_MS = 2_000;
// 최대 대기 45초: 원래는 90초로 잡았으나, 대기 후 새로 생성하는 경로의
// 전체 소요 시간(대기 + 생성)이 Vercel 함수 시간제한에 걸릴 위험이 있어
// 줄였다 — 대기(최대) + 생성(실측 최대 135초)이 라우트의 maxDuration(300초)
// 안에 항상 들어오게 하는 것이 목적이다. 실제 사고 사례(첫 요청 시작
// 73초 뒤 두 번째 요청 도착, 첫 요청은 104초에 완료)로 계산해보면 45초
// 대기로도 이 사고는 그대로 방지됐을 시간차다(73+45=118초로 104초 완료
// 시점을 덮는다). 두 요청이 거의 동시에 들어오는 경우처럼 첫 요청의 실제
// 소요 시간이 45초를 넘기면 이 대기를 놓칠 수 있지만, 그 경우에도
// "새로 생성"으로 안전하게 넘어가지, 사용자를 계속 기다리게 하지는
// 않는다.
const MARKER_WAIT_MAX_MS = 45_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 마커 획득에 실패한(= 다른 요청이 이미 생성 중인) 요청이 부른다. 캐시를
// 2초 간격으로 다시 조회하면서 최대 45초까지 기다린다 — 그 안에 먼저
// 온 요청이 끝나 캐시를 채우면 그 결과를 바로 돌려준다. 45초가 지나도
// 캐시가 비어 있으면 null을 반환한다 — 호출부는 이 경우 대기를 포기하고
// 직접 생성해야 한다(사용자가 무한정 기다리는 상황을 만들지 않는다는
// 요구사항의 핵심 안전장치 — 마커나 이 함수가 무엇을 하든 이 보장은
// 깨지면 안 된다).
export async function waitForCachedGeneration<T>(cacheKey: string): Promise<T | null> {
  const deadline = Date.now() + MARKER_WAIT_MAX_MS;
  while (Date.now() < deadline) {
    await sleep(MARKER_WAIT_POLL_INTERVAL_MS);
    const cached = await getCachedGeneration<T>(cacheKey);
    if (cached) return cached;
  }
  return null;
}

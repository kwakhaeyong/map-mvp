import { NextRequest } from "next/server";
import { getRedisClient } from "./redis-client";

export const DAILY_SESSION_LIMIT = 5;
export const MAX_INPUT_LENGTH = 5000;
export const MAX_MESSAGES_PER_SESSION = 40;
export const MAX_GENERATIONS_PER_SESSION = 5;
// Sonnet-priced final-result generation costs meaningfully more per call than
// the Haiku conversation turns, so it gets its own, tighter daily budget
// instead of inheriting DAILY_SESSION_LIMIT. Sized at ~2x DAILY_SESSION_LIMIT
// (roughly "2 generations across a day's worth of sessions" for a real user)
// rather than the naive DAILY_SESSION_LIMIT * MAX_GENERATIONS_PER_SESSION
// worst case, which would let one IP trigger up to 25 Sonnet calls/day.
export const DAILY_GENERATION_LIMIT = 10;
// 서비스 전체 하루 생성 상한 — IP·세션 단위 한도는 IP 로테이션으로 뚫을 수
// 있지만, 이 한도만은 뚫을 방법이 없다(유일하게 IP·세션과 무관하다).
// 재배포 없이 조절할 수 있게 환경변수로 뺐다 — 홍보를 시작하면 실사용량을
// 보고 올려야 할 수 있어서다. 값을 못 읽거나 이상하면(0 이하, 숫자가
// 아님) 방어적으로 fallback(300)을 쓴다 — 환경변수 설정 실수로 상한이
// 0이 되어 서비스 전체가 막히는 사고를 피한다.
const DEFAULT_DAILY_GLOBAL_GENERATION_LIMIT = 300;
function readGlobalLimit(): number {
  const raw = Number(process.env.DAILY_GLOBAL_GENERATION_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_GLOBAL_GENERATION_LIMIT;
}
export const DAILY_GLOBAL_GENERATION_LIMIT = readGlobalLimit();
// AI 호출이 실패해도(네트워크 오류, 스키마 검증 실패 등) 세션/IP-하루 한도는
// 소모되지 않는다(아래 reserveGenerationSlot/releaseGenerationSlotOnFailure
// 참고) — 실패는 사용자 잘못이 아니기 때문이다. 하지만 그러면 "항상 실패하는
// 입력"으로 반복 호출해도 한도에 걸리지 않아 AI 호출 비용이 무제한
// 발생할 수 있으므로, 실패 시도 자체에는 세션당 이 낮은 별도 상한을 둔다.
export const MAX_FAILED_GENERATIONS_PER_SESSION = 2;

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한국 시간(KST) 자정 기준으로 하루 단위 키를 끊는다 — 방문자 대부분이
// 국내라 "오늘 한도가 언제 풀리는지"가 KST 자정과 맞아야 체감과 어긋나지
// 않는다. Date.getTime()은 타임존과 무관한 절대 시각이라, 9시간을 더한 뒤
// UTC 게터로 읽으면 그 값이 곧 "KST로 봤을 때의 연/월/일"이 된다.
// share-store.ts의 공유 레이트리밋도 이 함수를 그대로 가져다 쓴다 —
// 생성 쪽과 자정 리셋 기준(KST)을 통일하기 위해서다(날짜 키 계산
// 로직을 두 곳에 따로 두지 않는다).
export function kstDateKey(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// Redis TTL은 실제 경과 초만 알면 되므로, "다음 KST 자정까지 남은 시간"을
// UTC 연산으로 구해도 결과(초 단위 길이)는 동일하다.
export function secondsUntilNextKstMidnight(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const nextKstMidnightAsUtc = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1, 0, 0, 0);
  const nextKstMidnightRealEpoch = nextKstMidnightAsUtc - KST_OFFSET_MS;
  return Math.max(1, Math.ceil((nextKstMidnightRealEpoch - date.getTime()) / 1000));
}

// 로그에 sessionKey(session.startedAt) 원본을 그대로 남기지 않기 위한 요약값.
// 되돌릴 수 없는 암호학적 해시일 필요는 없다 — 민감정보 보호가 아니라, 같은
// 세션이 남긴 여러 로그 줄을 서로 연관지어볼 수 있을 정도로만 뭉개는 것이
// 목적이다.
function shortSessionHash(sessionKey: string): string {
  let hash = 0;
  for (let i = 0; i < sessionKey.length; i++) {
    hash = (hash * 31 + sessionKey.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

// x-real-ip를 우선 신뢰한다 — Vercel의 공식 @vercel/functions 패키지가 제공하는
// ipAddress() 헬퍼도 정확히 이 헤더(IP_HEADER_NAME = "x-real-ip")를 읽는다
// (packages/functions/src/headers.ts, vercel/vercel 저장소). Vercel 엣지가
// 프록시 단계에서 직접 채워 넣는 값이라 사용자가 보내는 요청 헤더로 덮어쓸 수
// 없다. x-forwarded-for는 표준 프록시 체인 헤더라 여러 홉을 거치며 값이
// 누적되는데, 첫 번째 값은 클라이언트가 그대로 써 보낼 수 있어(예:
// `X-Forwarded-For: 1.2.3.4`) 신뢰할 수 없다. x-real-ip가 없는 환경(로컬
// 개발, Vercel 외 배포)에서만 x-forwarded-for로 폴백하되, 이때도 첫 값이
// 아니라 우리 서버에 가장 가까운(=가장 신뢰할 수 있는) 마지막 값을 쓴다.
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((hop) => hop.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return "unknown";
}

// 생성 API에 curl 한 줄로 직접 때리는 기회주의적 남용을 막는 최소한의
// 장치 — Origin/Referer는 클라이언트가 원하면 위조할 수 있어서 결심한
// 공격자를 막지는 못하지만, 헤더 자체를 안 붙이는(가장 흔한 curl
// 기본값) 요청은 걸러진다.
//
// 최신 브라우저는 POST 같은 "unsafe" 메서드 fetch에는 same-origin이어도
// 항상 Origin 헤더를 붙인다(Referrer-Policy와 무관하게 — 이건 Referer만
// 줄이거나 없앨 뿐 Origin에는 영향이 없다). 그래서 Origin이 있으면
// 그것만 확인하고, Origin이 아예 없는 드문 경우에만 Referer로 대체
// 확인한다. 공유 링크(/r/[id])로 들어온 사용자가 이어서 새 카드를
// 만들 때도 이 시점의 Origin은 "지금 이 페이지"(mapdecision.com) 기준이라
// 어떻게 들어왔는지(카카오톡 등 외부 경로)와 무관하게 항상 통과한다.
export function isTrustedRequestOrigin(request: NextRequest): boolean {
  const expected = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expected;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }
  return false;
}

// 대화 세션 시작(extract-nodes) 자체는 AI 호출 비용이 사실상 없는
// 가벼운 동작이라 지금도 인메모리로 충분하다 — 생성(Sonnet 호출)만
// Redis로 옮긴다.
const dailySessionCounts = new Map<string, { day: string; count: number }>();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function registerSessionStart(ip: string): { allowed: boolean; count: number } {
  const day = todayUtc();
  const existing = dailySessionCounts.get(ip);
  const count = existing && existing.day === day ? existing.count + 1 : 1;
  dailySessionCounts.set(ip, { day, count });
  return { allowed: count <= DAILY_SESSION_LIMIT, count };
}

export type GenerationLimitReason = "session_limit" | "ip_daily_limit" | "global_daily_limit" | "failure_limit" | "unavailable";

// share-store.ts도 이 원자적 INCR+EXPIRE 패턴을 그대로 재사용한다 — 다중
// 인스턴스에서 동시 요청이 들어와도 Redis가 INCR을 순서대로 처리해주므로
// 카운트가 어긋나지 않는다(reserveGenerationSlot 주석 참고).
export async function incrWithExpire(redis: NonNullable<ReturnType<typeof getRedisClient>>, key: string, ttlSeconds: number): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, ttlSeconds);
  return count;
}

// sessionKey should be a value stable for the lifetime of one MapSession
// (e.g. session.startedAt) so repeated "정리해줘"/재생성 calls within the
// same session share one small budget, independent of the per-IP daily cap.
//
// 이전에는 "조회만 하고 성공 시에만 나중에 차감"하는 2단계 방식이었는데,
// 이 방식은 동시에 여러 요청이 들어오면 전부 조회를 통과해버리는 경쟁
// 상태가 있었다(docs/CURRENT_STATE.md에 기록된 구멍 2번 — 인메모리
// 다중 인스턴스 문제와 별개로, 단일 인스턴스에서도 발생 가능). Redis의
// 원자적 INCR로 먼저 자리를 "예약"하고 나서 초과 여부를 확인하는 방식으로
// 바꿔 이 경쟁을 없앤다 — Redis가 같은 키에 대한 INCR을 항상 순서대로
// 처리해주기 때문에, 동시 요청이 몇 개가 들어와도 한도를 초과해 통과할
// 수 없다.
//
// 세션/IP-하루 예약은 실제 생성이 실패하면 releaseGenerationSlotOnFailure로
// 되돌린다(생성 실패는 사용자 잘못이 아니므로). 전체 하루 상한(global)은
// 되돌리지 않는다 — 스키마 검증 실패 같은 경우도 Anthropic API 호출
// 자체는 이미 일어나 비용이 발생했을 수 있어서, 전체 상한만은 "오늘 시도한
// 횟수"를 보수적으로(실제 성공 횟수보다 같거나 크게) 센다.
export async function reserveGenerationSlot(ip: string, sessionKey: string): Promise<{ allowed: true } | { allowed: false; reason: GenerationLimitReason }> {
  const redis = getRedisClient();
  if (!redis) {
    // Redis 연결 정보가 없으면 한도를 원자적으로 확인할 방법이 없다 —
    // 레이트리밋 없이 생성을 허용하는 건 이 기능의 목적(비용 방어) 자체를
    // 무너뜨리므로, 공유 기능이 Redis 없을 때 하는 것과 같은 원칙으로
    // 안전하게(fail-closed) 막는다.
    return { allowed: false, reason: "unavailable" };
  }

  const failureKey = `gen-fail:session:${sessionKey}`;
  let failureCount: number;
  try {
    failureCount = Number((await redis.get<number | string>(failureKey)) ?? 0);
  } catch (error) {
    console.error("[rate-limit] failure count read failed", error);
    return { allowed: false, reason: "unavailable" };
  }
  if (failureCount >= MAX_FAILED_GENERATIONS_PER_SESSION) {
    console.error(`[rate-limit] session ${shortSessionHash(sessionKey)} blocked by failure_limit (failureCount=${failureCount})`);
    return { allowed: false, reason: "failure_limit" };
  }

  const now = new Date();
  const day = kstDateKey(now);
  const ttl = secondsUntilNextKstMidnight(now);
  const sessionSlotKey = `gen-slot:session:${sessionKey}`;
  const ipDailyKey = `gen-slot:ip:${ip}:${day}`;
  const globalKey = `gen-slot:global:${day}`;

  let sessionCount: number;
  try {
    // 세션 예약 키는 "하루"가 아니라 "이 세션이 살아있는 동안" 개념이라
    // 날짜를 안 붙인다 — 대신 Redis에 무한정 남지 않도록, 세션이 통상
    // 끝났을 시간(48시간)으로 TTL을 걸어 자동 정리되게 한다.
    sessionCount = await incrWithExpire(redis, sessionSlotKey, 60 * 60 * 48);
  } catch (error) {
    console.error("[rate-limit] session slot reserve failed", error);
    return { allowed: false, reason: "unavailable" };
  }
  if (sessionCount > MAX_GENERATIONS_PER_SESSION) {
    await redis.decr(sessionSlotKey).catch(() => {});
    return { allowed: false, reason: "session_limit" };
  }

  let ipDailyCount: number;
  try {
    ipDailyCount = await incrWithExpire(redis, ipDailyKey, ttl);
  } catch (error) {
    console.error("[rate-limit] ip daily slot reserve failed", error);
    await redis.decr(sessionSlotKey).catch(() => {});
    return { allowed: false, reason: "unavailable" };
  }
  if (ipDailyCount > DAILY_GENERATION_LIMIT) {
    await Promise.all([redis.decr(sessionSlotKey), redis.decr(ipDailyKey)]).catch(() => {});
    return { allowed: false, reason: "ip_daily_limit" };
  }

  let globalCount: number;
  try {
    globalCount = await incrWithExpire(redis, globalKey, ttl);
  } catch (error) {
    console.error("[rate-limit] global slot reserve failed", error);
    await Promise.all([redis.decr(sessionSlotKey), redis.decr(ipDailyKey)]).catch(() => {});
    return { allowed: false, reason: "unavailable" };
  }
  if (globalCount > DAILY_GLOBAL_GENERATION_LIMIT) {
    await Promise.all([redis.decr(sessionSlotKey), redis.decr(ipDailyKey), redis.decr(globalKey)]).catch(() => {});
    return { allowed: false, reason: "global_daily_limit" };
  }

  return { allowed: true };
}

// 생성이 실패했을 때만 부른다 — 세션/IP-하루 예약은 되돌려 사용자 몫을
// 지키고(생성 실패는 사용자 잘못이 아니므로), 별도의 낮은 실패 상한만
// 올린다. 전체 하루 상한(global)은 되돌리지 않는다(reserveGenerationSlot
// 주석 참고).
export async function releaseGenerationSlotOnFailure(ip: string, sessionKey: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  const day = kstDateKey(new Date());
  const ipDailyKey = `gen-slot:ip:${ip}:${day}`;
  const sessionSlotKey = `gen-slot:session:${sessionKey}`;
  const failureKey = `gen-fail:session:${sessionKey}`;
  try {
    await Promise.all([redis.decr(sessionSlotKey), redis.decr(ipDailyKey), incrWithExpire(redis, failureKey, 60 * 60 * 48)]);
  } catch (error) {
    console.error("[rate-limit] release on failure failed", error);
  }
}

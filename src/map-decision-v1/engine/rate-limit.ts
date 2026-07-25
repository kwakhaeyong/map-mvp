import { NextRequest } from "next/server";

// In-memory, best-effort caps keyed by client IP (and, for generation, by
// session). These reset on every serverless cold start and are not shared
// across instances — they are a loose safety pin against accidental or
// automated repeated use, not an accurate limiter. Real abuse protection is
// the Anthropic Console monthly budget cap.
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

const dailySessionCounts = new Map<string, { day: string; count: number }>();
const dailyGenerationCounts = new Map<string, { day: string; count: number }>();
const sessionGenerationCounts = new Map<string, number>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

export function registerSessionStart(ip: string): { allowed: boolean; count: number } {
  const day = today();
  const existing = dailySessionCounts.get(ip);
  const count = existing && existing.day === day ? existing.count + 1 : 1;
  dailySessionCounts.set(ip, { day, count });
  return { allowed: count <= DAILY_SESSION_LIMIT, count };
}

export type GenerationLimitReason = "session_limit" | "daily_limit";

// sessionKey should be a value stable for the lifetime of one MapSession
// (e.g. session.startedAt) so repeated "정리해줘"/재생성 calls within the
// same session share one small budget, independent of the per-IP daily cap.
export function registerGenerationAttempt(ip: string, sessionKey: string): { allowed: boolean; reason?: GenerationLimitReason } {
  const sessionCount = (sessionGenerationCounts.get(sessionKey) || 0) + 1;
  if (sessionCount > MAX_GENERATIONS_PER_SESSION) {
    return { allowed: false, reason: "session_limit" };
  }

  const day = today();
  const existing = dailyGenerationCounts.get(ip);
  const dailyCount = existing && existing.day === day ? existing.count + 1 : 1;
  if (dailyCount > DAILY_GENERATION_LIMIT) {
    return { allowed: false, reason: "daily_limit" };
  }

  sessionGenerationCounts.set(sessionKey, sessionCount);
  dailyGenerationCounts.set(ip, { day, count: dailyCount });
  return { allowed: true };
}

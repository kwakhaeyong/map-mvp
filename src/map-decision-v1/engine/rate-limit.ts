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

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
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

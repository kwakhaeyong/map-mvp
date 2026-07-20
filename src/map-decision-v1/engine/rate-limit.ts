// In-memory, best-effort daily session cap keyed by client IP. This resets on
// every serverless cold start and is not shared across instances — it is a
// loose safety pin against accidental repeated use, not an accurate limiter.
// Real abuse protection is the Anthropic Console monthly budget cap.
const DAILY_SESSION_LIMIT = 5;
const dailySessionCounts = new Map<string, { day: string; count: number }>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function registerSessionStart(ip: string): { allowed: boolean; count: number } {
  const day = today();
  const existing = dailySessionCounts.get(ip);
  const count = existing && existing.day === day ? existing.count + 1 : 1;
  dailySessionCounts.set(ip, { day, count });
  return { allowed: count <= DAILY_SESSION_LIMIT, count };
}

export { DAILY_SESSION_LIMIT };

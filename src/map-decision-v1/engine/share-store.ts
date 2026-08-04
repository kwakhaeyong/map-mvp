import { randomBytes } from "crypto";
import { getRedisClient } from "./redis-client";
import { incrWithExpire, kstDateKey, secondsUntilNextKstMidnight } from "./rate-limit";

// 익명 공유 링크 저장소. Upstash Redis(Vercel Marketplace)를 쓴다 — 로그인
// 없이 "ID로 저장하고 꺼내 쓰기"만 필요하고, 만료 기능이 기본 내장돼
// 있어서 별도 삭제 배치 작업이 필요 없다. 연결 설정 자체는
// redis-client.ts에 있다(rate-limit.ts의 생성 한도와 같은 인스턴스를
// 쓴다). 연결 정보가 없으면 호출부가 "지금은 공유 기능을 쓸 수 없어요"로
// 처리한다(ANTHROPIC_API_KEY 없을 때의 처리 방식과 같다).

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90일

// 진로 등 다른 주제로 확장할 때도 이 레코드 모양을 그대로 쓸 수 있게
// topicId/resultLayoutId를 같이 저장한다. result는 그 주제의 결과
// JSON뿐이다 — 대화 원문(messages)은 절대 포함하지 않는다.
export type SharedResultRecord = {
  id: string;
  topicId: string;
  resultLayoutId: string;
  createdAt: string;
  result: unknown;
  // 이상형 퀴즈를 심화(선택 6문항)까지 답하고 만든 결과인지 — 공유
  // 페이지(/r/[id])에서 "🔍 심층 분석 포함" 배지를 보여줄지 판단하는 데
  // 쓴다. 이 필드가 생기기 전에 저장된 링크는 undefined로 읽히고,
  // 그냥 배지 없이 보여주면 되므로 별도 이관이 필요 없다.
  quizDepth?: "quick" | "deep";
};

function shareKey(id: string): string {
  return `share:${id}`;
}

export function isShareStoreConfigured(): boolean {
  return getRedisClient() !== null;
}

// base64url 12바이트(96비트) — URL에 넣기 좋고 추측이 사실상 불가능하다.
export function createShareId(): string {
  return randomBytes(12).toString("base64url");
}

// 연결 정보는 있는데 Upstash가 일시적으로 응답하지 않거나 에러를 내는
// 경우(연결 정보 자체가 없는 것과는 다른 상황) — 이때도 조용히 실패
// 처리해서 호출부가 "지금은 안 돼요" 안내로 이어가게 한다. 저장/조회/
// 횟수 확인 중 하나라도 이 상태면 나머지도 같은 Redis라 어차피 실패할
// 가능성이 높으므로, 굳이 개별적으로 복구를 시도하지 않는다.
export async function saveShare(record: SharedResultRecord): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    await redis.set(shareKey(record.id), JSON.stringify(record), { ex: SHARE_TTL_SECONDS });
    return true;
  } catch (error) {
    console.error("[share-store] saveShare failed", error);
    return false;
  }
}

// 링크를 찾을 수 없는 것(만료/오타 — 사용자에게 "이 링크는 유효하지
// 않다"고 말해도 되는 상태)과 저장소 장애로 지금 당장 확인할 수 없는
// 것(사용자에게 "잠시 후 다시 시도해보라"고 말해야 하는, 링크 자체는
// 멀쩡할 수 있는 상태)은 화면 문구가 달라야 해서 결과를 구분해 돌려준다.
export type GetShareResult = { status: "ok"; record: SharedResultRecord } | { status: "not_found" } | { status: "unavailable" };

export async function getShare(id: string): Promise<GetShareResult> {
  const redis = getRedisClient();
  if (!redis) return { status: "unavailable" };
  let raw: string | SharedResultRecord | null;
  try {
    raw = await redis.get<string | SharedResultRecord>(shareKey(id));
  } catch (error) {
    console.error("[share-store] getShare failed", error);
    return { status: "unavailable" };
  }
  if (!raw) return { status: "not_found" };
  // @upstash/redis는 저장된 값이 JSON으로 파싱 가능하면 자동으로 파싱해
  // 돌려주기도 해서, 문자열/객체 둘 다 들어올 수 있다.
  if (typeof raw === "string") {
    try {
      return { status: "ok", record: JSON.parse(raw) as SharedResultRecord };
    } catch {
      return { status: "not_found" };
    }
  }
  return { status: "ok", record: raw };
}

// 하루 공유 횟수 제한. 기존 rate-limit.ts의 세션 생성 제한과 별개로,
// 이건 공유 저장소에 같이 기록해서 서버 재시작에도 초기화되지 않게
// 한다(기존 generate-result 쪽 제한은 메모리 기반이라 콜드 스타트마다
// 풀리는 한계가 있는데, 여기서는 이미 영구 저장소를 쓰니 더 안정적으로
// 만들 수 있다).
//
// 5였던 걸 25로 올렸다 — 국내 이동통신사 CGNAT 환경에서는 여러 실사용자가
// 같은 공인 IP를 공유해서, 5로는 무관한 사용자가 남의 사용량으로 차단될
// 위험이 있었다. 공유 1건의 실비용은 Redis SET 1번뿐이라(생성처럼 AI
// 호출 비용이 없음) 한도를 넉넉히 둬도 실제 비용 방어에는 영향이 없고,
// 스팸성 대량 생성만 막으면 된다. 게다가 링크 재사용(ShareResult.tsx의
// ensureShareUrl)이 들어가 정상 사용자는 같은 결과를 여러 번 눌러도
// 한도를 한 번만 소모한다.
const DAILY_SHARE_LIMIT = 25;

// 서비스 전체 하루 공유 생성 상한 — IP 단위 한도는 IP 로테이션이나 국내
// CGNAT 환경(같은 IP를 여러 사용자가 나눠 쓰는 경우) 때문에 실질적인
// 전체 방어선이 되지 못한다. 공유 1건의 실비용은 Redis 쓰기 1번뿐이라
// 생성(Sonnet 호출)만큼 비싸진 않지만, 링크가 90일간 저장되는 구조라
// 막지 않으면 저장량이 무한정 누적된다.
// rate-limit.ts의 readGlobalLimit()과 같은 패턴: 재배포 없이 조절할 수
// 있게 환경변수로 빼고, 값을 못 읽거나 이상하면(0 이하, 숫자가 아님)
// 방어적으로 fallback을 쓴다.
// 기본값 1000 산정 근거: IP 하루 상한(25)의 40배로, 생성 쪽 비율
// (DAILY_GLOBAL_GENERATION_LIMIT 300 ÷ DAILY_GENERATION_LIMIT 10 = 30배)보다
// 약간 더 여유를 뒀다 — 공유는 AI 호출 비용이 없어 남용 시 실질 피해가
// "봇 대량 생성으로 인한 Redis 저장량 증가" 정도라 생성보다 조금 더
// 관대해도 된다고 판단했다(확립된 트래픽 데이터에 근거한 값은 아니며,
// 실사용량을 보고 조정이 필요할 수 있다).
const DEFAULT_DAILY_GLOBAL_SHARE_LIMIT = 1000;
function readGlobalShareLimit(): number {
  const raw = Number(process.env.DAILY_GLOBAL_SHARE_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_GLOBAL_SHARE_LIMIT;
}
export const DAILY_GLOBAL_SHARE_LIMIT = readGlobalShareLimit();

export type ShareAttemptReason = "daily_limit" | "global_daily_limit" | "unavailable";

// rate-limit.ts의 reserveGenerationSlot과 같은 2단계 원자적 예약 패턴이다 —
// IP 카운터를 먼저 INCR로 예약하고 초과分 확인, 그다음 전체 카운터를
// INCR로 예약하고 초과 확인한다. 나중 단계가 실패/초과하면 앞서 늘린
// 카운터를 되돌린다. 날짜 키는 kstDateKey()로 생성 레이트리밋과 동일하게
// KST 자정 기준으로 통일한다(이전엔 UTC 기준이라 생성과 9시간 어긋나
// 있었다).
export async function registerShareAttempt(ip: string): Promise<{ allowed: boolean; reason?: ShareAttemptReason }> {
  const redis = getRedisClient();
  if (!redis) return { allowed: false, reason: "unavailable" };

  const now = new Date();
  const day = kstDateKey(now);
  const ttl = secondsUntilNextKstMidnight(now);
  const ipKey = `share-limit:${ip}:${day}`;
  const globalKey = `share-limit:global:${day}`;

  let count: number;
  try {
    count = await incrWithExpire(redis, ipKey, ttl);
  } catch (error) {
    console.error("[share-store] registerShareAttempt failed", error);
    return { allowed: false, reason: "unavailable" };
  }
  if (count > DAILY_SHARE_LIMIT) {
    await redis.decr(ipKey).catch(() => {});
    return { allowed: false, reason: "daily_limit" };
  }

  let globalCount: number;
  try {
    globalCount = await incrWithExpire(redis, globalKey, ttl);
  } catch (error) {
    console.error("[share-store] global registerShareAttempt failed", error);
    await redis.decr(ipKey).catch(() => {});
    return { allowed: false, reason: "unavailable" };
  }
  if (globalCount > DAILY_GLOBAL_SHARE_LIMIT) {
    await Promise.all([redis.decr(ipKey), redis.decr(globalKey)]).catch(() => {});
    return { allowed: false, reason: "global_daily_limit" };
  }

  return { allowed: true };
}

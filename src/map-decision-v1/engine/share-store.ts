import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";

// 익명 공유 링크 저장소. Upstash Redis(Vercel Marketplace)를 쓴다 — 로그인
// 없이 "ID로 저장하고 꺼내 쓰기"만 필요하고, 만료 기능이 기본 내장돼
// 있어서 별도 삭제 배치 작업이 필요 없다. Vercel 프로젝트에 Upstash를
// 연결하면 UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN 환경변수가
// 자동으로 채워진다(대시보드에서 Marketplace로 연결하는 건 오너가
// 직접 해야 하는 부분 — 이 파일은 그 환경변수가 있다고 가정하고, 없으면
// 조용히 null을 반환해 호출부가 "지금은 공유 기능을 쓸 수 없어요"로
// 처리하게 한다. ANTHROPIC_API_KEY 없을 때의 처리 방식과 같다).

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
  // 이상형 퀴즈를 심화(선택 8문항)까지 답하고 만든 결과인지 — 공유
  // 페이지(/r/[id])에서 "🔍 심층 분석 포함" 배지를 보여줄지 판단하는 데
  // 쓴다. 이 필드가 생기기 전에 저장된 링크는 undefined로 읽히고,
  // 그냥 배지 없이 보여주면 되므로 별도 이관이 필요 없다.
  quizDepth?: "quick" | "deep";
};

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  // 자동 파이프라이닝(같은 틱 안의 여러 호출을 한 요청으로 묶는 기능)은
  // 끈다 — 우리는 요청마다 많아야 호출 한두 번뿐이라 얻는 이득이 없고,
  // 끄면 매 호출이 단순한 단일 명령 요청이 되어 동작을 예측하기 쉽다.
  client = url && token ? new Redis({ url, token, enableAutoPipelining: false }) : null;
  return client;
}

function shareKey(id: string): string {
  return `share:${id}`;
}

export function isShareStoreConfigured(): boolean {
  return getClient() !== null;
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
  const redis = getClient();
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
  const redis = getClient();
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
const DAILY_SHARE_LIMIT = 5;

export type ShareAttemptReason = "daily_limit" | "unavailable";

export async function registerShareAttempt(ip: string): Promise<{ allowed: boolean; reason?: ShareAttemptReason }> {
  const redis = getClient();
  if (!redis) return { allowed: false, reason: "unavailable" };
  const day = new Date().toISOString().slice(0, 10);
  const key = `share-limit:${ip}:${day}`;
  let count: number;
  try {
    count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60 * 60 * 24);
  } catch (error) {
    console.error("[share-store] registerShareAttempt failed", error);
    return { allowed: false, reason: "unavailable" };
  }
  return count <= DAILY_SHARE_LIMIT ? { allowed: true } : { allowed: false, reason: "daily_limit" };
}

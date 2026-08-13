import { getRedisClient } from "../map-decision-v1/engine/redis-client";

// PERSONAL MAGAZINE PRIVATE BETA — 중앙 데이터 수집(2026-08). 서버 전용
// 모듈이다 — API route와 dev summary 페이지(Server Component)에서만
// import한다. 새 backend를 도입하지 않고, 이상형 공유(share-store.ts)가
// 이미 쓰고 있는 Upstash Redis 인스턴스를 그대로 재사용한다
// (redis-client.ts 하나에서 연결을 관리하는 기존 관례를 그대로 따른다).
//
// 저장 구조를 "이벤트 로그"가 아니라 "참가자별 최신 상태 Hash" 하나로
// 설계했다 — 이유:
// 1. 이번 Beta가 필요한 건 "누가 무엇을 했는가"라는 최신 상태 표(§9의
//    Participant 표)뿐이지, 시계열 이벤트 분석이 아니다.
//    (5명 대상 — 통계적 유의성을 주장하지 않는다)
// 2. HSET은 같은 필드에 여러 번 써도 값이 그대로 덮어써진다 — 그래서
//    "같은 화면을 다시 봐서 이벤트가 여러 번 오더라도(§8)" 참가자당
//    필드 하나만 남는 구조 자체가 중복을 흡수한다. 별도 dedup 테이블이
//    필요 없다.
// 3. Redis에서 "이 이벤트를 낸 모든 참가자"를 찾으려면 SCAN/KEYS가
//    필요한데(느리고 Upstash 요금에도 안 좋다), 대신 SADD로 참가자
//    ID를 별도 Set(PARTICIPANTS_KEY)에 등록해두면 5명이든 50명이든
//    O(1)에 전체 목록을 얻는다.

const PARTICIPANTS_KEY = "pmbeta:participants";
function statusKey(participantId: string): string {
  return `pmbeta:status:${participantId}`;
}
function feedbackKey(participantId: string, issueId: string): string {
  return `pmbeta:feedback:${participantId}:${issueId}`;
}

// 행동 이벤트 — "말한 의향"이 아니라 "실제 행동"만 담는다(§6). 값은
// ISO 타임스탬프(가장 최근 발생 시각) 또는 next_chapter_* 처럼 선택한
// chapter 문자열이다 — 표에서는 "있으면 YES"로만 쓰지만, 값 자체를
// 타임스탬프/문자열로 남겨두면 나중에 디버깅할 때 "언제/무엇을"까지
// 바로 알 수 있다.
export const BETA_ACTION_EVENTS = [
  "magazine_started",
  "taste_completed",
  "issue_saved",
  "share_attempted",
  "share_succeeded",
  "share_fallback_downloaded",
  "my_magazine_viewed",
  "next_chapter_selected",
  "next_chapter_confirmed",
] as const;
export type BetaActionEvent = (typeof BETA_ACTION_EVENTS)[number];

export type BetaActionInput =
  | { event: Exclude<BetaActionEvent, "share_attempted" | "next_chapter_selected" | "next_chapter_confirmed">; participantId: string }
  | { event: "share_attempted"; participantId: string; method: "native" | "fallback" }
  | { event: "next_chapter_selected" | "next_chapter_confirmed"; participantId: string; chapter: "travel" | "style" };

export type BetaFeedbackInput = {
  participantId: string;
  issueId: string;
  resonance: 1 | 2 | 3 | 4 | 5;
  desire: 1 | 2 | 3 | 4 | 5;
  continuation: 1 | 2 | 3 | 4 | 5;
  mostLikeMe: string | null;
};

export function isBetaStoreConfigured(): boolean {
  return getRedisClient() !== null;
}

// analytics failure는 product failure가 아니어야 한다(§7) — 여기서 던지지
// 않고 항상 boolean으로 성공 여부만 돌려준다. 호출부(API route)도 이
// 값을 바탕으로 사용자에게 보이는 에러를 만들지 않는다.
export async function recordBetaAction(input: BetaActionInput): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  const value = "chapter" in input ? input.chapter : "method" in input ? input.method : new Date().toISOString();
  try {
    await Promise.all([redis.sadd(PARTICIPANTS_KEY, input.participantId), redis.hset(statusKey(input.participantId), { [input.event]: value })]);
    return true;
  } catch (error) {
    // §7 — 콘솔 로그에도 participantId/이벤트 값 이상의 개인정보는
    // 없다(원래 익명 ID + whitelist된 이벤트 이름뿐이라 로그 자체에
    // PII가 없다).
    console.error("[personal-magazine-beta-store] recordBetaAction failed", error);
    return false;
  }
}

// 같은 participantId+issueId로 다시 제출하면 SET이 덮어쓴다 — §8 "최신
// 제출값으로 판단 가능하게" 요구를 키 설계만으로 만족한다(별도
// "가장 최근 것 찾기" 쿼리가 필요 없다).
export async function recordBetaFeedback(input: BetaFeedbackInput): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  const record = {
    resonance: input.resonance,
    desire: input.desire,
    continuation: input.continuation,
    mostLikeMe: input.mostLikeMe,
    createdAt: new Date().toISOString(),
  };
  try {
    await Promise.all([
      redis.sadd(PARTICIPANTS_KEY, input.participantId),
      redis.set(feedbackKey(input.participantId, input.issueId), JSON.stringify(record)),
    ]);
    return true;
  } catch (error) {
    console.error("[personal-magazine-beta-store] recordBetaFeedback failed", error);
    return false;
  }
}

// ============================================================
// 관리자 확인용 — §9. 거창한 대시보드 대신 dev summary 페이지
// (Server Component)에서 이 함수 하나만 호출해 표를 그린다.
// ============================================================
export type BetaParticipantRow = {
  participantId: string;
  resonance: number | null;
  desire: number | null;
  continuation: number | null;
  mostLikeMe: string | null;
  saved: boolean;
  shareAttempted: "native" | "fallback" | null;
  shareSucceeded: boolean;
  shareFallbackDownloaded: boolean;
  viewedMyMagazine: boolean;
  nextChapterSelected: "travel" | "style" | null;
  nextChapterConfirmed: "travel" | "style" | null;
};

const BETA_TASTE_ISSUE_ID = "taste-1";

export async function getBetaCentralSummary(): Promise<BetaParticipantRow[] | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    const participantIds = await redis.smembers(PARTICIPANTS_KEY);
    if (participantIds.length === 0) return [];

    const rows = await Promise.all(
      participantIds.map(async (participantId): Promise<BetaParticipantRow> => {
        const [status, feedbackRaw] = await Promise.all([
          redis.hgetall<Record<string, string>>(statusKey(participantId)),
          redis.get<string | BetaFeedbackRecord>(feedbackKey(participantId, BETA_TASTE_ISSUE_ID)),
        ]);
        const feedback = parseFeedbackRecord(feedbackRaw);
        const s = status ?? {};
        return {
          participantId,
          resonance: feedback?.resonance ?? null,
          desire: feedback?.desire ?? null,
          continuation: feedback?.continuation ?? null,
          mostLikeMe: feedback?.mostLikeMe ?? null,
          saved: Boolean(s.issue_saved),
          shareAttempted: s.share_attempted === "native" || s.share_attempted === "fallback" ? s.share_attempted : null,
          shareSucceeded: Boolean(s.share_succeeded),
          shareFallbackDownloaded: Boolean(s.share_fallback_downloaded),
          viewedMyMagazine: Boolean(s.my_magazine_viewed),
          nextChapterSelected: s.next_chapter_selected === "travel" || s.next_chapter_selected === "style" ? s.next_chapter_selected : null,
          nextChapterConfirmed: s.next_chapter_confirmed === "travel" || s.next_chapter_confirmed === "style" ? s.next_chapter_confirmed : null,
        };
      })
    );
    // 참가자 ID 문자열 순 정렬 — 생성 시각을 별도로 남기지 않아 "가입
    // 순서"는 알 수 없다(§2 개인식별정보 최소화 원칙과 같은 맥락에서
    // 굳이 순서 추적용 타임스탬프를 추가하지 않았다). 순서 자체가
    // 중요하지 않은 5명 표라 결정적(deterministic) 정렬이면 충분하다.
    return rows.sort((a, b) => a.participantId.localeCompare(b.participantId));
  } catch (error) {
    console.error("[personal-magazine-beta-store] getBetaCentralSummary failed", error);
    return null;
  }
}

type BetaFeedbackRecord = { resonance: number; desire: number; continuation: number; mostLikeMe: string | null; createdAt: string };

function parseFeedbackRecord(raw: string | BetaFeedbackRecord | null): BetaFeedbackRecord | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as BetaFeedbackRecord;
    } catch {
      return null;
    }
  }
  return raw;
}

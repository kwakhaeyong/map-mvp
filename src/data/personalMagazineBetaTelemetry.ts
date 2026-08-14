// PERSONAL MAGAZINE PRIVATE BETA — 클라이언트 텔레메트리(2026-08).
// tasteIssueStorage.ts와 같은 SSR guard 패턴을 따른다. 로그인 없이
// "이 브라우저"를 구분할 익명 ID 하나만 만들고(§2), 나머지는 전부
// fire-and-forget으로 /api/personal-magazine-beta-event에 POST한다.
//
// §7 "analytics failure는 product failure가 아니어야 한다" — 이 파일의
// 모든 함수는 절대 throw하지 않는다. fetch가 실패하거나, 응답이
// 실패거나, 네트워크가 아예 없어도 호출부(컴포넌트)는 그 사실을 알
// 필요가 없다 — 그래서 Promise를 반환하지 않고 fire-and-forget으로
// 던지기만 한다(호출부에서 await하지 않는다).

const PARTICIPANT_ID_KEY = "personal-magazine:beta-id";

function generateParticipantId(): string {
  // 공유 ID(share-store.ts의 96비트 랜덤)와 달리 이건 접근 제어에
  // 쓰이는 비밀이 아니라 그냥 "이 브라우저"를 구분하는 익명 표식이라,
  // crypto.randomUUID/getRandomValues가 없는 아주 오래된 환경에서도
  // 최소한 동작은 하도록 Math.random 폴백을 둔다.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `pm_beta_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  }
  const random = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `pm_beta_${random.slice(0, 20)}`;
}

// 동일 브라우저에서는 계속 같은 ID를 쓴다(§2) — localStorage에 한 번
// 쓰고 이후로는 계속 읽기만 한다. 새 브라우저 context(시크릿 모드,
// 다른 기기 등)에서는 이 값이 없어 새로 생성된다.
export function getBetaParticipantId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(PARTICIPANT_ID_KEY);
    if (existing) return existing;
    const generated = generateParticipantId();
    window.localStorage.setItem(PARTICIPANT_ID_KEY, generated);
    return generated;
  } catch {
    // localStorage를 쓸 수 없는 환경 — participantId 없이도 나머지
    // 제품 흐름은 그대로 동작해야 하므로 null만 돌려준다(§7).
    return null;
  }
}

type BetaEventName =
  | "magazine_started"
  | "taste_completed"
  | "issue_saved"
  | "share_attempted"
  | "share_succeeded"
  | "share_fallback_downloaded"
  | "feedback_submitted"
  | "my_magazine_viewed"
  | "next_chapter_selected"
  | "next_chapter_confirmed";

type BetaEventData =
  | { event: "share_attempted"; method: "native" | "fallback" }
  | { event: "next_chapter_selected" | "next_chapter_confirmed"; chapter: "travel" | "style" }
  | {
      event: "feedback_submitted";
      resonance: 1 | 2 | 3 | 4 | 5;
      desire: 1 | 2 | 3 | 4 | 5;
      continuation: 1 | 2 | 3 | 4 | 5;
      mostLikeMe: string | null;
      notLikeMe: string | null;
    }
  | { event: Exclude<BetaEventName, "share_attempted" | "next_chapter_selected" | "next_chapter_confirmed" | "feedback_submitted"> };

// issueId는 questionnaire 전체 답변이나 signal debug를 담지 않는다(§4) —
// "taste-1" 같은 짧은 식별자 하나뿐이다.
export function sendBetaEvent(issueId: string, payload: BetaEventData): void {
  const participantId = getBetaParticipantId();
  if (!participantId) return; // localStorage 불가 환경 — 조용히 스킵.
  const { event, ...data } = payload;
  try {
    void fetch("/api/personal-magazine-beta-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, issueId, event, data }),
      keepalive: true,
    }).catch(() => {
      // 네트워크 실패 — 콘솔에도 참가자 식별값 이상의 정보는 남기지
      // 않는다(§7 "console에 개인정보 포함 로그 금지"). 실패했다는
      // 사실 자체를 굳이 로그로 남기지 않는다 — 사용자 세션마다 반복
      // 실패가 콘솔을 채우는 것도 바람직하지 않다.
    });
  } catch {
    // fetch 자체가 없는 아주 예외적인 환경 — 무시(§7).
  }
}

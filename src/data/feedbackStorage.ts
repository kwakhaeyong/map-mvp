// R-D-C FEEDBACK STORAGE(2026-08, Private Beta Round 5) — 로그인/서버
// 없이 브라우저 localStorage에 저장한다. tasteIssueStorage.ts와 같은
// 패턴(SSR guard, try/catch JSON parse, issueId 기반 map)을 따른다.
// R(esonance)/D(esire)/C(ontinuation)는 서로 다른 질문이라 하나의
// "만족도" 숫자로 합치지 않고 각각 별도 필드로 저장한다.

export type FeedbackScore = 1 | 2 | 3 | 4 | 5;

export type TasteFeedback = {
  issueId: string;
  resonance: FeedbackScore;
  desire: FeedbackScore;
  continuation: FeedbackScore;
  mostLikeMe: string;
  submittedAt: string;
};

const STORAGE_KEY = "personal-magazine:feedback";

type FeedbackStore = Record<string, TasteFeedback>;

function readStore(): FeedbackStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as FeedbackStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: FeedbackStore): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// 같은 issueId로 다시 제출하면 overwrite한다 — 새 배열로 append하지
// 않는다(§8 "중복 응답을 만들지 않는다").
export function saveFeedback(
  issueId: string,
  params: { resonance: FeedbackScore; desire: FeedbackScore; continuation: FeedbackScore; mostLikeMe: string }
): TasteFeedback {
  const feedback: TasteFeedback = { issueId, ...params, submittedAt: new Date().toISOString() };
  const store = readStore();
  store[issueId] = feedback;
  writeStore(store);
  return feedback;
}

export function getFeedback(issueId: string): TasteFeedback | null {
  return readStore()[issueId] ?? null;
}

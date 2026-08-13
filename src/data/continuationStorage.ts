// CONTINUATION INTENT STORAGE(2026-08, Private Beta Round 4) — 아직
// 실제 Chapter(설문)로 이어지지 않는 "다음 Chapter 선택" 의사만
// localStorage에 남긴다. tasteIssueStorage.ts와 같은 패턴(SSR guard,
// try/catch JSON parse)을 그대로 따른다.

export type NextChapterId = "travel" | "style";

export type ContinuationIntent = {
  selectedChapter: NextChapterId;
  selectedAt: string;
};

const STORAGE_KEY = "personal-magazine:continuation";

export function saveContinuationIntent(selectedChapter: NextChapterId): ContinuationIntent {
  const intent: ContinuationIntent = { selectedChapter, selectedAt: new Date().toISOString() };
  if (typeof window === "undefined") return intent;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // localStorage를 쓸 수 없는 환경 — 조용히 무시(§ 기존 tasteIssueStorage 관례와 동일).
  }
  return intent;
}

export function getContinuationIntent(): ContinuationIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.selectedChapter === "travel" || parsed.selectedChapter === "style") &&
      typeof parsed.selectedAt === "string"
    ) {
      return parsed as ContinuationIntent;
    }
    return null;
  } catch {
    return null;
  }
}

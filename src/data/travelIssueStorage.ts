// TRAVEL ISSUE STORAGE(2026-08, PR #261 Round I §18) — tasteIssueStorage.ts와
// 동일한 관례(로그인/서버 DB 없이 localStorage, signal debug 전체는
// 저장하지 않고 최소 필드만 담아 화면을 다시 구성)를 그대로 따른다.
// 같은 STORAGE_KEY("personal-magazine:issues")를 공유하는 issueId 기반
// map이라, TASTE와 TRAVEL Issue가 하나의 저장소 안에 나란히 쌓인다 —
// tasteIssueStorage.ts는 한 글자도 건드리지 않았다(새 파일로 분리).
import type { TravelV1RawAnswers } from "./travelQuestionnaireV1";

export type SavedTravelIssue = {
  issueId: string;
  issueType: "travel";
  issueNumber: 2;
  createdAt: string;
  questionnaireVersion: "v1";
  narrativeVersion: "v1";
  answers: TravelV1RawAnswers;
  opening: { headline: string; summary: string };
  keywords: string[];
  pullQuote: string;
};

const STORAGE_KEY = "personal-magazine:issues";
export const TRAVEL_ISSUE_ID = "travel-2";

type IssueStore = Record<string, unknown>;

function readStore(): IssueStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as IssueStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: IssueStore): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveTravelIssue(params: {
  answers: TravelV1RawAnswers;
  narrative: { opening: { headline: string; summary: string }; keywords: string[]; pullQuote: string };
}): SavedTravelIssue {
  const issue: SavedTravelIssue = {
    issueId: TRAVEL_ISSUE_ID,
    issueType: "travel",
    issueNumber: 2,
    createdAt: new Date().toISOString(),
    questionnaireVersion: "v1",
    narrativeVersion: "v1",
    answers: params.answers,
    opening: { headline: params.narrative.opening.headline, summary: params.narrative.opening.summary },
    keywords: params.narrative.keywords,
    pullQuote: params.narrative.pullQuote,
  };
  const store = readStore();
  store[issue.issueId] = issue;
  writeStore(store);
  return issue;
}

export function getSavedTravelIssue(): SavedTravelIssue | null {
  const value = readStore()[TRAVEL_ISSUE_ID];
  return (value as SavedTravelIssue | undefined) ?? null;
}

// TASTE ISSUE STORAGE(2026-08, Private Beta Round 3) — 로그인/서버 DB
// 없이 브라우저 localStorage로 실제 저장을 구현한다. §4 지시대로
// signal debug 전체는 저장하지 않고, 나중에 MY MAGAZINE에서 화면을
// 재구성할 수 있는 최소 데이터만 담는다.
//
// issueId 기반 map 구조(§6) — 지금은 taste issue 하나뿐이라
// TASTE_ISSUE_ID가 고정 상수지만, 같은 id로 계속 덮어쓰기만 해도
// "저장을 여러 번 눌러도 중복 생성되지 않는다"는 요구를 그대로
//만족한다. 여러 Chapter가 생기면 이 map에 issueId만 늘어나면 된다.
import type { TasteMagazineNarrative } from "./tasteNarrative";
import type { TasteRawAnswers } from "./tasteQuestionnaire";
import type { TasteMagazineNarrativeV3 } from "./tasteNarrativeV3";
import type { TasteV3RawAnswers } from "./tasteQuestionnaireV3";

export type SavedTasteIssue = {
  issueId: string;
  issueType: "taste";
  issueNumber: 1;
  createdAt: string;
  questionnaireVersion: "v2.2";
  narrativeVersion: "v2.3-final";
  answers: TasteRawAnswers;
  opening: { headline: string; summary: string };
  keywords: string[];
  pullQuote: string;
  hasInterestingPart: boolean;
};

// TASTE v3(PRODUCT FREEZE, 2026-08) — §18 "가장 작은 호환 전략" 요구에
// 따라 기존 SavedTasteIssue(v2.2) 타입은 필드 하나도 바꾸지 않고,
// questionnaireVersion으로 구분되는 새 타입을 나란히 추가했다. 기존
// v2.2로 저장된 Issue를 강제로 v3 구조로 재해석하지 않는다 — 저장소는
// 두 버전을 있는 그대로 구분해서 들고 있는다.
export type SavedTasteIssueV3 = {
  issueId: string;
  issueType: "taste";
  issueNumber: 1;
  createdAt: string;
  questionnaireVersion: "v3";
  narrativeVersion: "v3-compositional";
  answers: TasteV3RawAnswers;
  opening: { headline: string; summary: string };
  keywords: string[];
  pullQuote: string;
  hasInterestingPart: boolean;
};

export type AnySavedTasteIssue = SavedTasteIssue | SavedTasteIssueV3;

const STORAGE_KEY = "personal-magazine:issues";
export const TASTE_ISSUE_ID = "taste-1";

type IssueStore = Record<string, AnySavedTasteIssue>;

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

export function saveTasteIssue(params: { answers: TasteRawAnswers; narrative: TasteMagazineNarrative }): SavedTasteIssue {
  const issue: SavedTasteIssue = {
    issueId: TASTE_ISSUE_ID,
    issueType: "taste",
    issueNumber: 1,
    createdAt: new Date().toISOString(),
    questionnaireVersion: "v2.2",
    narrativeVersion: "v2.3-final",
    answers: params.answers,
    opening: { headline: params.narrative.opening.headline, summary: params.narrative.opening.summary },
    keywords: params.narrative.keywords,
    pullQuote: params.narrative.pullQuote,
    hasInterestingPart: Boolean(params.narrative.interestingPart),
  };
  const store = readStore();
  store[issue.issueId] = issue;
  writeStore(store);
  return issue;
}

export function saveTasteIssueV3(params: { answers: TasteV3RawAnswers; narrative: TasteMagazineNarrativeV3 }): SavedTasteIssueV3 {
  const issue: SavedTasteIssueV3 = {
    issueId: TASTE_ISSUE_ID,
    issueType: "taste",
    issueNumber: 1,
    createdAt: new Date().toISOString(),
    questionnaireVersion: "v3",
    narrativeVersion: "v3-compositional",
    answers: params.answers,
    opening: { headline: params.narrative.opening.headline, summary: params.narrative.opening.summary },
    keywords: params.narrative.keywords,
    pullQuote: params.narrative.pullQuote,
    hasInterestingPart: true,
  };
  const store = readStore();
  store[issue.issueId] = issue;
  writeStore(store);
  return issue;
}

// 저장된 Issue가 v2.2인지 v3인지는 questionnaireVersion 필드로만
// 구분한다 — 호출부(PersonalMagazineBetaClient.tsx)가 이 필드를 보고
// 렌더링 경로(레거시 JourneyResult vs v3 JourneyResultV3)를 고른다.
export function getSavedTasteIssue(): AnySavedTasteIssue | null {
  return readStore()[TASTE_ISSUE_ID] ?? null;
}

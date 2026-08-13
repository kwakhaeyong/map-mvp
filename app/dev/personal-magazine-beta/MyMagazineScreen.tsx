"use client";

import { useEffect, useRef, useState } from "react";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";
import { getContinuationIntent, saveContinuationIntent, type NextChapterId } from "../../../src/data/continuationStorage";
import { TASTE_ISSUE_ID, type SavedTasteIssue } from "../../../src/data/tasteIssueStorage";
import { sendBetaEvent } from "../../../src/data/personalMagazineBetaTelemetry";

// MY MAGAZINE / CONTINUATION LAYER(2026-08, Private Beta Round 4) — §5~§13
// 확정. TASTE COMPLETE는 항상 localStorage의 실제 저장 데이터
// (getSavedTasteIssue()가 부모에서 읽어 prop으로 내려준 값)만 쓰고,
// 하드코딩된 fake complete 카드를 만들지 않는다(§6). TRAVEL/STYLE은
// 실제 설문으로 이어지지 않는 상태 기록일 뿐이다(§11) — 선택
// (selectedNextChapter)과 확정(confirmedNextChapter)을 서로 다른
// state로 분리해 §13이 요구한 "세 행동의 독립적 구분"을 코드
// 구조로 남긴다. data-behavior attribute는 나중에 analytics를 붙일
// 때 참조할 수 있는 순수 구조용 마킹이며, 지금은 track() 호출을
// 하지 않는다(§22).

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const NEXT_CHAPTERS: Array<{ id: NextChapterId; number: string; title: string }> = [
  { id: "travel", number: "02", title: "TRAVEL" },
  { id: "style", number: "03", title: "STYLE" },
];

export function MyMagazineScreen({
  savedIssue,
  onGoHome,
  onOpenSavedIssue,
}: {
  savedIssue: SavedTasteIssue | null;
  onGoHome: () => void;
  onOpenSavedIssue: (issue: SavedTasteIssue) => void;
}) {
  const [selectedNextChapter, setSelectedNextChapter] = useState<NextChapterId | null>(null);
  const [confirmedNextChapter, setConfirmedNextChapter] = useState<NextChapterId | null>(null);
  // §8 "my_magazine_viewed × 5 같은 데이터가 생기면 안 된다" — 실제
  // 행동(이 화면을 보러 옴) 1회와 컴포넌트 rerender를 구분하기 위한
  // 가드. useEffect([]) 자체가 이미 mount당 1번만 실행되지만, 이
  // ref로 한 번 더 명시적으로 막아 StrictMode 이중 호출 등 어떤
  // 이유로든 같은 mount 안에서 두 번 불리는 상황까지 막는다.
  const viewedFired = useRef(false);

  // §16 — mount 시 localStorage의 continuation intent를 읽어 선택
  // 상태를 복원한다. 저장된 값은 항상 "확정된" 선택이었으므로 두
  // state를 함께 채운다.
  useEffect(() => {
    const stored = getContinuationIntent();
    if (stored) {
      setSelectedNextChapter(stored.selectedChapter);
      setConfirmedNextChapter(stored.selectedChapter);
    }
  }, []);

  useEffect(() => {
    if (viewedFired.current) return;
    viewedFired.current = true;
    sendBetaEvent(TASTE_ISSUE_ID, { event: "my_magazine_viewed" });
  }, []);

  function handleSelectChapter(chapter: NextChapterId) {
    setSelectedNextChapter(chapter);
    sendBetaEvent(TASTE_ISSUE_ID, { event: "next_chapter_selected", chapter });
    if (confirmedNextChapter && confirmedNextChapter !== chapter) {
      setConfirmedNextChapter(null);
    }
  }

  function handleConfirmChapter() {
    if (!selectedNextChapter) return;
    saveContinuationIntent(selectedNextChapter);
    sendBetaEvent(TASTE_ISSUE_ID, { event: "next_chapter_confirmed", chapter: selectedNextChapter });
    setConfirmedNextChapter(selectedNextChapter);
  }

  if (!savedIssue) {
    return (
      <div data-behavior="viewed-my-magazine" className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>
        <p className="mt-6 text-sm font-bold leading-6 text-text-secondary">아직 저장된 Issue가 없습니다.</p>
        <button
          type="button"
          onClick={onGoHome}
          className="mt-8 inline-flex h-12 items-center justify-center bg-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-background"
        >
          MAKE MY FIRST ISSUE
        </button>
      </div>
    );
  }

  return (
    <div
      data-behavior="viewed-my-magazine"
      data-selected-chapter={selectedNextChapter ?? undefined}
      data-confirmed-chapter={confirmedNextChapter ?? undefined}
      className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-20 pt-14 text-center"
    >
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">PERSONAL MAGAZINE</p>
      <h1 className="mt-5 text-[2.25rem] font-black leading-[1.15] tracking-[-0.02em] text-text-primary">MY MAGAZINE</h1>
      <p className="mt-4 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
        {"당신에 관한 이야기가\n한 Chapter씩 쌓입니다."}
      </p>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">1 CHAPTER COMPLETE</p>

      <button type="button" onClick={() => onOpenSavedIssue(savedIssue)} className="mt-8 block w-full overflow-hidden border border-border-strong text-left">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
          <img
            src={magazineVisualAssets.taste.hero.src}
            alt={magazineVisualAssets.taste.hero.alt}
            className="size-full object-cover"
            style={{ objectPosition: magazineVisualAssets.taste.hero.objectPositionMobile }}
          />
        </div>
        <div className="px-5 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted">01 / TASTE / COMPLETE</p>
          <p className="mt-2 whitespace-pre-line text-lg font-black leading-snug tracking-[-0.01em] text-text-primary">{savedIssue.opening.headline}</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">
            {new Date(savedIssue.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </button>

      <div className="mt-16 border-t border-dashed border-border-strong pt-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR NEXT CHAPTER</p>
        <h2 className="mx-auto mt-4 whitespace-pre-line text-[1.5rem] font-black leading-[1.25] tracking-[-0.02em] text-text-primary">
          {"한 Chapter가\n당신 전부를 설명하지 않습니다."}
        </h2>
        <p className="mx-auto mt-4 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
          {"하나씩 채워질수록,\n당신의 Magazine은 조금 더\n당신다워집니다."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {NEXT_CHAPTERS.map((chapter) => {
            const isSelected = selectedNextChapter === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => handleSelectChapter(chapter.id)}
                className={cx(
                  "flex items-center justify-between border px-5 py-5 text-left transition-colors duration-normal",
                  isSelected ? "border-text-primary" : "border-border-strong"
                )}
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-xs font-black text-text-muted">{chapter.number}</span>
                  <span className="text-base font-black tracking-[-0.01em] text-text-primary">{chapter.title}</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">COMING NEXT</span>
              </button>
            );
          })}
        </div>

        {selectedNextChapter && (
          <div className="mt-10 border-t border-dashed border-border-strong pt-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">NEXT CHAPTER</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.01em] text-text-primary">{selectedNextChapter === "travel" ? "TRAVEL" : "STYLE"}</h3>
            <p className="mx-auto mt-4 whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
              {"이 Chapter가 준비되면\n당신의 Magazine을 계속 이어갈 수 있습니다."}
            </p>

            {confirmedNextChapter === selectedNextChapter ? (
              <p className="mt-6 text-sm font-black uppercase tracking-[0.04em] text-text-primary">NEXT CHAPTER SAVED ✓</p>
            ) : (
              <button
                type="button"
                onClick={handleConfirmChapter}
                className="mt-6 inline-flex h-12 items-center justify-center bg-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-background"
              >
                KEEP THIS AS MY NEXT CHAPTER
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

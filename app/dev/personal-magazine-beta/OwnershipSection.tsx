"use client";

import { useState } from "react";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";
import { type TasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { getSavedTasteIssue, saveTasteIssue, TASTE_ISSUE_ID } from "../../../src/data/tasteIssueStorage";
import { sendBetaEvent } from "../../../src/data/personalMagazineBetaTelemetry";
import type { TasteMagazineNarrativeV3 } from "../../../src/data/tasteNarrativeV3";
import type { TasteV3RawAnswers } from "../../../src/data/tasteQuestionnaireV3";

// TASTE v3(2026-08) — §17/§18 "SAVE/SHARE UX 그대로 유지" 요구에 따라
// 이 컴포넌트의 화면/문구/PNG 생성 로직은 전혀 바꾸지 않았다. 다만
// v2.2/v3 두 questionnaire 버전 모두에서 재사용할 수 있도록 narrative/
// answers 타입만 "실제로 이 컴포넌트가 읽는 필드"로 좁혔고(구조적
// 타이핑 — 두 실제 타입 모두 이 최소 shape를 만족한다), 저장 동작은
// onSaveIssue가 주어지면 그것을 쓰고, 없으면 기존 saveTasteIssue(v2.2)
// 그대로 호출한다 — 기존 호출부(JourneyResult)는 prop을 넘기지 않으므로
// 동작이 전혀 바뀌지 않는다.
type ShareableNarrative = { opening: { headline: string; summary: string }; pullQuote: string; keywords: string[] };

// OWNERSHIP / SAVE / SHARE(2026-08, Private Beta Round 3) — §3 확정
// 카피 그대로, 기존 Result의 EndingSection 바로 다음에 이어지는 한
// 장으로 보이도록 같은 typography(font-serif eyebrow, 중앙 정렬,
// editorial spacing)를 재사용한다. TasteMagazineResult.tsx는 전혀
// 건드리지 않고, 이 컴포넌트를 그 아래 형제 요소로만 붙인다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================
// SHARE CARD — 신규 외부 의존성 없이 네이티브 Canvas API로 9:16 PNG를
// 만든다(§11). 새 색/폰트를 만들지 않고, 이미 쓰이는 CSS 커스텀
// property(--color-*)와 페이지가 실제로 쓰는 font-family를 런타임에
// 읽어서 그대로 쓴다 — 그래서 raw hex를 소스에 넣지 않는다(design:check
// 통과 이유이기도 하다).
// ============================================================
const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${src}`));
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

async function buildTasteShareCardBlob(narrative: ShareableNarrative): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context를 만들 수 없습니다.");

  // design:check(raw color 금지) 대응 — CSS custom property는 이 페이지에
  // design-tokens.css가 항상 로드된 상태로만 렌더링되므로, hex 리터럴
  // fallback 없이 읽은 값을 그대로 쓴다(Round 4에서 발견해 최소 수정 —
  // Share Card 자체의 시각 출력은 바뀌지 않는다).
  const rootStyle = getComputedStyle(document.documentElement);
  const bg = rootStyle.getPropertyValue("--color-background").trim();
  const ink = rootStyle.getPropertyValue("--color-text-primary").trim();
  const muted = rootStyle.getPropertyValue("--color-text-muted").trim();
  const borderStrong = rootStyle.getPropertyValue("--color-border-strong").trim();
  const sansFont = getComputedStyle(document.body).fontFamily || "sans-serif";
  const serifFont = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  // Hero — 기존 taste.hero(승인된 asset) 재사용. 새 이미지를 만들지
  // 않는다. 위쪽 58%를 object-cover 방식으로 채운다.
  const heroAsset = magazineVisualAssets.taste.hero;
  const img = await loadImage(heroAsset.src);
  const heroHeight = Math.round(SHARE_CARD_HEIGHT * 0.58);
  const scale = Math.max(SHARE_CARD_WIDTH / img.width, heroHeight / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, SHARE_CARD_WIDTH, heroHeight);
  ctx.clip();
  ctx.drawImage(img, (SHARE_CARD_WIDTH - drawWidth) / 2, (heroHeight - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();

  ctx.strokeStyle = borderStrong;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, heroHeight);
  ctx.lineTo(SHARE_CARD_WIDTH, heroHeight);
  ctx.stroke();

  const centerX = SHARE_CARD_WIDTH / 2;
  ctx.textAlign = "center";
  let y = heroHeight + 96;

  ctx.fillStyle = muted;
  ctx.font = `700 26px ${sansFont}`;
  ctx.fillText("PERSONAL MAGAZINE", centerX, y);

  y += 48;
  ctx.font = `700 22px ${sansFont}`;
  ctx.fillText("ISSUE 01 · TASTE", centerX, y);

  y += 96;
  ctx.fillStyle = ink;
  ctx.font = `900 56px ${sansFont}`;
  for (const line of wrapLines(ctx, narrative.opening.headline, SHARE_CARD_WIDTH - 160)) {
    ctx.fillText(line, centerX, y);
    y += 68;
  }

  y += 64;
  ctx.fillStyle = ink;
  ctx.font = `italic 500 40px ${serifFont}`;
  for (const line of wrapLines(ctx, narrative.pullQuote, SHARE_CARD_WIDTH - 220)) {
    ctx.fillText(line, centerX, y);
    y += 54;
  }

  ctx.fillStyle = muted;
  ctx.font = `700 22px ${sansFont}`;
  ctx.fillText("MY PERSONAL MAGAZINE", centerX, SHARE_CARD_HEIGHT - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG 생성에 실패했습니다."))), "image/png");
  });
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "taste-issue-share-card.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// ROOT
// ============================================================
export function OwnershipSection({
  answers,
  narrative,
  onSaved,
  onSaveIssue,
}: {
  answers: TasteRawAnswers | TasteV3RawAnswers;
  narrative: TasteMagazineNarrative | TasteMagazineNarrativeV3;
  onSaved?: () => void;
  // v3(§18)에서만 넘긴다 — 없으면 기존 saveTasteIssue(v2.2)를 그대로 쓴다.
  onSaveIssue?: () => void;
}) {
  // MY MAGAZINE / CONTINUATION LAYER(2026-08, Round 4) — §4/§16. 이미
  // 저장된 Issue를 가지고 돌아온 경우(예: TASTE COMPLETE 카드를 다시
  // 열어 이 화면으로 돌아온 경우)에도 "SAVE MY MAGAZINE"이 다시
  // 미저장 상태로 보이면 안 되므로, 실제 localStorage를 읽어 초기값을
  // 잡는다.
  const [saved, setSaved] = useState(() => Boolean(getSavedTasteIssue()));
  // §15 — telemetry 없이 행동 상태만 분리해둔다(추후 track() 연결용).
  const [shareAttempted, setShareAttempted] = useState(false);
  const [shareCompleted, setShareCompleted] = useState(false);
  const [shareDownloaded, setShareDownloaded] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [shareCardBlob, setShareCardBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  function handleSave() {
    // 사용자 행동(localStorage 저장) 먼저, 중앙 전송은 그다음 —
    // §7 순서 그대로. sendBetaEvent는 실패해도 던지지 않으므로 아래
    // 두 줄(setSaved/onSaved)은 항상 정상 실행된다.
    if (onSaveIssue) {
      onSaveIssue();
    } else {
      saveTasteIssue({ answers: answers as TasteRawAnswers, narrative: narrative as TasteMagazineNarrative });
    }
    sendBetaEvent(TASTE_ISSUE_ID, { event: "issue_saved" });
    setSaved(true);
    onSaved?.();
  }

  async function ensureShareCard(): Promise<Blob> {
    if (shareCardBlob) return shareCardBlob;
    const blob = await buildTasteShareCardBlob(narrative);
    setShareCardBlob(blob);
    setShareCardUrl(URL.createObjectURL(blob));
    return blob;
  }

  async function handleShare() {
    setShareAttempted(true);
    setShareError(null);
    setIsGeneratingCard(true);
    try {
      const blob = await ensureShareCard();
      const file = new File([blob], "taste-issue-share-card.png", { type: "image/png" });
      const shareData = { files: [file], title: "나의 TASTE Issue", text: "나의 TASTE Issue" };
      const canShareFiles = typeof navigator !== "undefined" && Boolean(navigator.share) && Boolean(navigator.canShare) && navigator.canShare(shareData);
      // §5 "share method을 알 수 있으면 native | fallback 정도만" —
      // canShareFiles 판정 시점에 이미 어느 경로로 갈지 알 수 있다.
      sendBetaEvent(TASTE_ISSUE_ID, { event: "share_attempted", method: canShareFiles ? "native" : "fallback" });

      if (canShareFiles) {
        try {
          await navigator.share(shareData);
          setShareCompleted(true);
          sendBetaEvent(TASTE_ISSUE_ID, { event: "share_succeeded" });
        } catch (err) {
          // 사용자가 공유 시트를 취소한 것은 실패가 아니다(§14) — 상태를
          // 바꾸지 않고 조용히 종료한다. 그 외 실제 오류만 다운로드로
          // fallback한다. §6 "취소는 별도 데이터" — 취소 시 아무
          // 이벤트도 보내지 않는다(실패도 성공도 아니므로).
          if ((err as DOMException)?.name !== "AbortError") {
            triggerDownload(blob);
            setShareDownloaded(true);
            sendBetaEvent(TASTE_ISSUE_ID, { event: "share_fallback_downloaded" });
          }
        }
      } else {
        triggerDownload(blob);
        setShareDownloaded(true);
        sendBetaEvent(TASTE_ISSUE_ID, { event: "share_fallback_downloaded" });
      }
    } catch {
      // Canvas/PNG 생성 자체가 실패하는 경우 — 임의로 다른 방법을
      // 만들지 않고 그대로 보고한다(§11).
      setShareError("Share card를 만드는 데 실패했습니다.");
    } finally {
      setIsGeneratingCard(false);
    }
  }

  const shareButtonLabel = isGeneratingCard ? "PREPARING…" : shareCompleted ? "SHARED ✓" : shareDownloaded ? "SHARE CARD SAVED ✓" : "SHARE";

  return (
    <section className="border-t border-dashed border-border-strong px-6 pb-20 pt-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR ISSUE</p>

      <h2 className="mx-auto mt-4 whitespace-pre-line text-[1.9rem] font-black leading-[1.2] tracking-[-0.02em] text-text-primary">
        {"이 Magazine을\n내 것으로 남겨두세요."}
      </h2>

      <p className="mx-auto mt-4 max-w-[22rem] whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
        {"당신이 고른 장면과 선택으로 만든\n첫 번째 Personal Magazine입니다."}
      </p>

      <div className="mx-auto mt-8 flex max-w-xs flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className={cx(
            "inline-flex h-12 w-full items-center justify-center px-8 text-sm font-black uppercase tracking-[0.04em] transition-all duration-normal",
            saved ? "border border-border-strong bg-tag-fill text-text-secondary" : "bg-text-primary text-background"
          )}
        >
          {saved ? "SAVED TO MY MAGAZINE ✓" : "SAVE MY MAGAZINE"}
        </button>
        {saved && <p className="text-[12px] font-bold text-text-secondary">첫 번째 Issue가 저장되었습니다.</p>}

        <button
          type="button"
          onClick={handleShare}
          disabled={isGeneratingCard}
          className="inline-flex h-12 w-full items-center justify-center border border-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-text-primary"
        >
          {shareButtonLabel}
        </button>
        {shareCompleted && <p className="text-[12px] font-bold text-text-secondary">Share card가 준비되었습니다.</p>}
        {shareDownloaded && !shareCompleted && <p className="text-[12px] font-bold text-text-secondary">Share card가 저장되었습니다.</p>}
        {shareError && <p className="text-[12px] font-bold text-error">{shareError}</p>}
        {shareAttempted && !shareCardUrl && !shareError && isGeneratingCard && (
          <p className="text-[12px] font-bold text-text-muted">Share card를 만들고 있습니다…</p>
        )}

        {shareCardUrl && (
          <div className="mt-4 w-32 overflow-hidden border border-border-strong" style={{ aspectRatio: `${SHARE_CARD_WIDTH} / ${SHARE_CARD_HEIGHT}` }}>
            <img src={shareCardUrl} alt="TASTE SHARE CARD 미리보기" className="size-full object-cover" />
          </div>
        )}
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">ISSUE 01 · TASTE</p>
    </section>
  );
}

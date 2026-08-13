"use client";

import { useState } from "react";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";
import { type TasteMagazineNarrative } from "../../../src/data/tasteNarrative";
import { type TasteRawAnswers } from "../../../src/data/tasteQuestionnaire";
import { saveTasteIssue } from "../../../src/data/tasteIssueStorage";

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

async function buildTasteShareCardBlob(narrative: TasteMagazineNarrative): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context를 만들 수 없습니다.");

  const rootStyle = getComputedStyle(document.documentElement);
  const bg = rootStyle.getPropertyValue("--color-background").trim() || "#faf9f6";
  const ink = rootStyle.getPropertyValue("--color-text-primary").trim() || "#222222";
  const muted = rootStyle.getPropertyValue("--color-text-muted").trim() || "#6e6e6a";
  const borderStrong = rootStyle.getPropertyValue("--color-border-strong").trim() || "rgba(34,34,34,0.24)";
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
export function OwnershipSection({ answers, narrative }: { answers: TasteRawAnswers; narrative: TasteMagazineNarrative }) {
  const [saved, setSaved] = useState(false);
  // §15 — telemetry 없이 행동 상태만 분리해둔다(추후 track() 연결용).
  const [shareAttempted, setShareAttempted] = useState(false);
  const [shareCompleted, setShareCompleted] = useState(false);
  const [shareDownloaded, setShareDownloaded] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [shareCardBlob, setShareCardBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  function handleSave() {
    saveTasteIssue({ answers, narrative });
    setSaved(true);
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

      if (canShareFiles) {
        try {
          await navigator.share(shareData);
          setShareCompleted(true);
        } catch (err) {
          // 사용자가 공유 시트를 취소한 것은 실패가 아니다(§14) — 상태를
          // 바꾸지 않고 조용히 종료한다. 그 외 실제 오류만 다운로드로
          // fallback한다.
          if ((err as DOMException)?.name !== "AbortError") {
            triggerDownload(blob);
            setShareDownloaded(true);
          }
        }
      } else {
        triggerDownload(blob);
        setShareDownloaded(true);
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

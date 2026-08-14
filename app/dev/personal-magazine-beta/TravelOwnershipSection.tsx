"use client";

import { useState } from "react";
import { magazineVisualAssets } from "../../../src/data/magazineVisualAssets";
import { getSavedTravelIssue, saveTravelIssue, TRAVEL_ISSUE_ID, type SavedTravelIssue } from "../../../src/data/travelIssueStorage";
import { sendBetaEvent } from "../../../src/data/personalMagazineBetaTelemetry";
import type { TravelMagazineNarrativeV1 } from "../../../src/data/travelNarrativeV1";
import type { TravelV1RawAnswers } from "../../../src/data/travelQuestionnaireV1";

// TRAVEL OWNERSHIP / SAVE / SHARE(ISSUE 02, 2026-08, PR #261 Round I) —
// OwnershipSection.tsx(TASTE)와 같은 UX/Share Card 생성 로직을 그대로
// 따르되, TASTE 쪽 컴포넌트는 §17 요구대로 한 글자도 건드리지 않기
// 위해 독립 컴포넌트로 새로 작성했다. 문구만 ISSUE 02 · TRAVEL로
// 바뀌고 동작은 동일하다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

async function buildTravelShareCardBlob(narrative: TravelMagazineNarrativeV1): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context를 만들 수 없습니다.");

  const rootStyle = getComputedStyle(document.documentElement);
  const bg = rootStyle.getPropertyValue("--color-background").trim();
  const ink = rootStyle.getPropertyValue("--color-text-primary").trim();
  const muted = rootStyle.getPropertyValue("--color-text-muted").trim();
  const borderStrong = rootStyle.getPropertyValue("--color-border-strong").trim();
  const sansFont = getComputedStyle(document.body).fontFamily || "sans-serif";
  const serifFont = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);

  const heroAsset = magazineVisualAssets.travel.hero;
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
  ctx.fillText("ISSUE 02 · TRAVEL", centerX, y);

  y += 40;
  ctx.font = `700 20px ${sansFont}`;
  const publishedLabel = `PUBLISHED · ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}`;
  ctx.fillText(publishedLabel, centerX, y);

  y += 88;
  ctx.fillStyle = ink;
  ctx.font = `900 56px ${sansFont}`;
  for (const line of wrapLines(ctx, narrative.opening.headline, SHARE_CARD_WIDTH - 160)) {
    ctx.fillText(line, centerX, y);
    y += 68;
  }

  y += 64;
  ctx.fillStyle = ink;
  ctx.font = `italic 500 40px ${serifFont}`;
  const supportingLine = narrative.interestingPart.headline.replace(/\n/g, " ");
  for (const line of wrapLines(ctx, supportingLine, SHARE_CARD_WIDTH - 220)) {
    ctx.fillText(line, centerX, y);
    y += 54;
  }

  ctx.fillStyle = muted;
  ctx.font = `700 22px ${sansFont}`;
  ctx.fillText("MAKE YOUR ISSUE", centerX, SHARE_CARD_HEIGHT - 80);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG 생성에 실패했습니다."))), "image/png");
  });
}

function triggerDownload(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "travel-issue-share-card.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function TravelOwnershipSection({
  answers,
  narrative,
  onSaved,
}: {
  answers: TravelV1RawAnswers;
  narrative: TravelMagazineNarrativeV1;
  onSaved?: (issue: SavedTravelIssue) => void;
}) {
  const [saved, setSaved] = useState(() => Boolean(getSavedTravelIssue()));
  const [shareCompleted, setShareCompleted] = useState(false);
  const [shareDownloaded, setShareDownloaded] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [shareCardBlob, setShareCardBlob] = useState<Blob | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  function handleSave() {
    const issue = saveTravelIssue({ answers, narrative });
    sendBetaEvent(TRAVEL_ISSUE_ID, { event: "issue_saved" });
    setSaved(true);
    onSaved?.(issue);
  }

  async function ensureShareCard(): Promise<Blob> {
    if (shareCardBlob) return shareCardBlob;
    const blob = await buildTravelShareCardBlob(narrative);
    setShareCardBlob(blob);
    setShareCardUrl(URL.createObjectURL(blob));
    return blob;
  }

  async function handleShare() {
    setShareError(null);
    setIsGeneratingCard(true);
    try {
      const blob = await ensureShareCard();
      const file = new File([blob], "travel-issue-share-card.png", { type: "image/png" });
      const shareData = { files: [file], title: "나의 TRAVEL Issue", text: "나의 TRAVEL Issue" };
      const canShareFiles = typeof navigator !== "undefined" && Boolean(navigator.share) && Boolean(navigator.canShare) && navigator.canShare(shareData);
      sendBetaEvent(TRAVEL_ISSUE_ID, { event: "share_attempted", method: canShareFiles ? "native" : "fallback" });

      if (canShareFiles) {
        try {
          await navigator.share(shareData);
          setShareCompleted(true);
          sendBetaEvent(TRAVEL_ISSUE_ID, { event: "share_succeeded" });
        } catch (err) {
          if ((err as DOMException)?.name !== "AbortError") {
            triggerDownload(blob);
            setShareDownloaded(true);
            sendBetaEvent(TRAVEL_ISSUE_ID, { event: "share_fallback_downloaded" });
          }
        }
      } else {
        triggerDownload(blob);
        setShareDownloaded(true);
        sendBetaEvent(TRAVEL_ISSUE_ID, { event: "share_fallback_downloaded" });
      }
    } catch {
      setShareError("Share card를 만드는 데 실패했습니다.");
    } finally {
      setIsGeneratingCard(false);
    }
  }

  const shareButtonLabel = isGeneratingCard ? "PREPARING…" : shareCompleted ? "SHARED ✓" : shareDownloaded ? "SHARE CARD SAVED ✓" : "SHARE MY COVER";

  return (
    <section className="border-t border-dashed border-border-strong px-6 pb-20 pt-16 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">YOUR ISSUE</p>

      <h2 className="mx-auto mt-4 whitespace-pre-line text-[1.9rem] font-black leading-[1.2] tracking-[-0.02em] text-text-primary">
        {"이 Magazine을\n내 것으로 남겨두세요."}
      </h2>

      <p className="mx-auto mt-4 max-w-[22rem] whitespace-pre-line text-sm font-bold leading-6 text-text-secondary">
        {"낯선 환경에서 당신이 고른 선택으로 만든\n두 번째 Personal Magazine입니다."}
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
          {saved ? "SAVED TO MY MAGAZINE ✓" : "ADD TO MY MAGAZINE"}
        </button>
        {saved && <p className="text-[12px] font-bold text-text-secondary">두 번째 Issue가 저장되었습니다.</p>}

        <button
          type="button"
          onClick={handleShare}
          disabled={isGeneratingCard}
          className="inline-flex h-12 w-full items-center justify-center border border-text-primary px-8 text-sm font-black uppercase tracking-[0.04em] text-text-primary"
        >
          {shareButtonLabel}
        </button>
        {shareError && <p className="text-[12px] font-bold text-error">{shareError}</p>}

        {shareCardUrl && (
          <div className="mt-4 w-32 overflow-hidden border border-border-strong" style={{ aspectRatio: `${SHARE_CARD_WIDTH} / ${SHARE_CARD_HEIGHT}` }}>
            <img src={shareCardUrl} alt="TRAVEL SHARE CARD 미리보기" className="size-full object-cover" />
          </div>
        )}
      </div>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">ISSUE 02 · TRAVEL</p>
    </section>
  );
}

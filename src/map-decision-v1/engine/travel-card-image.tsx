// 여행 스타일의 1080×1350 초대장 컨셉 card.png satori 렌더링 로직.
// taste-card-image.tsx와 완전히 같은 구조다 — 이상형(ideal-type-
// card-image.tsx)의 4테마 큰 파일을 건드리지 않고, 초대장 컨셉 하나만
// 지원하는 주제마다 새 파일을 만드는 지금까지의 방식을 그대로 따른다.
// 폰트 로딩·PNG 압축·카드 크기 상수는 이상형 쪽에 이미 export돼 있는
// 유틸을 그대로 가져다 쓴다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { CARD_COLORS } from "./ideal-type-card-colors";
import { INVITATION_CARD_HEIGHT, INVITATION_CARD_WIDTH } from "./ideal-type-card-image";
import type { TravelResult } from "../types";

const SIDE_PADDING = 72;
const CONTENT_WIDTH = INVITATION_CARD_WIDTH - SIDE_PADDING * 2;
const PAPER_TEXTURE_PATH = path.join(process.cwd(), "assets/textures/paper-noise.png");

let paperTextureDataUri: string | undefined;
function loadPaperTextureDataUri(): string {
  if (!paperTextureDataUri) {
    const bytes = readFileSync(PAPER_TEXTURE_PATH);
    paperTextureDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  }
  return paperTextureDataUri;
}

function clampForSafety(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const safeCut = lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut.trim()}…`;
}

function pickBySteps(length: number, steps: { max: number; size: number }[], fallback: number): number {
  for (const step of steps) {
    if (length <= step.max) return step.size;
  }
  return fallback;
}

function titleFontSize(title: string): number {
  return pickBySteps(
    title.length,
    [
      { max: 12, size: 130 },
      { max: 20, size: 108 },
      { max: 26, size: 90 },
      { max: 38, size: 76 },
      { max: 52, size: 62 },
    ],
    50,
  );
}

function fitPillFontSize(tags: string[], candidateSizes: number[], paddingX: number, gap: number, charWidthRatio: number): number {
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  for (const fontSize of candidateSizes) {
    const fits = rows.every((row) => {
      const textWidth = row.reduce((sum, tag) => sum + tag.length * fontSize * charWidthRatio, 0);
      const paddingWidth = row.length * paddingX * 2;
      const gapWidth = row.length > 1 ? gap : 0;
      return textWidth + paddingWidth + gapWidth <= CONTENT_WIDTH;
    });
    if (fits) return fontSize;
  }
  return candidateSizes[candidateSizes.length - 1];
}

function fitOneLiner(text: string, fontSizes: number[], budget: number, lineHeight: number): { text: string; fontSize: number } {
  const smallest = fontSizes[fontSizes.length - 1];
  const maxLines = Math.max(1, Math.floor(budget / (smallest * lineHeight)));
  const charsPerLine = Math.max(1, Math.floor(CONTENT_WIDTH / (smallest * 0.56)));
  return { text: clampForSafety(text, charsPerLine * maxLines), fontSize: smallest };
}

// topicLabel(36)은 title에서 그만큼(610→574) 떼어와 마련했다 —
// taste-card-image.tsx의 같은 상수 옆 주석 참고(일곱 파일이 같은
// 초대장 레이아웃을 각자 복제해 쓰고 있어 계산 근거도 동일하다).
// statusLabel(60)도 같은 방식으로 title에서 떼어왔다(574→514) —
// friendship-card-image.tsx와 동일한 근거. oneLiner(200→140)·
// footer(70→130)도 60을 주고받았다 — Zone이 justifyContent:center라
// 존 안의 빈 공간이 위아래로 절반씩 나뉘는데, oneLiner 존을 줄이면 그
// 아래(statusLabel과의 사이) 여백이 줄고, footer 존을 늘리면 그
// 위(statusLabel과의 사이) 여백이 늘어 statusLabel이 oneLiner에 붙고
// footer와는 떨어져 보인다.
const ZONE = { topMargin: 60, topicLabel: 36, title: 514, statusLabel: 60, tags: 350, oneLiner: 140, footer: 130, bottomMargin: 60 } as const;
const TAG = { sizes: [72, 68, 64, 58, 52, 46, 40, 34], paddingX: 32, gap: 20 };
const TAG_CHAR_WIDTH_RATIO = 0.92;
const ONELINER_FONT_SIZES = [44, 40, 36, 30];
const ONELINER_BUDGET = ZONE.oneLiner - 10;
const ONELINER_LINE_HEIGHT = 1.4;

function Zone({ height, children }: { height: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: INVITATION_CARD_WIDTH,
        height,
        flexShrink: 0,
        boxSizing: "border-box",
        paddingLeft: SIDE_PADDING,
        paddingRight: SIDE_PADDING,
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function Seal() {
  return (
    <span
      style={{
        display: "flex",
        position: "absolute",
        left: 64,
        bottom: 64,
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: 999,
        backgroundColor: CARD_COLORS.primary,
        boxShadow: CARD_COLORS.sealShadow,
        color: CARD_COLORS.background,
        fontSize: 30,
        fontWeight: 700,
      }}
    >
      M
    </span>
  );
}

// ideal-type-card-image.tsx/taste-card-image.tsx의 TopicLabel과 같은
// 이유·같은 크기(30px, textSecondary)로 추가한다 — 일곱 카드가 태그를
// 공유해(교차 궁합용) 겉모습이 같아진 것을 킥커 한 줄로 구분한다.
function TopicLabel({ label }: { label: string }) {
  return (
    <Zone height={ZONE.topicLabel}>
      <div style={{ display: "flex", width: CONTENT_WIDTH }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.06em", color: CARD_COLORS.textSecondary }}>{label}</span>
      </div>
    </Zone>
  );
}

function Title({ title }: { title: string }) {
  return (
    <Zone height={ZONE.title}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: ZONE.title, overflow: "hidden" }}>
        <span
          style={{
            fontSize: titleFontSize(title),
            fontWeight: 700,
            lineHeight: 1.25,
            color: CARD_COLORS.primary,
            letterSpacing: "-1px",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </span>
      </div>
    </Zone>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  const fontSize = fitPillFontSize(tags, TAG.sizes, TAG.paddingX, TAG.gap, TAG_CHAR_WIDTH_RATIO);
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  return (
    <Zone height={ZONE.tags}>
      <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH, maxHeight: ZONE.tags, overflow: "hidden" }}>
        {rows.map((row, rowIndex) => (
          <div key={row.join("-")} style={{ display: "flex", justifyContent: "center", marginTop: rowIndex === 0 ? 0 : TAG.gap }}>
            {row.map((tag, tagIndex) => (
              <span
                key={tag}
                style={{
                  display: "flex",
                  backgroundColor: CARD_COLORS.invitationTagFill,
                  color: CARD_COLORS.primary,
                  borderRadius: 999,
                  padding: `${TAG.paddingX * 0.6}px ${TAG.paddingX}px`,
                  fontSize,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  marginLeft: tagIndex === 0 ? 0 : TAG.gap,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Zone>
  );
}

function OneLiner({ oneLiner }: { oneLiner: string }) {
  const fitted = fitOneLiner(oneLiner, ONELINER_FONT_SIZES, ONELINER_BUDGET, ONELINER_LINE_HEIGHT);
  return (
    <Zone height={ZONE.oneLiner}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: ZONE.oneLiner, overflow: "hidden" }}>
        <span style={{ fontSize: fitted.fontSize, fontWeight: 400, lineHeight: ONELINER_LINE_HEIGHT, color: CARD_COLORS.inkStrong }}>
          {fitted.text}
        </span>
      </div>
    </Zone>
  );
}

// friendship-card-image.tsx의 StatusLabel과 같은 이유·같은 구현 —
// OneLiner(inkStrong, 30~44px)보다 작고 옅은 보조 설명이라 새 색 없이
// CARD_COLORS.textSecondary(TopicLabel·Footer가 이미 쓴다)를
// 재사용한다. statusLabel이 없으면(옛 공유 데이터) 존 자체를
// 렌더링하지 않는다 — Tags(tags.length === 0)와 같은 패턴이다.
function StatusLabel({ statusLabel }: { statusLabel?: string }) {
  if (!statusLabel) return null;
  return (
    <Zone height={ZONE.statusLabel}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: ZONE.statusLabel, overflow: "hidden" }}>
        <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, color: CARD_COLORS.textSecondary }}>{statusLabel}</span>
      </div>
    </Zone>
  );
}

function Footer() {
  return (
    <Zone height={ZONE.footer}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: CARD_COLORS.textSecondary, letterSpacing: "0.5px" }}>mapdecision.com</span>
      </div>
    </Zone>
  );
}

function Frame() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 40,
        left: 40,
        right: 40,
        bottom: 40,
        border: `2px solid ${CARD_COLORS.primarySoftBorder}`,
        borderRadius: 16,
      }}
    />
  );
}

// 타이틀 + 태그 4개 + 한줄설명 + 상태 라벨(있으면) + 하단 도메인만
// 담는다(이상형·나 소개·친구·인간관계·일할 때의 나·취향의 초대장
// 카드와 동일한 범위 — 자기성찰 텍스트는 카드에 넣지 않는다).
export function buildTravelCardElement(result: TravelResult) {
  const title = clampForSafety(result.title.trim(), 60);
  const oneLiner = clampForSafety(result.oneLiner.trim(), 120);
  const statusLabel = result.statusLabel ? clampForSafety(result.statusLabel.trim(), 60) : undefined;
  const tags = (result.tags ?? []).slice(0, 4);
  const textureDataUri = loadPaperTextureDataUri();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: INVITATION_CARD_WIDTH,
        height: INVITATION_CARD_HEIGHT,
        backgroundColor: CARD_COLORS.background,
        backgroundImage: `url(${textureDataUri})`,
        backgroundRepeat: "repeat",
        fontFamily: "Noto Serif KR, Pretendard",
      }}
    >
      <Frame />
      <Seal />
      <div style={{ display: "flex", width: INVITATION_CARD_WIDTH, height: ZONE.topMargin, flexShrink: 0 }} />
      <TopicLabel label="나는 이렇게 여행해" />
      <Title title={title} />
      <Tags tags={tags} />
      <OneLiner oneLiner={oneLiner} />
      <StatusLabel statusLabel={statusLabel} />
      <Footer />
      <div style={{ display: "flex", width: INVITATION_CARD_WIDTH, height: ZONE.bottomMargin, flexShrink: 0 }} />
    </div>
  );
}

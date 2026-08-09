// 친구·인간관계의 1080×1350 초대장 컨셉 card.png satori 렌더링 로직.
// self-intro-card-image.tsx와 완전히 같은 구조다 — 나 소개가 처음
// "초대장 컨셉 하나만" 지원하도록 이상형(ideal-type-card-image.tsx)의
// 4테마 큰 파일을 건드리지 않고 새로 만든 것과 같은 이유로, 이 파일도
// 새로 만든다. 폰트 로딩·PNG 압축·카드 크기 상수는 이상형 쪽에 이미
// export돼 있는 유틸을 그대로 가져다 쓴다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { CARD_COLORS } from "./ideal-type-card-colors";
import { INVITATION_CARD_HEIGHT, INVITATION_CARD_WIDTH } from "./ideal-type-card-image";
import type { FriendshipResult } from "../types";

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
// self-intro-card-image.tsx의 같은 상수 옆 주석 참고(세 파일이 같은
// 초대장 레이아웃을 각자 복제해 쓰고 있어 계산 근거도 동일하다).
// statusLabel(60)도 같은 방식으로 title에서 떼어왔다(574→514) — 결과
// 화면(FriendshipResultBlocks.tsx의 HeroHeader)에서 statusLabel이 없는
// 기존 공유 링크가 많아, 새 존을 위해 다른 필수 존(tags/oneLiner 등)의
// 예산을 줄이기보다 title의 여유분에서 가져오는 쪽을 택했다.
// oneLiner(200→140)·footer(70→130)는 서로 60을 주고받았다 — 각 Zone이
// justifyContent:center라 존 안의 빈 공간이 위아래로 절반씩 나뉘는데,
// oneLiner 존을 줄이면 그 아래(statusLabel과의 사이) 여백이 줄고,
// footer 존을 늘리면 그 위(statusLabel과의 사이) 여백이 늘어 statusLabel이
// oneLiner에 붙고 footer와는 떨어져 보인다. 그것만으로는(Zone이
// justifyContent:center라 오직 존 높이 차이에만 의존) 간격 차이가
// oneLiner 줄 수(1~3줄)에 따라 들쭉날쭉하고 눈에 띄게 크지 않아서,
// Zone에 justifyContent 오버라이드(style prop, ideal-type-card-image.tsx의
// InvitationZone과 같은 방식)를 추가해 OneLiner는 자기 존 아래쪽에,
// StatusLabel은 자기 존 위쪽에 붙인다 — 둘 사이 간격이 항상 거의 0이
// 되어 oneLiner 줄 수와 무관하게 "바로 아래"가 유지된다. Footer는 반대로
// 자기 존 아래쪽(bottomMargin 쪽)에 붙여, StatusLabel 존의 남는
// 공간(statusLabel 아래)과 Footer 존의 남는 공간(Footer 글자 위)이
// 전부 statusLabel-Footer 사이에 쌓이게 한다.
const ZONE = { topMargin: 60, topicLabel: 36, title: 514, statusLabel: 60, tags: 350, oneLiner: 140, footer: 130, bottomMargin: 60 } as const;
const TAG = { sizes: [72, 68, 64, 58, 52, 46, 40, 34], paddingX: 32, gap: 20 };
const TAG_CHAR_WIDTH_RATIO = 0.92;
const ONELINER_FONT_SIZES = [44, 40, 36, 30];
const ONELINER_BUDGET = ZONE.oneLiner - 10;
const ONELINER_LINE_HEIGHT = 1.4;

function Zone({ height, children, style }: { height: number; children: React.ReactNode; style?: Record<string, unknown> }) {
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
        ...style,
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

// ideal-type-card-image.tsx/self-intro-card-image.tsx의 TopicLabel과
// 같은 이유·같은 크기(30px, textSecondary)로 추가한다 — 세 카드가
// 태그를 공유해(교차 궁합용) 겉모습이 같아진 것을 킥커 한 줄로 구분한다.
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
    <Zone height={ZONE.oneLiner} style={{ justifyContent: "flex-end" }}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: ZONE.oneLiner, overflow: "hidden" }}>
        <span style={{ fontSize: fitted.fontSize, fontWeight: 400, lineHeight: ONELINER_LINE_HEIGHT, color: CARD_COLORS.inkStrong }}>
          {fitted.text}
        </span>
      </div>
    </Zone>
  );
}

// 결과 화면(HeroHeader)과 같은 시각 위계 — oneLiner(inkStrong, 30~44px)
// 보다 작고 옅은 색이라 "보조 설명"으로 읽힌다. 새 색을 만들지 않고
// TopicLabel·Footer가 이미 쓰는 CARD_COLORS.textSecondary를 그대로
// 재사용한다(design-tokens.css와의 수동 동기화 대상을 늘리지 않기
// 위해서). 옛 공유 데이터처럼 statusLabel이 없으면 존 자체를 렌더링하지
// 않는다 — Tags(tags.length === 0)와 같은 패턴이다.
function StatusLabel({ statusLabel }: { statusLabel?: string }) {
  if (!statusLabel) return null;
  return (
    <Zone height={ZONE.statusLabel} style={{ justifyContent: "flex-start" }}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: ZONE.statusLabel, overflow: "hidden" }}>
        <span style={{ fontSize: 30, fontWeight: 500, lineHeight: 1.4, color: CARD_COLORS.textSecondary }}>{statusLabel}</span>
      </div>
    </Zone>
  );
}

function Footer() {
  return (
    <Zone height={ZONE.footer} style={{ justifyContent: "flex-end" }}>
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
// 담는다(이상형·나 소개의 초대장 카드와 동일한 범위 — 자기성찰 텍스트는
// 카드에 넣지 않는다). 순서는 title → tags → oneLiner → statusLabel —
// 이 카드의 기존 tags·oneLiner 순서(결과 화면과는 반대)는 그대로 두고,
// statusLabel만 oneLiner 바로 아래에 추가한다.
export function buildFriendshipCardElement(result: FriendshipResult) {
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
      <TopicLabel label="나는 이런 친구" />
      <Title title={title} />
      <Tags tags={tags} />
      <OneLiner oneLiner={oneLiner} />
      <StatusLabel statusLabel={statusLabel} />
      <Footer />
      <div style={{ display: "flex", width: INVITATION_CARD_WIDTH, height: ZONE.bottomMargin, flexShrink: 0 }} />
    </div>
  );
}

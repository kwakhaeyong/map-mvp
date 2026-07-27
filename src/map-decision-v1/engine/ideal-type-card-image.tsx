// A형 한 장 MAP(인스타 스토리용 PNG) 카드의 satori(next/og ImageResponse)
// 렌더링 로직. app/r/[id]/card.png/route.ts(프로덕션)와 개발 전용
// 미리보기 라우트가 이 모듈을 함께 쓴다 — 실제 공유 데이터를 읽는
// 부분(getShare)은 각 라우트에 남겨두고, "IdealTypeResult를 받아서
// 1080x1920 satori 엘리먼트를 만든다"는 순수 로직만 여기 둔다.
//
// 규격은 인스타 스토리(9:16)다. 인터뷰 조사 결과 20대는 심리테스트
// 결과를 피드보다 스토리에 훨씬 자주 올린다 — "게시물로 올리기엔
// 부담스럽지만 공유는 하고 싶은 것"의 자리가 스토리이기 때문이다.
// 그래서 상하단 약 250px은 인스타 UI(프로필·답장창)를 피하고 사용자가
// 스티커·손글씨를 얹을 여백("스꾸")으로 비워두고, 실제 내용은 가운데
// 약 1420px 안에만 그린다.
//
// AI가 만드는 title/oneLiner/selfReflection 문장은 길이가 매번 달라서,
// 그대로 그리면 카드 밖으로 넘치는(overflow) 문제가 생긴다. 이 파일은
// 두 겹의 방어로 막는다: (1) 내용 길이에 따라 폰트 크기를 단계적으로
// 줄이고, (2) 그래도 넘칠 가능성에 대비해 각 텍스트 박스에
// overflow: hidden을 걸어 "잘리더라도 카드 틀을 절대 뚫지 않게" 한다.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { CARD_COLORS } from "./ideal-type-card-colors";
import type { IdealTypeResult } from "../types";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
const SAFE_ZONE = 250;
const SIDE_PADDING = 72;
const CONTENT_WIDTH = CARD_WIDTH - SIDE_PADDING * 2;

const FONT_DIR = path.join(process.cwd(), "assets/fonts/pretendard-static");

type CardFont = { data: Buffer; name: string; weight: 400 | 500 | 600 | 700 | 800 | 900; style: "normal" };

// ImageResponse가 실제로 렌더링에 쓰는 것만 최소로 로드한다(전부 로드하면
// 파일마다 1.5MB 안팎이라 함수 콜드스타트가 느려진다). weight는 실제
// woff2 가변 폰트(#93)가 아니라 이 5개 정적 OTF 굵기 중 가장 가까운
// 값으로 매핑해서 쓴다.
export function loadCardFonts(): CardFont[] {
  const weights: { file: string; weight: CardFont["weight"] }[] = [
    { file: "Pretendard-Medium.otf", weight: 500 },
    { file: "Pretendard-SemiBold.otf", weight: 600 },
    { file: "Pretendard-Bold.otf", weight: 700 },
    { file: "Pretendard-ExtraBold.otf", weight: 800 },
    { file: "Pretendard-Black.otf", weight: 900 },
  ];
  return weights.map(({ file, weight }) => ({
    data: readFileSync(path.join(FONT_DIR, file)),
    name: "Pretendard",
    weight,
    style: "normal" as const,
  }));
}

// 마침표 기준 첫 문장만 남긴다. 글자 수로 자르면 문장 중간이 끊겨서
// 어색해지므로(예: "다정하게 챙겨주는 편이") 반드시 문장 경계로 자른다.
// 마침표가 없으면(짧은 한 단어짜리 응답 등) 원문 전체를 그대로 쓴다.
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const periodIndex = trimmed.indexOf(".");
  if (periodIndex === -1) return trimmed;
  return trimmed.slice(0, periodIndex + 1);
}

// firstSentence()로 문장 단위 절단을 해도, AI가 마침표 없이 아주 긴
// 문장을 쓸 가능성은 남아있다. 그 경우에 대비한 최후 안전판 — 단어
// 경계(공백)에서 자르고 말줄임표를 붙인다. 정상적인 응답에서는 절대
// 발동하지 않을 만큼 넉넉한 길이로 잡는다.
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
      { max: 6, size: 132 },
      { max: 10, size: 112 },
      { max: 14, size: 96 },
      { max: 18, size: 84 },
      { max: 24, size: 72 },
    ],
    60,
  );
}

function oneLinerFontSize(oneLiner: string): number {
  return pickBySteps(
    oneLiner.length,
    [
      { max: 16, size: 44 },
      { max: 28, size: 40 },
      { max: 42, size: 36 },
      { max: 60, size: 32 },
    ],
    28,
  );
}

// 자기성찰 문장이 이제 두 개(내가 줄 수 있는 것 / 내가 보완할 부분)라
// 한 블록 안에 둘 다 들어간다 — 예전 한 문장짜리 버전보다 한 단계씩
// 작게 잡아서 두 개를 합친 높이가 안전 영역을 넘지 않게 한다.
function reflectionFontSize(sentence: string): number {
  return pickBySteps(
    sentence.length,
    [
      { max: 20, size: 34 },
      { max: 34, size: 30 },
      { max: 50, size: 27 },
      { max: 70, size: 24 },
    ],
    22,
  );
}

export type CardTheme = "purple" | "navy" | "colorBlock";

function pickReflectionSentence(source: string[]): string {
  const first = source[0];
  if (!first) return "";
  return clampForSafety(firstSentence(first), 90);
}

function tagFontSize(tags: string[]): number {
  const maxLen = tags.reduce((max, tag) => Math.max(max, tag.length), 0);
  return pickBySteps(
    maxLen,
    [
      { max: 5, size: 48 },
      { max: 6, size: 46 },
      { max: 7, size: 42 },
      { max: 8, size: 38 },
    ],
    34,
  );
}

function BrandMark({ color, borderColor }: { color: string; borderColor: string }) {
  return (
    <div style={{ display: "flex", width: CONTENT_WIDTH, alignItems: "center", marginBottom: 40 }}>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 12,
          border: `2px solid ${borderColor}`,
          color,
          fontSize: 20,
          fontWeight: 900,
          marginRight: 12,
        }}
      >
        M
      </span>
      <span style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: "-0.5px" }}>MAP Decision</span>
    </div>
  );
}

function TitleText({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: 300, overflow: "hidden", marginBottom: 36 }}>
      <span style={{ fontSize: titleFontSize(title), fontWeight: 900, lineHeight: 1.15, color, letterSpacing: "-1.5px" }}>{title}</span>
    </div>
  );
}

// 태그 4개는 MBTI 결과의 "ENFP" 네 글자와 같은 역할 — 친구와 서로
// 맞춰볼 수 있는 "소속감" 축이다. 타이틀(고유성)과 이 카드 안에서
// 크기·존재감으로 맞대비를 이루도록 2열 그리드에 큼직하고 굵은
// 글자로 배치하고, 칸 사이에는 선(자체 제작 도형)만 긋는다.
function TagGrid({ tags, textColor, fillColor, borderColor }: { tags: string[]; textColor: string; fillColor: string; borderColor: string }) {
  if (tags.length === 0) return null;
  const columns = 2;
  const rows = Math.ceil(tags.length / columns);
  const fontSize = tagFontSize(tags);
  // satori(yoga)에서 width:'50%'가 부모의 auto 너비를 기준으로 0으로
  // 풀리는 경우가 있어(부모가 명시적 width 없이 stretch에 의존하면
  // 자식 퍼센트 계산이 어긋난다), 퍼센트 대신 실제 픽셀값을 계산해서
  // 명시한다.
  const cellWidth = CONTENT_WIDTH / columns;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: CONTENT_WIDTH, borderRadius: 32, backgroundColor: fillColor, overflow: "hidden", maxHeight: 320, marginBottom: 36 }}>
      {tags.map((tag, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const hasRightNeighbor = col < columns - 1 && index + 1 < tags.length;
        const hasBottomNeighbor = row < rows - 1;
        return (
          <div
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: cellWidth,
              padding: "36px 24px",
              borderRight: hasRightNeighbor ? `2px solid ${borderColor}` : "none",
              borderBottom: hasBottomNeighbor ? `2px solid ${borderColor}` : "none",
            }}
          >
            <span style={{ fontSize, fontWeight: 900, color: textColor, letterSpacing: "-1px" }}>{tag}</span>
          </div>
        );
      })}
    </div>
  );
}

function OneLinerText({ oneLiner, color }: { oneLiner: string; color: string }) {
  return (
    <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: 110, overflow: "hidden" }}>
      <span style={{ fontSize: oneLinerFontSize(oneLiner), fontWeight: 700, lineHeight: 1.4, color }}>{oneLiner}</span>
    </div>
  );
}

type ReflectionPanelProps = {
  offerSentence: string;
  improveSentence: string;
  boxBackground: string | null;
  boxBorder?: string;
  textColor: string;
  labelColor: string;
  dividerColor: string;
};

// 자기성찰은 이제 "내가 줄 수 있는 것"과 "내가 보완할 부분" 둘 다
// 한 블록에 보여준다(예전 버전은 둘 중 하나를 골라야 했다). 두 문장을
// 구분선 하나로 나눠 쌓는다. boxBackground가 null이면(C안처럼 이미
// 그 영역 전체가 색면으로 구분된 경우) 별도 박스 없이 투명하게 얹는다.
function ReflectionPanel({ offerSentence, improveSentence, boxBackground, boxBorder, textColor, labelColor, dividerColor }: ReflectionPanelProps) {
  if (!offerSentence && !improveSentence) return null;
  const rows: { label: string; sentence: string }[] = [];
  if (offerSentence) rows.push({ label: "내가 줄 수 있는 것", sentence: offerSentence });
  if (improveSentence) rows.push({ label: "내가 보완할 부분", sentence: improveSentence });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CONTENT_WIDTH,
        boxSizing: "border-box",
        borderRadius: boxBackground ? 32 : 0,
        backgroundColor: boxBackground ?? "transparent",
        border: boxBorder ? `2px solid ${boxBorder}` : "none",
        padding: boxBackground ? "40px 48px" : "0px",
        maxHeight: 480,
        overflow: "hidden",
        marginTop: 56,
      }}
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: index === 0 ? 0 : 28,
            marginTop: index === 0 ? 0 : 28,
            borderTop: index === 0 ? "none" : `2px solid ${dividerColor}`,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, color: labelColor, letterSpacing: "-0.3px", marginBottom: 12 }}>{row.label}</span>
          <span style={{ fontSize: reflectionFontSize(row.sentence), fontWeight: 700, lineHeight: 1.5, color: textColor }}>{row.sentence}</span>
        </div>
      ))}
    </div>
  );
}

function FooterText({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", width: CONTENT_WIDTH, justifyContent: "center", marginTop: "auto", paddingTop: 48 }}>
      <span style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: "-0.3px" }}>mapdecision.com</span>
    </div>
  );
}

// 위쪽 그룹(브랜드·타이틀·태그·한줄설명)은 실제 내용 높이만큼만 차지하고,
// 아래쪽 그룹(자기성찰·footer)은 flexGrow:1로 남는 공간을 전부 먹어서
// 캔버스 맨 아래까지 채운다. 예전에는 "자기성찰 영역이 시작되는 지점"을
// 픽셀 숫자로 미리 추측해서 색 띠 경계를 고정했는데, 실제 렌더 높이는
// 내용 길이에 따라 달라져서 추측이 자주 빗나갔다(자기성찰 글자가 보라
// 영역 위에 흰 글씨로 얹혀 안 보이는 사고가 실제로 났다). 이 구조는
// 추측 없이 항상 실제 내용 경계에 맞춰 색이 나뉜다.
function TopGroup({ children, backgroundColor }: { children: ReactNode; backgroundColor: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        boxSizing: "border-box",
        paddingTop: SAFE_ZONE,
        paddingLeft: SIDE_PADDING,
        paddingRight: SIDE_PADDING,
        backgroundColor,
      }}
    >
      {children}
    </div>
  );
}

function BottomGroup({ children, backgroundColor }: { children: ReactNode; backgroundColor: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        flexGrow: 1,
        boxSizing: "border-box",
        paddingLeft: SIDE_PADDING,
        paddingRight: SIDE_PADDING,
        paddingBottom: SAFE_ZONE,
        backgroundColor,
      }}
    >
      {children}
    </div>
  );
}

function buildContent(result: IdealTypeResult, theme: Exclude<CardTheme, "navy">) {
  const title = clampForSafety(result.title.trim(), 60);
  const oneLiner = clampForSafety(result.oneLiner.trim(), 120);
  const tags = (result.tags ?? []).slice(0, 4);
  const offerSentence = pickReflectionSentence(result.selfReflection.whatYouOffer);
  const improveSentence = pickReflectionSentence(result.selfReflection.whatToImprove);

  const rootStyle =
    theme === "colorBlock" ? {} : { backgroundImage: `linear-gradient(135deg, ${CARD_COLORS.value}, ${CARD_COLORS.feeling}, ${CARD_COLORS.action})` };

  const topBackground = theme === "colorBlock" ? CARD_COLORS.value : "transparent";
  const bottomBackground = theme === "colorBlock" ? CARD_COLORS.primary : "transparent";

  const titleColor = CARD_COLORS.primary;
  const tagFill = CARD_COLORS.primarySoftFill;
  const tagBorder = CARD_COLORS.primarySoftBorder;
  const oneLinerColor = CARD_COLORS.textSecondary;
  const reflectionBoxBackground = theme === "colorBlock" ? null : CARD_COLORS.primary;
  const reflectionDividerColor = theme === "purple" ? CARD_COLORS.foregroundFaint : CARD_COLORS.onDarkSoftBorder;
  const footerColor = theme === "purple" ? CARD_COLORS.textSecondary : CARD_COLORS.foregroundFaint;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: CARD_WIDTH, height: CARD_HEIGHT, fontFamily: "Pretendard", ...rootStyle }}>
      <TopGroup backgroundColor={topBackground}>
        <BrandMark color={titleColor} borderColor={titleColor} />
        <TitleText title={title} color={titleColor} />
        <TagGrid tags={tags} textColor={titleColor} fillColor={tagFill} borderColor={tagBorder} />
        <OneLinerText oneLiner={oneLiner} color={oneLinerColor} />
      </TopGroup>
      <BottomGroup backgroundColor={bottomBackground}>
        <ReflectionPanel
          offerSentence={offerSentence}
          improveSentence={improveSentence}
          boxBackground={reflectionBoxBackground}
          textColor={CARD_COLORS.primaryForeground}
          labelColor={CARD_COLORS.foregroundFaint}
          dividerColor={reflectionDividerColor}
        />
        <FooterText color={footerColor} />
      </BottomGroup>
    </div>
  );
}

// ── B안(navy) 확정 이후 전용 레이아웃 ──────────────────────────────────
// 위 buildContent()의 내용 기반(auto-height) 레이아웃은 짧은 결과에서
// 아래 40%가 텅 비어 보이는 문제가 있었다. B안은 오너가 준 정확한
// 픽셀 예산(0~250 여백 / 250~330 브랜드 / 330~780 타이틀 / 780~1060
// 태그 / 1060~1160 한줄설명 / 1160~1670 자기성찰 / 1670~1920 footer+
// 하단 여백)을 그대로 6개의 고정 높이 구역으로 만든다 — 내용이 짧아도
// 각 구역이 항상 자기 자리를 지킨다.
const NAVY_ZONE = {
  brand: 80,
  title: 450,
  tags: 280,
  oneLiner: 100,
  reflection: 510,
  footer: 250,
} as const;

// 타이틀은 이 작업의 핵심이라 숫자를 그대로 박아넣는다. 실제 프로덕션
// 타이틀은 대부분 10자 안팎이라 짧은 쪽(100px, 2줄 이내)에 최적화하고,
// 길어질수록만 단계적으로 줄인다.
function navyTitleFontSize(title: string): number {
  return pickBySteps(
    title.length,
    [
      { max: 18, size: 100 },
      { max: 26, size: 88 },
      { max: 38, size: 76 },
      { max: 52, size: 64 },
    ],
    54,
  );
}

// 자기성찰 블록은 밝은 면으로 뒤집혀서 본문이 36px 이상이어야 축소해도
// 읽힌다는 요구를 만족한다 — 짧은 문장(실제 데이터 대다수)은 38px,
// 아주 긴 예외 케이스에서만 그 아래로 내려간다.
function navyReflectionFontSize(sentence: string): number {
  return pickBySteps(
    sentence.length,
    [
      { max: 45, size: 38 },
      { max: 65, size: 36 },
      { max: 85, size: 32 },
    ],
    28,
  );
}

function NavyZone({ height, children, style }: { height: number; children: ReactNode; style?: Record<string, unknown> }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
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

function NavyBrand() {
  return (
    <NavyZone height={NAVY_ZONE.brand}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, alignItems: "center" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: 12,
            border: `2px solid ${CARD_COLORS.primaryForeground}`,
            color: CARD_COLORS.primaryForeground,
            fontSize: 22,
            fontWeight: 900,
            marginRight: 14,
          }}
        >
          M
        </span>
        <span style={{ fontSize: 32, fontWeight: 800, color: CARD_COLORS.primaryForeground, letterSpacing: "-0.5px" }}>MAP Decision</span>
      </div>
    </NavyZone>
  );
}

function NavyTitle({ title }: { title: string }) {
  return (
    <NavyZone height={NAVY_ZONE.title}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: NAVY_ZONE.title, overflow: "hidden" }}>
        <span
          style={{
            fontSize: navyTitleFontSize(title),
            fontWeight: 900,
            lineHeight: 1.2,
            color: CARD_COLORS.primaryForeground,
            letterSpacing: "-2px",
          }}
        >
          {title}
        </span>
      </div>
    </NavyZone>
  );
}

// 태그를 데이터 표처럼 보이게 하던 테두리·칸 구분선을 없애고, 배경만
// 있는 알약(pill)으로 바꿨다 — 2개씩 정확히 두 줄로 쌓는다(줄바꿈에
// 기대면 글자 길이에 따라 1개나 3개로 흐트러질 수 있어 행을 직접
// 나눈다).
function NavyTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  return (
    <NavyZone height={NAVY_ZONE.tags}>
      <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH }}>
        {rows.map((row, rowIndex) => (
          <div key={row.join("-")} style={{ display: "flex", justifyContent: "center", marginTop: rowIndex === 0 ? 0 : 24 }}>
            {row.map((tag, tagIndex) => (
              <span
                key={tag}
                style={{
                  display: "flex",
                  backgroundColor: CARD_COLORS.value,
                  color: CARD_COLORS.primary,
                  borderRadius: 999,
                  padding: "26px 40px",
                  fontSize: 48,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  marginLeft: tagIndex === 0 ? 0 : 24,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ))}
      </div>
    </NavyZone>
  );
}

function NavyOneLiner({ oneLiner }: { oneLiner: string }) {
  return (
    <NavyZone height={NAVY_ZONE.oneLiner}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: NAVY_ZONE.oneLiner, overflow: "hidden" }}>
        <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.4, color: CARD_COLORS.foregroundSoft }}>{oneLiner}</span>
      </div>
    </NavyZone>
  );
}

// B안의 유일한 약점이었던 부분 — 자기성찰이 배경과 같은 네이비라 안
// 보였다. 이 구역만 크림색(글로벌 배경색과 동일한 #fbf7ef)으로 뒤집어
// 어두운 카드 한가운데 밝은 띠가 지나가게 만든다. 캔버스 양 끝까지
// 닿는 색면이라 "이 블록만 다르다"는 게 분명히 보인다.
function NavyReflection({ offerSentence, improveSentence }: { offerSentence: string; improveSentence: string }) {
  const rows: { label: string; sentence: string }[] = [];
  if (offerSentence) rows.push({ label: "내가 줄 수 있는 것", sentence: offerSentence });
  if (improveSentence) rows.push({ label: "내가 보완할 부분", sentence: improveSentence });
  if (rows.length === 0) return <div style={{ display: "flex", width: CARD_WIDTH, height: NAVY_ZONE.reflection, flexShrink: 0 }} />;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        height: NAVY_ZONE.reflection,
        flexShrink: 0,
        boxSizing: "border-box",
        paddingLeft: SIDE_PADDING,
        paddingRight: SIDE_PADDING,
        justifyContent: "center",
        backgroundColor: CARD_COLORS.background,
        overflow: "hidden",
      }}
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            flexDirection: "column",
            width: CONTENT_WIDTH,
            paddingTop: index === 0 ? 0 : 32,
            marginTop: index === 0 ? 0 : 32,
            borderTop: index === 0 ? "none" : `2px solid ${CARD_COLORS.primarySoftBorder}`,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 700, color: CARD_COLORS.textSecondary, letterSpacing: "-0.3px", marginBottom: 14 }}>{row.label}</span>
          <span style={{ fontSize: navyReflectionFontSize(row.sentence), fontWeight: 700, lineHeight: 1.5, color: CARD_COLORS.primary }}>{row.sentence}</span>
        </div>
      ))}
    </div>
  );
}

function NavyFooter() {
  return (
    <NavyZone height={NAVY_ZONE.footer} style={{ justifyContent: "flex-start", paddingTop: 40 }}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: CARD_COLORS.foregroundFaint, letterSpacing: "-0.3px" }}>mapdecision.com</span>
      </div>
    </NavyZone>
  );
}

function buildNavyStoryCard(result: IdealTypeResult) {
  const title = clampForSafety(result.title.trim(), 60);
  const oneLiner = clampForSafety(result.oneLiner.trim(), 120);
  const tags = (result.tags ?? []).slice(0, 4);
  const offerSentence = pickReflectionSentence(result.selfReflection.whatYouOffer);
  const improveSentence = pickReflectionSentence(result.selfReflection.whatToImprove);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: CARD_COLORS.primary,
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex", width: CARD_WIDTH, height: SAFE_ZONE, flexShrink: 0 }} />
      <NavyBrand />
      <NavyTitle title={title} />
      <NavyTags tags={tags} />
      <NavyOneLiner oneLiner={oneLiner} />
      <NavyReflection offerSentence={offerSentence} improveSentence={improveSentence} />
      <NavyFooter />
    </div>
  );
}

export function buildIdealTypeCardElement(result: IdealTypeResult, theme: CardTheme) {
  if (theme === "navy") return buildNavyStoryCard(result);
  return buildContent(result, theme);
}

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
import sharp from "sharp";
import { CARD_COLORS } from "./ideal-type-card-colors";
import type { IdealTypeResult } from "../types";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
const SAFE_ZONE = 250;
const SIDE_PADDING = 72;
const CONTENT_WIDTH = CARD_WIDTH - SIDE_PADDING * 2;

const FONT_DIR = path.join(process.cwd(), "assets/fonts/pretendard-static");
const NOTO_SERIF_KR_DIR = path.join(process.cwd(), "assets/fonts/noto-serif-kr");
const PAPER_TEXTURE_PATH = path.join(process.cwd(), "assets/textures/paper-noise.png");

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

// 초대장 컨셉(invitation 테마) 전용 세리프. google/fonts 저장소의 가변
// 폰트를 scripts/subset-noto-serif-kr.py로 400/700 두 굵기만 정적
// 인스턴스로 뽑고, KS X 1001 상용 한글 2,350자 + 라틴/문장부호 범위로
// 서브셋한 파일이다(9.4MB → 약 2.4MB). AI가 쓰는 문장은 이론상 이
// 2,350자 밖의 희귀 음절을 쓸 수도 있어, fontFamily에 Pretendard를
// 폴백으로 같이 둔다(아래 목록에 Pretendard도 포함) — 세리프에 없는
// 글자만 Pretendard로 자동 대체되고 두부(tofu) 빈 박스는 나오지 않는다.
// 서버에서만 래스터화에 쓰이고 클라이언트로 내려가지 않아 용량 제약이
// 없다.
//
// 모듈 스코프에서 한 번만 읽어 웜 인스턴스에서 재사용한다 — 실측
// 결과 readFileSync 자체(폰트 4개 파일)는 10ms 안팎으로 빨랐지만,
// 캐싱을 적용한 뒤 satori 렌더링 시간이 요청당 평균 약 1.0초→0.7초로
// 줄었다(총 처리 시간 기준 약 1.4초→1.0초). 정확한 메커니즘은 satori
// 내부 구현이라 알 수 없지만(버퍼 재사용이 V8/Node 메모리 상태에
// 영향을 줬을 수 있다), 실측으로 확인된 효과라 유지한다.
let invitationFontsCache: CardFont[] | undefined;
export function loadInvitationFonts(): CardFont[] {
  if (!invitationFontsCache) {
    invitationFontsCache = [
      { data: readFileSync(path.join(NOTO_SERIF_KR_DIR, "NotoSerifKR-Regular.ttf")), name: "Noto Serif KR", weight: 400, style: "normal" as const },
      { data: readFileSync(path.join(NOTO_SERIF_KR_DIR, "NotoSerifKR-Bold.ttf")), name: "Noto Serif KR", weight: 700, style: "normal" as const },
      // 세리프 서브셋(KS X 1001 2,350자) 밖의 글자를 위한 폴백. 정적
      // 굵기가 Medium(500)부터라 400 대신 가장 가까운 Medium을 쓴다 —
      // 드물게만 쓰이는 폴백 경로라 이 정도 굵기 차이는 감수한다.
      { data: readFileSync(path.join(FONT_DIR, "Pretendard-Medium.otf")), name: "Pretendard", weight: 400, style: "normal" as const },
      { data: readFileSync(path.join(FONT_DIR, "Pretendard-Bold.otf")), name: "Pretendard", weight: 700, style: "normal" as const },
    ];
  }
  return invitationFontsCache;
}

// scripts/generate-paper-texture.mjs가 미리 만들어둔 48x48 타일(약
// 1KB)을 data URI로 감싼다. 요청마다 디스크에서 다시 읽지만 파일이
// 작아 비용은 무시할 만하고, 모듈이 콜드스타트 중 여러 번 재사용되면
// 이 캐시가 그 안에서는 재사용된다.
let paperTextureDataUri: string | undefined;
function loadPaperTextureDataUri(): string {
  if (!paperTextureDataUri) {
    const bytes = readFileSync(PAPER_TEXTURE_PATH);
    paperTextureDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  }
  return paperTextureDataUri;
}

// satori(next/og)가 직접 만드는 PNG는 압축률이 낮다 — 특히 종이
// 질감처럼 픽셀마다 값이 미세하게 다른 영역이 섞이면 파일 크기가 몇
// 배로 뛴다(실측: 텍스처 추가 직후 700KB대였던 카드가, 아래처럼 sharp로
// 한 번 더 인코딩하면 160KB대로 줄었다 — 같은 그림, 다른 압축기 차이일
// 뿐 화질 손실은 눈에 띄지 않는다). 그래서 라우트가 satori 결과를 그대로
// 내보내지 않고 이 함수로 한 번 더 압축한다.
export async function optimizeCardPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).png({ compressionLevel: 9, palette: true }).toBuffer();
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

export type CardTheme = "purple" | "navy" | "colorBlock" | "invitation";

// invitation 테마는 다른 테마(9:16 인스타 스토리 규격)와 비율이 다르다
// (4:5) — 라우트가 ImageResponse 크기를 테마에 맞게 정할 수 있게 노출한다.
export const INVITATION_CARD_WIDTH = CARD_WIDTH;
export const INVITATION_CARD_HEIGHT = 1350;
export function getCardDimensions(theme: CardTheme): { width: number; height: number } {
  return theme === "invitation"
    ? { width: INVITATION_CARD_WIDTH, height: INVITATION_CARD_HEIGHT }
    : { width: CARD_WIDTH, height: CARD_HEIGHT };
}

// 자기성찰 문장에서 첫 문장만 뽑는다 — 길이 컷은 여기서 하지 않는다.
// 실제로 보여줄 수 있는지(폰트를 줄여서 들어가는지, 그래도 안 들어가면
// 뺄지)는 아래 fitReflectionSentence()가 렌더 단계에서 실제 줄바꿈을
// 추정해 판단한다.
function pickReflectionSentence(source: string[]): string {
  const first = source[0];
  if (!first) return "";
  return firstSentence(first);
}

// #99: satori(next/og ImageResponse)는 실제 브라우저와 달리
// overflow:hidden + 고정 height를 안정적으로 지키지 않는다 — 내용이
// 박스보다 크면 조용히 박스를 뚫고 자라며, 그 결과 카드 전체 레이아웃이
// 밀려서 맨 아래 footer가 통째로 사라지거나 문장 뒷부분이 캔버스
// 경계에서 마침표도 말줄임표도 없이 그대로 잘린다. 직접 재현해서
// 확인했다(/dev/card-preview?variant=toolong&theme=navy).
//
// 처음엔 "글자 수가 N자 넘으면 통째로 뺀다"로 막았는데, 실제 프로덕션
// 문장(마침표 있고 92자)이 그 기준에 걸려 정상 문장까지 빠지는
// 부작용이 있었다(#99 후속 피드백). 글자 수 자체는 위험 신호가
// 아니다 — 진짜 위험한 건 "실제로 몇 줄로 줄바꿈되어 몇 px를
// 차지하는가"다. 그래서 아래는 폰트 크기별로 줄바꿈 줄 수를 추정해
// 실제로 들어갈 것 같은 가장 큰 폰트를 고르고, 가장 작은 폰트(28px)
// 로도 못 들어갈 때만 문장을 뺀다.
//
// charsPerLine 계산에 쓰는 0.73은 실측 기반 근사치다 — Pretendard
// Bold 한글이 CONTENT_WIDTH(936px) 안에서 실제로 몇 글자씩
// 줄바꿈되는지를 이미 검증된 두 케이스(80자 문장이 32px에서 2줄,
// 55자 문장이 36px에서 2줄로 렌더된 것)로 역산해서 맞췄다. 정확한
// 폰트 메트릭 API가 없는 satori 환경이라 근사치이지만, 실측치와
// 어긋나지 않는 선에서 보수적으로(줄 수를 약간 넉넉하게 잡는 쪽으로)
// 잡아뒀다 — 실제보다 줄이 하나 더 필요하다고 보는 쪽이 폰트를
// 필요 이상 줄이는 손해는 있어도 카드 틀을 뚫는 사고보다는 안전하다.
// 자기성찰뿐 아니라 한줄설명(oneLiner)에도 같은 계산을 쓴다 — 같은
// 폰트(Pretendard Bold)를 쓰는 한 이 비율은 문맥과 무관하게 성립한다.
const CARD_TEXT_CHAR_WIDTH_RATIO = 0.73;
const REFLECTION_LINE_HEIGHT = 1.5;

function estimateWrappedHeight(text: string, fontSize: number, lineHeight: number = REFLECTION_LINE_HEIGHT): number {
  const charsPerLine = Math.max(1, Math.floor(CONTENT_WIDTH / (fontSize * CARD_TEXT_CHAR_WIDTH_RATIO)));
  const lines = Math.ceil(text.length / charsPerLine);
  return lines * fontSize * lineHeight;
}

type FittedReflection = { text: string; fontSize: number };

// fontSizes는 큰 것부터 순서대로 — 가장 먼저 예산 안에 들어가는(가장
// 큰) 폰트를 쓴다. 라벨("내가 줄 수 있는 것" 등)까지 포함한 한 행
// 전체 높이가 budget을 넘지 않아야 통과. 끝까지 다 시도해도 못
// 들어가면 null을 돌려줘서 이 항목을 화면에서 뺀다.
function fitReflectionSentence(sentence: string, fontSizes: number[], labelHeight: number, budget: number): FittedReflection | null {
  if (!sentence) return null;
  for (const fontSize of fontSizes) {
    if (labelHeight + estimateWrappedHeight(sentence, fontSize) <= budget) {
      return { text: sentence, fontSize };
    }
  }
  return null;
}

// #99 후속 확인: 한줄설명(oneLiner)도 같은 위험이 있었다 — Navy 카드의
// 한줄설명 구역(NAVY_ZONE.oneLiner=100px)이 폰트 크기 고정(34px)이라,
// 80자 안팎만 돼도 다음 구역(자기성찰) 위로 텍스트가 넘쳐서 마지막
// 줄이 마침표 없이 잘렸다(직접 재현: /dev/card-preview?variant=
// extremeoneliner&theme=navy). 자기성찰과 달리 한줄설명은 카드에
// 항상 있어야 하는 필수 요소라 "안 들어가면 뺀다"를 쓸 수 없다 —
// 가장 작은 폰트로도 못 들어가는 극단적인 경우에만 단어 경계에서
// 잘라 그 폰트에 맞춘다(clampForSafety와 달리 말줄임표를 붙인다 —
// 한줄설명은 원래도 "요약"이라 짧아져도 어색하지 않다).
function fitOneLiner(text: string, fontSizes: number[], budget: number, lineHeight: number): FittedReflection {
  for (const fontSize of fontSizes) {
    if (estimateWrappedHeight(text, fontSize, lineHeight) <= budget) {
      return { text, fontSize };
    }
  }
  const smallest = fontSizes[fontSizes.length - 1];
  const charsPerLine = Math.max(1, Math.floor(CONTENT_WIDTH / (smallest * CARD_TEXT_CHAR_WIDTH_RATIO)));
  const maxLines = Math.max(1, Math.floor(budget / (smallest * lineHeight)));
  return { text: clampForSafety(text, charsPerLine * maxLines), fontSize: smallest };
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
      <span style={{ fontSize: titleFontSize(title), fontWeight: 900, lineHeight: 1.15, color, letterSpacing: "-1.5px", wordBreak: "keep-all" }}>{title}</span>
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

// 라벨(fontSize 22, 기본 줄간격 ~1.2배) + marginBottom 12의 대략적인
// 높이. 한 행의 예산(REFLECTION_PANEL_ROW_BUDGET)을 계산할 때 쓴다.
const REFLECTION_PANEL_LABEL_HEIGHT = 38;
// maxHeight(480)에서 두 행 사이 구분선 여백(28+28+2=58)과 박스 자체
// 패딩(위아래 80, boxBackground가 있을 때 기준 — 없을 때가 더
// 여유로우니 있을 때 기준으로 보수적으로 잡는다)을 뺀 나머지를 두
// 행에 나눠 배정한다.
const REFLECTION_PANEL_ROW_BUDGET = 170;
const REFLECTION_PANEL_FONT_SIZES = [34, 30, 27, 24];

// 자기성찰은 이제 "내가 줄 수 있는 것"과 "내가 보완할 부분" 둘 다
// 한 블록에 보여준다(예전 버전은 둘 중 하나를 골라야 했다). 두 문장을
// 구분선 하나로 나눠 쌓는다. boxBackground가 null이면(C안처럼 이미
// 그 영역 전체가 색면으로 구분된 경우) 별도 박스 없이 투명하게 얹는다.
function ReflectionPanel({ offerSentence, improveSentence, boxBackground, boxBorder, textColor, labelColor, dividerColor }: ReflectionPanelProps) {
  const offer = fitReflectionSentence(offerSentence, REFLECTION_PANEL_FONT_SIZES, REFLECTION_PANEL_LABEL_HEIGHT, REFLECTION_PANEL_ROW_BUDGET);
  const improve = fitReflectionSentence(improveSentence, REFLECTION_PANEL_FONT_SIZES, REFLECTION_PANEL_LABEL_HEIGHT, REFLECTION_PANEL_ROW_BUDGET);
  if (!offer && !improve) return null;
  const rows: { label: string; text: string; fontSize: number }[] = [];
  if (offer) rows.push({ label: "내가 줄 수 있는 것", ...offer });
  if (improve) rows.push({ label: "내가 보완할 부분", ...improve });

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
          <span style={{ fontSize: row.fontSize, fontWeight: 700, lineHeight: 1.5, color: textColor }}>{row.text}</span>
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
// 짧은 타이틀(실제 프로덕션 대다수)이 450px 구역을 한 줄만 쓰고
// 위아래를 비워서, 오히려 긴 타이틀 카드가 더 꽉 차 보이는 역전이
// 있었다. 그래서 짧을수록 폰트를 더 크게 잡아 2줄로 자연스럽게
// 나뉘며 구역을 채우도록 뒤집었다 — 목표는 "짧은 타이틀이 가장
// 강력해 보이는 것"이다.
function navyTitleFontSize(title: string): number {
  return pickBySteps(
    title.length,
    [
      { max: 12, size: 140 },
      { max: 20, size: 110 },
      { max: 26, size: 88 },
      { max: 38, size: 76 },
      { max: 52, size: 64 },
    ],
    54,
  );
}

// 자기성찰 블록은 밝은 면으로 뒤집혀서 본문이 커야 축소해도 읽힌다는
// 요구가 있다 — 짧은 문장(실제 데이터 대다수)은 38px로 크게, 길어질
// 때만 36→32→28 순으로 줄인다. 실제로 들어가는지는
// fitReflectionSentence()가 줄바꿈을 추정해서 판단한다(#99).
const NAVY_REFLECTION_FONT_SIZES = [38, 36, 32, 28];
// 라벨(fontSize 26, 기본 줄간격 ~1.2배 + marginBottom 14)의 대략적인
// 높이. NAVY_ZONE.reflection(510px)에서 두 행 사이 구분선 여백
// (32+32+2=66)과 라벨 두 개(45×2=90)를 뺀 나머지(354px)를 두 행에
// 나눠 배정하되, 실측 여유를 두기 위해 조금 더 빡빡하게(210) 잡는다
// — 두 행이 동시에 이 예산을 꽉 채워도 354px 안에 들어온다.
const NAVY_REFLECTION_LABEL_HEIGHT = 45;
const NAVY_REFLECTION_ROW_BUDGET = 210;

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
            wordBreak: "keep-all",
          }}
        >
          {title}
        </span>
      </div>
    </NavyZone>
  );
}

// #99 후속 확인: 태그도 같은 위험이 있었다 — pill(배경 있는 알약)이
// 텍스트+padding만큼 자기 크기를 갖고, 부모는 그 크기를 줄이거나
// 줄바꿈시키지 않는다. 태그 이름이 길면(예: "#장거리연애도가능형")
// 두 pill의 폭 합이 CONTENT_WIDTH를 넘어 카드 옆 여백 밖으로 pill이
// 삐져나오거나 서로 겹쳤다(직접 재현: /dev/card-preview?variant=
// extremetags&theme=navy). 태그는 자기성찰처럼 "빼는" 선택지가
// 없다(4개가 한 세트라 하나만 빠지면 더 어색함) — 폰트를 계속
// 줄여서라도 반드시 한 줄 안에 들어가게 한다.
//
// fontWeight:900(Black)은 자기성찰 문장에 쓰는 700(Bold)보다 글자가
// 눈에 띄게 굵고 넓어서, 같은 0.73 비율을 쓰면 실제보다 좁게 계산돼
// 위험을 놓친다. 0.92로 더 넉넉하게 잡아 재현 테스트로 실측
// 보정했다.
const NAVY_TAG_CHAR_WIDTH_RATIO = 0.92;
const NAVY_TAG_PADDING_X = 40;
const NAVY_TAG_GAP = 24;
const NAVY_TAG_FONT_SIZES = [48, 46, 42, 38, 34, 30, 26, 22];

function fitNavyTagFontSize(tags: string[]): number {
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  for (const fontSize of NAVY_TAG_FONT_SIZES) {
    const fits = rows.every((row) => {
      const textWidth = row.reduce((sum, tag) => sum + tag.length * fontSize * NAVY_TAG_CHAR_WIDTH_RATIO, 0);
      const paddingWidth = row.length * NAVY_TAG_PADDING_X * 2;
      const gapWidth = row.length > 1 ? NAVY_TAG_GAP : 0;
      return textWidth + paddingWidth + gapWidth <= CONTENT_WIDTH;
    });
    if (fits) return fontSize;
  }
  return NAVY_TAG_FONT_SIZES[NAVY_TAG_FONT_SIZES.length - 1];
}

// 태그를 데이터 표처럼 보이게 하던 테두리·칸 구분선을 없애고, 배경만
// 있는 알약(pill)으로 바꿨다 — 2개씩 정확히 두 줄로 쌓는다(줄바꿈에
// 기대면 글자 길이에 따라 1개나 3개로 흐트러질 수 있어 행을 직접
// 나눈다).
function NavyTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  const fontSize = fitNavyTagFontSize(tags);
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
                  fontSize,
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

// NAVY_ZONE.oneLiner(100px) 예산으로 34px부터 시도해서 줄여나간다.
// 여유(10px)를 조금 빼서 잡는다 — justifyContent:center로 세로
// 중앙 정렬되니 약간의 여백이 있어야 위아래로 잘리지 않는다.
const NAVY_ONELINER_FONT_SIZES = [34, 30, 26, 22];
const NAVY_ONELINER_BUDGET = NAVY_ZONE.oneLiner - 10;
const NAVY_ONELINER_LINE_HEIGHT = 1.4;

function NavyOneLiner({ oneLiner }: { oneLiner: string }) {
  const fitted = fitOneLiner(oneLiner, NAVY_ONELINER_FONT_SIZES, NAVY_ONELINER_BUDGET, NAVY_ONELINER_LINE_HEIGHT);
  return (
    <NavyZone height={NAVY_ZONE.oneLiner}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: NAVY_ZONE.oneLiner, overflow: "hidden" }}>
        <span style={{ fontSize: fitted.fontSize, fontWeight: 700, lineHeight: NAVY_ONELINER_LINE_HEIGHT, color: CARD_COLORS.foregroundSoft }}>{fitted.text}</span>
      </div>
    </NavyZone>
  );
}

// B안의 유일한 약점이었던 부분 — 자기성찰이 배경과 같은 네이비라 안
// 보였다. 이 구역만 크림색(글로벌 배경색과 동일한 #fbf7ef)으로 뒤집어
// 어두운 카드 한가운데 밝은 띠가 지나가게 만든다. 캔버스 양 끝까지
// 닿는 색면이라 "이 블록만 다르다"는 게 분명히 보인다.
function NavyReflection({ offerSentence, improveSentence }: { offerSentence: string; improveSentence: string }) {
  const offer = fitReflectionSentence(offerSentence, NAVY_REFLECTION_FONT_SIZES, NAVY_REFLECTION_LABEL_HEIGHT, NAVY_REFLECTION_ROW_BUDGET);
  const improve = fitReflectionSentence(improveSentence, NAVY_REFLECTION_FONT_SIZES, NAVY_REFLECTION_LABEL_HEIGHT, NAVY_REFLECTION_ROW_BUDGET);
  const rows: { label: string; text: string; fontSize: number }[] = [];
  if (offer) rows.push({ label: "내가 줄 수 있는 것", ...offer });
  if (improve) rows.push({ label: "내가 보완할 부분", ...improve });
  // 둘 다 못 들어가서 빈 경우, 크림색 띠만 덩그러니 남으면 오히려 더
  // 어색하다(카드 존재 이유인 블록이 텅 빈 색면으로 보임) — 배경색을
  // 주지 않아 카드 전체 배경(네이비)이 그대로 이어지게 해서, 이
  // 구간이 원래 없었던 것처럼 자연스럽게 지나가게 한다.
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
          <span style={{ fontSize: row.fontSize, fontWeight: 700, lineHeight: 1.5, color: CARD_COLORS.primary }}>{row.text}</span>
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

// ── 초대장 컨셉(invitation) 전용 레이아웃 ──────────────────────────────
// /r/{id}에서 카드가 컨테이너 폭의 80%로만 표시되다 보니(약 3.6배
// 축소) 6개 구역(브랜드·타이틀·태그·한줄설명·자기성찰·footer)에 걸쳐
// 나눠 담던 원래 구성은 실제 화면에서 본문이 아예 안 읽히는 문제가
// 있었다 — 이미지 로드 실패 시의 텍스트 폴백보다도 읽기 나쁜
// 역전이었다. 그래서 이 카드는 "본문 정리"가 아니라 "한눈에 훅 들어오는
// 첫인상 카드" 하나로 범위를 좁힌다: 타이틀 + 태그 4개 + 한줄설명만
// 남기고 자기성찰·footer 텍스트는 뺀다. 비율도 인스타 스토리(9:16)
// 대신 카톡 공유에 더 맞는 4:5로 바꿨다(INVITATION_CARD_HEIGHT).
// 남는 공간은 전부 타이틀·태그를 키우는 데 쓴다 — 태그 4개가
// "줄어든 상태에서도" 또렷이 읽히는 게 기준이다.
// topicLabel(36)은 title에서 그만큼(610→574) 떼어와 마련했다 — topMargin/
// bottomMargin은 InvitationFrame(테두리, top/bottom 40px 안쪽)과의 여백
// 확보용이라 건드리면 내용이 테두리선과 겹칠 위험이 있어 그대로 뒀다.
// title 574px는 실제 타이틀 최대 크기(130px, 2줄)*1.25 기준으로도 넉넉해
// 줄어든 만큼의 손해가 없다.
const INVITATION_ZONE = { topMargin: 60, topicLabel: 36, title: 574, tags: 350, oneLiner: 200, footer: 70, bottomMargin: 60 } as const;

function invitationTitleFontSize(title: string): number {
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

// navy의 fitNavyTagFontSize()와 같은 계산 — 2줄×2칸 배치 안에서 실제로
// 들어가는 가장 큰 폰트를 폭 기준으로 고른다.
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

const INVITATION_TAG_CHAR_WIDTH_RATIO = 0.92;
const INVITATION_TAG = { sizes: [72, 68, 64, 58, 52, 46, 40, 34], paddingX: 32, gap: 20 };

function InvitationZone({ height, children, style }: { height: number; children: ReactNode; style?: Record<string, unknown> }) {
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

// 봉랍(왁스 실) 마크 — 예전에는 카드 위쪽에 "MAP Decision" 글자와 함께
// 가로로 놓여 있었는데, 상단부는 스크린샷 시선이 타이틀로 바로 가는
// 자리라 잘 눈에 띄지 않았다. 절대 위치로 하단 좌측 모서리에 단독으로
// 배치하고 글자(워드마크)는 뺀다 — 도메인 표기(InvitationFooter)는
// 하단 중앙에 별도로 있어서 서로 겹치지 않는다. 카드가 /r/{id}에서
// 컨테이너 폭의 80%로 축소되므로(원본 대비 약 3.6배 축소), 축소된
// 상태에서도 보이는 크기(72px)를 유지한다.
function InvitationSeal() {
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

// 이상형·나소개 두 카드가 태그 18개를 공유하면서(교차 궁합용) 겉모습이
// 완전히 같아져, 카톡으로 받은 사람이 "이 친구가 좋아하는 타입"인지
// "이 친구 자체"인지 구분할 수 없어졌다. 타이틀 위 작은 킥커 한 줄로
// 주제를 밝힌다 — 타이틀(50px~)·태그(34px~)보다 항상 작은 고정 30px로
// 잡아 위계를 침범하지 않는다. 색도 새로 만들지 않고 기존 잉크 네이비
// 계열 중 가장 옅은 textSecondary를 재사용한다.
function InvitationTopicLabel({ label, height }: { label: string; height: number }) {
  return (
    <InvitationZone height={height}>
      <div style={{ display: "flex", width: CONTENT_WIDTH }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.06em", color: CARD_COLORS.textSecondary }}>{label}</span>
      </div>
    </InvitationZone>
  );
}

function InvitationTitle({ title, height }: { title: string; height: number }) {
  return (
    <InvitationZone height={height}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: height, overflow: "hidden" }}>
        <span
          style={{
            fontSize: invitationTitleFontSize(title),
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
    </InvitationZone>
  );
}

function InvitationTags({ tags, height }: { tags: string[]; height: number }) {
  if (tags.length === 0) return null;
  const fontSize = fitPillFontSize(tags, INVITATION_TAG.sizes, INVITATION_TAG.paddingX, INVITATION_TAG.gap, INVITATION_TAG_CHAR_WIDTH_RATIO);
  const rows: string[][] = [];
  for (let i = 0; i < tags.length; i += 2) rows.push(tags.slice(i, i + 2));
  return (
    <InvitationZone height={height}>
      <div style={{ display: "flex", flexDirection: "column", width: CONTENT_WIDTH, maxHeight: height, overflow: "hidden" }}>
        {rows.map((row, rowIndex) => (
          <div key={row.join("-")} style={{ display: "flex", justifyContent: "center", marginTop: rowIndex === 0 ? 0 : INVITATION_TAG.gap }}>
            {row.map((tag, tagIndex) => (
              <span
                key={tag}
                style={{
                  display: "flex",
                  backgroundColor: CARD_COLORS.invitationTagFill,
                  color: CARD_COLORS.primary,
                  borderRadius: 999,
                  padding: `${INVITATION_TAG.paddingX * 0.6}px ${INVITATION_TAG.paddingX}px`,
                  fontSize,
                  fontWeight: 700,
                  letterSpacing: "-0.5px",
                  marginLeft: tagIndex === 0 ? 0 : INVITATION_TAG.gap,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ))}
      </div>
    </InvitationZone>
  );
}

// 375px로 축소됐을 때 이전 색(textSecondary, #465672)이 흐려서 잘
// 안 읽힌다는 피드백으로 본문 잉크(CARD_COLORS.inkStrong)에 더 가깝게
// 진하게 바꾸고 크기도 소폭(약 10%) 키웠다. 다만 타이틀(62~130px)·
// 태그(34~72px)보다는 항상 작게 유지해 위계는 그대로 지킨다.
const INVITATION_ONELINER_FONT_SIZES = [44, 40, 36, 30];
const INVITATION_ONELINER_BUDGET = INVITATION_ZONE.oneLiner - 10;
const INVITATION_ONELINER_LINE_HEIGHT = 1.4;

function InvitationOneLiner({ oneLiner }: { oneLiner: string }) {
  const fitted = fitOneLiner(oneLiner, INVITATION_ONELINER_FONT_SIZES, INVITATION_ONELINER_BUDGET, INVITATION_ONELINER_LINE_HEIGHT);
  return (
    <InvitationZone height={INVITATION_ZONE.oneLiner}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, maxHeight: INVITATION_ZONE.oneLiner, overflow: "hidden" }}>
        <span style={{ fontSize: fitted.fontSize, fontWeight: 400, lineHeight: INVITATION_ONELINER_LINE_HEIGHT, color: CARD_COLORS.inkStrong }}>
          {fitted.text}
        </span>
      </div>
    </InvitationZone>
  );
}

// 카드 하단 중앙 도메인 표기 — 본문 3블록을 뺄 때 같이 사라졌던 것을
// 되살렸다. 이 카드는 인스타 스크린샷으로 퍼지는 게 목적이라 도메인이
// 안 읽히면 유입 경로가 끊기므로, 375px로 축소된 상태에서도 읽히는
// 크기(28px, NavyFooter와 동일한 기준)로 잡았다. 색은 잉크 네이비
// 계열이되 본문(InvitationOneLiner, inkStrong)보다 옅은 textSecondary를
// 써서 본문보다 시선이 덜 가게 한다.
function InvitationFooter({ height }: { height: number }) {
  return (
    <InvitationZone height={height}>
      <div style={{ display: "flex", width: CONTENT_WIDTH, justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: CARD_COLORS.textSecondary, letterSpacing: "0.5px" }}>mapdecision.com</span>
      </div>
    </InvitationZone>
  );
}

// 카드 전체에 허용된 테두리 선 1개 — 캔버스 가장자리에서 안쪽으로
// 들여서 "종이 카드 자체의 가장자리"처럼 보이게 한다. 절대 위치로
// 콘텐츠 위에 얹되 배경이 없어(border만 있음) 아래 내용을 가리지
// 않는다.
function InvitationFrame() {
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

// 타이틀 + 태그 4개 + 한줄설명 + 하단 도메인만 남긴다 — 자기성찰
// 텍스트는 뺐다(위 "본문 정리" 주석 참고). 봉랍은 절대 위치라 In-flow
// 구역을 차지하지 않는다. 아래 In-flow 구역(topMargin/title/tags/
// oneLiner/footer/bottomMargin)의 높이 합이 INVITATION_CARD_HEIGHT
// (1350)와 정확히 맞도록 INVITATION_ZONE에서 배정한다.
function buildInvitationCard(result: IdealTypeResult) {
  const title = clampForSafety(result.title.trim(), 60);
  const oneLiner = clampForSafety(result.oneLiner.trim(), 120);
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
        // ★실측 확인: 세리프를 타이틀에만 한정해도(태그·한줄설명은
        // Pretendard) 렌더링 시간이 거의 줄지 않았다(타이틀만 세리프로
        // 써도 전체 세리프 때와 동일하게 ~1.0초) — 병목이 "세리프로 그리는
        // 글자 수"가 아니라 "Noto Serif KR 폰트를 satori에 포함시키는
        // 것 자체"의 고정 비용이었기 때문으로 보인다. 그래서 시간상
        // 이득이 없는 폰트 혼용 대신, 카드 전체를 세리프로 통일하는 쪽을
        // 유지한다(디자인 일관성을 공짜로 얻는 셈).
        fontFamily: "Noto Serif KR, Pretendard",
      }}
    >
      <InvitationFrame />
      <InvitationSeal />
      <div style={{ display: "flex", width: INVITATION_CARD_WIDTH, height: INVITATION_ZONE.topMargin, flexShrink: 0 }} />
      <InvitationTopicLabel label="내가 끌리는 사람" height={INVITATION_ZONE.topicLabel} />
      <InvitationTitle title={title} height={INVITATION_ZONE.title} />
      <InvitationTags tags={tags} height={INVITATION_ZONE.tags} />
      <InvitationOneLiner oneLiner={oneLiner} />
      <InvitationFooter height={INVITATION_ZONE.footer} />
      <div style={{ display: "flex", width: INVITATION_CARD_WIDTH, height: INVITATION_ZONE.bottomMargin, flexShrink: 0 }} />
    </div>
  );
}

export function buildIdealTypeCardElement(result: IdealTypeResult, theme: CardTheme) {
  if (theme === "navy") return buildNavyStoryCard(result);
  if (theme === "invitation") return buildInvitationCard(result);
  return buildContent(result, theme);
}

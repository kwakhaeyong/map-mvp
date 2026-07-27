// A형 한 장 MAP(인스타용 PNG) 카드의 satori(next/og ImageResponse) 렌더링
// 로직. app/r/[id]/card.png/route.ts(프로덕션)와 개발 전용 미리보기
// 라우트가 이 모듈을 함께 쓴다 — 실제 공유 데이터를 읽는 부분(getShare)은
// 각 라우트에 남겨두고, "IdealTypeResult를 받아서 1080x1350 satori
// 엘리먼트를 만든다"는 순수 로직만 여기 둔다.
//
// AI가 만드는 title/oneLiner/selfReflection 문장은 길이가 매번 달라서,
// 그대로 그리면 카드 밖으로 넘치는(overflow) 문제가 생긴다. 이 파일은
// 두 겹의 방어로 막는다: (1) 내용 길이에 따라 폰트 크기를 단계적으로
// 줄이고, (2) 그래도 넘칠 가능성에 대비해 각 텍스트 박스에
// overflow: hidden을 걸어 "잘리더라도 카드 틀을 절대 뚫지 않게" 한다.
import { readFileSync } from "node:fs";
import path from "node:path";
import { CARD_COLORS } from "./ideal-type-card-colors";
import type { IdealTypeResult } from "../types";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

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

function reflectionFontSize(sentence: string): number {
  return pickBySteps(
    sentence.length,
    [
      { max: 20, size: 38 },
      { max: 34, size: 34 },
      { max: 50, size: 30 },
      { max: 70, size: 27 },
    ],
    24,
  );
}

export type ReflectionSide = "offer" | "improve";

// 자기성찰 문장 두 후보 중 하나를 고른다. 둘 다 없는(빈 배열) 경우는
// 실제로는 selfReflection이 결과 스키마상 항상 채워지지만, 방어적으로
// 빈 문자열을 반환해 호출부가 블록 자체를 생략할 수 있게 한다.
export function pickReflectionSentence(result: IdealTypeResult, side: ReflectionSide): string {
  const source = side === "offer" ? result.selfReflection.whatYouOffer : result.selfReflection.whatToImprove;
  const first = source[0];
  if (!first) return "";
  return clampForSafety(firstSentence(first), 90);
}

const REFLECTION_LABEL: Record<ReflectionSide, string> = {
  offer: "내가 줄 수 있는 것",
  improve: "내가 보완할 부분",
};

function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 999,
        border: `2px solid ${CARD_COLORS.primarySoftBorder}`,
        backgroundColor: CARD_COLORS.primarySoftFill,
        padding: "16px 28px",
        fontSize: 30,
        fontWeight: 800,
        color: CARD_COLORS.primary,
        marginRight: 16,
        marginBottom: 16,
      }}
    >
      {label}
    </span>
  );
}

export function buildIdealTypeCardElement(result: IdealTypeResult, side: ReflectionSide) {
  const title = clampForSafety(result.title.trim(), 60);
  const oneLiner = clampForSafety(result.oneLiner.trim(), 120);
  const tags = (result.tags ?? []).slice(0, 4);
  const reflectionSentence = pickReflectionSentence(result, side);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        padding: "84px 72px 64px",
        backgroundColor: CARD_COLORS.background,
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 12,
              border: `2px solid ${CARD_COLORS.primary}`,
              color: CARD_COLORS.primary,
              fontSize: 20,
              fontWeight: 900,
              marginRight: 12,
            }}
          >
            M
          </span>
          <span style={{ fontSize: 26, fontWeight: 800, color: CARD_COLORS.textSecondary, letterSpacing: "-0.5px" }}>MAP Decision</span>
        </div>

        <div
          style={{
            display: "flex",
            maxHeight: 300,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: titleFontSize(title),
              fontWeight: 900,
              lineHeight: 1.15,
              color: CARD_COLORS.primary,
              letterSpacing: "-1.5px",
            }}
          >
            {title}
          </span>
        </div>

        <div style={{ display: "flex", maxHeight: 110, overflow: "hidden", marginBottom: 32 }}>
          <span
            style={{
              fontSize: oneLinerFontSize(oneLiner),
              fontWeight: 700,
              lineHeight: 1.4,
              color: CARD_COLORS.textSecondary,
            }}
          >
            {oneLiner}
          </span>
        </div>

        {tags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", maxHeight: 160, overflow: "hidden" }}>
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </div>
        ) : null}
      </div>

      {reflectionSentence ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 32,
            backgroundColor: CARD_COLORS.primary,
            padding: "44px 48px",
            maxHeight: 320,
            overflow: "hidden",
            marginTop: 64,
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 700, color: CARD_COLORS.foregroundFaint, letterSpacing: "-0.3px", marginBottom: 16 }}>
            {REFLECTION_LABEL[side]}
          </span>
          <span style={{ fontSize: reflectionFontSize(reflectionSentence), fontWeight: 700, lineHeight: 1.5, color: CARD_COLORS.primaryForeground }}>
            {reflectionSentence}
          </span>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "auto", paddingTop: 64 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: CARD_COLORS.textSecondary, letterSpacing: "-0.3px" }}>mapdecision.com</span>
      </div>
    </div>
  );
}

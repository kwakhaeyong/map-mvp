import { readFileSync } from "node:fs";
import path from "node:path";
import { CARD_COLORS } from "./ideal-type-card-colors";

// 브랜드 고정 OG 이미지(public/og-share.png)의 디자인 소스. 카드
// 이미지(card.png)·/r/{id}가 초대장 컨셉(크림 종이 톤)으로 바뀐 뒤에도
// 카톡 미리보기만 예전 연보라 그라데이션으로 남아있었다 — 링크를 받은
// 사람이 누르기 전에 보는 유일한 화면이라 여기도 맞춘다.
//
// ★동적 OG 금지 원칙은 그대로다 — 이 함수는 항상 고정된 카피만
// 그린다. 사용자 결과 내용(제목 등)을 인자로 받지 않는다(app/layout.tsx
// 주석 참고 — 카톡 대화 로그에 남는 문제 때문에 의도적으로 고정값만
// 쓴다).
//
// PNG 자체는 satori(next/og의 ImageResponse)로 그려서 저장한
// 정적 파일이라, 재생성하려면 이 함수를 next/og로 렌더링하는 임시
// dev 라우트가 필요하다(카드 렌더링에 쓰는 것과 같은 엔진 —
// ideal-type-card-image.tsx의 loadCardFonts/optimizeCardPng를 그대로
// 재사용). 문구·색을 바꿀 땐 이 파일만 고치고 PNG를 다시 뽑으면 된다.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

let paperTextureDataUri: string | undefined;
function loadPaperTexture(): string {
  if (!paperTextureDataUri) {
    const bytes = readFileSync(path.join(process.cwd(), "assets/textures/paper-noise.png"));
    paperTextureDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  }
  return paperTextureDataUri;
}

export function buildOgShareElement() {
  const texture = loadPaperTexture();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: CARD_COLORS.background,
        backgroundImage: `url(${texture})`,
        backgroundRepeat: "repeat",
        fontFamily: "Pretendard",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 32,
          left: 32,
          right: 32,
          bottom: 32,
          border: `2px solid ${CARD_COLORS.primarySoftBorder}`,
          borderRadius: 16,
        }}
      />
      {/* 봉랍(왁스 실) — card.png와 같은 위치(하단 좌측 모서리)·크기·색. */}
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
          boxShadow: "0 3px 6px rgba(21, 33, 59, 0.3)",
          color: CARD_COLORS.background,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        M
      </span>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, paddingLeft: 80, paddingRight: 80 }}>
        <span style={{ display: "flex", fontSize: 54, fontWeight: 800, color: CARD_COLORS.primary, letterSpacing: "-1px" }}>
          말하면 정리되는 나의 MAP
        </span>
        <span style={{ display: "flex", marginTop: 20, fontSize: 26, fontWeight: 700, color: CARD_COLORS.textSecondary, letterSpacing: "0.5px" }}>
          mapdecision.com
        </span>
      </div>
    </div>
  );
}

// 이상형 퀴즈의 "외모 취향" 문항(hairStyle/hairColor/clothingStyle/
// accessory/colorImpression)을 텍스트 라벨이 아니라 그림으로 보고
// 고르게 하는 썸네일 렌더러.
//
// ★어깨 위 구도(증명사진 스타일)다 — 전신이 아니다. 체형을 그리지
// 않아서 타겟 연령(10대 중반 포함)에 부적절할 수 있는 요소가 아예
// 없고, 머리·소품이 화면에서 차지하는 비중이 커서 작은 썸네일에서도
// 잘 보인다. 얼굴 이목구비는 계속 그리지 않는다(원 안이 항상 비어
// 있다) — 특정 인상이 박히면 절반은 "내 취향 아닌데"가 되기 때문이다.
//
// ★이 파일은 순수 표현 계층이다 — topics.ts의 답변 데이터는 이 파일이
// 있든 없든 라벨 텍스트로만 저장된다(session.quizAnswers에 부품 ID가
// 아니라 라벨 문자열이 들어간다). 실루엣 품질이 기준에 못 미쳐 통째로
// 뺄 경우:
//   1) 이 파일(IdealTypeVisualParts.tsx)을 삭제
//   2) TopicQuiz.tsx의 VisualGridStep 함수와 그 사용처(phase 분기)를 삭제
//   3) topics.ts에서 hairStyle/hairColor/clothingStyle/accessory/
//      colorImpression 5개 축의 type을 "visualPick"에서 "quickTap"으로
//      바꾸기만 하면 된다(라벨·설명은 그대로 재사용 가능)
//   4) design-tokens.css의 --color-hair-* 5줄, tailwind.config.ts의
//      hair-* 5개 항목 삭제
// 이 문항들의 질문 문구·옵션 데이터는 그대로 두고 표현만 텍스트 칩으로
// 되돌아간다 — 데이터 계층을 다시 설계할 필요가 없다.
const LINE = "stroke-text-primary";
const LINE_WIDTH = 2.4;
const lineProps = { fill: "none", strokeWidth: LINE_WIDTH, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: LINE };

// 머리 위치·크기 — 어깨 위 구도라 얼굴이 화면의 대부분을 차지한다.
const HEAD_CX = 80;
const HEAD_CY = 62;
const HEAD_R = 32;

export const HAIR_KEYS = ["lightBob", "sleekStraight", "softWave", "asymmetricCrop", "neatPart", "activeShort"] as const;
export const HAIR_COLOR_KEYS = ["black", "darkBrown", "lightBrown", "blonde", "dyed"] as const;
export const COLLAR_KEYS = ["shirtCollar", "knitNeckline", "hoodieNeckline", "turtleneck", "blazerCollar", "basicTee"] as const;
export const ACCESSORY_KEYS = ["none", "glasses", "earring", "hat", "scarf"] as const;
export const COLOR_KEYS = ["warm", "deep", "soft", "bold", "fresh", "calm"] as const;

type HairKey = (typeof HAIR_KEYS)[number];
type HairColorKey = (typeof HAIR_COLOR_KEYS)[number];
type CollarKey = (typeof COLLAR_KEYS)[number];
type AccessoryKey = (typeof ACCESSORY_KEYS)[number];
type ColorKey = (typeof COLOR_KEYS)[number];

// 배경 색감 6종 — 흰 카드 위에서 서로 뚜렷이 구별되도록 색조가 겹치지
// 않는 디자인 토큰만 골랐다. calm은 색이 있는 토큰 대신 뉴트럴 톤을
// 써서 "은은한 뉴트럴 색"이라는 설명과 실제로 맞게 했다.
const ACCENT_FILL_CLASS: Record<ColorKey, string> = {
  warm: "fill-uncertainty",
  deep: "fill-value",
  soft: "fill-option",
  bold: "fill-risk",
  fresh: "fill-action",
  calm: "fill-background-subtle",
};

// 머리 색 5종 — design-tokens.css 전용 hair-* 토큰(흑발→밝은 톤→염색
// 톤까지 명도·채도가 뚜렷이 갈리도록 순서를 잡았다).
const HAIR_COLOR_FILL_CLASS: Record<HairColorKey, string> = {
  black: "fill-hair-black",
  darkBrown: "fill-hair-darkbrown",
  lightBrown: "fill-hair-lightbrown",
  blonde: "fill-hair-blonde",
  dyed: "fill-hair-dyed",
};

function HeadOutline() {
  return <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill="none" strokeWidth={LINE_WIDTH} className={LINE} />;
}

function HairShape({ hair }: { hair: HairKey }) {
  switch (hair) {
    case "lightBob":
      return (
        <g {...lineProps}>
          <path d="M50,54 Q80,20 110,54" />
          <path d="M50,54 Q45,78 53,98" />
          <path d="M110,54 Q115,78 107,98" />
        </g>
      );
    case "sleekStraight":
      return (
        <g {...lineProps}>
          <path d="M50,52 Q80,18 110,52" />
          <path d="M50,52 L45,124" />
          <path d="M110,52 L115,124" />
        </g>
      );
    case "softWave":
      return (
        <g {...lineProps}>
          <path d="M50,53 Q80,19 110,53" />
          <path d="M50,53 Q40,80 53,98 Q62,116 46,130" />
          <path d="M110,53 Q120,80 107,98 Q98,116 114,130" />
        </g>
      );
    case "asymmetricCrop":
      return (
        <g {...lineProps}>
          <path d="M53,52 Q80,21 107,52" />
          <path d="M107,52 Q113,64 107,74" />
          <path d="M53,52 L42,86 L50,112" />
        </g>
      );
    case "neatPart":
      return (
        <g {...lineProps}>
          <path d="M50,54 Q80,20 110,54" />
          <path d="M76,22 L73,52" />
          <path d="M50,54 Q46,68 53,80" />
          <path d="M110,54 Q114,68 107,80" />
        </g>
      );
    case "activeShort":
      return (
        <g {...lineProps}>
          <path d="M58,38 L54,25" />
          <path d="M68,31 L66,16" />
          <path d="M80,28 L80,14" />
          <path d="M92,31 L94,16" />
          <path d="M102,38 L106,25" />
        </g>
      );
    default:
      return null;
  }
}

// 머리 색 — 머리 모양과 무관하게 "머리 부피" 하나만 색 채움으로
// 보여준다(어떤 헤어스타일을 고르든 색 선택 화면에서는 같은 기준 모양
// 위에서 색만 비교할 수 있게).
function HairColorMass({ color }: { color: HairColorKey }) {
  return <path d={`M50,54 Q80,18 110,54 Q114,80 107,102 Q80,90 53,102 Q46,80 50,54 Z`} className={HAIR_COLOR_FILL_CLASS[color]} strokeWidth={LINE_WIDTH} stroke="none" />;
}

// 옷깃·넥라인 6종 — 어깨 위 구도라 어깨선~목선까지만 그린다(가슴 아래는
// 화면 밖으로 크롭). 공통 어깨 베이스 위에 옷깃 형태만 다르게 얹는다.
function CollarShape({ collar }: { collar: CollarKey }) {
  const shoulderBase = <path {...lineProps} d="M28,168 Q30,132 62,120 L98,120 Q130,132 132,168" />;
  switch (collar) {
    case "shirtCollar":
      return (
        <>
          {shoulderBase}
          <path {...lineProps} d="M62,120 L80,144 L98,120" />
        </>
      );
    case "knitNeckline":
      return (
        <>
          {shoulderBase}
          <path {...lineProps} d="M64,122 Q80,136 96,122" />
        </>
      );
    case "hoodieNeckline":
      return (
        <>
          <path {...lineProps} d="M56,116 Q80,100 104,116" />
          {shoulderBase}
        </>
      );
    case "turtleneck":
      return (
        <>
          {shoulderBase}
          <path {...lineProps} d="M66,168 L66,118 Q80,110 94,118 L94,168" />
        </>
      );
    case "blazerCollar":
      return (
        <>
          {shoulderBase}
          <path {...lineProps} d="M60,120 L80,146 L84,120" />
          <path {...lineProps} d="M100,120 L80,146" />
        </>
      );
    case "basicTee":
      return (
        <>
          {shoulderBase}
          <path {...lineProps} d="M68,121 Q80,130 92,121" />
        </>
      );
    default:
      return null;
  }
}

// 소품 5종 — "없음"은 아무것도 그리지 않는다(다른 4개와 같은 틀에서
// 비교할 수 있게 머리·어깨 기준선만 유지).
function AccessoryShape({ accessory }: { accessory: AccessoryKey }) {
  switch (accessory) {
    case "glasses":
      return (
        <g {...lineProps}>
          <circle cx="64" cy="60" r="12" />
          <circle cx="96" cy="60" r="12" />
          <line x1="76" y1="60" x2="84" y2="60" />
          <line x1="52" y1="57" x2="42" y2="52" />
          <line x1="108" y1="57" x2="118" y2="52" />
        </g>
      );
    case "earring":
      return (
        <g {...lineProps}>
          <line x1="53" y1="80" x2="53" y2="90" />
          <circle cx="53" cy="95" r="5" className="fill-text-primary" stroke="none" />
          <line x1="107" y1="80" x2="107" y2="90" />
          <circle cx="107" cy="95" r="5" className="fill-text-primary" stroke="none" />
        </g>
      );
    case "hat":
      return (
        <g {...lineProps}>
          <path d="M44,44 Q80,14 116,44" />
          <path d="M40,46 L120,46" />
        </g>
      );
    case "scarf":
      return (
        <g {...lineProps}>
          <path d="M54,92 Q80,112 106,92 Q102,102 80,106 Q58,102 54,92 Z" />
          <path d="M92,100 Q102,116 92,132" />
        </g>
      );
    case "none":
    default:
      return null;
  }
}

// 머리 썸네일
export function HairThumb({ index }: { index: number }) {
  const hair = HAIR_KEYS[index] ?? HAIR_KEYS[0];
  return (
    <svg viewBox="24 6 112 112" className="h-16 w-16" role="img" aria-hidden="true">
      <HeadOutline />
      <HairShape hair={hair} />
    </svg>
  );
}

// 머리 색 썸네일
export function HairColorThumb({ index }: { index: number }) {
  const color = HAIR_COLOR_KEYS[index] ?? HAIR_COLOR_KEYS[0];
  return (
    <svg viewBox="24 6 112 112" className="h-16 w-16" role="img" aria-hidden="true">
      <HairColorMass color={color} />
      <HeadOutline />
    </svg>
  );
}

// 옷깃·넥라인 썸네일 — 어깨선까지만 보이게 아래쪽을 크롭한다.
export function CollarThumb({ index }: { index: number }) {
  const collar = COLLAR_KEYS[index] ?? COLLAR_KEYS[0];
  return (
    <svg viewBox="16 78 128 96" className="h-16 w-16" role="img" aria-hidden="true">
      <CollarShape collar={collar} />
    </svg>
  );
}

// 소품 썸네일 — 목도리(scarf)가 머리 아래 목 부분까지 내려오므로
// 세로를 조금 더 넉넉히 잡는다(다른 4개는 위쪽 공간이 살짝 남지만
// 잘리는 것보다 낫다).
export function AccessoryThumb({ index }: { index: number }) {
  const accessory = ACCESSORY_KEYS[index] ?? ACCESSORY_KEYS[0];
  return (
    <svg viewBox="24 6 112 128" className="h-16 w-16" role="img" aria-hidden="true">
      <HeadOutline />
      <AccessoryShape accessory={accessory} />
    </svg>
  );
}

// 배경 색감 썸네일 — 면적이 있는 채움(fill)이라야 옅은 파스텔도
// 뚜렷이 보인다(선 색으로는 실제 렌더링에서 거의 안 보임).
export function ColorThumb({ index }: { index: number }) {
  const color = COLOR_KEYS[index] ?? COLOR_KEYS[0];
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16" role="img" aria-hidden="true">
      <circle cx="50" cy="50" r="42" className={ACCENT_FILL_CLASS[color]} />
    </svg>
  );
}

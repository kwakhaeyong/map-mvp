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
// 아니라 라벨 문자열이 들어간다). 이 문항들을 통째로 텍스트 칩으로
// 되돌리려면 topics.ts에서 5개 축의 type을 "visualPick"에서
// "quickTap"으로 바꾸고 TopicQuiz.tsx의 VisualGridStep 사용처를
// 지우면 된다 — 데이터 계층을 다시 설계할 필요가 없다.
//
// (참고: 이 부품 그림을 결과 카드에 하나로 조합해 보여주는 기능을
// PR #83/#84에서 시도했다가 품질 기준 미달로 걷어냈다 — 지금 이
// 파일은 "고르는 화면"용 썸네일만 담당한다.)
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

const LINE = "stroke-text-primary";
const LINE_WIDTH = 2.2;
const strokeOnly = { fill: "none", strokeWidth: LINE_WIDTH, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: LINE };
const filledLine = { strokeWidth: LINE_WIDTH, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: LINE };

// 머리 위치·크기 — 어깨 위 구도라 얼굴이 화면의 대부분을 차지한다.
// 이전보다 살짝 작게 잡아서(머리 부피에 밀리지 않게) 머리 모양이
// 실루엣의 주인공이 되게 한다.
const HEAD_CX = 80;
const HEAD_CY = 78;
const HEAD_R = 30;

// 배경 색감 6종 — 인물(머리·옷)보다 훨씬 작게 잡아서 "정보 없는 큰
// 단색 원"이 아니라 뒤에서 살짝 비치는 배경 톤 정도로만 쓴다.
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
const HAIR_FILL_CLASS: Record<HairColorKey, string> = {
  black: "fill-hair-black",
  darkBrown: "fill-hair-darkbrown",
  lightBrown: "fill-hair-lightbrown",
  blonde: "fill-hair-blonde",
  dyed: "fill-hair-dyed",
};

const SKIN_FILL = "fill-figure-skin";
const GARMENT_FILL = "fill-figure-garment";

function HeadFill() {
  return <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />;
}

// 목 — 머리와 옷을 잇는 면. 턱 아래(머리 원과 겹치게)부터 어깨 위까지
// 같은 피부 톤으로 채워서 "머리와 몸이 따로 논다"는 문제를 없앤다.
// 터틀넥일 때는 옷이 이 자리를 대신 덮는다(NeckFill을 그리지 않음).
function NeckFill() {
  return <path d="M64,100 L96,100 L92,138 L68,138 Z" strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />;
}

// 어깨~크롭선까지의 옷 몸통. 넥라인 모양과 무관하게 항상 같은 바탕
// 실루엣이고, 그 위에 옷깃별 넥라인을 얹는다 — "옷 영역이 텅 빈
// 흰색"이라는 문제를 없애기 위해 항상 면으로 채운다.
function GarmentBase() {
  return <path d="M16,198 Q20,148 58,134 L102,134 Q140,148 144,198 Z" strokeWidth={LINE_WIDTH} className={`${GARMENT_FILL} ${LINE}`} />;
}

// 옷깃·넥라인 6종 — GarmentBase 위에 넥라인 모양을 얹는다. 대부분
// "목 부분에 피부색을 어디까지 보여줄지"로 넥라인 모양을 구분한다.
function CollarOverlay({ collar }: { collar: CollarKey }) {
  switch (collar) {
    case "shirtCollar":
      // 브이넥으로 길게 트인 셔츠 옷깃 — 피부색 브이 + 옷깃 각(뾰족한 선).
      return (
        <>
          <path d="M68,138 L92,138 L84,178 L80,184 L76,178 Z" strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />
          <path {...strokeOnly} d="M62,134 L80,184 L98,134" />
        </>
      );
    case "blazerCollar":
      // 셔츠보다 더 넓게 트이고, 라펠(접힌 깃) 선이 추가된다.
      return (
        <>
          <path d="M60,134 L100,134 L84,182 L80,188 L76,182 Z" strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />
          <path {...strokeOnly} d="M54,136 L80,166 L64,134" />
          <path {...strokeOnly} d="M106,136 L80,166 L96,134" />
        </>
      );
    case "turtleneck":
      // 목까지 옷이 올라오므로 피부색 목이 안 보인다 — 옷 색으로 목
      // 전체를 감싸고, 접힌 단을 나타내는 가로 선 두 줄을 더한다.
      return (
        <>
          <path d="M62,100 L98,100 L92,138 L68,138 Z" strokeWidth={LINE_WIDTH} className={`${GARMENT_FILL} ${LINE}`} />
          <path {...strokeOnly} d="M66,112 L94,112" />
          <path {...strokeOnly} d="M65,124 L95,124" />
        </>
      );
    case "hoodieNeckline": {
      // 목 옆으로 후드 원단이 둘러진 것처럼 옷 색 덩어리를 목 뒤쪽에
      // 얹는다(머리보다 먼저 그려서 목 옆에 살짝 걸린 것처럼 보인다).
      return <path d="M50,140 Q80,108 110,140 Q104,150 80,148 Q56,150 50,140 Z" strokeWidth={LINE_WIDTH} className={`${GARMENT_FILL} ${LINE}`} />;
    }
    case "knitNeckline":
      // 둥글고 낮은 라운드넥 — 피부색 반타원.
      return <path d="M66,138 Q80,156 94,138 L94,120 Q80,112 66,120 Z" strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />;
    case "basicTee":
      // 니트보다 작고 높은 크루넥 — 얕은 반타원.
      return <path d="M70,138 Q80,148 90,138 L90,126 Q80,120 70,126 Z" strokeWidth={LINE_WIDTH} className={`${SKIN_FILL} ${LINE}`} />;
    default:
      return null;
  }
}

// 머리 6종 — 이제 선이 아니라 "채워진 머리 덩어리"다(머리 색이 그대로
// 채움색). 정수리 위 반원(캡)을 공유하고, 스타일마다 옆으로 늘어지는
// 길이·바깥선을 다르게 해서 실제로 다른 헤어스타일처럼 보이게 했다.
function HairSilhouette({ hair, color }: { hair: HairKey; color: HairColorKey }) {
  const fillClass = `${HAIR_FILL_CLASS[color]} ${LINE}`;
  const cap = "M46,86 Q40,30 80,24 Q120,30 114,86 Q98,72 80,72 Q62,72 46,86 Z";
  switch (hair) {
    case "lightBob":
      // 턱선 길이에서 안으로 살짝 마는 단발.
      return (
        <>
          <path d={cap} strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M46,86 Q40,108 45,124 Q52,133 63,128 L63,98 Q55,90 46,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M114,86 Q120,108 115,124 Q108,133 97,128 L97,98 Q105,90 114,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
        </>
      );
    case "sleekStraight":
      // 어깨 아래까지 떨어지는 긴 생머리 — 곧고 좁은 실루엣.
      return (
        <>
          <path d={cap} strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M46,86 L40,178 L58,176 L60,98 Q53,90 46,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M114,86 L120,178 L102,176 L100,98 Q107,90 114,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
        </>
      );
    case "softWave":
      // 생머리보다 더 길고 볼륨 있게, 바깥선이 물결친다.
      return (
        <>
          <path d={cap} strokeWidth={LINE_WIDTH} className={fillClass} />
          <path
            d="M46,86 Q34,120 44,140 Q36,158 46,182 L62,178 Q54,158 60,142 Q52,122 62,98 Q54,90 46,86 Z"
            strokeWidth={LINE_WIDTH}
            className={fillClass}
          />
          <path
            d="M114,86 Q126,120 116,140 Q124,158 114,182 L98,178 Q106,158 100,142 Q108,122 98,98 Q106,90 114,86 Z"
            strokeWidth={LINE_WIDTH}
            className={fillClass}
          />
        </>
      );
    case "asymmetricCrop":
      // 한쪽은 짧게, 반대쪽은 길게 — 비대칭 크롭.
      return (
        <>
          <path d={cap} strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M46,86 L42,98 Q50,104 60,98 L60,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M114,86 L124,144 Q114,154 100,148 L100,98 Q107,90 114,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
        </>
      );
    case "neatPart":
      // 짧고 단정, 가운데(약간 옆) 가르마 선이 보인다.
      return (
        <>
          <path d={cap} strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M46,86 Q42,96 48,104 L58,98 L58,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path d="M114,86 Q118,96 112,104 L102,98 L102,86 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path {...strokeOnly} d="M70,26 L66,58" />
        </>
      );
    case "activeShort":
      // 정수리를 짧게 덮고, 뾰족한 스파이크가 위로 튄다.
      return (
        <>
          <path d="M54,74 Q50,34 80,28 Q110,34 106,74 Q93,64 80,64 Q67,64 54,74 Z" strokeWidth={LINE_WIDTH} className={fillClass} />
          <path
            d="M58,40 L54,24 L64,36 L66,20 L76,34 L78,16 L82,16 L84,34 L94,20 L96,36 L106,24 L102,40 Z"
            strokeWidth={LINE_WIDTH}
            className={fillClass}
          />
        </>
      );
    default:
      return null;
  }
}

// 소품 5종 — 전부 눈에 띄게 키웠다(특히 귀걸이는 이전에 점 2개라 거의
// 안 보였음). "없음"은 아무것도 그리지 않는다.
function AccessoryShape({ accessory }: { accessory: AccessoryKey }) {
  switch (accessory) {
    case "glasses":
      return (
        <g {...strokeOnly}>
          <circle cx="63" cy="80" r="15" />
          <circle cx="97" cy="80" r="15" />
          <line x1="78" y1="80" x2="82" y2="80" />
          <line x1="48" y1="76" x2="36" y2="70" />
          <line x1="112" y1="76" x2="124" y2="70" />
        </g>
      );
    case "earring":
      // 귀 위치(눈높이 바로 아래, 머리 바깥쪽)에서 짧게 늘어지는 귀걸이.
      // 머리보다 나중에 그려서 긴 머리 위에도 또렷이 보인다.
      return (
        <g {...filledLine}>
          <line x1="46" y1="88" x2="46" y2="100" />
          <circle cx="46" cy="106" r="8" className="fill-primary" />
          <line x1="114" y1="88" x2="114" y2="100" />
          <circle cx="114" cy="106" r="8" className="fill-primary" />
        </g>
      );
    case "hat":
      // 속이 빈 크레센트가 아니라 통째로 채운 돔 — 안에 어떤 머리
      // 스타일이 있어도 챙 위쪽이 전부 가려져서 "모자를 쓴" 것처럼
      // 보인다(머리보다 나중에 그려서 위에 덮인다).
      return (
        <g {...filledLine}>
          <path d="M38,60 Q38,16 80,14 Q122,16 122,60 L122,64 L38,64 Z" className="fill-primary" />
          <path d="M32,64 L128,64 L122,72 L38,72 Z" className="fill-primary" />
        </g>
      );
    case "scarf":
      return (
        <g {...filledLine}>
          <path d="M50,132 Q80,158 110,132 Q104,146 80,152 Q56,146 50,132 Z" className="fill-primary" />
          <path d="M94,144 Q106,168 92,192 L80,188 Q94,166 84,146 Z" className="fill-primary" />
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
    <svg viewBox="18 4 124 130" className="h-16 w-16" role="img" aria-hidden="true">
      <HeadFill />
      <HairSilhouette hair={hair} color="black" />
    </svg>
  );
}

// 머리 색 썸네일 — 스타일은 고정(softWave)하고 색만 비교한다.
export function HairColorThumb({ index }: { index: number }) {
  const color = HAIR_COLOR_KEYS[index] ?? HAIR_COLOR_KEYS[0];
  return (
    <svg viewBox="18 4 124 130" className="h-16 w-16" role="img" aria-hidden="true">
      <HeadFill />
      <HairSilhouette hair="lightBob" color={color} />
    </svg>
  );
}

// 옷깃·넥라인 썸네일 — 어깨선까지만 보이게 아래쪽을 크롭한다.
export function CollarThumb({ index }: { index: number }) {
  const collar = COLLAR_KEYS[index] ?? COLLAR_KEYS[0];
  return (
    <svg viewBox="8 96 144 100" className="h-16 w-16" role="img" aria-hidden="true">
      <GarmentBase />
      {collar !== "turtleneck" ? <NeckFill /> : null}
      <CollarOverlay collar={collar} />
    </svg>
  );
}

// 소품 썸네일
export function AccessoryThumb({ index }: { index: number }) {
  const accessory = ACCESSORY_KEYS[index] ?? ACCESSORY_KEYS[0];
  return (
    <svg viewBox="18 4 124 150" className="h-16 w-16" role="img" aria-hidden="true">
      <HeadFill />
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

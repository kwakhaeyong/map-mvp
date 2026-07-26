import { IdealTypeSilhouetteParts, SilhouetteColor } from "../types";
import { Card } from "./ui/primitives";

// 이상형의 "외모 취향"을 그림으로 보여주는 순수 프레젠테이션 컴포넌트.
// AI가 그리지 않는다 — engine/ideal-type-silhouette.ts가 퀴즈 답변에서
// 고른 고정 부품(머리·상의·자세·소품·색)을 SVG로 겹쳐 그릴 뿐이다.
// 실존 인물 사진·이름은 전혀 쓰지 않는다.
//
// ★얼굴 이목구비는 그리지 않는다(원 안이 항상 비어 있다) — 특정 인상이
// 박히면 절반은 "내 취향 아닌데"가 되기 때문이다. ★체형·몸매도
// 유형화하지 않는다 — 몸통 윤곽은 항상 같은 중립 실루엣이고, 구분은
// 머리·상의·자세·소품·색으로만 한다.
//
// 선(머리/상의/자세)은 항상 짙은 text-primary로만 그린다 — 디자인
// 토큰 중 배지 배경용으로 만들어진 fact/feeling/value/option/
// uncertainty/risk는 전부 아주 옅은 파스텔이라, 흰 카드 위에 얇은
// 선(stroke) 색으로 쓰면 실제 렌더링에서 거의 안 보인다(직접 캡처해서
// 확인함). 그래서 "색 팔레트" 축은 머리 뒤 배경 블롭 + 소품의 채움
// (fill) 색으로만 표현한다 — 면적이 있는 채움은 옅은 파스텔이어도
// 뚜렷이 보인다.
// feeling과 value, fact와 action은 색상표에서 거의 같은 톤이라(둘 다
// 옅은 보라 / 옅은 하늘색) 나란히 놓으면 구분이 잘 안 된다 — 6개가
// 서로 뚜렷이 구별되도록 색조가 겹치지 않는 토큰만 골랐다. "calm"은
// 색이 있는 토큰 대신 뉴트럴 톤(background-subtle)을 써서 "은은한
// 뉴트럴 색"이라는 설명과도 실제로 맞게 했다.
const ACCENT_FILL_CLASS: Record<SilhouetteColor, string> = {
  warm: "fill-uncertainty",
  deep: "fill-value",
  soft: "fill-option",
  bold: "fill-risk",
  fresh: "fill-action",
  calm: "fill-background-subtle",
};

const LINE = "stroke-text-primary";
const LINE_WIDTH = 1.6;
const lineProps = { fill: "none", strokeWidth: LINE_WIDTH, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: LINE };

function HairShape({ hair }: { hair: IdealTypeSilhouetteParts["hair"] }) {
  switch (hair) {
    case "lightBob":
      return (
        <g {...lineProps}>
          <path d="M58,46 Q80,26 102,46" />
          <path d="M58,46 Q54,64 60,80" />
          <path d="M102,46 Q106,64 100,80" />
        </g>
      );
    case "sleekStraight":
      return (
        <g {...lineProps}>
          <path d="M58,44 Q80,24 102,44" />
          <path d="M58,44 L54,112" />
          <path d="M102,44 L106,112" />
        </g>
      );
    case "softWave":
      return (
        <g {...lineProps}>
          <path d="M58,45 Q80,25 102,45" />
          <path d="M58,45 Q50,65 60,80 Q68,95 56,108" />
          <path d="M102,45 Q110,65 100,80 Q92,95 104,108" />
        </g>
      );
    case "asymmetricCrop":
      return (
        <g {...lineProps}>
          <path d="M60,44 Q80,26 100,44" />
          <path d="M100,44 Q104,54 100,62" />
          <path d="M60,44 L52,70 L58,95" />
        </g>
      );
    case "neatPart":
      return (
        <g {...lineProps}>
          <path d="M58,46 Q80,25 102,46" />
          <path d="M72,26 L70,44" />
          <path d="M58,46 Q55,58 60,68" />
          <path d="M102,46 Q106,58 101,68" />
        </g>
      );
    case "activeShort":
      return (
        <g {...lineProps}>
          <path d="M64,34 L61,24" />
          <path d="M72,29 L70,18" />
          <path d="M80,27 L80,16" />
          <path d="M88,29 L90,18" />
          <path d="M96,34 L99,24" />
        </g>
      );
    default:
      return null;
  }
}

function TopShape({ top }: { top: IdealTypeSilhouetteParts["top"] }) {
  switch (top) {
    case "roundKnit":
      return <path {...lineProps} d="M56,92 Q80,80 104,92 L100,170 Q80,180 60,170 Z" />;
    case "looseCasual":
      return <path {...lineProps} d="M48,90 L112,90 L118,172 L42,172 Z" />;
    case "minimalShirt":
      return (
        <>
          <path {...lineProps} d="M62,88 L98,88 L96,172 L64,172 Z" />
          <path {...lineProps} d="M74,88 L80,97 L86,88" />
        </>
      );
    case "structuredBlazer":
      return (
        <>
          <path {...lineProps} d="M46,86 L80,94 L114,86 L104,172 L56,172 Z" />
          <path {...lineProps} d="M72,88 L80,101 L88,88" />
        </>
      );
    case "oversizedHoodie":
      return (
        <>
          <path {...lineProps} d="M60,84 Q80,68 100,84" />
          <path {...lineProps} d="M40,94 Q80,84 120,94 L124,175 Q80,186 36,175 Z" />
        </>
      );
    case "layeredAsymmetric":
      return (
        <>
          <path {...lineProps} d="M56,92 L82,90 L78,158 L50,162 Z" />
          <path {...lineProps} d="M70,88 L104,90 L112,182 L74,178 Z" />
        </>
      );
    default:
      return null;
  }
}

function PoseLimbs({ pose }: { pose: IdealTypeSilhouetteParts["pose"] }) {
  switch (pose) {
    case "relaxedLean":
      return (
        <>
          <path {...lineProps} d="M60,94 Q56,120 64,145" />
          <path {...lineProps} d="M100,94 Q104,120 96,145" />
          <path {...lineProps} d="M68,176 L66,215" />
          <path {...lineProps} d="M92,176 L94,215" />
        </>
      );
    case "striding":
      return (
        <>
          <path {...lineProps} d="M60,94 L48,124" />
          <path {...lineProps} d="M100,94 L114,118" />
          <path {...lineProps} d="M70,176 L58,215" />
          <path {...lineProps} d="M90,176 L104,215" />
        </>
      );
    case "engaged":
      return (
        <>
          <path {...lineProps} d="M60,94 L52,116 L62,132" />
          <path {...lineProps} d="M100,94 L104,140" />
          <path {...lineProps} d="M70,176 L68,215" />
          <path {...lineProps} d="M90,176 L92,215" />
        </>
      );
    case "upright":
      return (
        <>
          <path {...lineProps} d="M60,94 L58,145" />
          <path {...lineProps} d="M100,94 L102,145" />
          <path {...lineProps} d="M70,176 L70,216" />
          <path {...lineProps} d="M90,176 L90,216" />
        </>
      );
    default:
      return null;
  }
}

function AccessoryShape({ accessory, accentFill }: { accessory: IdealTypeSilhouetteParts["accessory"]; accentFill: string }) {
  switch (accessory) {
    case "mug":
      return (
        <g>
          <path {...lineProps} className={`${accentFill} ${LINE}`} d="M114,150 L114,162 Q114,166 118,166 L126,166 Q130,166 130,162 L130,150 Z" />
          <path {...lineProps} d="M130,153 Q137,153 137,158 Q137,163 130,163" />
        </g>
      );
    case "scarf":
      return (
        <g>
          <path {...lineProps} className={`${accentFill} ${LINE}`} d="M64,86 Q80,100 96,86 Q94,92 80,96 Q66,92 64,86 Z" />
          <path {...lineProps} className={`${accentFill} ${LINE}`} d="M88,92 Q96,110 88,126 Q83,110 88,92 Z" />
        </g>
      );
    case "notebook":
      return (
        <g>
          <path {...lineProps} className={`${accentFill} ${LINE}`} d="M108,140 L128,140 L128,164 L108,164 Z" />
          <path {...lineProps} d="M112,147 L124,147" />
          <path {...lineProps} d="M112,153 L124,153" />
          <path {...lineProps} d="M112,159 L120,159" />
        </g>
      );
    case "backpack":
      return (
        <g>
          <path {...lineProps} className={`${accentFill} ${LINE}`} d="M110,112 Q124,112 124,126 L124,140 Q124,150 110,150 Z" />
          <path {...lineProps} d="M108,120 L108,140" />
        </g>
      );
    case "glasses":
      return (
        <g {...lineProps}>
          <circle cx="71" cy="55" r="7" className={accentFill} />
          <circle cx="89" cy="55" r="7" className={accentFill} />
          <line x1="78" y1="55" x2="82" y2="55" />
          <line x1="64" y1="53" x2="58" y2="50" />
          <line x1="96" y1="53" x2="102" y2="50" />
        </g>
      );
    default:
      return null;
  }
}

// 그림 아래에 붙일 설명 문구 — 3개, 무슨 조합인지 말로 짚어준다.
function DescriptionChips({ captions }: { captions: string[] }) {
  return <p className="text-center text-xs font-bold leading-5 text-text-secondary">{captions.join(" · ")}</p>;
}

export function IdealTypeSilhouette({ parts, captions }: { parts: IdealTypeSilhouetteParts; captions: string[] }) {
  const accentFill = ACCENT_FILL_CLASS[parts.color];
  return (
    <Card id="silhouette" className="scroll-mt-6 flex flex-col items-center gap-3">
      <div className="flex w-full items-start gap-2">
        <span className="text-lg" aria-hidden="true">
          🎨
        </span>
        <div>
          <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">외모 취향 실루엣</h2>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">
            얼굴이 아니라 분위기로 그려본, 끌리는 사람의 느낌이에요.
          </p>
        </div>
      </div>
      <svg viewBox="0 0 160 220" className="h-56 w-auto" role="img" aria-label="외모 취향을 표현한 실루엣 그림">
        {/* 색 팔레트를 표현하는 배경 블롭 — 항상 같은 크기·위치라 머리
            모양과 상관없이 뚜렷이 보인다. 가장 먼저(맨 뒤에) 그린다. */}
        <ellipse cx="80" cy="60" rx="40" ry="46" className={accentFill} />
        {/* 후드(오버사이즈 후드일 때만 몸통보다 먼저 그려서 뒤에 깔린다) */}
        {parts.top === "oversizedHoodie" ? <TopShape top={parts.top} /> : null}
        <circle cx="80" cy="54" r="22" fill="none" strokeWidth={LINE_WIDTH} className={LINE} />
        <line x1="80" y1="76" x2="80" y2="88" strokeWidth={LINE_WIDTH} className={LINE} />
        <HairShape hair={parts.hair} />
        {parts.accessory === "glasses" ? <AccessoryShape accessory={parts.accessory} accentFill={accentFill} /> : null}
        {parts.top !== "oversizedHoodie" ? <TopShape top={parts.top} /> : null}
        <PoseLimbs pose={parts.pose} />
        {parts.accessory !== "glasses" ? <AccessoryShape accessory={parts.accessory} accentFill={accentFill} /> : null}
      </svg>
      <DescriptionChips captions={captions} />
    </Card>
  );
}

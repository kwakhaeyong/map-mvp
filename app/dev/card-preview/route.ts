import { ImageResponse } from "next/og";
import { IdealTypeResult } from "../../../src/map-decision-v1/types";
import { buildIdealTypeCardElement, CardTheme, CARD_HEIGHT, CARD_WIDTH, loadCardFonts } from "../../../src/map-decision-v1/engine/ideal-type-card-image";

// 개발 환경 전용 — 한 장 MAP PNG 디자인을 Upstash 없이 mock 데이터로
// 바로 확인하기 위한 라우트. 프로덕션에는 절대 노출하지 않는다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SHORT_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "쿨한 척, 여린 사람",
  oneLiner: "겉으론 무심해 보여도 속은 누구보다 다정한 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["힘들 때 옆에서 조용히 있어줄 수 있어요."],
    whatToImprove: ["서운한 걸 바로 말 못 하고 쌓아두는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#집순이집돌이형", "#직진소통형", "#편안함추구형"],
};

const ONELINE_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "고요한 신뢰파",
  oneLiner: "말수는 적어도 곁에 있으면 마음이 놓이는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["한번 믿으면 끝까지 곁을 지켜줄 수 있어요."],
    whatToImprove: ["속마음을 표현하는 데 시간이 좀 걸리는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#거리존중형", "#루틴형", "#혼자정리형", "#편안함추구형"],
};

const MEDIUM_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["필요할 때 확실하게 챙겨줄 수 있어요."],
    whatToImprove: ["한번 삐지면 티가 좀 나는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

const LONG_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "겉으론 무심해도 속마음은 누구보다 여린 사람",
  oneLiner:
    "표현은 서툴지만 상대를 향한 마음은 누구보다 진심이고, 시간이 걸려도 결국 자기 방식대로 곁을 지켜주는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: [
      "한번 신뢰를 쌓으면 웬만한 일로는 흔들리지 않고 끝까지 곁을 지키면서, 상대가 힘든 시기를 지날 때도 재촉하지 않고 묵묵히 기다려줄 수 있어요. 대신 표현이 서툴러서 오해를 살 때도 있어요.",
    ],
    whatToImprove: [
      "속상한 일이 있어도 상대가 부담스러워할까 봐 며칠씩 혼자 삭이다가 결국 엉뚱한 타이밍에 터뜨리는 편이라, 그때그때 작은 감정부터 편하게 꺼내는 연습이 필요해요. 그러다 보니 상대는 제가 괜찮은 줄 알고 지나가는 경우가 많아요.",
    ],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#거리존중형", "#각자시간형", "#혼자정리형", "#설렘추구형"],
};

// #99 재현·회귀 검증용 — 실제 프로덕션에서 잘렸던 문장 그대로(92자,
// 마침표 있음). 오너가 직접 지적한 케이스라 이 문장만큼은 절대
// 드롭되면 안 된다 — 드롭되면 이 mock이 곧바로 표시해준다.
const REAL_PRODUCTION_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: [
      "오랜만에 만난 자리에서 말이 없어도 개입하지 않고 존중해주는 반응을 편하게 여기는 걸 보면, 본인도 관계에서 상대의 침묵이나 거리를 있는 그대로 받아들이는 편이에요.",
    ],
    whatToImprove: ["서운한 걸 바로 말 못 하고 쌓아두는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

// #99 재현·회귀 검증용 — 자기성찰 문장에 마침표가 없어서 firstSentence()가
// 원문을 그대로 반환하는 경우. 이 정도 길이(55자 이하)는 안전 범위 안이라
// 마침표 없이도 그대로 보여야 정상이다.
const NO_PERIOD_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: [
      "힘들 때 옆에서 이야기를 들어주고 상대의 감정을 판단하지 않고 있는 그대로 받아들이는 여유가 있어요",
    ],
    whatToImprove: ["서운한 걸 바로 말 못 하고 쌓아두는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

// #99 재현·회귀 검증용 — 마침표 없이 아주 길게(약 280자) 이어지는
// 연결 어미 나열. satori는 overflow:hidden을 지키지 않고 카드 틀을
// 그대로 뚫고 자라서 footer가 통째로 사라지는 사고가 났었다(직접
// 재현해서 확인함). 폰트를 38→36→32→28까지 다 줄여도 이 길이는
// 못 들어가므로, 이 항목만 빠지고 나머지 카드(footer 포함)는
// 멀쩡해야 한다.
const TOO_LONG_NO_PERIOD_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: [
      "힘들 때 옆에서 이야기를 들어주고 상대의 감정을 판단하지 않고 있는 그대로 받아들이면서 필요할 때마다 곁에서 힘이 되어주려고 하는 사람이라 오래 봐도 편안하게 느껴지는 여유가 있고 그런 편안함이 관계가 오래갈수록 더 진해지는 편이라 시간이 지날수록 서로에게 더 좋은 사람이 되어줄 수 있고 작은 약속이라도 꼭 지키려고 하는 편이라 신뢰가 천천히 그러나 단단하게 쌓이는 편이라 나중에는 그 신뢰가 관계 전체를 지탱하는 힘이 되어줄 수 있어요",
    ],
    whatToImprove: [
      "서운한 게 있어도 괜히 분위기를 무겁게 만들까 봐 바로 말하지 못하고 혼자 며칠씩 삭이다가 결국 다른 일로 짜증을 내는 식으로 터져 나오는 편이라 그때그때 표현하는 연습이 필요하고 그 연습이 쌓여야 관계가 더 편안해질 수 있다고 생각해요",
    ],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

// #99 후속 확인용 — 타이틀/한줄설명/태그도 satori overflow 위험이
// 있는지 극단 케이스로 확인하기 위한 mock. 검증이 끝나면 결과에 따라
// 유지하거나 정리한다.
const EXTREME_TITLE_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "겉으로는 정말 무심해 보이지만 사실은 속마음이 누구보다도 여리고 섬세해서 아주 잘 다치는 편인 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["필요할 때 확실하게 챙겨줄 수 있어요."],
    whatToImprove: ["한번 삐지면 티가 좀 나는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

const EXTREME_ONELINER_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner:
    "표현은 서툴러도 상대를 향한 마음만큼은 누구보다 진심이고, 시간이 걸리더라도 결국에는 자기만의 방식대로 끝까지 곁을 지켜주는 사람을 오랫동안 찾아왔던 것 같아요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["필요할 때 확실하게 챙겨줄 수 있어요."],
    whatToImprove: ["한번 삐지면 티가 좀 나는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#여행형", "#갈등해결형", "#설렘추구형"],
};

const EXTREME_TAGS_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "다정한데 은근히 까칠한 사람",
  oneLiner: "챙길 땐 확실히 챙기지만, 선 넘으면 은근히 단호해지는 사람을 찾고 있어요.",
  criteria: { mustHave: [], niceToHave: [], canCompromise: [] },
  attractionPatterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  flags: { green: [], red: [] },
  selfReflection: {
    whatYouOffer: ["필요할 때 확실하게 챙겨줄 수 있어요."],
    whatToImprove: ["한번 삐지면 티가 좀 나는 편이에요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#장거리연애도가능형", "#갑작스러운연락환영형", "#표현중시형", "#설렘추구형"],
};

function isCardTheme(value: string | null): value is CardTheme {
  return value === "purple" || value === "navy" || value === "colorBlock";
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const variantParam = url.searchParams.get("variant");
  const variant =
    variantParam === "long"
      ? LONG_MOCK
      : variantParam === "medium"
        ? MEDIUM_MOCK
        : variantParam === "oneline"
          ? ONELINE_MOCK
          : variantParam === "real"
            ? REAL_PRODUCTION_MOCK
            : variantParam === "noperiod"
              ? NO_PERIOD_MOCK
              : variantParam === "toolong"
                ? TOO_LONG_NO_PERIOD_MOCK
                : variantParam === "extremetitle"
                  ? EXTREME_TITLE_MOCK
                  : variantParam === "extremeoneliner"
                    ? EXTREME_ONELINER_MOCK
                    : variantParam === "extremetags"
                      ? EXTREME_TAGS_MOCK
                      : SHORT_MOCK;
  const themeParam = url.searchParams.get("theme");
  const theme: CardTheme = isCardTheme(themeParam) ? themeParam : "purple";

  return new ImageResponse(buildIdealTypeCardElement(variant, theme), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadCardFonts(),
  });
}

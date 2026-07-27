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

const LONG_MOCK: IdealTypeResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "말은 없어도 마음은 늘 곁에 있는, 은근히 다정한 노력파",
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

function isCardTheme(value: string | null): value is CardTheme {
  return value === "purple" || value === "navy" || value === "colorBlock";
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") === "long" ? LONG_MOCK : SHORT_MOCK;
  const themeParam = url.searchParams.get("theme");
  const theme: CardTheme = isCardTheme(themeParam) ? themeParam : "purple";

  return new ImageResponse(buildIdealTypeCardElement(variant, theme), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: loadCardFonts(),
  });
}

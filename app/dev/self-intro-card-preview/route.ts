import { ImageResponse } from "next/og";
import { SelfIntroResult } from "../../../src/map-decision-v1/types";
import { INVITATION_CARD_HEIGHT, INVITATION_CARD_WIDTH, loadInvitationFonts, optimizeCardPng } from "../../../src/map-decision-v1/engine/ideal-type-card-image";
import { buildSelfIntroCardElement } from "../../../src/map-decision-v1/engine/self-intro-card-image";

// 개발 환경 전용 — 나 소개·성격 card.png(초대장 컨셉, 유일한 테마)를
// Upstash 없이 mock 데이터로 바로 확인하기 위한 라우트. 이상형 쪽
// app/dev/card-preview/route.ts와 같은 목적·같은 게이트(NODE_ENV
// 프로덕션 차단)를 쓴다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MOCK: SelfIntroResult = {
  version: 2,
  generatedAt: new Date().toISOString(),
  model: "claude-sonnet-5",
  title: "조용히 할 일 하는 사람",
  oneLiner: "말보다 행동으로 먼저 보여주는 편이라, 겉으론 무심해 보여도 속은 꽤 다정한 사람이에요.",
  coreValues: { mustKeep: [], important: [], flexible: [] },
  patterns: [],
  matrix: { xAxisLabel: { low: "", high: "" }, yAxisLabel: { low: "", high: "" }, types: [] },
  traits: { strengths: [], cautions: [] },
  selfReflection: {
    whatYouOffer: ["말없이도 곁에서 묵묵히 챙겨줄 수 있어요."],
    whatToImprove: ["속마음을 먼저 꺼내는 데 시간이 좀 걸려요."],
  },
  roadmap: { firstAction: "", phases: [] },
  tags: ["#표현중시형", "#집순이집돌이형", "#직진소통형", "#편안함추구형"],
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const response = new ImageResponse(buildSelfIntroCardElement(MOCK), {
    width: INVITATION_CARD_WIDTH,
    height: INVITATION_CARD_HEIGHT,
    fonts: loadInvitationFonts(),
  });
  const optimized = await optimizeCardPng(Buffer.from(await response.arrayBuffer()));
  return new Response(optimized, { headers: { "Content-Type": "image/png" } });
}

import { notFound } from "next/navigation";
import { TasteQuestionnaireV1Client } from "./QuizV1Client";

// TASTE QUESTIONNAIRE v1 전용 dev 페이지 — production에서는 404.
// 다른 dev 라우트와 같은 이유로 NODE_ENV가 아니라 VERCEL_ENV로
// 판단한다(Vercel Preview에서는 열리고 Production에서만 막힌다).
//
// 이전 프로토타입(QuizClient.tsx, Q1/Q2 2문항)은 dev 참고용으로 그대로
// 남아 있다 — 이 라우트가 QuizV1Client.tsx(실제 6 PAGE)로 교체됐을 뿐,
// QuizClient.tsx 자체는 건드리지 않았다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function PersonalMagazineQuizPage() {
  if (isBlocked()) notFound();

  return <TasteQuestionnaireV1Client />;
}

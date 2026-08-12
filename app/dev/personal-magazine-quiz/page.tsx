import { notFound } from "next/navigation";
import { QuizSkeletonPrototype } from "./QuizClient";

// EDITORIAL QUIZ SKELETON 전용 dev 페이지 — production에서는 404.
// 다른 dev 라우트와 같은 이유로 NODE_ENV가 아니라 VERCEL_ENV로
// 판단한다(Vercel Preview에서는 열리고 Production에서만 막힌다).
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function PersonalMagazineQuizPage() {
  if (isBlocked()) notFound();

  return <QuizSkeletonPrototype />;
}

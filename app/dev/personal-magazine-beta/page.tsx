import { notFound } from "next/navigation";
import { PersonalMagazineBetaClient } from "./PersonalMagazineBetaClient";

// PRIVATE BETA 0.9 — HOME → TASTE INTRO → 기존 TASTE JOURNEY 진입 전용
// public-facing dev route. 다른 dev 라우트와 같은 이유로 NODE_ENV가
// 아니라 VERCEL_ENV로 판단한다(Vercel Preview에서는 열리고 Production
// 에서만 막힌다) — 실제 도메인 연결은 이번 라운드에서 하지 않는다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function PersonalMagazineBetaPage() {
  if (isBlocked()) notFound();

  return <PersonalMagazineBetaClient />;
}

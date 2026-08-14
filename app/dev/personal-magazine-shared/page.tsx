import { notFound } from "next/navigation";
import { SharedIssueLandingClient } from "./SharedIssueLandingClient";

// VIRAL LOOP PROTOTYPE(2026-08) — Share Recipient Landing. 다른
// dev 라우트와 같은 이유로 NODE_ENV가 아니라 VERCEL_ENV로 판단한다
// (Vercel Preview에서는 열리고 Production에서만 막힌다). 아직 실제
// production routing/공유 backend는 결정하지 않았다 — 이 라우트는
// prototype이다.
export const dynamic = "force-dynamic";

function isBlocked(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export default function PersonalMagazineSharedPage() {
  if (isBlocked()) notFound();

  return <SharedIssueLandingClient />;
}

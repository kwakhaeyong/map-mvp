import { MapSession } from "../types";

// Shared by the client (CTA visibility, Result screen gate) and the
// generate-result API route so both sides agree on the same threshold —
// otherwise a CTA that appears client-side could still get rejected by the
// server's own check.
export const MIN_USER_TURNS_FOR_RESULT = 3;
export const MIN_USER_CHARS_FOR_RESULT = 240;

// A user who says one long, detailed message shouldn't be told the
// conversation is "too short" just because it's a single turn — count
// total characters across all their messages as an alternate path to
// readiness. Short conversations (few turns, few characters) still block.
export function isReadyForResult(session: MapSession): boolean {
  const userMessages = session.messages.filter((message) => message.role === "user");
  if (userMessages.length >= MIN_USER_TURNS_FOR_RESULT) return true;
  const totalChars = userMessages.reduce((sum, message) => sum + message.text.length, 0);
  return totalChars >= MIN_USER_CHARS_FOR_RESULT;
}

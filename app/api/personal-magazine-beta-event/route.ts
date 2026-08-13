import { NextResponse } from "next/server";
import {
  BETA_ACTION_EVENTS,
  isBetaStoreConfigured,
  recordBetaAction,
  recordBetaFeedback,
  type BetaActionEvent,
} from "../../../src/data/personalMagazineBetaStore";

// PERSONAL MAGAZINE PRIVATE BETA — 중앙 이벤트 수집 endpoint(2026-08).
// §10 "임의 JSON 전체 저장 금지" — request body를 그대로 저장하지 않고,
// event 이름별로 정확히 어떤 필드를 받을지 여기서 하나씩 꺼내 검증한
// 다음, 검증된 값만 store 함수에 넘긴다. whitelist에 없는 event나
// 형식이 안 맞는 값은 전부 400으로 거절한다.
//
// 인증이 없는 이유: 이 endpoint는 §9가 명시한 "전체 Beta 데이터를 GET"
// 하는 통로가 아니다 — POST로 자기 자신의 이벤트 하나만 "쓸" 수 있고,
// 어떤 방식으로도 "읽을" 수 없다(응답은 { ok: boolean }뿐, 저장된
// 값을 되돌려주지 않는다). 전체 데이터 조회는 이 파일과 무관한
// dev-only Server Component(getBetaCentralSummary 직접 호출)에서만
// 가능하다.
export const dynamic = "force-dynamic";

const PARTICIPANT_ID_RE = /^pm_beta_[a-z0-9]{8,32}$/;
const ISSUE_ID_RE = /^[a-z0-9-]{1,64}$/;
const MAX_COMMENT_LENGTH = 500;

function isValidParticipantId(value: unknown): value is string {
  return typeof value === "string" && PARTICIPANT_ID_RE.test(value);
}

function isValidIssueId(value: unknown): value is string {
  return typeof value === "string" && ISSUE_ID_RE.test(value);
}

function isValidScore(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function isValidComment(value: unknown): value is string | null {
  if (value === null || value === undefined) return true;
  return typeof value === "string" && value.length <= MAX_COMMENT_LENGTH;
}

type RequestBody = { participantId?: unknown; issueId?: unknown; event?: unknown; data?: unknown };

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  if (!isBetaStoreConfigured()) {
    // §7 — 중앙 저장이 지금 불가능해도 제품 흐름을 막는 에러가 아니다.
    // 클라이언트는 이 응답을 UI에 노출하지 않는다(sendBetaEvent가
    // 항상 실패를 조용히 삼킨다). 200이 아니라 편의상 503을 주지만,
    // 클라이언트는 상태 코드를 아예 보지 않는다.
    return NextResponse.json({ ok: false, message: "beta store unavailable" }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) return badRequest("invalid request body");
  const { participantId, issueId, event, data } = body as RequestBody;

  if (!isValidParticipantId(participantId)) return badRequest("invalid participantId");
  if (typeof event !== "string") return badRequest("invalid event");

  if (event === "feedback_submitted") {
    if (!isValidIssueId(issueId)) return badRequest("invalid issueId");
    const payload = (data ?? {}) as Record<string, unknown>;
    if (!isValidScore(payload.resonance) || !isValidScore(payload.desire) || !isValidScore(payload.continuation)) {
      return badRequest("invalid R/D/C score — must be integer 1-5");
    }
    if (!isValidComment(payload.mostLikeMe)) return badRequest("comment too long");
    const ok = await recordBetaFeedback({
      participantId,
      issueId,
      resonance: payload.resonance,
      desire: payload.desire,
      continuation: payload.continuation,
      mostLikeMe: (payload.mostLikeMe as string | null) ?? null,
    });
    return NextResponse.json({ ok });
  }

  if (!(BETA_ACTION_EVENTS as readonly string[]).includes(event)) return badRequest("event not in whitelist");
  const actionEvent = event as BetaActionEvent;

  if (actionEvent === "share_attempted") {
    const method = (data as Record<string, unknown> | undefined)?.method;
    if (method !== "native" && method !== "fallback") return badRequest("invalid share method");
    const ok = await recordBetaAction({ event: actionEvent, participantId, method });
    return NextResponse.json({ ok });
  }

  if (actionEvent === "next_chapter_selected" || actionEvent === "next_chapter_confirmed") {
    const chapter = (data as Record<string, unknown> | undefined)?.chapter;
    if (chapter !== "travel" && chapter !== "style") return badRequest("invalid chapter");
    const ok = await recordBetaAction({ event: actionEvent, participantId, chapter });
    return NextResponse.json({ ok });
  }

  const ok = await recordBetaAction({ event: actionEvent, participantId });
  return NextResponse.json({ ok });
}

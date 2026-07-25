// 공유 API가 받는 데이터는 브라우저(클라이언트)가 보낸 것이라 그대로
// 믿지 않는다 — 우리 이상형 결과와 같은 모양인지, 크기가 적당한지를
// 저장 전에 확인한다. engine/ideal-type-generator.ts의 검증 로직과는
// 별개로 새로 작성했다(그 파일은 AI 응답 검증용이고 건드리지 않는다).
// 여기서는 "이상하거나 너무 큰 데이터를 저장하지 않는다"는 방어 목적만
// 있으므로 문자열이 비어있는지 같은 세부 검증은 하지 않는다.

const MAX_PAYLOAD_BYTES = 20_000;
const MAX_STRING_LENGTH = 400;
const MAX_ARRAY_LENGTH = 6;

function isShortString(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_STRING_LENGTH;
}

function isShortStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= MAX_ARRAY_LENGTH && value.every(isShortString);
}

function isValidAxisLabel(value: unknown): boolean {
  const v = value as { low?: unknown; high?: unknown } | undefined;
  return typeof v === "object" && v !== null && isShortString(v.low) && isShortString(v.high);
}

function isValidIdealTypeResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const criteria = r.criteria as Record<string, unknown> | undefined;
  if (typeof criteria !== "object" || criteria === null) return false;
  if (!isShortStringArray(criteria.mustHave) || !isShortStringArray(criteria.niceToHave) || !isShortStringArray(criteria.canCompromise)) return false;

  if (!isShortStringArray(r.attractionPatterns)) return false;

  const matrix = r.matrix as Record<string, unknown> | undefined;
  if (typeof matrix !== "object" || matrix === null) return false;
  if (!isValidAxisLabel(matrix.xAxisLabel) || !isValidAxisLabel(matrix.yAxisLabel)) return false;
  const types = matrix.types;
  if (!Array.isArray(types) || types.length > MAX_ARRAY_LENGTH) return false;
  const typesValid = types.every(
    (point) =>
      typeof point === "object" && point !== null &&
      isShortString((point as Record<string, unknown>).label) &&
      isShortString((point as Record<string, unknown>).description) &&
      typeof (point as Record<string, unknown>).x === "number" &&
      typeof (point as Record<string, unknown>).y === "number",
  );
  if (!typesValid) return false;

  const flags = r.flags as Record<string, unknown> | undefined;
  if (typeof flags !== "object" || flags === null) return false;
  if (!isShortStringArray(flags.green) || !isShortStringArray(flags.red)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.whatYouOffer) || !isShortStringArray(selfReflection.whatToImprove)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  return phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
}

export type ShareValidationFailure = "too_large" | "unsupported_topic" | "invalid_shape";
export type ShareValidationResult = { ok: true } | { ok: false; reason: ShareValidationFailure };

// 지금은 이상형만 공유를 지원한다 — 다른 주제는 결과 구조가 다르므로
// 화이트리스트 밖 topicId는 전부 거부한다.
const SUPPORTED_SHARE_TOPICS: Record<string, (result: unknown) => boolean> = {
  idealType: isValidIdealTypeResultShape,
};

export function validateSharePayload(topicId: unknown, result: unknown): ShareValidationResult {
  if (JSON.stringify(result ?? null).length > MAX_PAYLOAD_BYTES) return { ok: false, reason: "too_large" };
  if (typeof topicId !== "string" || !(topicId in SUPPORTED_SHARE_TOPICS)) return { ok: false, reason: "unsupported_topic" };
  if (!SUPPORTED_SHARE_TOPICS[topicId](result)) return { ok: false, reason: "invalid_shape" };
  return { ok: true };
}

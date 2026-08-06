// 공유 API가 받는 데이터는 브라우저(클라이언트)가 보낸 것이라 그대로
// 믿지 않는다 — 지원하는 주제(이상형/진로)의 결과와 같은 모양인지, 크기가
// 적당한지를 저장 전에 확인한다. engine/ideal-type-generator.ts,
// engine/final-result-generator.ts의 검증 로직과는 별개로 새로 작성했다
// (그 파일들은 AI 응답 검증용이고 건드리지 않는다). 여기서는 "이상하거나
// 너무 큰 데이터를 저장하지 않는다"는 방어 목적만 있으므로 문자열이
// 비어있는지 같은 세부 검증, 내용 검열은 하지 않는다.

const MAX_PAYLOAD_BYTES = 20_000;
const MAX_STRING_LENGTH = 400;
const MAX_ARRAY_LENGTH = 6;
// 진로 결과(FinalResult)는 이상형과 배열 길이 기준이 다르다 — 요인은
// 최대 8개까지 그대로 저장되고(final-result-generator.ts의
// raw.factors.slice(0, 8)), 시나리오·타임라인 단계·통찰 메시지·장단점은
// 코드에서 별도로 자르지 않는다. 여기서는 "이상하거나 너무 큰 데이터를
// 막는다"는 방어 목적만 있으므로 여유 있게 넉넉한 상한만 둔다.
const MAX_CAREER_ARRAY_LENGTH = 10;

function isShortString(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_STRING_LENGTH;
}

function isStringArrayUpTo(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every(isShortString);
}

function isShortStringArray(value: unknown): value is string[] {
  return isStringArrayUpTo(value, MAX_ARRAY_LENGTH);
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
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  // 태그(공유 태그 시스템)는 이 기능 이전에 저장된 결과에는 아예 없다 —
  // 없어도(undefined) 통과시키고, 있으면 고정 사전에서 나온 짧은 문자열
  // 배열이라는 것만 확인한다(어떤 문자열이 실제 사전에 있는지까지는
  // 여기서 재검증하지 않는다 — 이 파일의 목적은 "이상하거나 너무 큰
  // 데이터 방지"이지 내용 검열이 아니다).
  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 나 소개·성격 결과(SelfIntroResult) 형태 검증. 이상형과 필드 이름은
// 다르지만(coreValues/patterns/traits) 배열 개수·문자열 길이 상한은
// 그대로 재사용한다 — engine/self-intro-generator.ts가 이상형과 같은
// capArray(4) 방식으로 자르므로 상한값도 같다.
function isValidSelfIntroResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const coreValues = r.coreValues as Record<string, unknown> | undefined;
  if (typeof coreValues !== "object" || coreValues === null) return false;
  if (!isShortStringArray(coreValues.mustKeep) || !isShortStringArray(coreValues.important) || !isShortStringArray(coreValues.flexible)) return false;

  if (!isShortStringArray(r.patterns)) return false;

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

  const traits = r.traits as Record<string, unknown> | undefined;
  if (typeof traits !== "object" || traits === null) return false;
  if (!isShortStringArray(traits.strengths) || !isShortStringArray(traits.cautions)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.whatYouOffer) || !isShortStringArray(selfReflection.whatToImprove)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 친구·인간관계 결과(FriendshipResult) 형태 검증. 이상형·나 소개와
// 마찬가지로 배열 개수·문자열 길이 상한은 그대로 재사용한다 —
// engine/friendship-generator.ts도 같은 capArray(4) 방식으로 자른다.
// 필드 이름만 다르다(friendCriteria/friendTypes).
function isValidFriendshipResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const friendCriteria = r.friendCriteria as Record<string, unknown> | undefined;
  if (typeof friendCriteria !== "object" || friendCriteria === null) return false;
  if (!isShortStringArray(friendCriteria.essential) || !isShortStringArray(friendCriteria.bonus) || !isShortStringArray(friendCriteria.flexible)) return false;

  if (!isShortStringArray(r.patterns)) return false;

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

  const friendTypes = r.friendTypes as Record<string, unknown> | undefined;
  if (typeof friendTypes !== "object" || friendTypes === null) return false;
  if (!isShortStringArray(friendTypes.wellMatched) || !isShortStringArray(friendTypes.friction)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.whatYouOffer) || !isShortStringArray(selfReflection.whatToImprove)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 일할 때의 나 결과(WorkResult) 형태 검증. 이상형·나 소개·친구와
// 마찬가지로 배열 개수·문자열 길이 상한은 그대로 재사용한다 —
// engine/work-generator.ts도 같은 capArray(4) 방식으로 자른다.
// 필드 이름만 다르다(workDrivers/workFit/selfReflection의 strengths·
// blindSpots).
function isValidWorkResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const workDrivers = r.workDrivers as Record<string, unknown> | undefined;
  if (typeof workDrivers !== "object" || workDrivers === null) return false;
  if (!isShortStringArray(workDrivers.essential) || !isShortStringArray(workDrivers.boost) || !isShortStringArray(workDrivers.optional)) return false;

  if (!isShortStringArray(r.patterns)) return false;

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

  const workFit = r.workFit as Record<string, unknown> | undefined;
  if (typeof workFit !== "object" || workFit === null) return false;
  if (!isShortStringArray(workFit.thriving) || !isShortStringArray(workFit.draining)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.strengths) || !isShortStringArray(selfReflection.blindSpots)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 취향 결과(TasteResult) 형태 검증. 이상형·나 소개·친구·일할 때의
// 나와 마찬가지로 배열 개수·문자열 길이 상한은 그대로 재사용한다 —
// engine/taste-generator.ts도 같은 capArray(4) 방식으로 자른다.
// 필드 이름만 다르다(tasteCore의 certain/conditional/indifferent,
// tasteMap의 expand/avoid, selfReflection의 awareness/blindSpots).
function isValidTasteResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const tasteCore = r.tasteCore as Record<string, unknown> | undefined;
  if (typeof tasteCore !== "object" || tasteCore === null) return false;
  if (!isShortStringArray(tasteCore.certain) || !isShortStringArray(tasteCore.conditional) || !isShortStringArray(tasteCore.indifferent)) return false;

  if (!isShortStringArray(r.patterns)) return false;

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

  const tasteMap = r.tasteMap as Record<string, unknown> | undefined;
  if (typeof tasteMap !== "object" || tasteMap === null) return false;
  if (!isShortStringArray(tasteMap.expand) || !isShortStringArray(tasteMap.avoid)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.awareness) || !isShortStringArray(selfReflection.blindSpots)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 여행 스타일 결과(TravelResult) 형태 검증. 이상형·나 소개·친구·일할
// 때의 나·취향과 마찬가지로 배열 개수·문자열 길이 상한은 그대로
// 재사용한다 — engine/travel-generator.ts도 같은 capArray(4) 방식으로
// 자른다. 필드 이름만 다르다(travelCriteria의 mustHave/niceToHave/
// optional, travelFit의 goodFit/poorFit, selfReflection의 awareness/
// blindSpots).
function isValidTravelResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  if (!isShortString(r.title) || !isShortString(r.oneLiner)) return false;

  const travelCriteria = r.travelCriteria as Record<string, unknown> | undefined;
  if (typeof travelCriteria !== "object" || travelCriteria === null) return false;
  if (!isShortStringArray(travelCriteria.mustHave) || !isShortStringArray(travelCriteria.niceToHave) || !isShortStringArray(travelCriteria.optional)) return false;

  if (!isShortStringArray(r.patterns)) return false;

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

  const travelFit = r.travelFit as Record<string, unknown> | undefined;
  if (typeof travelFit !== "object" || travelFit === null) return false;
  if (!isShortStringArray(travelFit.goodFit) || !isShortStringArray(travelFit.poorFit)) return false;

  const selfReflection = r.selfReflection as Record<string, unknown> | undefined;
  if (typeof selfReflection !== "object" || selfReflection === null) return false;
  if (!isShortStringArray(selfReflection.awareness) || !isShortStringArray(selfReflection.blindSpots)) return false;

  const roadmap = r.roadmap as Record<string, unknown> | undefined;
  if (typeof roadmap !== "object" || roadmap === null) return false;
  if (!isShortString(roadmap.firstAction)) return false;
  const phases = roadmap.phases;
  if (!Array.isArray(phases) || phases.length > MAX_ARRAY_LENGTH) return false;
  const phasesValid = phases.every(
    (phase) =>
      typeof phase === "object" && phase !== null &&
      isShortString((phase as Record<string, unknown>).label) &&
      isShortStringArray((phase as Record<string, unknown>).actions),
  );
  if (!phasesValid) return false;

  if (r.tags !== undefined && !isShortStringArray(r.tags)) return false;

  return true;
}

// 진로 결과(FinalResult) 형태 검증. 요인 매트릭스·시나리오·타임라인·
// 통찰 4블록 — final-result-generator.ts가 실제로 만들어내는 구조를
// 그대로 옮겼다(그 파일 자체는 AI 응답 검증용이라 건드리지 않는다).
function isValidFactorMatrixShape(value: unknown): boolean {
  const fm = value as Record<string, unknown> | undefined;
  if (typeof fm !== "object" || fm === null) return false;
  if (!isValidAxisLabel(fm.xAxisLabel) || !isValidAxisLabel(fm.yAxisLabel)) return false;
  const factors = fm.factors;
  if (!Array.isArray(factors) || factors.length > MAX_CAREER_ARRAY_LENGTH) return false;
  return factors.every((factor) => {
    const f = factor as Record<string, unknown> | undefined;
    return (
      typeof f === "object" && f !== null &&
      isShortString(f.id) && isShortString(f.text) && isShortString(f.kind) &&
      typeof f.x === "number" && typeof f.y === "number"
    );
  });
}

function isValidScenarioBlockShape(value: unknown): boolean {
  const sc = value as Record<string, unknown> | undefined;
  if (typeof sc !== "object" || sc === null) return false;
  const scenarios = sc.scenarios;
  if (!Array.isArray(scenarios) || scenarios.length > MAX_CAREER_ARRAY_LENGTH) return false;
  const scenariosValid = scenarios.every((item) => {
    const s = item as Record<string, unknown> | undefined;
    return (
      typeof s === "object" && s !== null &&
      isShortString(s.id) && isShortString(s.name) && isShortString(s.summary) &&
      isStringArrayUpTo(s.pros, MAX_CAREER_ARRAY_LENGTH) && isStringArrayUpTo(s.cons, MAX_CAREER_ARRAY_LENGTH)
    );
  });
  if (!scenariosValid) return false;
  const closestFit = sc.closestFit;
  if (closestFit === null) return true;
  const cf = closestFit as Record<string, unknown> | undefined;
  return typeof cf === "object" && cf !== null && isShortString(cf.scenarioId) && isShortString(cf.reasoning);
}

function isValidTimelineBlockShape(value: unknown): boolean {
  const tl = value as Record<string, unknown> | undefined;
  if (typeof tl !== "object" || tl === null) return false;
  const phases = tl.phases;
  if (!Array.isArray(phases) || phases.length > MAX_CAREER_ARRAY_LENGTH) return false;
  return phases.every((phase) => {
    const p = phase as Record<string, unknown> | undefined;
    return typeof p === "object" && p !== null && isShortString(p.id) && isShortString(p.label) && isStringArrayUpTo(p.actions, MAX_CAREER_ARRAY_LENGTH);
  });
}

function isValidInsightBlockShape(value: unknown): boolean {
  const ins = value as Record<string, unknown> | undefined;
  if (typeof ins !== "object" || ins === null) return false;
  return isStringArrayUpTo(ins.messages, MAX_CAREER_ARRAY_LENGTH);
}

function isValidFinalResultShape(value: unknown): boolean {
  const r = value as Record<string, unknown> | undefined;
  if (typeof r !== "object" || r === null) return false;
  return (
    isValidFactorMatrixShape(r.factorMatrix) &&
    isValidScenarioBlockShape(r.scenarios) &&
    isValidTimelineBlockShape(r.timeline) &&
    isValidInsightBlockShape(r.insights)
  );
}

export type ShareValidationFailure = "too_large" | "unsupported_topic" | "invalid_shape";
export type ShareValidationResult = { ok: true } | { ok: false; reason: ShareValidationFailure };

// 화이트리스트 밖 topicId는 전부 거부한다 — 결과 구조가 주제마다 달라서,
// 지원하는 형태만 골라 검증해야 한다.
const SUPPORTED_SHARE_TOPICS: Record<string, (result: unknown) => boolean> = {
  idealType: isValidIdealTypeResultShape,
  career: isValidFinalResultShape,
  selfIntro: isValidSelfIntroResultShape,
  friendship: isValidFriendshipResultShape,
  work: isValidWorkResultShape,
  taste: isValidTasteResultShape,
  travelStyle: isValidTravelResultShape,
};

export function validateSharePayload(topicId: unknown, result: unknown): ShareValidationResult {
  if (JSON.stringify(result ?? null).length > MAX_PAYLOAD_BYTES) return { ok: false, reason: "too_large" };
  if (typeof topicId !== "string" || !(topicId in SUPPORTED_SHARE_TOPICS)) return { ok: false, reason: "unsupported_topic" };
  if (!SUPPORTED_SHARE_TOPICS[topicId](result)) return { ok: false, reason: "invalid_shape" };
  return { ok: true };
}

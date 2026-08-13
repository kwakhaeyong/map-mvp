// TASTE ANALYSIS MODEL v1(2026-08) — dev 전용 데이터/로직 레이어.
// Personal Magazine의 최상위 원칙: 재미있게 선택하게 하고, 뒤에서는
// 훨씬 깊게 해석하고, 결과에서는 그 깊이를 Magazine 문법으로 보여준다.
//
// 파이프라인:
//   USER ANSWERS
//   → MULTI-DIMENSIONAL SIGNALS (문항 하나가 여러 축에 동시에 기여)
//   → CROSS-VALIDATION (같은 축을 여러 문항에서 다시 확인 → confidence)
//   → CORE TRAITS / CONTRADICTIONS
//   → NARRATIVE SYNTHESIS → MAGAZINE TEXT
//   → PAGE PRIORITY / VISUAL DIRECTION
//
// "A 선택 = 내향형" 같은 1:1 매핑은 쓰지 않는다 — 문항 하나가 6개 축
// 전부에 조금씩 기여하고, 여러 문항이 같은 축에 다시 신호를 주면서
// confidence와 contradiction이 함께 계산된다.
//
// 이 파일은 dev 전용이다. 실제 TASTE Result 화면/생성 API에는 아직
// 연결하지 않는다(연결은 별도 라운드에서 진행).

// ============================================================
// 1. SIGNAL 축
// ============================================================
// v1(2026-08) TASTE Questionnaire 실제 구현에 맞춰 expression/attachment
// 2개 축을 추가한다(GPT 확정 Spec). 기존 6축은 그대로 유지.
export type TasteSignalKey = "stimulus" | "socialDensity" | "pace" | "curation" | "sensory" | "novelty" | "expression" | "attachment";

export const TASTE_SIGNAL_KEYS: TasteSignalKey[] = [
  "stimulus",
  "socialDensity",
  "pace",
  "curation",
  "sensory",
  "novelty",
  "expression",
  "attachment",
];

export const TASTE_SIGNAL_LABELS: Record<TasteSignalKey, string> = {
  stimulus: "STIMULUS",
  socialDensity: "SOCIAL DENSITY",
  pace: "PACE",
  curation: "CURATION",
  sensory: "SENSORY",
  novelty: "NOVELTY",
  expression: "EXPRESSION",
  attachment: "ATTACHMENT",
};

// 문항 하나가 한 축에 주는 개별 기여값. ±100 전체를 한 문항이 주지
// 않는다 — weak=±5, medium=±10, strong=±15 정도의 가중치를 합산한다.
export type SignalScore = number;

export type SignalContribution = Partial<Record<TasteSignalKey, SignalScore>>;

// Q1/Q2가 이미 쓰고 있는 챕터 구조(PLACE/OBJECT/DETAIL/RITUAL)를
// QuizClient.tsx를 건드리지 않고 이 데이터 레이어에서도 참조하기
// 위해 동일한 이름으로 다시 선언한다.
export type PageSectionKey = "place" | "object" | "detail" | "ritual";

export type SignalSource = {
  questionId: string;
  answerId: string;
  pageSection: PageSectionKey;
  label: string; // "Q1 · 장면 선택 · 조용한 카페" 같은 사람이 읽는 출처 표시
  signals: SignalContribution;
  semanticTags: string[];
};

// ============================================================
// 2. Q1 / Q2 SIGNAL MAP — v1 provisional 값. 나중에 쉽게 조정할 수
// 있도록 코드가 아니라 데이터로 둔다.
// ============================================================
export const Q1_SIGNAL_SOURCES: Record<string, SignalSource> = {
  cafe: {
    questionId: "q1",
    answerId: "cafe",
    pageSection: "place",
    label: "Q1 · 장면 선택 · 조용한 카페",
    signals: { stimulus: -15, socialDensity: -10, pace: -15, curation: 5, sensory: 10, novelty: 0 },
    semanticTags: ["quiet", "solitude", "reading"],
  },
  city: {
    questionId: "q1",
    answerId: "city",
    pageSection: "place",
    label: "Q1 · 장면 선택 · 활기찬 도시",
    signals: { stimulus: 15, socialDensity: 15, pace: 10, curation: 0, sensory: 5, novelty: 5 },
    semanticTags: ["energy", "social", "night"],
  },
};

export const Q2_SIGNAL_SOURCES: Record<string, SignalSource> = {
  camera: {
    questionId: "q2",
    answerId: "camera",
    pageSection: "object",
    label: "Q2 · 물건 선택 · 필름카메라",
    signals: { pace: -5, curation: 10, sensory: 10, novelty: 0 },
    semanticTags: ["memory", "record", "analog", "story"],
  },
  speaker: {
    questionId: "q2",
    answerId: "speaker",
    pageSection: "object",
    label: "Q2 · 물건 선택 · 스피커",
    signals: { stimulus: 5, socialDensity: 5, pace: 0, curation: 5, sensory: 15, novelty: 5 },
    semanticTags: ["music", "atmosphere", "experience", "space"],
  },
  notebook: {
    questionId: "q2",
    answerId: "notebook",
    pageSection: "object",
    label: "Q2 · 물건 선택 · 노트",
    signals: { stimulus: -5, socialDensity: -5, pace: -10, curation: 10, sensory: 10, novelty: 0 },
    semanticTags: ["reflection", "writing", "private", "tactile"],
  },
  object: {
    questionId: "q2",
    answerId: "object",
    pageSection: "object",
    label: "Q2 · 물건 선택 · 오브제",
    signals: { stimulus: 0, socialDensity: 0, pace: -5, curation: 15, sensory: 10, novelty: 5 },
    semanticTags: ["form", "aesthetic", "visual", "curated"],
  },
};

// ============================================================
// 3. AGGREGATE — signal 합산 + cross-validation(confidence)
// ============================================================
function createZeroSignalRecord(): Record<TasteSignalKey, number> {
  const record = {} as Record<TasteSignalKey, number>;
  for (const key of TASTE_SIGNAL_KEYS) record[key] = 0;
  return record;
}

export type SignalAggregate = {
  signals: Record<TasteSignalKey, number>;
  // 같은 축을 몇 개의 서로 다른 문항이 확인했는지 + 방향이 일치하는지로
  // 계산한 0~100 신뢰도. 소스가 없으면 0, 1개면 50(부분 확인), 2개
  // 이상이면서 방향이 일치하면 100, 방향이 갈리면 50(모순 가능성).
  confidence: Record<TasteSignalKey, number>;
  sourcesByAxis: Record<TasteSignalKey, SignalSource[]>;
};

export function aggregateSignals(sources: SignalSource[]): SignalAggregate {
  const signals = createZeroSignalRecord();
  const sourcesByAxis = {} as Record<TasteSignalKey, SignalSource[]>;
  for (const key of TASTE_SIGNAL_KEYS) sourcesByAxis[key] = [];

  for (const source of sources) {
    for (const key of TASTE_SIGNAL_KEYS) {
      const value = source.signals[key];
      if (!value) continue; // undefined 또는 0은 이 축에 기여하지 않은 것으로 취급
      signals[key] += value;
      sourcesByAxis[key].push(source);
    }
  }
  for (const key of TASTE_SIGNAL_KEYS) {
    signals[key] = Math.max(-100, Math.min(100, signals[key]));
  }

  const confidence = createZeroSignalRecord();
  for (const key of TASTE_SIGNAL_KEYS) {
    const axisSources = sourcesByAxis[key];
    if (axisSources.length === 0) continue;
    const firstSign = Math.sign(axisSources[0].signals[key] ?? 0);
    const allAgree = axisSources.every((s) => Math.sign(s.signals[key] ?? 0) === firstSign);
    const coverage = Math.min(1, axisSources.length / 2);
    const agreement = allAgree ? 1 : 0.5;
    confidence[key] = Math.round(coverage * agreement * 100);
  }

  return { signals, confidence, sourcesByAxis };
}

// ============================================================
// 4. CONTRADICTION — 평균으로 지워지지 않는 핵심 결과.
// ============================================================
export type Contradiction = {
  id: string;
  axis: TasteSignalKey;
  title: string;
  interpretation: string;
  evidence: string[];
};

// expression/attachment 항목은 아직 GPT 확정 카피가 없어 의도적으로
// 비워둔다(Partial) — detectContradictions()가 이 두 축은 건너뛴다.
const CONTRADICTION_COPY: Partial<Record<TasteSignalKey, { title: string; interpretation: string; headline: string; pullQuote: string }>> = {
  stimulus: {
    title: "조용함과 자극 사이",
    interpretation:
      "일상의 장면에서는 자극이 적고 통제된 쪽을 고르지만, 곁에 두고 싶은 물건은 더 큰 자극과 경험을 향해 있습니다. 당신에게 중요한 건 자극의 크기가 아니라, 그 자극을 스스로 선택했는가에 가깝습니다.",
    headline: "조용함을 고르지만,\n자극을 밀어내진 않는 사람.",
    pullQuote: "고요함은 자극이 없어서가 아니라,\n내가 고른 자극이라서 편안하다.",
  },
  socialDensity: {
    title: "혼자와 함께 사이",
    interpretation:
      "쉬는 시간에는 혼자 있는 장면을 고르지만, 곁에 두고 싶은 물건은 사람과 에너지를 나누는 쪽을 향합니다. 혼자를 좋아한다기보다, 관계의 밀도를 스스로 조절하고 싶은 쪽에 가깝습니다.",
    headline: "혼자를 고르지만,\n사람을 밀어내진 않는 사람.",
    pullQuote: "혼자 있는 시간은 사람을 피해서가 아니라,\n밀도를 스스로 정하기 위해서다.",
  },
  pace: {
    title: "느림과 빠름 사이",
    interpretation:
      "여유로운 장면을 선호하면서도, 곁에 두고 싶은 물건은 더 즉흥적이고 활동적인 쪽을 가리킵니다. 속도 자체보다, 언제 느려지고 언제 빨라질지를 스스로 정하고 싶어하는 편입니다.",
    headline: "느림을 고르지만,\n멈춰 있지만은 않은 사람.",
    pullQuote: "여유는 속도가 없어서가 아니라,\n속도를 내가 정할 수 있어서다.",
  },
  curation: {
    title: "다양함과 선별 사이",
    interpretation:
      "여러 경험을 넓게 취하는 쪽에 마음이 가면서도, 곁에 두고 싶은 물건은 신중하게 고른 한 가지를 향합니다. 많이 갖는 것과 오래 좋아하는 것 사이에서, 상황에 따라 다른 기준을 쓰는 편입니다.",
    headline: "넓게 보지만,\n결국 하나를 고르는 사람.",
    pullQuote: "많이 보는 것과 오래 좋아하는 것은,\n다른 이야기다.",
  },
  sensory: {
    title: "실용과 감각 사이",
    interpretation:
      "기능과 효율을 우선하는 장면을 고르면서도, 곁에 두고 싶은 물건은 감각적이고 섬세한 쪽을 향합니다. 실용성과 감각적 만족 중 하나만 택하기보다, 상황에 따라 저울질하는 편입니다.",
    headline: "실용을 고르지만,\n감각을 포기하진 않는 사람.",
    pullQuote: "쓸모와 아름다움 사이에서,\n둘 다 놓지 않는다.",
  },
  novelty: {
    title: "익숙함과 새로움 사이",
    interpretation:
      "익숙한 장면에 마음이 가면서도, 곁에 두고 싶은 물건은 낯선 경험 쪽을 가리킵니다. 안정 자체보다, 언제 새로움을 향해 움직일지를 스스로 정하고 싶어하는 편입니다.",
    headline: "익숙함을 고르지만,\n새로움을 피하진 않는 사람.",
    pullQuote: "안정은 익숙해서가 아니라,\n내가 고를 수 있어서 온다.",
  },
};

export function detectContradictions(aggregate: SignalAggregate): Contradiction[] {
  const contradictions: Contradiction[] = [];
  for (const key of TASTE_SIGNAL_KEYS) {
    const axisSources = aggregate.sourcesByAxis[key];
    if (axisSources.length < 2) continue;
    const values = axisSources.map((s) => s.signals[key] ?? 0);
    const hasPositive = values.some((v) => v > 0);
    const hasNegative = values.some((v) => v < 0);
    if (!hasPositive || !hasNegative) continue;
    // expression/attachment(v1 신규 축)는 아직 GPT가 준 contradiction
    // 해석 카피가 없다 — 새 문구를 임의로 짓지 않고, signals/confidence
    // 원자료에는 반영하되 이 축에 대한 named contradiction 카드는
    // 만들지 않는다(다음 라운드에서 GPT Narrative Spec으로 채운다).
    const copy = CONTRADICTION_COPY[key];
    if (!copy) continue;
    contradictions.push({
      id: `contradiction-${key}`,
      axis: key,
      title: copy.title,
      interpretation: copy.interpretation,
      evidence: axisSources.map((s) => s.label),
    });
  }
  return contradictions;
}

// ============================================================
// 5. CORE TRAITS
// ============================================================
export type CoreTrait = {
  id: string;
  label: string;
  strength: number; // 0~100
  evidence: string[];
};

type TraitAxisRule = { key: TasteSignalKey; direction: "low" | "high" };

type TraitRule = {
  id: string;
  label: string;
  axes: TraitAxisRule[];
};

const TRAIT_RULES: TraitRule[] = [
  { id: "calm-controlled", label: "통제된 고요함", axes: [{ key: "stimulus", direction: "low" }, { key: "pace", direction: "low" }] },
  { id: "selective-curator", label: "선별하는 사람", axes: [{ key: "curation", direction: "high" }] },
  { id: "sensory-attuned", label: "감각에 예민함", axes: [{ key: "sensory", direction: "high" }] },
  { id: "socially-energized", label: "관계에서 에너지를 얻음", axes: [{ key: "socialDensity", direction: "high" }, { key: "stimulus", direction: "high" }] },
  { id: "solitary-focus", label: "혼자의 몰입을 선호함", axes: [{ key: "socialDensity", direction: "low" }] },
  { id: "explorer", label: "새로움을 향해 열려 있음", axes: [{ key: "novelty", direction: "high" }] },
  { id: "grounded-familiar", label: "익숙함 속의 안정", axes: [{ key: "novelty", direction: "low" }] },
  { id: "deliberate-pace", label: "여유로운 흐름을 선호함", axes: [{ key: "pace", direction: "low" }] },
];

const TRAIT_COPY: Record<string, { headline: string; phrase: string; pullQuote: string; keyword: string }> = {
  "calm-controlled": {
    headline: "많이 갖기보다,\n조용히 곁에 둘 것을 고르는 사람.",
    phrase: "자극이 적고 스스로 통제할 수 있는 환경에서 편안함을 느낍니다",
    pullQuote: "편안함은 아무것도 없어서가 아니라,\n내가 고를 수 있어서 온다.",
    keyword: "QUIET ENERGY",
  },
  "selective-curator": {
    headline: "많은 것보다,\n오래 좋아할 것을 고르는 사람.",
    phrase: "다양하게 경험하기보다 신중하게 고른 소수를 오래 곁에 두는 쪽을 선호합니다",
    pullQuote: "양보다,\n오래 가는 쪽을 고른다.",
    keyword: "SELECTIVE",
  },
  "sensory-attuned": {
    headline: "눈에 보이지 않는 것까지\n느끼는 사람.",
    phrase: "빛, 소재, 소리 같은 미세한 감각의 차이에 민감하게 반응합니다",
    pullQuote: "같은 공간도,\n감각으로 다르게 기억한다.",
    keyword: "SENSORY",
  },
  "socially-energized": {
    headline: "사람 속에서\n에너지를 얻는 사람.",
    phrase: "사람들과 에너지를 나누는 상황에서 활력을 얻는 편입니다",
    pullQuote: "혼자보다,\n함께일 때 더 선명해진다.",
    keyword: "SOCIAL SPARK",
  },
  "solitary-focus": {
    headline: "혼자의 시간에서\n몰입을 찾는 사람.",
    phrase: "혼자 있는 시간에 더 깊이 몰입하는 편입니다",
    pullQuote: "혼자라서 조용한 게 아니라,\n조용해야 들리는 게 있다.",
    keyword: "SELF-CONTAINED",
  },
  explorer: {
    headline: "익숙함보다\n낯섦에 끌리는 사람.",
    phrase: "새롭고 낯선 경험 쪽으로 자연스럽게 움직입니다",
    pullQuote: "가본 곳보다,\n안 가본 곳이 궁금하다.",
    keyword: "CURIOUS",
  },
  "grounded-familiar": {
    headline: "낯섦보다\n익숙함에 마음이 가는 사람.",
    phrase: "익숙하고 예측 가능한 것에서 안정감을 느낍니다",
    pullQuote: "안정은 지루함이 아니라,\n신뢰다.",
    keyword: "WARM MINIMAL",
  },
  "deliberate-pace": {
    headline: "서두르지 않는\n사람.",
    phrase: "느리고 여유 있는 흐름을 선호하는 편입니다",
    pullQuote: "천천히 가는 것도,\n방향이 있다면 속도다.",
    keyword: "UNHURRIED",
  },
};

const CORE_TRAIT_THRESHOLD = 20;
const SECONDARY_TRAIT_THRESHOLD = 8;

export function deriveTraits(aggregate: SignalAggregate): { coreTraits: CoreTrait[]; secondaryTraits: Array<{ id: string; label: string }> } {
  const scored = TRAIT_RULES.map((rule) => {
    const axisScores = rule.axes.map(({ key, direction }) => {
      const raw = aggregate.signals[key];
      const directional = direction === "high" ? raw : -raw;
      return Math.max(0, directional);
    });
    const strength = Math.round(axisScores.reduce((sum, v) => sum + v, 0) / axisScores.length);
    const evidence = Array.from(new Set(rule.axes.flatMap(({ key }) => aggregate.sourcesByAxis[key].map((s) => s.label))));
    return { id: rule.id, label: rule.label, strength, evidence };
  });

  scored.sort((a, b) => b.strength - a.strength);

  const coreTraits = scored.filter((t) => t.strength >= CORE_TRAIT_THRESHOLD).slice(0, 4);
  const secondaryTraits = scored
    .filter((t) => t.strength >= SECONDARY_TRAIT_THRESHOLD && t.strength < CORE_TRAIT_THRESHOLD)
    .map(({ id, label }) => ({ id, label }));

  return { coreTraits, secondaryTraits };
}

// ============================================================
// 6. EDITORIAL KEYWORDS
// ============================================================
export function deriveEditorialKeywords(
  coreTraits: CoreTrait[],
  secondaryTraits: Array<{ id: string; label: string }>,
  sources: SignalSource[]
): string[] {
  const traitIds = [...coreTraits.map((t) => t.id), ...secondaryTraits.map((t) => t.id)];
  const fromTraits = traitIds.map((id) => TRAIT_COPY[id]?.keyword).filter((k): k is string => Boolean(k));
  const keywords = Array.from(new Set(fromTraits));

  if (keywords.length < 4) {
    const tagPool = Array.from(new Set(sources.flatMap((s) => s.semanticTags))).map((t) => t.toUpperCase());
    for (const tag of tagPool) {
      if (keywords.length >= 6) break;
      if (!keywords.includes(tag)) keywords.push(tag);
    }
  }

  return keywords.slice(0, 6);
}

// ============================================================
// 7. MAGAZINE TEXT ARCHITECTURE — headline / summary / feature
// analysis / signature insight / pull quote. 여기서 만든 텍스트는
// "당신은 ~합니다. 또한 ~합니다." 같은 반복 문체를 쓰지 않는다 —
// Magazine 안에서 헤드라인·서브헤드·짧은 feature·풀쿼트로 흩어져
// 쓰이는 것을 전제로 짧고 편집된 문장 단위로 만든다.
// ============================================================
export type MagazineNarrative = {
  headline: string;
  summary: string;
  featureAnalysis: Array<{ section: PageSectionKey; text: string }>;
  signatureInsight: { title: string; text: string } | null;
  pullQuote: string;
};

const DEFAULT_HEADLINE = "아직 당신의 장면이 많지 않습니다.";
const DEFAULT_PULL_QUOTE = "더 많은 선택이 모이면,\n이야기가 시작됩니다.";

function buildSummary(
  topTrait: CoreTrait | undefined,
  secondaryTrait: CoreTrait | undefined,
  topContradiction: Contradiction | undefined
): string {
  if (!topTrait) return "아직 뚜렷한 성향을 읽기엔 답변이 충분하지 않습니다.";
  const topPhrase = TRAIT_COPY[topTrait.id]?.phrase ?? topTrait.label;
  const first = `당신은 ${topPhrase}.`;
  if (topContradiction) {
    return `${first} 다만 모든 상황에서 같은 방식은 아닙니다 — ${topContradiction.interpretation}`;
  }
  if (secondaryTrait) {
    const secondaryPhrase = TRAIT_COPY[secondaryTrait.id]?.phrase ?? secondaryTrait.label;
    return `${first} 동시에 ${secondaryPhrase}는 편이기도 합니다.`;
  }
  return first;
}

const PAGE_SECTION_ORDER: PageSectionKey[] = ["place", "object", "detail", "ritual"];
const PENDING_FEATURE_TEXT = "아직 답변이 없어 분석할 수 없습니다. 해당 문항이 추가되면 채워집니다.";

function buildPlaceFeature(sources: SignalSource[]): string {
  if (sources.length === 0) return PENDING_FEATURE_TEXT;
  const stimulus = sources.reduce((sum, s) => sum + (s.signals.stimulus ?? 0), 0);
  const social = sources.reduce((sum, s) => sum + (s.signals.socialDensity ?? 0), 0);
  if (stimulus < 0 || social < 0) {
    return "당신이 편안함을 느끼는 공간은 단순히 조용한 곳이 아닙니다. 사람과 소리의 밀도를 스스로 조절할 수 있을 때, 그 공간에 더 오래 머무르는 편입니다.";
  }
  return "당신이 편안함을 느끼는 공간은 정적인 곳이 아닙니다. 사람과 에너지가 오가는 흐름 속에 있을 때, 오히려 더 자연스럽게 머무르는 편입니다.";
}

function buildObjectFeature(sources: SignalSource[]): string {
  if (sources.length === 0) return PENDING_FEATURE_TEXT;
  const curation = sources.reduce((sum, s) => sum + (s.signals.curation ?? 0), 0);
  const sensory = sources.reduce((sum, s) => sum + (s.signals.sensory ?? 0), 0);
  if (curation >= 5 && sensory >= 5) {
    return "당신이 곁에 두고 싶은 물건은 기능만으로 고른 것이 아닙니다. 손에 닿는 질감, 시간이 쌓인 흔적처럼 감각적인 이유가 함께 작용합니다.";
  }
  if (curation >= 5) {
    return "당신은 물건을 넓게 모으기보다, 이유가 분명한 것만 신중하게 곁에 둡니다.";
  }
  return "당신이 곁에 두고 싶은 물건은 분위기와 경험을 만들어주는 쪽에 가깝습니다.";
}

function buildFeatureAnalysis(sources: SignalSource[]): Array<{ section: PageSectionKey; text: string }> {
  const bySection = {} as Record<PageSectionKey, SignalSource[]>;
  for (const section of PAGE_SECTION_ORDER) bySection[section] = [];
  for (const source of sources) bySection[source.pageSection].push(source);

  return PAGE_SECTION_ORDER.map((section) => {
    if (section === "place") return { section, text: buildPlaceFeature(bySection.place) };
    if (section === "object") return { section, text: buildObjectFeature(bySection.object) };
    return { section, text: PENDING_FEATURE_TEXT };
  });
}

function buildNarrative(
  aggregate: SignalAggregate,
  sources: SignalSource[],
  coreTraits: CoreTrait[],
  contradictions: Contradiction[]
): MagazineNarrative {
  const topTrait = coreTraits[0];
  const secondaryTrait = coreTraits[1];
  const topContradiction = contradictions[0];

  // topContradiction은 detectContradictions()가 이미 CONTRADICTION_COPY가
  // 있는 축만 만들어내므로 여기서는 항상 존재한다.
  const headline = topContradiction
    ? (CONTRADICTION_COPY[topContradiction.axis]?.headline ?? DEFAULT_HEADLINE)
    : topTrait
      ? (TRAIT_COPY[topTrait.id]?.headline ?? DEFAULT_HEADLINE)
      : DEFAULT_HEADLINE;

  const pullQuote = topContradiction
    ? (CONTRADICTION_COPY[topContradiction.axis]?.pullQuote ?? DEFAULT_PULL_QUOTE)
    : topTrait
      ? (TRAIT_COPY[topTrait.id]?.pullQuote ?? DEFAULT_PULL_QUOTE)
      : DEFAULT_PULL_QUOTE;

  const summary = buildSummary(topTrait, secondaryTrait, topContradiction);
  const featureAnalysis = buildFeatureAnalysis(sources);

  const signatureInsight = topContradiction
    ? { title: topContradiction.title, text: topContradiction.interpretation }
    : topTrait
      ? { title: topTrait.label, text: `당신에게 중요한 것은 ${TRAIT_COPY[topTrait.id]?.phrase ?? topTrait.label}는 점입니다.` }
      : null;

  return { headline, summary, featureAnalysis, signatureInsight, pullQuote };
}

// ============================================================
// 8. VISUAL DIRECTION — 분석 결과가 향후 이미지/레이아웃 선택에도
// 영향을 줄 수 있는 자리. 지금은 실제 이미지 교체 로직을 구현하지
// 않는다 — 방향성 데이터만 만든다.
// ============================================================
export type VisualDirection = {
  mood: string[];
  density: "low" | "medium" | "high";
  warmth: "cool" | "neutral" | "warm";
  imageStyle: string[];
};

function deriveVisualDirection(signals: Record<TasteSignalKey, number>): VisualDirection {
  const mood: string[] = [];
  const imageStyle: string[] = [];
  let density: "low" | "medium" | "high" = "medium";
  let warmth: "cool" | "neutral" | "warm" = "neutral";

  if (signals.sensory > 10 && signals.curation > 10) {
    mood.push("detail-rich", "refined");
    imageStyle.push("editorial close-up", "textured light");
    warmth = "warm";
  }
  if (signals.novelty > 10 && signals.pace > 10) {
    mood.push("dynamic");
    imageStyle.push("stronger contrast", "movement");
  }
  if (signals.stimulus < -5 && signals.pace < -5) {
    mood.push("calm", "whitespace");
    density = "low";
  }
  if (signals.stimulus > 10 || signals.socialDensity > 10) {
    density = "high";
  }
  if (mood.length === 0) mood.push("balanced");
  if (imageStyle.length === 0) imageStyle.push("natural light", "candid framing");

  return { mood: Array.from(new Set(mood)), density, warmth, imageStyle: Array.from(new Set(imageStyle)) };
}

// ============================================================
// 9. PAGE PRIORITY — 섹션마다 신호가 얼마나 쌓였는지에 비례한 가중치.
// 지금은 Q1(PLACE)/Q2(OBJECT)만 실제 문항이라 DETAIL/RITUAL은 0%로
// 정직하게 비어 있다 — Q3~Q6이 붙으면 자연히 채워진다.
// ============================================================
function derivePagePriority(sources: SignalSource[]): Array<{ section: PageSectionKey; weight: number }> {
  const totals = { place: 0, object: 0, detail: 0, ritual: 0 } as Record<PageSectionKey, number>;
  for (const source of sources) {
    const magnitude = Object.values(source.signals).reduce((sum: number, v) => sum + Math.abs(v ?? 0), 0);
    totals[source.pageSection] += magnitude;
  }
  const total = Object.values(totals).reduce((sum, v) => sum + v, 0) || 1;
  return PAGE_SECTION_ORDER.map((section) => ({ section, weight: Math.round((totals[section] / total) * 100) }));
}

// ============================================================
// 10. TOP-LEVEL RESULT + ANALYZE 파이프라인
// ============================================================
export type TasteAnalysisResult = {
  signals: Record<TasteSignalKey, number>;
  confidence: Record<TasteSignalKey, number>;
  coreTraits: CoreTrait[];
  secondaryTraits: Array<{ id: string; label: string }>;
  contradictions: Contradiction[];
  editorialKeywords: string[];
  narrative: MagazineNarrative;
  pagePriority: Array<{ section: PageSectionKey; weight: number }>;
  visualDirection: VisualDirection;
};

export type TasteAnswers = {
  q1?: string; // Q1_SIGNAL_SOURCES의 key ("cafe" | "city")
  q2?: string; // Q2_SIGNAL_SOURCES의 key ("camera" | "speaker" | "notebook" | "object")
};

// analyzeTaste()의 핵심 로직을 SignalSource[] 입력 기준으로 분리한
// 버전 — TASTE QUESTIONNAIRE v1(6 PAGE 실제 문항)처럼 Q1/Q2 2개짜리
// TasteAnswers shape에 갇히지 않는 입력을 분석할 때 이 함수를 직접
// 쓴다(src/data/tasteQuestionnaire.ts의 mapTasteAnswersToSignalSources()
// 출력을 그대로 받는다). analyzeTaste(answers)는 이 함수의 얇은
// wrapper로 남겨 기존 dev preview(/dev/personal-magazine-analysis)와
// 3개 PROTOTYPE mock profile을 그대로 유지한다.
export function analyzeTasteFromSources(sources: SignalSource[]): TasteAnalysisResult {
  const aggregate = aggregateSignals(sources);
  const { coreTraits, secondaryTraits } = deriveTraits(aggregate);
  const contradictions = detectContradictions(aggregate);
  const editorialKeywords = deriveEditorialKeywords(coreTraits, secondaryTraits, sources);
  const narrative = buildNarrative(aggregate, sources, coreTraits, contradictions);
  const pagePriority = derivePagePriority(sources);
  const visualDirection = deriveVisualDirection(aggregate.signals);

  return {
    signals: aggregate.signals,
    confidence: aggregate.confidence,
    coreTraits,
    secondaryTraits,
    contradictions,
    editorialKeywords,
    narrative,
    pagePriority,
    visualDirection,
  };
}

export function analyzeTaste(answers: TasteAnswers): TasteAnalysisResult {
  const sources: SignalSource[] = [];
  if (answers.q1 && Q1_SIGNAL_SOURCES[answers.q1]) sources.push(Q1_SIGNAL_SOURCES[answers.q1]);
  if (answers.q2 && Q2_SIGNAL_SOURCES[answers.q2]) sources.push(Q2_SIGNAL_SOURCES[answers.q2]);
  return analyzeTasteFromSources(sources);
}

// ============================================================
// 11. MOCK PROFILES — 분석 구조 검증용 3개 시나리오. PROFILE C는
// 의도적으로 장면(조용함)과 물건(자극/사교/감각) 신호가 충돌하도록
// 구성했다 — 평균으로 지워지지 않고 contradiction으로 남는지가
// 이번 라운드의 핵심 검증 지점이다.
// ============================================================
export type TasteMockProfile = {
  id: string;
  label: string;
  description: string;
  answers: TasteAnswers;
};

export const TASTE_MOCK_PROFILES: TasteMockProfile[] = [
  {
    id: "quiet-curator",
    label: "PROFILE A · QUIET CURATOR",
    description: "조용한 카페 + 노트 — 낮은 자극, 높은 큐레이션·감각",
    answers: { q1: "cafe", q2: "notebook" },
  },
  {
    id: "urban-explorer",
    label: "PROFILE B · URBAN EXPLORER",
    description: "활기찬 도시 + 스피커 — 높은 자극·사교·새로움",
    answers: { q1: "city", q2: "speaker" },
  },
  {
    id: "contradiction",
    label: "PROFILE C · CONTRADICTION",
    description: "조용한 카페 + 스피커 — 장면은 조용함, 물건은 자극/사교를 가리킴(의도적 충돌)",
    answers: { q1: "cafe", q2: "speaker" },
  },
];

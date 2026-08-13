// TASTE EDITORIAL NARRATIVE SYSTEM v1(2026-08) — dev 전용 데이터/로직
// 레이어.
//
// tasteAnalysis.ts의 signals/confidence/coreTraits/contradictions/
// keywords/pagePriority/visualDirection은 내부 분석 데이터(debug용)로
// 그대로 둔다 — 사용자에게 그 숫자를 그대로 보여주지 않는다.
//
// 이 파일은 그 분석 결과를 실제 Magazine에 실릴 수 있는 편집된
// 텍스트(TasteMagazineNarrative)로 바꾸는 레이어다:
//
//   RAW ANSWERS → tasteAnalysis.ts → TasteAnalysisResult
//   → tasteNarrative.ts → TasteMagazineNarrative → (다음 라운드) Magazine Result UI
//
// 원칙(Narrative Spec):
//   - "당신은 ~한 사람입니다" 같은 단일 trait 선언을 하지 않는다.
//   - signal 이름/점수/"분석 결과"라는 표현을 사용자 텍스트에 노출하지
//     않는다.
//   - 실제 사용자를 5개 validation profile 중 하나로 강제 분류하지
//     않는다 — opening/place/object/detail/ritual/interestingPart/
//     pullQuote/keywords 각각을 독립적으로 "가장 가까운 pattern
//     fragment"로 채운다. 그래서 opening은 A 계열, place는 D 계열,
//     object는 C 계열처럼 서로 다른 profile의 fragment가 한 사람의
//     Narrative 안에 섞일 수 있다.
//   - 이 파일의 모든 문장은 GPT가 전달한 5개 validation profile copy
//     map을 그대로 옮긴 것이다 — Claude가 새로 지은 문장은 없다. 이
//     엔진이 하는 일은 "어떤 신호 패턴일 때 어떤 fragment를 쓸지"
//     고르는 규칙(rule)뿐이다.

import { TASTE_SIGNAL_KEYS, type SignalSource, type TasteAnalysisResult, type TasteSignalKey } from "./tasteAnalysis";

// ============================================================
// 1. 최종 Narrative 구조
// ============================================================
export type TasteNarrativeFeature = {
  headline: string;
  body: string;
};

export type TasteMagazineNarrative = {
  opening: {
    eyebrow?: string;
    headline: string;
    summary: string;
  };
  features: {
    place: TasteNarrativeFeature;
    object: TasteNarrativeFeature;
    detail: TasteNarrativeFeature;
    ritual: TasteNarrativeFeature;
  };
  interestingPart?: TasteNarrativeFeature;
  pullQuote: string;
  keywords: string[];
  evidence: {
    headline: string[];
    place: string[];
    object: string[];
    detail: string[];
    ritual: string[];
    interestingPart?: string[];
  };
};

// ============================================================
// 2. VALIDATION PROFILE COPY MAP — GPT가 전달한 5개 profile의 문장을
// 그대로 옮긴 pattern fragment 저장소. 여기 있는 문자열은 한 글자도
// 새로 짓지 않았다.
//
// NARRATIVE_COPY/타입은 Narrative v2(tasteNarrativeV2.ts)가 §7에서
// 카피가 비어 있는 조각(pullQuote/interestingPart 일부)을 빌려 쓸 수
// 있도록 export한다 — v2도 "새 문장을 짓지 않는다" 원칙을 지키기
// 위해 이미 승인된 v1 문구를 그대로 재사용하는 것이다.
// ============================================================
export type NarrativeProfileId = "quiet-curator" | "urban-explorer" | "practical-editor" | "quiet-explorer" | "contradiction";

export type NarrativeProfileCopy = {
  id: NarrativeProfileId;
  opening: { headline: string; summary: string };
  place: TasteNarrativeFeature;
  object: TasteNarrativeFeature;
  detail: TasteNarrativeFeature;
  ritual: TasteNarrativeFeature;
  interestingPart?: TasteNarrativeFeature;
  pullQuote: string;
  keywords: string[];
};

export const NARRATIVE_COPY: Record<NarrativeProfileId, NarrativeProfileCopy> = {
  "quiet-curator": {
    id: "quiet-curator",
    opening: {
      headline: "좋아하는 것을 자주 바꾸기보다,\n오래 남길 것을 천천히 고르는 사람.",
      summary:
        "당신은 눈에 띄는 새로움보다 시간이 지나도 계속 마음이 가는 것을 더 중요하게 보는 편입니다. 무엇인가를 좋아하게 되는 속도는 빠르지 않을 수 있지만, 한번 기준을 통과한 것은 꽤 오래 곁에 남습니다.",
    },
    place: {
      headline: "편안함은 조용함보다 여유에 가깝습니다.",
      body: "사람이 전혀 없는 공간보다, 빛과 소리와 사람의 밀도를 스스로 조절할 수 있는 공간에서 더 오래 머무는 편입니다.",
    },
    object: {
      headline: "마음에 든다고 바로 내 것이 되지는 않습니다.",
      body: "물건을 고를 때는 순간의 끌림보다 오래 보아도 질리지 않을 이유와 완성도를 함께 봅니다.",
    },
    detail: {
      headline: "작은 차이를 그냥 지나치지 않습니다.",
      body: "빛, 소재, 마감처럼 설명하기 어려운 차이가 전체 인상을 바꾸는 것을 비교적 잘 느끼는 편입니다.",
    },
    ritual: {
      headline: "익숙한 곳을 다시 찾는 것도 새로운 경험입니다.",
      body: "늘 가던 곳에서도 작은 변화를 발견하고, 좋아하는 경험을 반복하면서 더 깊게 즐기는 쪽에 가깝습니다.",
    },
    pullQuote: "좋아하는 것은 많지 않아도 오래 남는다.",
    keywords: ["QUIET ENERGY", "SELECTIVE", "SENSORY", "LONG-TERM", "UNHURRIED"],
  },
  "urban-explorer": {
    id: "urban-explorer",
    opening: {
      headline: "새로운 것을 발견하면,\n생각보다 빠르게 경험으로 옮기는 사람.",
      summary:
        "새로운 장소나 사람, 분위기에 비교적 쉽게 호기심을 느낍니다. 좋다고 느낀 경험은 혼자 간직하기보다 누군가와 나누거나 다시 움직이는 동력이 되는 편입니다.",
    },
    place: {
      headline: "공간의 에너지도 취향의 일부입니다.",
      body: "사람, 음악, 움직임처럼 공간 안에서 일어나는 변화에 영향을 많이 받는 편입니다.",
    },
    object: {
      headline: "좋아하는 이유는 경험으로 이어질 때 더 선명해집니다.",
      body: "물건 자체보다 그것이 만들어내는 소리, 분위기, 사용 경험에 마음이 가는 경우가 많습니다.",
    },
    detail: {
      headline: "조용히 보는 것보다 직접 경험하면서 알게 됩니다.",
      body: "세부를 오래 관찰하기보다, 전체 분위기 속에서 몸으로 느끼는 감각을 빠르게 받아들이는 편입니다.",
    },
    ritual: {
      headline: "계획보다 발견이 하루를 움직입니다.",
      body: "처음 가는 동네나 우연히 발견한 장소처럼 예상하지 못했던 선택이 좋은 하루를 만드는 경우가 많습니다.",
    },
    pullQuote: "좋다고 느끼면, 일단 경험해본다.",
    keywords: ["ENERGY", "SOCIAL SPARK", "DISCOVERY", "CURIOUS", "EXPERIENCE"],
  },
  "practical-editor": {
    id: "practical-editor",
    opening: {
      headline: "예쁜 것보다,\n잘 만든 것을 오래 좋아하는 사람.",
      summary:
        "당신에게 취향은 보기 좋은 것만을 뜻하지 않습니다. 실제로 오래 쓰기 좋은지, 구조가 합리적인지, 작은 부분까지 제대로 만들어졌는지가 중요합니다.",
    },
    place: {
      headline: "머물기 좋은 공간은 이유가 있습니다.",
      body: "분위기만큼 동선, 자리, 편안함처럼 실제로 사용하는 경험을 중요하게 봅니다.",
    },
    object: {
      headline: "좋은 물건은 쓰면서 더 좋아집니다.",
      body: "처음 봤을 때의 인상보다 시간이 지나도 제 역할을 잘하는지가 선택에 더 크게 작용합니다.",
    },
    detail: {
      headline: "디테일은 장식보다 완성도를 판단하는 기준입니다.",
      body: "작은 요소를 보더라도 그것이 전체 사용 경험을 어떻게 바꾸는지에 더 관심이 갑니다.",
    },
    ritual: {
      headline: "좋았던 선택을 반복하는 데 거리낌이 없습니다.",
      body: "새로움 자체보다 이미 만족했던 경험을 다시 선택하는 것을 꽤 합리적인 선택으로 보는 편입니다.",
    },
    pullQuote: "예쁜 것보다 잘 만든 것.",
    keywords: ["FUNCTIONAL", "SELECTIVE", "RELIABLE", "WELL-MADE", "LONG-TERM"],
  },
  "quiet-explorer": {
    id: "quiet-explorer",
    opening: {
      headline: "새로운 경험에는 열려 있지만,\n내 것으로 정하는 데에는 시간이 필요한 사람.",
      summary:
        "처음 보는 장소와 새로운 장면에는 비교적 쉽게 호기심을 느낍니다. 하지만 무엇인가를 실제로 선택하고 오래 곁에 두는 기준은 생각보다 까다로운 편입니다.",
    },
    interestingPart: {
      headline: "새로운 경험에는 빠르고,\n소유에는 느립니다.",
      body: "처음 보는 곳에는 큰 망설임 없이 들어가면서도, 물건 하나를 내 것으로 만드는 데에는 시간을 씁니다. 당신에게 '새롭다'와 '갖고 싶다'는 같은 말이 아닙니다.",
    },
    place: {
      headline: "새로운 곳에서도 내 속도를 찾습니다.",
      body: "낯선 공간 자체는 즐기지만, 그 안에서 너무 많은 자극이 한꺼번에 들어오는 것은 선호하지 않는 편입니다.",
    },
    object: {
      headline: "발견은 빠르지만 선택은 신중합니다.",
      body: "마음에 들어오는 것은 많아도 실제로 오래 남는 것은 적은 편에 가깝습니다.",
    },
    detail: {
      headline: "낯선 곳에서도 작은 차이를 봅니다.",
      body: "새로운 장면을 즐기면서도 빛, 소재, 분위기처럼 자신에게 맞는 디테일을 빠르게 찾는 편입니다.",
    },
    ritual: {
      headline: "익숙함보다 발견에서 에너지를 얻습니다.",
      body: "하루가 비면 이미 아는 만족보다 아직 모르는 장소를 찾아 움직이는 쪽에 더 마음이 갑니다.",
    },
    pullQuote: "발견은 빠르게, 선택은 천천히.",
    keywords: ["QUIET ENERGY", "CURIOUS", "SELECTIVE", "DISCOVERY", "SENSORY"],
  },
  contradiction: {
    id: "contradiction",
    opening: {
      headline: "조용함을 고르지만,\n자극을 밀어내진 않는 사람.",
      summary:
        "평소에는 비교적 차분하고 통제 가능한 장면에 마음이 가지만, 좋아하는 경험의 범위가 꼭 조용한 쪽에만 머물지는 않습니다. 상황에 따라 필요한 에너지의 종류가 달라지는 편입니다.",
    },
    interestingPart: {
      headline: "조용함과 활기는 당신에게 반대말이 아닙니다.",
      body: "혼자 머무는 시간에는 낮은 자극을 선호하면서도, 음악이나 사람과 함께하는 경험에서는 더 큰 에너지를 즐길 수 있습니다. 당신에게 중요한 것은 자극의 크기보다 그 자극을 스스로 선택했는지에 더 가깝습니다.",
    },
    place: {
      headline: "혼자 있을 때와 함께 있을 때 원하는 공간이 다릅니다.",
      body: "하나의 분위기를 늘 선호하기보다 상황과 함께하는 사람에 따라 편안한 공간의 조건이 달라지는 편입니다.",
    },
    object: {
      headline: "물건은 때로 당신의 다른 면을 꺼냅니다.",
      body: "평소의 생활 리듬보다 더 큰 감각과 경험을 주는 물건에 의외로 쉽게 끌릴 수 있습니다.",
    },
    detail: {
      headline: "분위기의 차이는 일관되게 중요합니다.",
      body: "조용한 공간이든 활기찬 공간이든 빛, 소리, 소재처럼 장면을 만드는 세부 요소에는 비교적 민감한 편입니다.",
    },
    ritual: {
      headline: "한 가지 속도로만 사는 사람은 아닙니다.",
      body: "쉴 때 필요한 속도와 새로운 경험을 찾을 때 필요한 속도를 서로 다르게 사용하는 편입니다.",
    },
    pullQuote: "고요함은 자극이 없어서가 아니라,\n내가 고른 자극이라서 편안하다.",
    keywords: ["CONTEXTUAL", "SENSORY", "QUIET ENERGY", "FLEXIBLE", "SELECTIVE"],
  },
};

// ============================================================
// 3. PROFILE SIGNAL TARGET — 각 profile의 "대표 성향"(GPT Spec 10번)을
// 축별 방향(+1 high / -1 low / 0 무관)으로 옮긴 것. 실제 판정은 이
// 방향과 실제 signal 값을 내적(dot product)해서 연속적인 점수로 낸다
// — "몇 개 조건을 만족하는가"를 세는 방식이 아니라서 Quiet Curator와
// Quiet Explorer처럼 4/5축이 겹치는 두 profile도(novelty/pace 방향만
// 다름) 자연스럽게 분리된다.
// ============================================================
const PROFILE_SIGNAL_TARGET: Record<Exclude<NarrativeProfileId, "contradiction">, Partial<Record<TasteSignalKey, number>>> = {
  "quiet-curator": { stimulus: -1, pace: -1, curation: 1, attachment: 1, sensory: 1 },
  "urban-explorer": { stimulus: 1, socialDensity: 1, pace: 1, novelty: 1, expression: 1 },
  // "새로움 자체보다 이미 만족했던 경험을 다시 선택"(RITUAL 카피)이
  // 뜻하는 낮은 novelty 선호를 명시적으로 반영한다 — 대표 성향 목록엔
  // 없지만 이 profile 자체 문구가 담고 있는 방향이다.
  "practical-editor": { curation: 1, attachment: 1, sensory: -0.6, pace: -0.5, novelty: -0.5 },
  "quiet-explorer": { stimulus: -1, novelty: 1, curation: 1, sensory: 1, attachment: 1 },
};

// PRACTICAL EDITOR의 "functional preference / low impulse"는 신호 축이
// 아니라 raw answer(옵션 id) 조건이다 — TASTE_QUESTIONS_V1(질문지)의
// 실제 옵션 id를 그대로 참조한다. v2(tasteNarrativeV2.ts)도 같은 v1
// 옵션 id를 그대로 참조하므로(TASTE_QUESTIONS_V2가 signals를 v1에서
// 그대로 가져왔듯 answer id도 동일) 값을 새로 만들지 않고 export해서
// 공유한다.
export const FUNCTIONAL_PREFERENCE_ANSWER_IDS = ["functional", "structure-use", "budget-limit"];
export const IMPULSE_ANSWER_ID = "buy-if-lingers";

// 섹션마다 "무엇을 보고 판단하는가"가 다르다(Spec 6번 — PLACE는 공간/
// 자극/밀도, OBJECT는 소유/선택 기준, DETAIL은 감각, RITUAL은 새로움/
// 반복 방식). 그래서 같은 signals라도 섹션별로 다른 축에 가중치를
// 줘서, 한 사람 안에서도 opening=A 계열, place=D 계열처럼 서로 다른
// profile의 fragment가 섞일 수 있게 한다(Spec 11번 "profile은 유형이
// 아니라 reference pattern").
const SECTION_AXIS_WEIGHT: Record<"opening" | "place" | "object" | "detail" | "ritual" | "interestingPart", Partial<Record<TasteSignalKey, number>>> = {
  opening: { stimulus: 1, socialDensity: 1, pace: 1, curation: 1, sensory: 1, novelty: 1, expression: 1, attachment: 1 },
  // novelty를 함께 넣는 이유: quiet-explorer의 PLACE 카피("새로운
  // 곳에서도 내 속도를 찾습니다")는 "낯선 공간"이 핵심이다 — 공간
  // 판단에서도 익숙함/새로움이 quiet-curator와 quiet-explorer를
  // 가르는 실질적인 축이라 반영한다.
  place: { stimulus: 1.2, socialDensity: 1.2, sensory: 0.8, pace: 0.6, novelty: 0.5 },
  object: { curation: 1.2, attachment: 1.2, pace: 0.6, sensory: 0.4 },
  detail: { sensory: 1.5, curation: 0.5 },
  ritual: { novelty: 1.2, attachment: 0.8, pace: 0.6, stimulus: 0.4 },
  interestingPart: { stimulus: 1, socialDensity: 1, pace: 1, curation: 1, sensory: 1, novelty: 1, expression: 1, attachment: 1 },
};

function normalize(value: number): number {
  return Math.max(-1, Math.min(1, value / 100));
}

function profileScore(
  id: Exclude<NarrativeProfileId, "contradiction">,
  section: keyof typeof SECTION_AXIS_WEIGHT,
  signals: Record<TasteSignalKey, number>,
  sources: SignalSource[]
): number {
  const target = PROFILE_SIGNAL_TARGET[id];
  const sectionWeight = SECTION_AXIS_WEIGHT[section];
  let score = 0;
  for (const key of TASTE_SIGNAL_KEYS) {
    const direction = target[key];
    if (!direction) continue;
    const weight = sectionWeight[key] ?? 0;
    if (weight === 0) continue;
    score += direction * weight * normalize(signals[key]);
  }
  // "기능 선호/낮은 충동성" raw answer 보너스는 구매·소유 판단과
  // 직접 관련된 opening/object 섹션에만 적용한다 — place/detail/ritual
  // 처럼 무관한 섹션까지 practical-editor 쪽으로 밀지 않기 위함이다.
  if (id === "practical-editor" && (section === "opening" || section === "object")) {
    const hasFunctionalAnswer = sources.some((s) => FUNCTIONAL_PREFERENCE_ANSWER_IDS.includes(s.answerId));
    const hasImpulseAnswer = sources.some((s) => s.answerId === IMPULSE_ANSWER_ID);
    if (hasFunctionalAnswer) score += 0.8;
    if (!hasImpulseAnswer) score += 0.3;
  }
  return score;
}

// CONTRADICTION은 신호 크기가 아니라 "같은 축에서 방향이 갈리는가"로
// 판단한다(Spec 10번 E — stimulus/socialDensity 축의 실제 contradiction
// 존재 여부). Narrative Spec 4번의 우선순위 A(의미 있는 contradiction
// 우선 검토)를 반영해, 해당 축에서 contradiction이 실제로 감지됐을
// 때만 큰 보너스를 줘서 다른 profile보다 우선하게 만든다 — 항상
// 이기는 것이 아니라 "그 축의 충돌이 실제로 있을 때"만 이긴다.
const CONTRADICTION_CORE_AXES: TasteSignalKey[] = ["stimulus", "socialDensity"];

function contradictionScore(result: TasteAnalysisResult): number {
  const hasCoreContradiction = result.contradictions.some((c) => CONTRADICTION_CORE_AXES.includes(c.axis));
  return hasCoreContradiction ? 10 : 0;
}

function bestProfileForSection(
  section: keyof typeof SECTION_AXIS_WEIGHT,
  result: TasteAnalysisResult,
  sources: SignalSource[]
): NarrativeProfileId {
  const candidates: Array<[NarrativeProfileId, number]> = [
    ["quiet-curator", profileScore("quiet-curator", section, result.signals, sources)],
    ["urban-explorer", profileScore("urban-explorer", section, result.signals, sources)],
    ["practical-editor", profileScore("practical-editor", section, result.signals, sources)],
    ["quiet-explorer", profileScore("quiet-explorer", section, result.signals, sources)],
    ["contradiction", contradictionScore(result)],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0][0];
}

// ============================================================
// 4. EVIDENCE — 어떤 raw answer가 이 fragment 선택을 뒷받침하는지.
// 사용자 화면에는 노출하지 않는다(dev/향후 AI prompt 입력용).
// ============================================================
function collectEvidence(sources: SignalSource[], weight: Partial<Record<TasteSignalKey, number>>): string[] {
  const relevantAxes = TASTE_SIGNAL_KEYS.filter((key) => (weight[key] ?? 0) !== 0);
  const seen = new Set<string>();
  const evidence: string[] = [];
  for (const source of sources) {
    const touchesRelevantAxis = relevantAxes.some((axis) => (source.signals[axis] ?? 0) !== 0);
    if (!touchesRelevantAxis) continue;
    const label = `${source.questionId}: ${source.answerId}`;
    if (seen.has(label)) continue;
    seen.add(label);
    evidence.push(label);
  }
  return evidence;
}

function evidenceWeightFor(id: NarrativeProfileId): Partial<Record<TasteSignalKey, number>> {
  if (id === "contradiction") return { stimulus: 1, socialDensity: 1 };
  return PROFILE_SIGNAL_TARGET[id];
}

// ============================================================
// 5. TOP-LEVEL — TasteAnalysisResult + SignalSource[] → TasteMagazineNarrative
// ============================================================
const INTERESTING_PART_THRESHOLD = 1.5;

export function buildTasteMagazineNarrative(result: TasteAnalysisResult, sources: SignalSource[]): TasteMagazineNarrative {
  const openingProfileId = bestProfileForSection("opening", result, sources);
  const placeProfileId = bestProfileForSection("place", result, sources);
  const objectProfileId = bestProfileForSection("object", result, sources);
  const detailProfileId = bestProfileForSection("detail", result, sources);
  const ritualProfileId = bestProfileForSection("ritual", result, sources);

  const opening = NARRATIVE_COPY[openingProfileId].opening;
  const place = NARRATIVE_COPY[placeProfileId].place;
  const object = NARRATIVE_COPY[objectProfileId].object;
  const detail = NARRATIVE_COPY[detailProfileId].detail;
  const ritual = NARRATIVE_COPY[ritualProfileId].ritual;

  // interestingPart는 quiet-explorer/contradiction만 카피가 있다(Spec 7번
  // — 없는 profile에서 억지로 만들지 않는다). 둘 다 임계값을 못 넘으면
  // 아예 생략한다.
  const contradictionInterestingScore = contradictionScore(result);
  const quietExplorerInterestingScore = profileScore("quiet-explorer", "interestingPart", result.signals, sources);
  let interestingPart: TasteNarrativeFeature | undefined;
  let interestingPartProfileId: NarrativeProfileId | undefined;
  if (Math.max(contradictionInterestingScore, quietExplorerInterestingScore) >= INTERESTING_PART_THRESHOLD) {
    interestingPartProfileId = contradictionInterestingScore >= quietExplorerInterestingScore ? "contradiction" : "quiet-explorer";
    interestingPart = NARRATIVE_COPY[interestingPartProfileId].interestingPart;
  }

  // pullQuote/keywords는 opening과 같은 목소리를 유지하기 위해 opening을
  // 고른 profile의 세트를 그대로 쓴다(Spec 8/9번 — 기존 approved 문구
  // 조합, 개별 단어를 새로 섞지 않는다).
  const pullQuote = NARRATIVE_COPY[openingProfileId].pullQuote;
  const keywords = NARRATIVE_COPY[openingProfileId].keywords;

  const evidence: TasteMagazineNarrative["evidence"] = {
    headline: collectEvidence(sources, evidenceWeightFor(openingProfileId)),
    place: collectEvidence(sources, evidenceWeightFor(placeProfileId)),
    object: collectEvidence(sources, evidenceWeightFor(objectProfileId)),
    detail: collectEvidence(sources, evidenceWeightFor(detailProfileId)),
    ritual: collectEvidence(sources, evidenceWeightFor(ritualProfileId)),
  };
  if (interestingPartProfileId) {
    evidence.interestingPart = collectEvidence(sources, evidenceWeightFor(interestingPartProfileId));
  }

  return {
    opening,
    features: { place, object, detail, ritual },
    interestingPart,
    pullQuote,
    keywords,
    evidence,
  };
}

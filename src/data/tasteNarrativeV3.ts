// TASTE v3 — RESULT EDITORIAL COMPRESSION(PR #261 후속, 2026-08).
//
// §1 FREEZE: Questionnaire(15문항)·6축 evidence extraction·Relationship
// R1~R8·Tension T1~T5는 전혀 축소하지 않는다. tasteQuestionnaireV3.ts/
// tasteEvidenceV3.ts/tasteRelationshipsV3.ts/tasteTensionsV3.ts는 이번
// 라운드에서 한 줄도 수정하지 않았다 — 내부 분석은 이전(PR #261)과
// 완전히 동일한 깊이로 15문항 전체·8개 relationship·5개 tension을
// 그대로 계산한다.
//
// 바뀐 것은 "그 계산 결과 중 무엇을 사용자에게 보여줄지 고르는 선택
// 레이어"뿐이다(§5 DEEP ANALYSIS → SELECTIVE EDITORIAL OUTPUT). 이전
// 버전은 축마다 고정된 섹션(SPACE→섹션2, SENSORY→섹션2, RHYTHM+
// RELATION→섹션3, EXPLORATION+EXPRESSION→섹션4)에 기계적으로 다
// 채워 넣었다 — 그래서 사용자와 무관하게 매번 6축을 전부, 장문으로
// 설명하게 됐고 결과가 2,200~2,300자까지 길어졌다. 이번에는 실제
// 계산된 축 강도 순위(axisRanking)로 "이 사람에게 가장 설명력이
// 높은 축"만 골라 SECTION 2/3에 배치한다 — 어떤 축이 SECTION 2가
// 되는지는 사용자마다 달라진다(§9).

import { TASTE_V3_AXIS_KEYS, TASTE_V3_AXIS_LABELS, type TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { aggregateV3Axes, extractV3Evidence, type V3AxisAggregate, type V3EvidenceItem } from "./tasteEvidenceV3";
import { matchAllV3Relationships, RELATIONSHIP_DEFS_V3, type V3RelationshipDef, type V3RelationshipMatch } from "./tasteRelationshipsV3";
import { matchAllV3Tensions, type V3TensionMatch } from "./tasteTensionsV3";
import type { TasteV3RawAnswers } from "./tasteQuestionnaireV3";

// ============================================================
// SECTION SHAPE — §6 5-section editorial structure. 이전 버전의
// space/sensory/rhythmRelation/explorationExpression(4개, 축에 고정)을
// coreTaste/howItShowsUp(2개, 축 순위에 따라 동적으로 배정)로
// 압축했다. TasteMagazineResultV3.tsx도 이 shape로 함께 갱신했다.
// ============================================================
export type TasteMagazineNarrativeV3 = {
  opening: { headline: string; summary: string };
  coreTaste: { headline: string; body: string; axisLabel: string };
  howItShowsUp: { headline: string; body: string; axisLabel: string };
  interestingPart: { headline: string; body: string };
  ending: { body: string; pullQuote: string };
  keywords: string[];
  pullQuote: string;
  charCount: number;
  debug: {
    axes: Record<TasteV3AxisKey, number>;
    axisRanking: TasteV3AxisKey[];
    relationshipMatches: string[];
    tensionMatches: string[];
    openingSource: string;
    interestingPartSource: string;
  };
};

const AXIS_LABEL_KO: Record<TasteV3AxisKey, string> = {
  space: "공간을 대하는 방식",
  sensory: "먼저 반응하는 감각",
  rhythm: "리듬",
  relation: "관계 안에서의 거리",
  exploration: "새로움을 대하는 태도",
  expression: "표현하는 방식",
};

// 축마다 방향(+/-) 2개씩 — 짧은 해석 한 줄(§7 "Magazine editorial
// voice", 리포트 문체 금지). 구체적 evidence는 weave 문장이 담당하고,
// 이 줄은 "왜 그런가"의 해석만 짧게 얹는다.
const AXIS_INTERPRETATION: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative:
      "당신에게 좋은 공간은 크기가 아니라 밀도로 결정됩니다 — 얼마나 많은 시간이 그 안에 쌓여 있는가가 먼저입니다. 정돈된 넓은 공간보다, 손에 익은 좁은 자리에서 더 빨리 마음이 놓입니다.",
    positive:
      "당신에게 좋은 공간은 무엇으로 채워졌는가보다 무엇이 비워졌는가로 결정됩니다. 물건이 많은 풍요로움보다, 시야가 걸리지 않는 명료함 쪽에서 더 빨리 마음이 놓입니다.",
  },
  sensory: {
    positive:
      "정제된 것보다 흔적이 남은 것에 먼저 눈이 가는, 촉각에 가까운 감각을 가졌습니다. 완벽한 상태보다 시간이 만든 표면을 더 오래 들여다보는 편입니다.",
    negative:
      "느낌보다 먼저 정확함을 알아보는, 시각적으로 엄격한 감각을 가졌습니다. 분위기가 좋아도 비율이나 마감이 어긋나면 눈이 먼저 걸립니다.",
  },
  rhythm: {
    positive: "머뭇거림 없이 움직이는 쪽이 당신에게는 더 자연스러운 속도입니다. 오래 재는 것보다, 마음이 움직인 순간을 놓치지 않는 쪽을 택합니다.",
    negative: "속도를 늦추는 것이 게으름이 아니라, 당신이 확신에 도달하는 방식입니다. 시간을 들일수록 오히려 더 편안해지는 쪽에 가깝습니다.",
  },
  relation: {
    positive: "혼자보다 함께일 때 더 선명해지는 쪽에 가깝습니다. 좋은 순간일수록 누군가와 나눠야 비로소 완성된다고 느낍니다.",
    negative: "곁에 사람이 없어도 허전해지지 않는, 스스로 채워지는 쪽입니다. 함께 있는 시간도 좋지만, 혼자인 시간이 있어야 다시 채워집니다.",
  },
  exploration: {
    positive: "안전한 선택지보다 낯선 쪽으로 먼저 손이 가는 사람입니다. 이미 아는 것을 반복하기보다, 확인되지 않은 쪽에서 더 큰 자극을 느낍니다.",
    negative: "새로움보다 이미 확인된 좋음을 놓치지 않는 쪽을 택합니다. 낯선 시도보다, 이미 아는 만족을 다시 확인하는 데서 더 큰 안정을 느낍니다.",
  },
  expression: {
    positive: "느낀 것을 안에 담아두지 못하고, 결국 밖으로 흘려보내는 편입니다. 좋은 것을 발견하면 그 순간의 흥분이 표현으로 먼저 튀어나옵니다.",
    negative: "표현하지 않아도 사라지지 않는, 스스로에게만 확실하면 되는 취향입니다. 굳이 설명하지 않아도 그 감정은 이미 충분히 완결돼 있습니다.",
  },
};

// weave — 서로 다른 두 evidence의 실제 선택 문구(optionLabel)를 하나의
// 해석 문장으로 엮는다(§7 GOOD 예시 방식 — "~를 골랐습니다" 나열 금지).
// 참고: 보간되는 optionLabel의 마지막 글자 받침에 따라 "은/는", "이/가"
// 조사가 어긋날 수 있어(§7), 조사가 필요 없는 접속 부사(그리고/이어서/
// 그 옆에는) 중심으로 문장을 설계했다.
const WEAVE_PAIR = [
  (a: string, b: string) => `${a}. 그리고 ${b}. 우연이라기엔 방향이 너무 또렷합니다.`,
  (a: string, b: string) => `${a}. 그 옆에는 ${b}도 있었습니다 — 서로 다른 순간처럼 보여도 같은 결로 이어집니다.`,
  (a: string, b: string) => `${a}. 이어서 ${b}까지, 같은 방향이 반복해서 나타났습니다.`,
  (a: string, b: string) => `${a}. 그다음엔 ${b}. 이 흐름은 하나의 기준을 가리킵니다.`,
  (a: string, b: string) => `${a}. 그리고 ${b}. 두 장면 사이에는 뚜렷한 공통점이 있습니다.`,
];
const WEAVE_SINGLE = [
  (a: string) => `${a}. 이 선택 하나가 나머지 열네 개보다 더 크게 말합니다.`,
  (a: string) => `${a}. 고른 것 자체가 이미 많은 것을 말해줍니다.`,
  (a: string) => `${a}. 이 방향으로는 망설임이 없었습니다.`,
];
const WHY_IT_MATTERS = [
  "겉으로는 사소해 보여도, 이 기준은 매번 비슷하게 작동합니다. 다른 모든 조건이 바뀌어도 이 부분만큼은 잘 흔들리지 않습니다.",
  "이 기준은 상황이 바뀌어도 잘 흔들리지 않는 편입니다. 새로운 선택지 앞에서도 결국 같은 방향으로 다시 돌아오는 쪽입니다.",
  "다른 조건이 아무리 좋아도, 이 기준이 어긋나면 결국 마음이 가지 않습니다. 반대로 이 기준만 맞으면 나머지는 비교적 쉽게 양보하는 편입니다.",
  "이 기준은 의식적으로 정한 게 아니라, 거의 반사적으로 작동하는 쪽에 가깝습니다. 설명을 듣기 전부터 몸이 먼저 그쪽으로 움직입니다.",
];
// 대비 문장 — "남들은 이럴 텐데 당신은" 식으로 한 번 더 구체화한다.
const CONTRAST_LINE = [
  "누군가는 이 차이를 눈치채지 못하고 지나가지만, 당신에게는 결과를 가르는 기준입니다.",
  "비슷해 보이는 두 선택지 사이에서, 당신은 언제나 이 기준으로 먼저 갈랐습니다.",
  "다른 사람이라면 크게 신경 쓰지 않았을 지점에서, 당신의 선택은 매번 갈렸습니다.",
  "사소한 차이처럼 보여도, 이 기준을 빼고 나면 남는 설명이 별로 없습니다.",
];

function pickByIndex<T>(pool: T[], seed: number): T {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

// 한국어 조사 도우미 — 보간되는 optionLabel/evidenceLabel의 마지막
// 글자 받침 유무에 따라 "은/는"이 어긋나는 문법 버그(§7)를 막는다.
function hasBatchim(text: string): boolean {
  const lastChar = text.trim().slice(-1);
  const code = lastChar.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false; // 한글 음절이 아니면(영문/숫자 등) 받침 없는 것으로 취급
  return code % 28 !== 0;
}
function eunNeun(text: string): string {
  return hasBatchim(text) ? "은" : "는";
}
function gwaWa(text: string): string {
  return hasBatchim(text) ? "과" : "와";
}
function iRaneun(text: string): string {
  return hasBatchim(text) ? "이라는" : "라는";
}
function eulReul(text: string): string {
  return hasBatchim(text) ? "을" : "를";
}
// 문장 끝에 이미 마침표/줄임표가 있으면 중복 마침표를 만들지 않도록
// 정리한다(Q15 description처럼 이미 "~보낸다."로 끝나는 경우 대응).
function stripTrailingPunct(text: string): string {
  return text.trim().replace(/[.!?]+$/, "");
}

function tieBreakHash(item: V3EvidenceItem, axis: TasteV3AxisKey): number {
  const axisSeed = axis.charCodeAt(0) + axis.charCodeAt(axis.length - 1);
  return (item.qNumber * 31 + axisSeed * 7) % 97;
}

function strongestEvidenceForAxis(aggregate: V3AxisAggregate, axis: TasteV3AxisKey): V3EvidenceItem[] {
  return [...aggregate[axis].evidence].sort((a, b) => {
    const diff = Math.abs(b.axes[axis] ?? 0) - Math.abs(a.axes[axis] ?? 0);
    if (diff !== 0) return diff;
    return tieBreakHash(a, axis) - tieBreakHash(b, axis);
  });
}

// 반복 통제(§8) — 같은 evidence(questionId)는 결과 전체에서 최대 2회,
// 가능하면 1회만 직접 인용한다.
class UsageTracker {
  private counts = new Map<string, number>();
  use(questionId: string): number {
    const next = (this.counts.get(questionId) ?? 0) + 1;
    this.counts.set(questionId, next);
    return next;
  }
  peek(questionId: string): number {
    return this.counts.get(questionId) ?? 0;
  }
}

function pickUnused(evidenceSorted: V3EvidenceItem[], usage: UsageTracker, exclude: string[] = []): V3EvidenceItem | undefined {
  return evidenceSorted.find((e) => usage.peek(e.questionId) === 0 && !exclude.includes(e.questionId));
}

// ============================================================
// §5 우선순위 — axisRanking(강도 내림차순). SECTION 2/3가 사용자마다
// 다른 축을 쓰게 되는 핵심 로직이다.
// ============================================================
function rankAxes(aggregate: V3AxisAggregate): TasteV3AxisKey[] {
  return [...TASTE_V3_AXIS_KEYS].sort((a, b) => Math.abs(aggregate[b].score) - Math.abs(aggregate[a].score));
}

// ============================================================
// CORE TASTE / HOW IT SHOWS UP — 축 하나를 골라 evidence 2개를
// weave해서 하나의 해석 문단으로 압축한다(기계적 "블록 나열" 금지).
// ============================================================
function buildAxisSection(
  axis: TasteV3AxisKey,
  headline: string,
  leadIn: string | null,
  aggregate: V3AxisAggregate,
  usage: UsageTracker,
  seed: number
): { headline: string; body: string; axisLabel: string } {
  const sorted = strongestEvidenceForAxis(aggregate, axis);
  const anchor = sorted[0];
  if (!anchor) {
    return { headline, body: "이 축은 뚜렷한 방향 없이 고르게 나뉘었습니다.", axisLabel: TASTE_V3_AXIS_LABELS[axis] };
  }
  usage.use(anchor.questionId);
  const supporting = pickUnused(sorted, usage, [anchor.questionId]) ?? sorted.find((e) => e.questionId !== anchor.questionId);
  if (supporting) usage.use(supporting.questionId);

  const weaveSentence = supporting
    ? pickByIndex(WEAVE_PAIR, seed)(stripTrailingPunct(anchor.optionLabel), stripTrailingPunct(supporting.optionLabel))
    : pickByIndex(WEAVE_SINGLE, seed)(stripTrailingPunct(anchor.optionLabel));

  // 3번째 근거(다른 문항)를 찾을 수 있으면 한 문장 더 얹어 해석에
  // 두께를 더한다 — 있으면 쓰고, 없으면 생략한다(억지 filler 금지, §12).
  const third = pickUnused(sorted, usage, [anchor.questionId, supporting?.questionId ?? ""]);
  if (third) usage.use(third.questionId);
  const thirdClause = third ? stripTrailingPunct(third.optionLabel) : "";
  const thirdSentence = third ? `${third.eyebrow}에서도 ${thirdClause} 쪽을 골라, 같은 방향이 한 번 더 확인됩니다.` : "";

  const direction = aggregate[axis].score >= 0 ? "positive" : "negative";
  const interpretation = AXIS_INTERPRETATION[axis][direction];
  const why = pickByIndex(WHY_IT_MATTERS, seed + anchor.qNumber);
  const contrast = pickByIndex(CONTRAST_LINE, seed + anchor.qNumber + 1);
  const magnitude = Math.abs(aggregate[axis].score);
  const strengthLine =
    magnitude >= 40
      ? "그것도 한두 번이 아니라, 열다섯 문항 내내 거의 흔들림 없이 같은 방향으로 나타난 결과입니다."
      : "여러 문항에 걸쳐 조금씩, 그러나 꾸준히 같은 방향으로 쌓인 결과입니다.";

  const body = [leadIn, weaveSentence, thirdSentence, interpretation, why, contrast, strengthLine].filter(Boolean).join(" ");
  return { headline, body, axisLabel: TASTE_V3_AXIS_LABELS[axis] };
}

// ============================================================
// OPENING — headline arbitration은 기존과 동일(tension > relationship >
// axis fallback), 다만 본문은 "이 지면은 열다섯 개의..." 같은 메타
// 설명 문단을 완전히 제거하고 짧은 편집적 도입부 1~2문장으로 압축했다.
// ============================================================
function buildOpening(
  aggregate: V3AxisAggregate,
  relationships: V3RelationshipMatch[],
  tensions: V3TensionMatch[],
  axisRanking: TasteV3AxisKey[],
  usage: UsageTracker
): { headline: string; summary: string; source: string } {
  if (tensions.length > 0) {
    const t = tensions[0].def;
    const ev = tensions[0].evidence.slice(0, 2);
    ev.forEach((e) => usage.use(e.questionId));
    const quotes = ev.map((e) => e.optionLabel).join(" 그리고 ");
    return {
      headline: t.headline,
      summary: `${quotes}. 이 두 장면이 한 사람 안에 자연스럽게 겹쳐 있습니다. 서로 반대 방향처럼 보이는 두 선택이 실은 같은 사람에게서 나왔다는 것부터, 이 Magazine은 시작됩니다. 열다섯 개의 선택 중 이 지점부터 읽어봅니다.`,
      source: `tension:${t.id}`,
    };
  }
  if (relationships.length > 0) {
    const r = relationships[0];
    const ev = r.evidence.slice(0, 2);
    ev.forEach((e) => usage.use(e.questionId));
    const quotes = ev.map((e) => e.optionLabel).join(" 그리고 ");
    return {
      headline: r.def.headline,
      summary: `${quotes} — 우연이 아니라 같은 태도에서 나온 두 선택입니다. 서로 다른 질문에서 나온 두 대답이 같은 방향을 가리켰다는 것부터, 이 Magazine은 시작됩니다. 열다섯 개의 선택 중 이 지점부터 읽어봅니다.`,
      source: `relationship:${r.def.id}`,
    };
  }
  const topAxis = axisRanking[0];
  const top = strongestEvidenceForAxis(aggregate, topAxis)[0];
  if (top) usage.use(top.questionId);
  return {
    headline: "여러 개의 선택이 아니라,\n하나의 시선으로 이어지는 사람.",
    summary: top
      ? `${top.optionLabel}. 이 한 번의 선택에서도 같은 시선이 드러납니다. 열다섯 개의 선택 중 이 지점부터 읽어봅니다.`
      : "당신의 선택들이 하나의 시선으로 이어집니다.",
    source: `axis-fallback:${topAxis}`,
  };
}

// ============================================================
// THE INTERESTING PART — tension > relationship > axis-pair fallback.
// 기존 relationship/tension def 카피는 그대로 재사용하되(§10 "여러 개
// 전부 설명하지 않는다, 가장 강한 1개") 부가 문장을 압축했다.
// ============================================================
const FALLBACK_INTERESTING_HEADLINES = [
  "가장 강하게 남은 것은,\n하나의 축이 아니라 그 사이의 간격이었습니다.",
  "정답을 정해두지 않아도,\n선택들은 이미 한 방향을 가리키고 있었습니다.",
];
const INTERESTING_CLOSERS = [
  "이 조합이 결과 전체에서 가장 '나 같다'고 느껴질 대목일 가능성이 큽니다. 서로 다른 방향처럼 보이는 두 선택이 실제로는 아무 마찰 없이 공존하고 있습니다. 둘 중 하나를 지우면 오히려 설명이 이상해집니다.",
  "여러 축 중에서도 유독 이 지점이 당신을 가장 분명하게 갈라놓습니다. 겉으로 드러나는 결과만으로는 짐작하기 어려운, 당신만의 조합입니다. 처음 만난 사람은 이 부분을 가장 늦게, 하지만 가장 오래 기억합니다.",
  "둘 중 하나로 정리하기보다, 함께 있는 채로 두는 편이 더 정확합니다. 하나를 고르는 순간 나머지 절반을 놓치게 됩니다. 모순이 아니라 두 겹으로 겹친 진짜 모습에 가깝습니다.",
];
// evidence 잔여량과 무관하게 항상 붙는 마무리 — Interesting Part 길이가
// 남은 evidence 수에 좌우되지 않도록 하는 안전장치.
const INTERESTING_FINAL_LINE = [
  "설명하자면 길지만, 실제로는 한 사람 안에서 아주 자연스럽게 일어나는 일입니다.",
  "이 페이지의 다른 어떤 문장보다, 이 대목이 당신을 더 정확하게 그립니다.",
  "정리된 성격 유형 하나보다, 이 장면 하나가 더 많은 것을 말해줍니다.",
];

function buildInterestingPart(
  aggregate: V3AxisAggregate,
  relationships: V3RelationshipMatch[],
  tensions: V3TensionMatch[],
  openingSource: string,
  usage: UsageTracker,
  allEvidence: V3EvidenceItem[]
): { headline: string; body: string; source: string } {
  const openingIsTension = openingSource.startsWith("tension:");
  const openingIsRelationship = openingSource.startsWith("relationship:");
  const nextTension = tensions.find((t) => !(openingIsTension && openingSource === `tension:${t.def.id}`));
  const nextRelationship = relationships.find((r) => !(openingIsRelationship && openingSource === `relationship:${r.def.id}`));

  function extend(baseBody: string, ev: V3EvidenceItem[], allEvidence: V3EvidenceItem[], seed: number): string {
    const grounding = pickUnused(ev, usage);
    if (grounding) usage.use(grounding.questionId);
    const groundingClause = grounding ? stripTrailingPunct(grounding.optionLabel) : "";
    const groundingSentence = grounding ? `실제로 ${groundingClause}${eulReul(groundingClause)} 고른 대목도 같은 결을 뒷받침합니다.` : "";

    // 두 번째 뒷받침 근거 — ev(관계/tension 직접 근거)에 남은 게 없으면
    // evidence 전체에서 아직 인용되지 않은 것 중 하나를 더 찾는다.
    const secondGrounding = pickUnused(ev, usage) ?? pickUnused(allEvidence, usage);
    if (secondGrounding) usage.use(secondGrounding.questionId);
    const secondClause = secondGrounding ? stripTrailingPunct(secondGrounding.optionLabel) : "";
    const secondSentence = secondGrounding
      ? `${secondGrounding.eyebrow}에서 ${secondClause} 쪽을 고른 것도 같은 이야기를 하고 있습니다.`
      : "";

    const thirdGroundingRaw = pickUnused(allEvidence, usage);
    if (thirdGroundingRaw) usage.use(thirdGroundingRaw.questionId);
    const thirdGroundingSentence = thirdGroundingRaw
      ? `한 걸음 더 들어가면, ${thirdGroundingRaw.eyebrow}에서 ${stripTrailingPunct(thirdGroundingRaw.optionLabel)} 쪽을 고른 것도 이 조합과 무관하지 않습니다.`
      : "";

    return [
      baseBody,
      groundingSentence,
      secondSentence,
      thirdGroundingSentence,
      pickByIndex(INTERESTING_CLOSERS, seed),
      pickByIndex(INTERESTING_FINAL_LINE, seed + 1),
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (nextTension) {
    return {
      headline: nextTension.def.headline,
      body: extend(
        nextTension.def.interestingPartBody,
        nextTension.evidence,
        allEvidence,
        nextTension.def.relatedQNumbers.reduce((a, b) => a + b, 0)
      ),
      source: `tension:${nextTension.def.id}`,
    };
  }
  if (nextRelationship) {
    return {
      headline: nextRelationship.def.headline,
      body: extend(nextRelationship.def.interestingPartBody, nextRelationship.evidence, allEvidence, nextRelationship.strength),
      source: `relationship:${nextRelationship.def.id}`,
    };
  }

  const axesSorted = TASTE_V3_AXIS_KEYS.map((k) => ({ key: k, score: aggregate[k].score })).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const a = axesSorted[0];
  const b = axesSorted.find((x) => x.key !== a.key) ?? axesSorted[1];
  const evA = strongestEvidenceForAxis(aggregate, a.key)[0];
  const evB = strongestEvidenceForAxis(aggregate, b.key)[0];
  [evA, evB].forEach((e) => e && usage.use(e.questionId));
  const quotes = [evA, evB]
    .filter((e): e is V3EvidenceItem => Boolean(e))
    .map((e) => e.optionLabel)
    .join(" 그리고 ");
  const headline = pickByIndex(FALLBACK_INTERESTING_HEADLINES, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 0));
  const thirdGrounding = pickUnused(allEvidence, usage);
  if (thirdGrounding) usage.use(thirdGrounding.questionId);
  const thirdGroundingSentence = thirdGrounding
    ? `${thirdGrounding.eyebrow}에서 ${stripTrailingPunct(thirdGrounding.optionLabel)} 쪽을 고른 것도 이 간격과 무관하지 않습니다.`
    : "";
  const body = [
    quotes ? `${quotes}.` : "",
    `${AXIS_LABEL_KO[a.key]}${gwaWa(AXIS_LABEL_KO[a.key])} ${AXIS_LABEL_KO[b.key]}${eunNeun(AXIS_LABEL_KO[b.key])} 뚜렷하게 다른 크기로 나타났다는 것은, 이 두 기준을 애초에 같은 무게로 쓰고 있지 않다는 뜻입니다.`,
    "관계나 모순으로 뚜렷하게 묶이지 않았다는 것 자체가, 당신의 취향이 몇 개의 이름표로 깔끔하게 정리되지 않는다는 증거이기도 합니다.",
    thirdGroundingSentence,
    "어느 쪽이 진짜인지 하나로 정리할 필요는 없습니다 — 두 크기가 다른 채로 함께 있는 편이 실제 모습에 더 가깝습니다.",
    pickByIndex(INTERESTING_CLOSERS, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 1)),
    pickByIndex(INTERESTING_FINAL_LINE, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 2)),
  ]
    .filter(Boolean)
    .join(" ");
  return { headline, body, source: `axis-pair-fallback:${a.key}x${b.key}` };
}

// ============================================================
// ENDING — 요약도 새 분석도 아닌 editorial closing(§6 SECTION 5).
// P1/P5 Ending 완전 동일 버그(이전 라운드)는 Q15/Q3 raw evidence에
// 의존했기 때문이었다 — 이번에는 howItShowsUp에 실제로 쓰인 축(두
// 사람이 실제로 갈리는 지점)을 callback해서 만든다. 같은 축이 강한
// 사람끼리도 opening headline이 다르면 callback 문장이 달라진다.
// ============================================================
const ENDING_CLOSERS = [
  "이 페이지는 오늘로 끝나지 않습니다 — 다음 Chapter에서 당신은 조금 더 구체적으로 읽힐 것입니다.",
  "사진 몇 장으로 보이는 인상보다, 이 안에 쌓인 선택들이 결국 더 오래 남습니다.",
  "취향은 완성되는 것이 아니라, 매번 이렇게 다시 확인되는 것에 가깝습니다.",
  "여기까지가 오늘의 한 장입니다 — 다음 장은 조금 다른 장면에서 시작됩니다.",
];

function buildEnding(
  openingHeadline: string,
  howItShowsUp: { axisLabel: string },
  coreTaste: { axisLabel: string },
  seed: number
): { body: string; pullQuote: string } {
  const callback = openingHeadline.replace(/\n/g, " ");
  // "SPACE"/"SENSORY" 같은 영문 축 라벨에 조사(과/와, 이/가)를 직접
  // 붙이면 받침 판정이 어긋나기 쉬워, "축"이라는 고정 한글 명사를
  // 매개로 붙인다("축"은 항상 받침이 있어 "과"/"이"로 고정된다).
  const cleanCallback = stripTrailingPunct(callback);
  const body = [
    `"${cleanCallback}"${iRaneun(cleanCallback)} 시작으로 돌아가 보면, ${coreTaste.axisLabel} 축과 ${howItShowsUp.axisLabel} 축이 서로 다른 자리에서 같은 사람을 가리키고 있었습니다.`,
    "장면 하나, 물건 하나로는 다 설명되지 않지만, 이렇게 겹쳐 놓고 보면 어렴풋했던 윤곽이 조금 더 또렷해집니다.",
    "결론을 하나로 좁히기보다, 이 페이지가 보여준 몇 개의 장면을 그대로 곁에 두는 편이 낫습니다.",
    pickByIndex(ENDING_CLOSERS, seed),
  ]
    .filter(Boolean)
    .join(" ");
  return { body, pullQuote: callback };
}

// ============================================================
// ROOT
// ============================================================
export function buildTasteMagazineNarrativeV3(answers: TasteV3RawAnswers): TasteMagazineNarrativeV3 {
  // §1 FREEZE — 15문항 전체 evidence extraction, 6축 aggregate,
  // relationship/tension 매칭은 이전(PR #261)과 완전히 동일하게
  // 계산한다. 아래 세 줄은 압축 이전과 한 글자도 다르지 않다.
  const evidence = extractV3Evidence(answers);
  const aggregate = aggregateV3Axes(evidence);
  const relationships = matchAllV3Relationships(aggregate);
  const tensions = matchAllV3Tensions(evidence);

  const axisRanking = rankAxes(aggregate);
  const usage = new UsageTracker();

  const openingResult = buildOpening(aggregate, relationships, tensions, axisRanking, usage);
  const opening = { headline: openingResult.headline, summary: openingResult.summary };

  // SECTION 2 — 가장 강한 축(§5 priority 3).
  const axis1 = axisRanking[0];
  const coreTaste = buildAxisSection(
    axis1,
    "취향의 중심",
    "열다섯 개의 답변 중에서 가장 자주, 가장 뚜렷하게 반복된 방향부터 짚어봅니다.",
    aggregate,
    usage,
    axis1.length + 1
  );

  // SECTION 3 — 두 번째로 강한 축(§5 priority 4), 다른 논리로 제시.
  const axis2 = axisRanking[1];
  const howItShowsUp = buildAxisSection(
    axis2,
    "생활에서 나타나는 방식",
    "취향의 중심만으로는 다 설명되지 않습니다. 일상 안에서는 이 취향이 조금 다른 얼굴로, 두 번째 결로 나타납니다.",
    aggregate,
    usage,
    axis2.length + 2
  );

  // SECTION 4 — strongest tension > relationship > axis-pair fallback.
  const interestingPartResult = buildInterestingPart(aggregate, relationships, tensions, openingResult.source, usage, evidence);
  const interestingPart = { headline: interestingPartResult.headline, body: interestingPartResult.body };

  // SECTION 5 — 요약 아님, howItShowsUp/coreTaste의 축을 callback.
  const ending = buildEnding(opening.headline, howItShowsUp, coreTaste, axis1.length + axis2.length);

  const keywords = Array.from(new Set(evidence.slice(0, 6).map((e) => e.eyebrow)));

  const fullText = [
    opening.headline,
    opening.summary,
    coreTaste.headline,
    coreTaste.body,
    howItShowsUp.headline,
    howItShowsUp.body,
    interestingPart.headline,
    interestingPart.body,
    ending.body,
  ].join("");
  const charCount = fullText.replace(/\s/g, "").length;

  const axesRecord = Object.fromEntries(TASTE_V3_AXIS_KEYS.map((k) => [k, aggregate[k].score])) as Record<TasteV3AxisKey, number>;

  return {
    opening,
    coreTaste,
    howItShowsUp,
    interestingPart,
    ending,
    keywords,
    pullQuote: ending.pullQuote,
    charCount,
    debug: {
      axes: axesRecord,
      axisRanking,
      relationshipMatches: relationships.map((r) => r.def.id),
      tensionMatches: tensions.map((t) => t.def.id),
      openingSource: openingResult.source,
      interestingPartSource: interestingPartResult.source,
    },
  };
}

export { RELATIONSHIP_DEFS_V3 };
export type { V3RelationshipDef };

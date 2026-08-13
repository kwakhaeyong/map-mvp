// TASTE v3 — RESULT EDITORIAL REWRITE(PR #261 후속 2차, 2026-08).
//
// §0 FREEZE: Questionnaire(15문항)·6축 evidence extraction·Relationship
// R1~R8·Tension T1~T5·scoring logic·분석 깊이는 전혀 손대지 않았다.
// tasteQuestionnaireV3.ts/tasteEvidenceV3.ts는 이번 라운드에서 아예
// 수정하지 않았고, tasteRelationshipsV3.ts/tasteTensionsV3.ts는 "고르다"
// 동사 2곳만 자연스러운 표현으로 바꿨을 뿐 축/방향/매칭 조건은 그대로다.
//
// 이번 라운드가 바꾼 것은 오직 "그 계산 결과를 사용자에게 어떤 말로
// 전달할지"뿐이다(DEEP ANALYSIS → SELECTIVE EDITORIAL OUTPUT). 이전
// (압축) 라운드는 글자 수를 줄이는 과정에서 "실제로 OO을 고른 대목",
// "열다섯 개의 답변 중에서", "SPACE 축" 같은 분석 리포트 표현이 오히려
// 늘어났다 — 이번 라운드는 그 표현을 전부 걷어내고, 생활 장면을 오래
// 관찰한 매거진 에디터의 문장으로 다시 썼다. 사용자에게 "문항/질문/
// 답변/선택/점수/분석/축/evidence/relationship/tension" 같은 단어나
// 그 개념을 노출하지 않는다 — 계산에는 그대로 쓰되, 문장에는 등장하지
// 않는다.

import { TASTE_V3_AXIS_KEYS, type TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { aggregateV3Axes, extractV3Evidence, type V3AxisAggregate, type V3EvidenceItem } from "./tasteEvidenceV3";
import { matchAllV3Relationships, RELATIONSHIP_DEFS_V3, type V3RelationshipDef, type V3RelationshipMatch } from "./tasteRelationshipsV3";
import { matchAllV3Tensions, type V3TensionMatch } from "./tasteTensionsV3";
import type { TasteV3RawAnswers } from "./tasteQuestionnaireV3";

// ============================================================
// SECTION SHAPE — 5-section editorial structure(Cover는 별도, Result는
// Opening/Core Taste/How It Shows Up/Interesting Part/Ending). axisLabel은
// 화면에도, 문장에도 원래 축 이름(SPACE/SENSORY 등)을 노출하지 않도록
// 자연어 설명 문구로만 채운다(§ "SPACE 성향" 같은 노출 금지).
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

// 문장 안에서 축을 지칭할 때 쓰는 자연어 표현 — "SPACE"/"SENSORY" 같은
// 원래 이름을 절대 그대로 노출하지 않는다. debug 패널(개발자 전용,
// 기본 접힘)에서만 원래 축 이름을 쓴다.
const AXIS_LABEL_KO: Record<TasteV3AxisKey, string> = {
  space: "공간을 대하는 마음",
  sensory: "먼저 반응하는 감각",
  rhythm: "하루를 흐르게 하는 속도",
  relation: "사람과 두는 거리",
  exploration: "새로움을 대하는 태도",
  expression: "마음을 드러내는 방식",
};

// 축마다 방향(+/-)별 해석 한 줄 — 관찰한 것을 그대로 말하는 문장이지,
// "점수가 높다"는 식의 진단이 아니다.
const AXIS_INTERPRETATION: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative:
      "당신에게 좋은 공간은 크기가 아니라 밀도로 정해집니다. 정돈된 넓은 곳보다, 손에 익은 좁은 자리에서 마음이 더 빨리 놓입니다.",
    positive:
      "당신에게 좋은 공간은 무엇으로 채워졌는가보다 무엇이 비워졌는가로 정해집니다. 물건이 많은 풍요로움보다, 시야가 걸리지 않는 명료함 쪽에서 마음이 더 빨리 놓입니다.",
  },
  sensory: {
    positive:
      "정제된 것보다 흔적이 남은 것에 먼저 눈이 가는, 촉각에 가까운 감각을 가졌습니다. 완벽한 상태보다 시간이 만든 표면을 더 오래 들여다보는 편입니다.",
    negative:
      "느낌보다 먼저 정확함을 알아보는, 시각적으로 엄격한 감각을 가졌습니다. 분위기가 좋아도 비율이나 마감이 어긋나면 눈이 먼저 걸립니다.",
  },
  rhythm: {
    positive: "머뭇거림 없이 움직이는 쪽이 당신에게는 더 자연스러운 속도입니다. 오래 재는 것보다, 마음이 움직인 순간을 놓치지 않습니다.",
    negative: "속도를 늦추는 것이 게으름이 아니라, 당신이 확신에 도달하는 방식입니다. 시간을 들일수록 오히려 더 편안해지는 쪽에 가깝습니다.",
  },
  relation: {
    positive: "혼자보다 함께일 때 더 선명해지는 쪽에 가깝습니다. 좋은 순간일수록 누군가와 나눠야 비로소 완성된다고 느낍니다.",
    negative: "곁에 사람이 없어도 허전해지지 않는, 스스로 채워지는 쪽입니다. 함께 있는 시간도 좋지만, 혼자인 시간이 있어야 다시 채워집니다.",
  },
  exploration: {
    positive: "안전한 길보다 낯선 쪽으로 먼저 손이 가는 사람입니다. 이미 아는 것을 반복하기보다, 확인되지 않은 쪽에서 더 큰 자극을 느낍니다.",
    negative: "새로움보다 이미 확인된 좋음을 놓치지 않는 쪽으로 마음이 기웁니다. 낯선 시도보다, 이미 아는 만족을 다시 확인하는 데서 더 큰 안정을 느낍니다.",
  },
  expression: {
    positive: "느낀 것을 안에 담아두지 못하고, 결국 밖으로 흘려보내는 편입니다. 좋은 것을 발견하면 그 순간의 흥분이 표현으로 먼저 튀어나옵니다.",
    negative: "표현하지 않아도 사라지지 않는, 스스로에게만 확실하면 되는 취향입니다. 굳이 설명하지 않아도 그 감정은 이미 충분히 완결돼 있습니다.",
  },
};

// 두 장면을 매거진 문장으로 잇는 연결구 — "그리고/이어서/고른" 같은
// 나열·인용 어투를 쓰지 않고, 관찰한 사람의 목소리로 자연스럽게 넘어간다.
const SCENE_LINK = [
  "이 장면들 사이에는 뚜렷한 결이 있습니다.",
  "두 순간이 다르게 보여도 같은 마음에서 나옵니다.",
  "겉모습은 달라도 같은 곳을 향합니다.",
  "이런 장면 앞에서 마음이 움직이는 방향은 한결같습니다.",
  "서로 다른 순간이지만 같은 무게로 다가옵니다.",
];
// CORE TASTE 전용 — "무엇"(interpretation) 다음에 "왜 그런가"를 한 겹
// 더 파고드는 문장. howItShowsUp의 AXIS_INTERPRETATION 재사용과
// 겹치지 않도록, 취향의 이유를 설명하는 새 정보만 담는다.
const AXIS_MEANING: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "정돈보다 익숙함을 우선하는 것은, 당신에게 좋은 공간이 보여주기 위한 곳이 아니라 살아내는 곳이기 때문입니다.",
    positive: "비움을 우선하는 것은, 당신에게 공간이 채워야 할 대상이 아니라 숨 쉴 자리를 남겨둬야 할 대상이기 때문입니다.",
  },
  sensory: {
    positive: "흔적에 먼저 반응하는 것은, 당신에게 좋은 것이 완성된 상태가 아니라 시간이 지나간 흔적 안에 있기 때문입니다.",
    negative: "정확함에 먼저 반응하는 것은, 당신에게 좋은 느낌이 분위기가 아니라 만듦새에서 나온다고 믿기 때문입니다.",
  },
  rhythm: {
    positive: "머뭇거리지 않는 것은, 당신에게 확신이 시간을 들여야 오는 것이 아니라 이미 그 순간에 와 있는 것이기 때문입니다.",
    negative: "속도를 늦추는 것은, 당신에게 좋은 결정이 저절로 오는 것이 아니라 시간을 들여야 비로소 확인되는 것이기 때문입니다.",
  },
  relation: {
    positive: "함께일 때 더 선명해지는 것은, 당신에게 좋은 순간이 혼자 간직하기보다 나눠야 비로소 완성되기 때문입니다.",
    negative: "혼자서도 채워지는 것은, 당신에게 관계가 결핍을 채우는 수단이 아니라 여유에서 나오는 마음이기 때문입니다.",
  },
  exploration: {
    positive: "낯선 쪽으로 먼저 움직이는 것은, 당신에게 안전함보다 아직 모르는 자극이 더 크게 다가오기 때문입니다.",
    negative: "이미 아는 좋음을 지키는 것은, 당신에게 새로움보다 검증된 만족이 더 믿을 만하기 때문입니다.",
  },
  expression: {
    positive: "감정이 밖으로 흘러나오는 것은, 당신에게 좋은 순간이 혼자만 아는 채로 남으면 아쉽기 때문입니다.",
    negative: "표현하지 않아도 되는 것은, 당신에게 감정의 완결이 남에게 확인받는 데 있지 않기 때문입니다.",
  },
};

// HOW IT SHOWS UP 전용 — 이 마음이 실제로 어떤 구체적인 행동/선택
// (쇼핑·여행·만남·하루 속도)으로 나타나는지 보여주는 생활 장면 한 줄.
// AXIS_INTERPRETATION/AXIS_MEANING과 다른 새 정보(§6 반복 금지)만 담는다.
const BEHAVIOR_SCENE: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "이사를 하거나 짐을 채울 때도 넓이보다 얼마나 빨리 손에 익을지를 먼저 생각합니다. 처음 며칠은 낯설어도, 물건들을 조금씩 옮겨와 원래 자리처럼 만듭니다.",
    positive: "짐을 정리할 때도 더할 것보다 없앨 것부터 찾습니다. 책상 위에 물건 하나만 더 있어도 눈에 걸려, 자주 비우는 편입니다.",
  },
  sensory: {
    positive: "물건을 살 때도 눈에 띄는 새로움보다 시간이 지나 어떻게 변할지를 먼저 상상합니다. 낡아가는 모습까지 마음에 들어야 손이 갑니다.",
    negative: "물건을 살 때도 겉보기 분위기보다 마감과 비율을 먼저 확인합니다. 아주 조금만 어긋나도 계속 눈에 밟힙니다.",
  },
  rhythm: {
    positive: "마음이 움직인 날은 정해둔 계획을 바꿔서라도 그 순간을 따라갑니다. 다음으로 미루면 이미 늦었다고 느낄 때가 많습니다.",
    negative: "누군가 재촉해도 속도를 크게 늦추지 않습니다. 시간이 지날수록 오히려 마음이 더 편안한 쪽으로 정리됩니다.",
  },
  relation: {
    positive: "좋은 하루를 보내면 그 자리에서 바로 누군가에게 연락하고 싶어집니다. 혼자 간직하기보다 나눌 사람을 먼저 떠올립니다.",
    negative: "약속 없는 저녁에도 딱히 허전함을 느끼지 않습니다. 혼자 보내는 시간이 쌓여야 다시 사람을 만날 힘이 생깁니다.",
  },
  exploration: {
    positive: "여행지에서도 미리 정한 일정보다 그날 눈에 들어오는 골목을 따라갑니다. 계획이 틀어지는 것을 오히려 반깁니다.",
    negative: "여행지에서도 처음 가는 곳보다 마음에 들었던 자리를 다시 찾아갑니다. 이미 좋았던 것을 또 확인하는 데서 안정을 얻습니다.",
  },
  expression: {
    positive: "마음에 드는 것을 발견하면 사진이나 말로 그 순간을 바로 남깁니다. 좋았던 감정을 안에만 두지 못하는 편입니다.",
    negative: "마음에 드는 것을 발견해도 굳이 알리지 않고 지나가는 경우가 많습니다. 표현하지 않아도 그 감정은 이미 충분합니다.",
  },
};

const SCENE_LINK_SINGLE = [
  "이 장면 하나만으로도 충분히 짐작됩니다.",
  "망설임 없이 이쪽으로 마음이 갑니다.",
  "다른 설명이 필요 없을 만큼 분명합니다.",
];
const WHY_IT_MATTERS = [
  "겉으로는 사소해 보여도, 이 마음은 매번 비슷하게 움직입니다.",
  "상황이 달라져도 결국 같은 쪽으로 돌아옵니다.",
  "다른 조건이 아무리 좋아도, 이 부분이 어긋나면 마음이 잘 가지 않습니다.",
  "설명을 듣기 전부터 몸이 먼저 그쪽으로 움직입니다.",
];
const CONTRAST_LINE = [
  "누군가는 이 차이를 눈치채지 못하고 지나가지만, 당신에게는 분명한 경계입니다.",
  "비슷해 보이는 두 갈래 앞에서, 당신은 언제나 같은 쪽으로 기울었습니다.",
  "다른 사람이라면 크게 신경 쓰지 않았을 지점에서, 당신은 매번 갈렸습니다.",
  "사소한 차이처럼 보여도, 이 부분을 빼면 나머지 설명이 잘 되지 않습니다.",
];

function pickByIndex<T>(pool: T[], seed: number): T {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

// 한국어 조사 도우미 — 동적으로 삽입되는 문구 뒤에 조사를 하드코딩하면
// 받침 유무에 따라 어긋나기 쉬워, 받침 판정 헬퍼로 통일한다.
function hasBatchim(text: string): boolean {
  const lastChar = text.trim().slice(-1);
  const code = lastChar.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return false;
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

// 같은 장면(questionId)을 여러 section에서 그대로 재사용하지 않기
// 위한 사용 추적기.
class UsageTracker {
  private counts = new Map<string, number>();
  use(questionId: string): number {
    const next = (this.counts.get(questionId) ?? 0) + 1;
    this.counts.set(questionId, next);
    return next;
  }
}

function rankAxes(aggregate: V3AxisAggregate): TasteV3AxisKey[] {
  return [...TASTE_V3_AXIS_KEYS].sort((a, b) => Math.abs(aggregate[b].score) - Math.abs(aggregate[a].score));
}

// 장면 두 개(또는 세 개)를 매거진식 comma-list로 연결한다 — "~를
// 골랐습니다" 나열이 아니라 하나의 시각적 문장으로 보이게 한다.
function sceneList(phrases: string[]): string {
  return phrases.map(stripTrailingPunct).join(", ") + ".";
}

// ============================================================
// CORE TASTE / HOW IT SHOWS UP — 가장 강한 축(들)을 하나의 관찰
// 문단으로 엮는다. 첫 문장은 항상 구체적인 생활 장면(이미지가 있다면
// 그 이미지 안의 장면과 같은 결)으로 시작한다.
// ============================================================
function buildAxisSection(
  axis: TasteV3AxisKey,
  headline: string,
  leadIn: string | null,
  aggregate: V3AxisAggregate,
  usage: UsageTracker,
  seed: number,
  // CORE TASTE는 "왜 끌리는지"(meaning)를 먼저, HOW IT SHOWS UP은
  // "실제로 어떻게 나타나는지"(behavior)를 먼저 말해 두 섹션의
  // 무게중심을 다르게 둔다 — 두 정보 모두 담되 순서로 역할을 가른다.
  // 같은 축이라도 두 섹션(axis1≠axis2)이 서로 다른 축을 다뤄 반복되지
  // 않는다(§6).
  role: "why" | "behavior" = "why"
): { headline: string; body: string; axisLabel: string } {
  const axisLabel = AXIS_LABEL_KO[axis];
  const sorted = strongestEvidenceForAxis(aggregate, axis);
  const anchor = sorted[0];
  if (!anchor) {
    return { headline, body: "여기서는 어느 한쪽으로 뚜렷하게 기울지 않고 고르게 나뉩니다.", axisLabel };
  }
  usage.use(anchor.questionId);
  const supporting = sorted.find((e) => e.questionId !== anchor.questionId);
  if (supporting) usage.use(supporting.questionId);

  const scene = supporting ? sceneList([anchor.optionLabel, supporting.optionLabel]) : sceneList([anchor.optionLabel]);
  const link = supporting ? pickByIndex(SCENE_LINK, seed) : pickByIndex(SCENE_LINK_SINGLE, seed);

  const direction = aggregate[axis].score >= 0 ? "positive" : "negative";
  const interpretation = AXIS_INTERPRETATION[axis][direction];
  const meaning = AXIS_MEANING[axis][direction];
  const behavior = BEHAVIOR_SCENE[axis][direction];
  const [first, second] = role === "why" ? [meaning, behavior] : [behavior, meaning];
  const why = pickByIndex(WHY_IT_MATTERS, seed + anchor.qNumber);
  const contrast = pickByIndex(CONTRAST_LINE, seed + anchor.qNumber + 1);

  const body = [leadIn, scene, link, interpretation, first, second, why, contrast].filter(Boolean).join(" ");
  return { headline, body, axisLabel };
}

// ============================================================
// OPENING — "계속 읽고 싶게 만드는 첫 관찰". 전체를 요약하지 않고,
// 가장 특징적인 장면 하나(또는 둘)를 꺼내 짧은 hook으로 닫는다.
// ============================================================
const OPENING_HOOK_PAIR = [
  "겉으로 다른 두 장면 같지만, 하루 안에서는 자연스럽게 이어집니다.",
  "언뜻 안 어울리는 조합처럼 보여도, 실은 같은 사람의 리듬입니다.",
  "이 두 순간을 나란히 놓고 보면, 그제야 진짜 얼굴이 보입니다.",
  "따로 보면 낯설지만, 함께 보면 오히려 선명해집니다.",
];
const OPENING_HOOK_SINGLE = [
  "이 장면 하나에도 이미 많은 것이 담겨 있습니다.",
  "화려하지 않아도, 이쪽 하나는 분명합니다.",
  "복잡한 설명이 필요 없을 만큼, 방향은 뚜렷합니다.",
];
// 훅 다음, 이 지면을 계속 읽고 싶게 만드는 짧은 예고 한 줄.
const OPENING_ECHO = [
  "지금부터 이 장면이 어디까지 이어지는지 하나씩 따라가 봅니다.",
  "이 페이지는 그 장면에서 시작해, 조금씩 더 안쪽으로 들어갑니다.",
  "여기서부터가 진짜 당신에 가까운 이야기입니다.",
];

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
    const scene = sceneList(ev.map((e) => e.optionLabel));
    return {
      headline: t.headline,
      summary: `${scene} ${pickByIndex(OPENING_HOOK_PAIR, ev[0]?.qNumber ?? 0)} ${pickByIndex(OPENING_ECHO, ev[0]?.qNumber ?? 0)}`,
      source: `tension:${t.id}`,
    };
  }
  if (relationships.length > 0) {
    const r = relationships[0];
    const ev = r.evidence.slice(0, 2);
    ev.forEach((e) => usage.use(e.questionId));
    const scene = sceneList(ev.map((e) => e.optionLabel));
    return {
      headline: r.def.headline,
      summary: `${scene} ${pickByIndex(OPENING_HOOK_PAIR, ev[0]?.qNumber ?? 1)} ${pickByIndex(OPENING_ECHO, ev[0]?.qNumber ?? 1)}`,
      source: `relationship:${r.def.id}`,
    };
  }
  const topAxis = axisRanking[0];
  const top = strongestEvidenceForAxis(aggregate, topAxis)[0];
  if (top) usage.use(top.questionId);
  return {
    headline: "여러 장면이 아니라,\n하나의 시선으로 이어지는 사람.",
    summary: top
      ? `${sceneList([top.optionLabel])} ${pickByIndex(OPENING_HOOK_SINGLE, top.qNumber)} ${pickByIndex(OPENING_ECHO, top.qNumber)}`
      : "여러 장면이 하나의 시선으로 이어집니다.",
    source: `axis-fallback:${topAxis}`,
  };
}

// ============================================================
// THE INTERESTING PART — strongest tension > relationship > axis-pair
// fallback. 이 사람 안의 뜻밖의 조합을 "재미있는 건" 식으로 풀어낸다.
// R1~R8/T1~T5의 headline/interestingPartBody(이미 편집된 문장)를 그대로
// 쓰고, 짧은 마무리 한 줄만 얹는다 — evidence를 추가로 인용하며
// 길이를 늘리지 않는다(§ 반복 제거·불필요한 padding 금지).
// ============================================================
const FALLBACK_INTERESTING_HEADLINES = [
  "가장 강하게 남은 건,\n어느 한쪽이 아니라 그 사이였습니다.",
  "정답을 정해두지 않아도,\n방향은 이미 뚜렷했습니다.",
];
const INTERESTING_CLOSERS = [
  "서로 다른 두 마음이 실제로는 아무 마찰 없이 공존합니다. 둘 중 하나를 지우면 오히려 설명이 이상해집니다.",
  "겉으로 드러나는 모습만으로는 짐작하기 어려운 조합입니다. 가까이서 지켜본 사람만 알아챌 만한 부분입니다.",
  "함께 있는 채로 두는 편이 더 정확합니다. 어긋나 보여도 실은 두 겹으로 겹친 하나의 모습입니다.",
];
// 이 모순이 실제로 언제 드러나는지 짚어주는 짧은 생활 장면 한 줄 —
// 가까운 사람 눈에는 보이지만 본인에게는 당연해서 잘 안 보이는 지점.
const INTERESTING_LIFE_ECHO = [
  "가까운 사람들은 이런 순간을 이미 여러 번 봤을 겁니다 — 정작 본인에게는 너무 당연해서 잘 안 보일 뿐입니다.",
  "처음 만난 사람은 둘 중 한쪽만 보고 당신을 짐작하기 쉽지만, 오래 지켜본 사람은 둘 다를 알고 있습니다.",
  "이 부분을 미리 알고 나면, 다음번엔 당신의 다른 결정도 조금 더 이해가 될 겁니다.",
];

function buildInterestingPart(
  aggregate: V3AxisAggregate,
  relationships: V3RelationshipMatch[],
  tensions: V3TensionMatch[],
  openingSource: string
): { headline: string; body: string; source: string } {
  const openingIsTension = openingSource.startsWith("tension:");
  const openingIsRelationship = openingSource.startsWith("relationship:");
  const nextTension = tensions.find((t) => !(openingIsTension && openingSource === `tension:${t.def.id}`));
  const nextRelationship = relationships.find((r) => !(openingIsRelationship && openingSource === `relationship:${r.def.id}`));

  if (nextTension) {
    const seed = nextTension.def.relatedQNumbers.reduce((a, b) => a + b, 0);
    return {
      headline: nextTension.def.headline,
      body: `${nextTension.def.interestingPartBody} ${pickByIndex(INTERESTING_CLOSERS, seed)} ${pickByIndex(INTERESTING_LIFE_ECHO, seed + 1)}`,
      source: `tension:${nextTension.def.id}`,
    };
  }
  if (nextRelationship) {
    return {
      headline: nextRelationship.def.headline,
      body: `${nextRelationship.def.interestingPartBody} ${pickByIndex(INTERESTING_CLOSERS, nextRelationship.strength)} ${pickByIndex(INTERESTING_LIFE_ECHO, nextRelationship.strength + 1)}`,
      source: `relationship:${nextRelationship.def.id}`,
    };
  }

  const axesSorted = TASTE_V3_AXIS_KEYS.map((k) => ({ key: k, score: aggregate[k].score })).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const a = axesSorted[0];
  const b = axesSorted.find((x) => x.key !== a.key) ?? axesSorted[1];
  const evA = strongestEvidenceForAxis(aggregate, a.key)[0];
  const evB = strongestEvidenceForAxis(aggregate, b.key)[0];
  const scene = [evA, evB]
    .filter((e): e is V3EvidenceItem => Boolean(e))
    .map((e) => e.optionLabel);
  const headline = pickByIndex(FALLBACK_INTERESTING_HEADLINES, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 0));
  const labelA = AXIS_LABEL_KO[a.key];
  const labelB = AXIS_LABEL_KO[b.key];
  const body = [
    scene.length > 0 ? sceneList(scene) : "",
    `${labelA}${gwaWa(labelA)} ${labelB}${eunNeun(labelB)} 이렇게 다른 크기로 나타났다는 것은, 이 둘을 애초에 같은 무게로 쓰고 있지 않다는 뜻입니다.`,
    "어느 쪽이 진짜인지 하나로 정리할 필요는 없습니다 — 두 크기가 다른 채로 함께 있는 편이 실제 모습에 더 가깝습니다.",
    pickByIndex(INTERESTING_CLOSERS, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 1)),
    pickByIndex(INTERESTING_LIFE_ECHO, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 2)),
  ]
    .filter(Boolean)
    .join(" ");
  return { headline, body, source: `axis-pair-fallback:${a.key}x${b.key}` };
}

// ============================================================
// ENDING — 요약도 새 분석도 아닌 짧은 editorial closing.
// ============================================================
const ENDING_CLOSERS = [
  "이 페이지는 오늘로 끝나지 않습니다 — 다음 장에서 당신은 조금 더 또렷하게 읽힐 것입니다.",
  "사진 몇 장으로 보이는 인상보다, 이 안에 쌓인 장면들이 결국 더 오래 남습니다.",
  "취향은 완성되는 것이 아니라, 매번 이렇게 다시 확인되는 것에 가깝습니다.",
  "여기까지가 오늘의 한 장입니다 — 다음 장은 조금 다른 장면에서 시작됩니다.",
];
// closer 앞에 한 겹 더 — 오늘 읽은 장면들이 왜 하나로 묶이는지에 대한
// 짧은 여운. 요약이 아니라 감정의 잔향에 가깝다.
const ENDING_RESONANCE = [
  "따로 떼어 보면 사소했을 순간들이, 이렇게 모아 놓으니 하나의 결로 읽힙니다.",
  "매일 지나치던 장면인데, 이렇게 나란히 놓고 보니 낯설게 다시 보입니다.",
  "본인에게는 당연했던 습관들이, 지면 위에서는 뚜렷한 무늬가 됩니다.",
];

function buildEnding(
  openingHeadline: string,
  howItShowsUp: { axisLabel: string },
  coreTaste: { axisLabel: string },
  seed: number
): { body: string; pullQuote: string } {
  const callback = openingHeadline.replace(/\n/g, " ");
  const cleanCallback = stripTrailingPunct(callback);
  const body = [
    `"${cleanCallback}"${iRaneun(cleanCallback)} 첫 장면으로 돌아가 보면, ${coreTaste.axisLabel}${gwaWa(coreTaste.axisLabel)} ${howItShowsUp.axisLabel}${eunNeun(howItShowsUp.axisLabel)} 서로 다른 자리에서 같은 사람을 가리키고 있었습니다.`,
    "장면 하나, 물건 하나로는 다 설명되지 않지만, 이렇게 겹쳐 놓고 보면 어렴풋했던 윤곽이 조금 더 또렷해집니다.",
    pickByIndex(ENDING_RESONANCE, seed),
    pickByIndex(ENDING_CLOSERS, seed + 1),
  ]
    .filter(Boolean)
    .join(" ");
  return { body, pullQuote: callback };
}

// ============================================================
// ROOT
// ============================================================
export function buildTasteMagazineNarrativeV3(answers: TasteV3RawAnswers): TasteMagazineNarrativeV3 {
  // §0 FREEZE — 15문항 전체의 evidence 계산, 6축 합산, 관계/긴장 매칭은
  // 이전 라운드들과 완전히 동일하다. 이 세 줄은 이번 라운드에서 한 글자도
  // 바뀌지 않았다.
  const evidence = extractV3Evidence(answers);
  const aggregate = aggregateV3Axes(evidence);
  const relationships = matchAllV3Relationships(aggregate);
  const tensions = matchAllV3Tensions(evidence);

  const axisRanking = rankAxes(aggregate);
  const usage = new UsageTracker();

  const openingResult = buildOpening(aggregate, relationships, tensions, axisRanking, usage);
  const opening = { headline: openingResult.headline, summary: openingResult.summary };

  const axis1 = axisRanking[0];
  const coreTaste = buildAxisSection(axis1, "취향의 중심", null, aggregate, usage, axis1.length + 1, "why");

  const axis2 = axisRanking[1];
  const howItShowsUp = buildAxisSection(
    axis2,
    "생활에서 나타나는 방식",
    "이 마음은 다른 자리에서도 다시 나타납니다.",
    aggregate,
    usage,
    axis2.length + 2,
    "behavior"
  );

  const interestingPartResult = buildInterestingPart(aggregate, relationships, tensions, openingResult.source);
  const interestingPart = { headline: interestingPartResult.headline, body: interestingPartResult.body };

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

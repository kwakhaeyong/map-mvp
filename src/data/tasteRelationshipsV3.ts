// TASTE v3 — §6 REQUIRED RELATIONSHIPS(R1~R8), PRODUCT FREEZE 그대로.
//
// 매칭 규칙은 기존 v2.1/v2.2 relationship 규칙(evaluateRelationship)과
// 동일하게 유지했다(§6 "기존 v2.3 relationship 중 의미가 맞는 것은
// 재사용 가능하다" — 매칭 "규칙"까지 포함해 재사용, 카피/축 조합
// 자체는 FREEZE R1~R8을 그대로 따른다): 두 축의 방향이 모두 맞아야
// 하고, 그 방향을 뒷받침하는 evidence가 서로 다른 문항(questionId)
// 최소 2곳에서 나와야 한다.
//
// R5(SPACE×SENSORY)는 FREEZE 원문이 "~하거나 그 반대인 사람"으로
// 양방향을 모두 인정하도록 써 있어, 두 방향(질감 우선 / 구조 우선)을
// 각각 별도 def(r5-textural-first / r5-structural-first)로 나눠 구현했다
// — 하나의 R5 개념 아래 두 개의 표현형이 있는 구조다.

import type { TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { evidencePageCount, type V3EvidenceItem } from "./tasteEvidenceV3";

export type V3RelationshipAxis = { key: TasteV3AxisKey; direction: "high" | "low" };

export type V3RelationshipDef = {
  id: string;
  reqId: string; // R1..R8 (FREEZE 원문 번호)
  headline: string;
  interestingPartBody: string;
  pullQuote: string;
  axes: [V3RelationshipAxis, V3RelationshipAxis];
  // 이 관계가 실제로 만들 수 있는 evidence 인용 문장 템플릿(선택된
  // evidenceLabel을 이어붙일 때 쓰는 접속 문구) — 구성 엔진에서 사용.
};

export const RELATIONSHIP_DEFS_V3: V3RelationshipDef[] = [
  {
    id: "r1-space-exploration",
    reqId: "R1",
    headline: "돌아갈 곳이 분명해서,\n더 멀리 가볼 수 있는 사람.",
    interestingPartBody:
      "머무는 공간에서는 밀도 있고 손에 익은 쪽을 고르면서도, 새로운 장소 앞에서는 주저하지 않습니다. 익숙한 공간을 좋아하는 것과 새로운 장면을 찾아 나서는 것은, 당신 안에서는 서로 다른 두 개의 규칙이 아니라 하나로 이어진 태도에 가깝습니다.",
    pullQuote: "익숙한 방이 있어서, 낯선 거리를 걸을 수 있다.",
    axes: [
      { key: "space", direction: "low" },
      { key: "exploration", direction: "high" },
    ],
  },
  {
    id: "r2-sensory-expression",
    reqId: "R2",
    headline: "느끼는 것은 섬세하지만,\n그것을 크게 드러내지는 않는 사람.",
    interestingPartBody:
      "빛과 질감, 흔적 같은 것들에 먼저 반응하면서도, 그 감각을 남에게 설명하거나 보여줘야 할 필요는 느끼지 않습니다. 감각의 예민함과 표현의 조용함은 반대말이 아니라, 당신에게는 같은 태도의 두 얼굴입니다.",
    pullQuote: "많이 느끼는 것과, 많이 보여주는 것은 다른 일이다.",
    axes: [
      { key: "sensory", direction: "high" },
      { key: "expression", direction: "low" },
    ],
  },
  {
    id: "r3-rhythm-exploration",
    reqId: "R3",
    headline: "발견은 빠르지만,\n선택은 천천히 하는 사람.",
    interestingPartBody:
      "새로운 것 앞에서 망설이는 시간은 짧지만, 그것을 실제로 내 것으로 정할 때는 시간을 들입니다. 발견의 속도와 결정의 속도가 다르다는 것은 성급함과 신중함이 뒤섞인 게 아니라, 두 순간에 각자 다른 기준을 쓰고 있다는 뜻에 가깝습니다.",
    pullQuote: "발견은 빠르게, 선택은 천천히.",
    axes: [
      { key: "exploration", direction: "high" },
      { key: "rhythm", direction: "low" },
    ],
  },
  {
    id: "r4-relation-expression",
    reqId: "R4",
    headline: "좋은 것은 함께 나누지만,\n전부를 보여주지는 않는 사람.",
    interestingPartBody:
      "정말 마음에 드는 것을 발견했을 때 가까운 사람과는 나누고 싶어하면서도, 그 취향을 모두에게 설명하거나 널리 알려야 할 필요는 느끼지 않습니다. 관계는 열려 있어도 표현은 선택적인 편에 가깝습니다.",
    pullQuote: "가까운 사람과는 나누고, 나머지는 내 몫으로 둔다.",
    axes: [
      { key: "relation", direction: "high" },
      { key: "expression", direction: "low" },
    ],
  },
  {
    id: "r5-textural-first",
    reqId: "R5",
    headline: "공간의 구조보다,\n흔적과 질감에 먼저 반응하는 사람.",
    interestingPartBody:
      "어떤 공간에 들어갔을 때 정돈된 구조보다 빛이 스민 자리, 손때 묻은 물건 같은 흔적에 먼저 눈이 갑니다. 공간을 판단하는 첫 기준이 배치가 아니라 질감이라는 것은, 당신이 공간을 '보는' 것이 아니라 먼저 '느낀다'는 뜻에 가깝습니다.",
    pullQuote: "구조를 보기 전에, 흔적을 먼저 본다.",
    axes: [
      { key: "space", direction: "low" },
      { key: "sensory", direction: "high" },
    ],
  },
  {
    id: "r5-structural-first",
    reqId: "R5",
    headline: "흔적이나 분위기보다,\n공간의 구조에 먼저 반응하는 사람.",
    interestingPartBody:
      "어떤 공간에 들어갔을 때 분위기나 흔적보다 선과 면, 트인 시야 같은 구조가 먼저 눈에 들어옵니다. 공간을 판단하는 첫 기준이 질감이 아니라 배치라는 것은, 당신이 공간을 먼저 '읽는다'는 뜻에 가깝습니다.",
    pullQuote: "느낌보다 먼저, 구조를 읽는다.",
    axes: [
      { key: "space", direction: "high" },
      { key: "sensory", direction: "low" },
    ],
  },
  {
    id: "r6-rhythm-relation",
    reqId: "R6",
    headline: "사람을 좋아하지만,\n자기 리듬도 함께 필요한 사람.",
    interestingPartBody:
      "누군가와 함께 있는 시간을 분명히 좋아하면서도, 그 시간 전부가 상대의 속도에 맞춰지는 것은 원하지 않습니다. 관계를 좋아하는 것과 자기만의 리듬을 지키고 싶어하는 것은, 당신 안에서 서로를 밀어내지 않고 나란히 있습니다.",
    pullQuote: "함께 있되, 내 속도는 내가 정한다.",
    axes: [
      { key: "relation", direction: "high" },
      { key: "rhythm", direction: "low" },
    ],
  },
  {
    id: "r7-exploration-expression",
    reqId: "R7",
    headline: "새로운 것은 계속 찾지만,\n유행에 크게 흔들리지는 않는 사람.",
    interestingPartBody:
      "낯선 것, 아직 알려지지 않은 것에는 적극적으로 다가가면서도, 무언가가 갑자기 유명해졌다는 사실 자체는 당신의 관심에 별 영향을 주지 않습니다. 새로움을 좇는 기준이 유행이 아니라 당신 자신에게 있다는 뜻에 가깝습니다.",
    pullQuote: "새로운 걸 찾는 건 나를 위해서지, 남을 따라서가 아니다.",
    axes: [
      { key: "exploration", direction: "high" },
      { key: "expression", direction: "low" },
    ],
  },
  {
    id: "r8-space-expression",
    reqId: "R8",
    headline: "취향을 말보다,\n자신의 공간에 남기는 사람.",
    interestingPartBody:
      "취향을 설명하기보다, 그 취향이 자연스럽게 묻어나는 공간을 만드는 쪽에 가깝습니다. 지금 쓰는 것들이 눈에 보이는 밀도 있는 공간을 선호한다는 것은, 말로 하지 않아도 그 공간 자체가 이미 당신을 보여주고 있다는 뜻입니다.",
    pullQuote: "설명하지 않아도, 공간이 대신 말해준다.",
    axes: [
      { key: "space", direction: "low" },
      { key: "expression", direction: "high" },
    ],
  },
];

export type V3RelationshipMatch = {
  def: V3RelationshipDef;
  strength: number;
  evidencePageCount: number;
  evidence: V3EvidenceItem[];
};

function axisDirectionEvidence(axisEvidence: V3EvidenceItem[], axis: V3RelationshipAxis): V3EvidenceItem[] {
  return axisEvidence.filter((e) => {
    const v = e.axes[axis.key];
    if (!v) return false;
    return axis.direction === "high" ? v > 0 : v < 0;
  });
}

export function evaluateV3Relationship(
  def: V3RelationshipDef,
  aggregate: Record<TasteV3AxisKey, { score: number; evidence: V3EvidenceItem[] }>
): V3RelationshipMatch | null {
  const [axisA, axisB] = def.axes;
  const scoreA = aggregate[axisA.key].score;
  const scoreB = aggregate[axisB.key].score;
  const directionMatches = (score: number, direction: "high" | "low") => (direction === "high" ? score > 0 : score < 0);
  if (!directionMatches(scoreA, axisA.direction) || !directionMatches(scoreB, axisB.direction)) return null;

  const evidenceA = axisDirectionEvidence(aggregate[axisA.key].evidence, axisA);
  const evidenceB = axisDirectionEvidence(aggregate[axisB.key].evidence, axisB);
  const combined = [...evidenceA, ...evidenceB];
  const pageCount = evidencePageCount(combined);
  if (pageCount < 2) return null; // 한 문항 하나로 관계가 정해지지 않게 하는 규칙(기존 v2.1과 동일)

  const strength = Math.abs(scoreA) + Math.abs(scoreB);
  // 중복 evidence 제거(같은 문항이 두 축 모두에 실렸을 수 있음)
  const uniqueEvidence = Array.from(new Map(combined.map((e) => [e.questionId, e])).values());
  return { def, strength, evidencePageCount: pageCount, evidence: uniqueEvidence };
}

function compareMatches(a: V3RelationshipMatch, b: V3RelationshipMatch): number {
  if (b.strength !== a.strength) return b.strength - a.strength;
  if (b.evidencePageCount !== a.evidencePageCount) return b.evidencePageCount - a.evidencePageCount;
  return a.def.id.localeCompare(b.def.id);
}

export function matchAllV3Relationships(
  aggregate: Record<TasteV3AxisKey, { score: number; evidence: V3EvidenceItem[] }>
): V3RelationshipMatch[] {
  const matches = RELATIONSHIP_DEFS_V3.map((def) => evaluateV3Relationship(def, aggregate)).filter((m): m is V3RelationshipMatch => m !== null);
  return matches.sort(compareMatches);
}

// R5는 텍스트/구조 반대 방향 2개 표현형 중 하나만 채택되도록(둘 다 동시
// matched될 수 없다 — space axis 방향이 정반대라 상호 배타적이다).

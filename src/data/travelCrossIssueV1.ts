// CROSS-ISSUE ENGINE v1(2026-08, PR #261 Round I §6~§13 구현).
//
// TASTE × TRAVEL을 나란히 놓고 "이전에는 볼 수 없었던 해석"을
// 만드는 유일한 엔진. 결정론적(non-ML) 규칙 기반이며, 사용자에게
// 보이는 모든 문장은 (pairId, insightType, tasteDirection,
// travelDirection) 조합별로 손으로 쓴 카피뱅크(COPY_BANK)에서만
// 나온다 — tasteNarrativeV3.ts의 BEHAVIOR_SCENE/PRACTICAL_CONSEQUENCE와
// 동일한 원칙이다. 계산된 조합에 맞는 카피가 없으면, generic 문장으로
// 대체하지 않고 그 후보를 그냥 버린다(§ "억지 생성 금지"). 그래서
// 이번 라운드의 Matrix는 설계 라운드가 제시한 14쌍 전체가 아니라,
// 실제로 편집자 품질의 카피를 쓸 수 있었던 6쌍만 우선 구현했다 —
// 나머지는 카피가 준비되는 대로 COPY_BANK에 항목만 추가하면 되는
// 구조라, 이후 라운드에서 점진적으로 넓힐 수 있다(완료 보고에 범위
// 축소를 명시한다).

import type { TasteV3AxisKey } from "./tasteQuestionnaireV3";
import type { V3AxisAggregate } from "./tasteEvidenceV3";
import type { TravelAxisKey } from "./travelQuestionnaireV1";
import type { TravelV1AxisAggregate } from "./travelEvidenceV1";

export type InsightType = "HIDDEN_RULE" | "CONTEXT_SHIFT" | "CONTRAST" | "REINFORCEMENT";
export type CrossIssueConfidence = "HIGH" | "MEDIUM" | "LOW";
type Direction = "positive" | "negative";

export type CrossIssueEvidenceRef = { source: "taste" | "travel"; label: string };

export type CrossIssueCandidate = {
  pairId: string;
  type: InsightType;
  confidence: CrossIssueConfidence;
  tasteAxis: TasteV3AxisKey;
  tasteDirection: Direction;
  travelAxis: TravelAxisKey;
  travelDirection: Direction;
  directEvidence: CrossIssueEvidenceRef[];
  editorialHeadline: string;
  editorialBody: string;
};

type CopyEntry = { type: InsightType; headline: string; body: string };

function key(pairId: string, tasteDir: Direction, travelDir: Direction): string {
  return `${pairId}:${tasteDir}:${travelDir}`;
}

// pairId = "<tasteAxis>x<travelAxis>". §11 요구대로 문항 번호가 아니라
// axis-pair로 키를 잡는다(문항이 나중에 바뀌어도 이 매핑은 안 깨진다).
const COPY_BANK: Record<string, CopyEntry> = {
  [key("spacexcomfort", "negative", "negative")]: {
    type: "REINFORCEMENT",
    headline: "좁고 낡은 방이 편한 이유는,\n낯선 여행지에서도 똑같이 나타납니다.",
    body: "당신은 정돈된 넓은 공간보다 손에 익은 좁은 자리에서 마음이 놓인다고 했습니다. 그리고 낯선 숙소가 불편해도 크게 개의치 않고 그 흐름 그대로 머무는 쪽을 택했습니다. 두 대답은 서로 다른 질문에서 나왔지만, 같은 태도를 가리킵니다 — 당신에게 편안함은 시설의 완성도가 아니라, 그 공간에 얼마나 빨리 스며드는가로 결정됩니다.",
  },
  [key("spacexcomfort", "negative", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "일상에서는 손때 묻은 공간이 편하지만,\n여행에서는 다른 기준이 작동합니다.",
    body: "당신은 평소 정돈된 넓은 곳보다 밀도 있고 익숙한 공간에서 마음이 놓인다고 했습니다. 그런데 여행 중 숙소가 불편하면 흐름을 바꿔서라도 더 편한 곳으로 옮기는 쪽을 택했습니다. 일상의 편안함과 여행의 편안함은 당신에게 같은 기준으로 작동하지 않습니다 — 손에 익은 것과 몸이 편한 것은, 당신 안에서는 서로 다른 이야기입니다.",
  },
  [key("relationxsocial", "negative", "negative")]: {
    type: "REINFORCEMENT",
    headline: "혼자 있는 시간이 필요한 사람은,\n낯선 여행지에서도 그 시간을 지킵니다.",
    body: "당신은 평소 사람들과 함께 있는 시간보다 혼자 채워지는 시간이 필요하다고 했습니다. 여행 중에도 낯선 사람이 먼저 다가와도 대화를 짧게 끝내고 혼자만의 시간으로 돌아가는 쪽을 택했습니다. 익숙한 삶에서도, 완전히 낯선 환경에서도 — 당신에게 회복은 관계가 아니라 혼자 있는 시간에서 옵니다.",
  },
  [key("relationxsocial", "negative", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "평소엔 혼자가 편하지만,\n낯선 곳에서는 먼저 다가가는 쪽이 됩니다.",
    body: "당신은 평소 혼자 있는 시간이 있어야 다시 채워진다고 했습니다. 하지만 여행 중에는 먼저 말을 걸어볼 사람을 찾고, 낯선 이와의 대화를 반갑게 이어가는 쪽을 택했습니다. 익숙한 관계에서는 거리를 두면서도, 낯선 환경에서는 오히려 그 거리를 먼저 좁히는 사람입니다 — 관계를 여는 기준이 '누구인가'가 아니라 '어디인가'에 있는 편에 가깝습니다.",
  },
  [key("expressionxmemory", "positive", "positive")]: {
    type: "REINFORCEMENT",
    headline: "느낀 것을 밖으로 흘려보내는 태도는,\n여행에서도 그대로 이어집니다.",
    body: "당신은 평소 좋은 것을 발견하면 그 감정을 안에 담아두지 못하고 밖으로 표현하는 편이라고 했습니다. 여행에서도 마음을 사로잡는 장면을 만나면 바로 사진과 메모를 남기고, 돌아온 뒤에는 그것을 정리해 사람들과 나눕니다. 표현은 당신에게 취향이 아니라 습관에 가깝습니다 — 무엇을 보든, 어디에 있든 반복되는 태도입니다.",
  },
  [key("expressionxmemory", "negative", "positive")]: {
    type: "CONTEXT_SHIFT",
    headline: "평소엔 감정을 안에만 두지만,\n여행에서는 기록으로 남깁니다.",
    body: "당신은 평소 좋아하는 것을 발견해도 굳이 알리지 않고 지나가는 경우가 많다고 했습니다. 그런데 여행에서는 마음을 사로잡는 장면을 만나면 바로 사진과 메모를 남기고, 돌아온 뒤에도 그것을 정리해 사람들과 나눕니다. 일상의 취향은 혼자만 알아도 충분하지만, 여행이라는 낯선 시간만큼은 기록으로 붙잡아두고 싶어하는 쪽입니다.",
  },
  [key("explorationxplanning", "positive", "positive")]: {
    type: "HIDDEN_RULE",
    headline: "새로움을 좇으면서도\n계획은 촘촘한 이유가 있습니다.",
    body: "당신은 안전한 길보다 낯선 쪽으로 먼저 손이 간다고 했습니다. 그런데 여행을 앞두고는 동선과 시간을 몇 주 전부터 촘촘히 정리해둡니다. 얼핏 모순처럼 보이지만, 실은 하나의 규칙입니다 — 당신에게 낯섦은 무계획으로 얻는 것이 아니라, 안전한 틀 안에서 골라내는 것입니다. 계획은 새로움을 막는 장치가 아니라, 더 대담하게 낯선 것을 고를 수 있게 해주는 발판에 가깝습니다.",
  },
  [key("rhythmxdepth", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "천천히 확신에 이르는 속도는,\n여행지에 머무는 방식에서도 나타납니다.",
    body: "당신은 시간을 들일수록 오히려 더 편안해지는 쪽이라고 했습니다. 여행에서도 여러 도시를 옮겨 다니기보다 한 도시에 계속 머물며 같은 골목을 여러 번 걷는 쪽을 택했습니다. 서두르지 않는 태도는 일상의 리듬에서 그친 것이 아니라, 낯선 곳에서 시간을 쓰는 방식까지 그대로 이어지고 있습니다.",
  },
  [key("spacexlocality", "negative", "positive")]: {
    type: "REINFORCEMENT",
    headline: "완성된 것보다 삶의 흔적을 신뢰하는 눈은,\n여행지를 고르는 방식에도 있습니다.",
    body: "당신은 정돈된 넓은 공간보다 손때 묻은 물건들이 놓인 자리에서 마음이 놓인다고 했습니다. 여행에서도 관광객을 위해 정돈된 명소보다, 그 도시 사람들이 실제로 줄 서는 잘 알려지지 않은 식당을 더 신뢰합니다. 두 대답 모두 같은 눈으로 세상을 봅니다 — 보여주기 위해 만들어진 것보다, 실제로 쓰이고 있는 것을 더 믿는 눈입니다.",
  },
};

// pairId별 taste/travel axis 매핑 — COPY_BANK 키의 pairId와 정확히
// 일치해야 한다.
const PAIR_AXES: Array<{ pairId: string; tasteAxis: TasteV3AxisKey; travelAxis: TravelAxisKey }> = [
  { pairId: "spacexcomfort", tasteAxis: "space", travelAxis: "comfort" },
  { pairId: "relationxsocial", tasteAxis: "relation", travelAxis: "social" },
  { pairId: "expressionxmemory", tasteAxis: "expression", travelAxis: "memory" },
  { pairId: "explorationxplanning", tasteAxis: "exploration", travelAxis: "planning" },
  { pairId: "rhythmxdepth", tasteAxis: "rhythm", travelAxis: "depth" },
  { pairId: "spacexlocality", tasteAxis: "space", travelAxis: "locality" },
];

const TYPE_PRIORITY: Record<InsightType, number> = { HIDDEN_RULE: 0, CONTEXT_SHIFT: 1, CONTRAST: 2, REINFORCEMENT: 3 };

// §10 — HIGH/MEDIUM/LOW 결정론적 규칙. LOW는 절대 화면에 노출하지
// 않는다(§10 "LOW는 사용자 화면에 노출하지 않습니다") — computeCandidates가
// LOW를 아예 후보 목록에서 제외한다.
const HIGH_THRESHOLD = 0.6;
const MEDIUM_THRESHOLD = 0.35;

function directionOf(score: number): Direction {
  return score >= 0 ? "positive" : "negative";
}

function computeConfidence(tasteAbs: number, travelAbs: number): CrossIssueConfidence {
  if (tasteAbs >= HIGH_THRESHOLD && travelAbs >= HIGH_THRESHOLD) return "HIGH";
  if ((tasteAbs >= HIGH_THRESHOLD && travelAbs >= MEDIUM_THRESHOLD) || (travelAbs >= HIGH_THRESHOLD && tasteAbs >= MEDIUM_THRESHOLD)) return "MEDIUM";
  return "LOW";
}

export function computeCrossIssueCandidates(
  tasteNormalized: Record<TasteV3AxisKey, number>,
  travelNormalized: Record<TravelAxisKey, number>,
  tasteAggregate: V3AxisAggregate,
  travelAggregate: TravelV1AxisAggregate
): { primary: CrossIssueCandidate | null; secondary: CrossIssueCandidate | null } {
  const candidates: CrossIssueCandidate[] = [];

  for (const { pairId, tasteAxis, travelAxis } of PAIR_AXES) {
    const tasteScore = tasteNormalized[tasteAxis];
    const travelScore = travelNormalized[travelAxis];
    const tasteDirection = directionOf(tasteScore);
    const travelDirection = directionOf(travelScore);
    const entry = COPY_BANK[key(pairId, tasteDirection, travelDirection)];
    if (!entry) continue; // 이 방향 조합에 대한 손글씨 카피가 없으면 후보에서 제외(§ 억지 생성 금지)

    const tasteHasEvidence = tasteAggregate[tasteAxis].evidence.length > 0;
    const travelHasEvidence = travelAggregate[travelAxis].evidence.length > 0;
    if (!tasteHasEvidence || !travelHasEvidence) continue; // §10 "evidence both sides" 요구

    const confidence = computeConfidence(Math.abs(tasteScore), Math.abs(travelScore));
    if (confidence === "LOW") continue;

    const tasteEv = [...tasteAggregate[tasteAxis].evidence].sort((a, b) => Math.abs(b.axes[tasteAxis] ?? 0) - Math.abs(a.axes[tasteAxis] ?? 0))[0];
    const travelEv = [...travelAggregate[travelAxis].evidence].sort((a, b) => Math.abs(b.axes[travelAxis] ?? 0) - Math.abs(a.axes[travelAxis] ?? 0))[0];

    candidates.push({
      pairId,
      type: entry.type,
      confidence,
      tasteAxis,
      tasteDirection,
      travelAxis,
      travelDirection,
      directEvidence: [
        ...(tasteEv ? [{ source: "taste" as const, label: tasteEv.evidenceLabel }] : []),
        ...(travelEv ? [{ source: "travel" as const, label: travelEv.evidenceLabel }] : []),
      ],
      editorialHeadline: entry.headline,
      editorialBody: entry.body,
    });
  }

  // §13 랭킹 — type priority → confidence(HIGH>MEDIUM) → 두 축 |score| 합.
  candidates.sort((a, b) => {
    if (TYPE_PRIORITY[a.type] !== TYPE_PRIORITY[b.type]) return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (a.confidence !== b.confidence) return a.confidence === "HIGH" ? -1 : 1;
    const strengthA = Math.abs(tasteNormalized[a.tasteAxis]) + Math.abs(travelNormalized[a.travelAxis]);
    const strengthB = Math.abs(tasteNormalized[b.tasteAxis]) + Math.abs(travelNormalized[b.travelAxis]);
    return strengthB - strengthA;
  });

  const primary = candidates[0] ?? null;
  // §12 — secondary는 primary와 다른 pairId, MEDIUM 이상만.
  const secondary = candidates.find((c) => c !== primary && c.pairId !== primary?.pairId && c.confidence !== "LOW") ?? null;

  return { primary, secondary };
}

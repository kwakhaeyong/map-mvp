import { TAG_CATEGORIES } from "./ideal-type-tags";

// 궁합(친구와 태그 비교) 기능 — 전부 코드로 계산한다. ★AI를 호출하지
// 않는다: 두 사람의 태그 4개씩을 받아 축(TAG_CATEGORIES)별로 같은지만
// 비교하는 순수 함수다. 퍼센트는 쓰지 않는다 — 축이 4개뿐이라 "0%",
// "25%" 같은 표현이 실제보다 더 정밀해 보이면서, binary1(2지선다) 하나만
// 봐도 두 사람이 우연히 겹치지 않을 확률이 꽤 있어(약 26%) "0%"가 드물지
// 않게 나온다. 그래서 0~4의 개수를 4단계 정성적 표현으로만 보여준다.

// 태그 문자열 -> 그 태그가 속한 축(카테고리) 역방향 조회. getIdealTypeTags가
// 이미 TAG_CATEGORIES 순서대로 태그를 만들어서 보통은 배열 인덱스로도
// 맞아떨어지지만, 두 사람의 결과가 서로 다른 시점에 만들어졌을 수 있어
// (예: 이 파일이 생기기 전에 저장된 공유 링크) 인덱스 대신 태그 문자열
// 자체로 축을 찾아 짝을 맞춘다.
const TAG_TO_CATEGORY = new Map<string, (typeof TAG_CATEGORIES)[number]>();
for (const category of TAG_CATEGORIES) {
  for (const tag of Object.values(category.mapping)) {
    TAG_TO_CATEGORY.set(tag, category);
  }
}

function groupByCategory(tags: string[]): Map<string, string> {
  const byCategory = new Map<string, string>();
  for (const tag of tags) {
    const category = TAG_TO_CATEGORY.get(tag);
    if (category) byCategory.set(category.id, tag);
  }
  return byCategory;
}

export type AxisComparison = { categoryId: string; label: string; same: boolean; aTag: string; bTag: string };
export type CompatibilityTier = "twin" | "close" | "spark" | "opposite";
export type CompatibilityResult = { overlapCount: number; tier: CompatibilityTier; axes: AxisComparison[] };

// aTags/bTags 둘 다에서 알아볼 수 있는 태그를 가진 축만 비교 대상에
// 넣는다 — 한쪽에 없는 축(오래된 링크 등)은 조용히 건너뛴다.
export function compareTags(aTags: string[], bTags: string[]): CompatibilityResult {
  const aByCategory = groupByCategory(aTags);
  const bByCategory = groupByCategory(bTags);
  const axes: AxisComparison[] = [];
  for (const category of TAG_CATEGORIES) {
    const aTag = aByCategory.get(category.id);
    const bTag = bByCategory.get(category.id);
    if (!aTag || !bTag) continue;
    axes.push({ categoryId: category.id, label: category.label, same: aTag === bTag, aTag, bTag });
  }
  const overlapCount = axes.filter((axis) => axis.same).length;
  const tier: CompatibilityTier = overlapCount === 4 ? "twin" : overlapCount >= 2 ? "close" : overlapCount === 1 ? "spark" : "opposite";
  return { overlapCount, tier, axes };
}

export const TIER_LABEL: Record<CompatibilityTier, string> = {
  twin: "완전 판박이 궁합",
  close: "꽤 잘 통하는 궁합",
  spark: "다른 매력에 끌리는 궁합",
  opposite: "정반대라 신기한 궁합",
};

// 0개가 겹쳐도 "안 맞는다"고 읽히지 않게 — 겹치는 게 없다는 건 서로
// 갖지 않은 걸 상대가 갖고 있다는 뜻이기도 하다는 쪽으로 표현한다.
export const TIER_DESCRIPTION: Record<CompatibilityTier, string> = {
  twin: "네 축 모두 같은 답을 골랐어요.",
  close: "여러 축에서 같은 답을 골랐어요.",
  spark: "한 축만 같고, 나머지는 서로 다른 매력이에요.",
  opposite: "네 축 모두 서로 달라요 — 겹치는 게 없다는 건, 서로에게 없는 걸 상대가 갖고 있다는 뜻이기도 해요.",
};

// 축 4개 × 같음/다름 = 고정 8종 문장 틀. 실제로 렌더링되는 문장은 이
// 두 형태(sameTemplate/differentTemplate)에 축 라벨과 두 사람의 태그값만
// 끼워 넣어 만든다.
function axisSentence(axis: AxisComparison): string {
  return axis.same ? `${axis.label} — 둘 다 ${axis.aTag}` : `${axis.label} — 나는 ${axis.bTag}, 친구는 ${axis.aTag}`;
}

export function buildAxisSentences(axes: AxisComparison[]): string[] {
  return axes.map(axisSentence);
}

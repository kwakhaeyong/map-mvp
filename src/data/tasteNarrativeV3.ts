// TASTE v3 — EDITORIAL DENSITY PASS(PR #261 후속 4차, 2026-08).
//
// §0 FREEZE(3차 라운드부터 확정, 계속 유지): Questionnaire(15문항)·6축
// evidence extraction·Relationship R1~R8·Tension T1~T5·scoring
// logic. `tasteQuestionnaireV3.ts`/`tasteEvidenceV3.ts`/
// `tasteRelationshipsV3.ts`/`tasteTensionsV3.ts`는 이번 라운드에서도
// 한 글자도 건드리지 않았다. 필요한 편집은 전부 이 파일에서만 한다.
//
// 3차 라운드에서 THE INTERESTING PART에 PRACTICAL_CONSEQUENCE("그래서
// 실제로는")를 추가하고 나머지 섹션의 범용 클로저를 걷어냈더니, 그 결과
// 8개 profile이 780~830자까지 짧아졌다 — 필러는 없앴지만 CORE/HOW/
// Opening/Ending은 상대적으로 얕아졌다. 이번 라운드는 새 분석 로직을
// 더하지 않고, 이미 있는 축/Relationship/Tension에서 "이 profile에만
// 붙는" 해석을 한 겹씩 더 끌어냈다:
//   - CORE TASTE: visual cue를 축 해석과 한 문장으로 묶고(visual cue만
//     단독으로 서 있지 않게), interpretation(무엇) → meaning(왜) 뒤에
//     STAKES(이게 왜 이 사람에게 중요한가)를 한 겹 더 얹었다.
//   - HOW IT SHOWS UP: 같은 축 안에서 서로 다른 생활 영역(BEHAVIOR_
//     SCENE_SECONDARY)을 하나 더 붙여 "여러 장면에서 반복되는 패턴"을
//     보여준다.
//   - Opening: hook 한 줄 뒤에 그 profile의 Relationship/Tension(또는
//     축)에서 파생된 해석 한 줄을 추가했다.
//   - Ending: 축마다 다른, 요약이 아닌 "이 취향을 어떻게 다루면
//     더 선명해지는가"짧은 반영으로 바꿨다(범용 ENDING_CLOSERS 제거).
// 새로 추가한 문장은 전부 축/Relationship/Tension "키"에 따라 달라지는
// 표현이지 "이 부분을 알고 나면…" 같은 어떤 결과에도 붙는 범용 문장이
// 아니다 — 그런 범용 클로저(WHY_IT_MATTERS/CONTRAST_LINE/
// INTERESTING_LIFE_ECHO/OPENING_ECHO/ENDING_RESONANCE/ENDING_CLOSERS)는
// 3~4차 라운드를 거치며 전부 제거했고 다시 만들지 않는다.
// Character count는 목표가 아니다 — 자연스럽게 900~1,100자대가 되면
// 좋지만, 억지로 그 범위를 채우지 않는다.

import { TASTE_V3_AXIS_KEYS, type TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { aggregateV3Axes, extractV3Evidence, type V3AxisAggregate, type V3EvidenceItem } from "./tasteEvidenceV3";
import { matchAllV3Relationships, RELATIONSHIP_DEFS_V3, type V3RelationshipDef, type V3RelationshipMatch } from "./tasteRelationshipsV3";
import { matchAllV3Tensions, type V3TensionMatch } from "./tasteTensionsV3";
import type { TasteV3RawAnswers } from "./tasteQuestionnaireV3";
import { magazineVisualAssets, type MagazineVisualAsset } from "./magazineVisualAssets";

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

// HOW IT SHOWS UP 전용 — 이 마음이 실제로 어떤 구체적인 행동
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

// HOW IT SHOWS UP 전용 두 번째 생활 장면 — BEHAVIOR_SCENE과는 다른
// 생활 영역(물건 구매/약속/여행/쉬는 방식/새 장소/추천 방식)에서 같은
// 내부 패턴이 반복된다는 것을 보여준다. 같은 이야기를 다른 말로
// 반복하지 않도록 BEHAVIOR_SCENE과 영역을 겹치지 않게 짰다.
const BEHAVIOR_SCENE_SECONDARY: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "여행을 가서도 화려한 숙소보다, 오래 걸어도 되는 익숙한 동네의 작은 자리를 더 편하게 느낍니다.",
    positive: "선물을 받을 때도 화려한 포장보다 실제로 쓸 수 있는 단순한 물건을 더 반갑게 여깁니다.",
  },
  sensory: {
    positive: "사람을 볼 때도 처음 만난 인상보다 시간이 지나며 자연스러워지는 모습에 더 마음이 갑니다.",
    negative: "옷을 살 때도 유행보다 재질과 마감이 실제로 좋은지를 먼저 만져 봅니다.",
  },
  rhythm: {
    positive: "약속을 잡을 때도 몇 주 전 계획보다, 그 순간 마음이 맞으면 바로 만나는 쪽을 더 좋아합니다.",
    negative: "집에서 쉴 때도 일정을 빡빡하게 채우기보다, 아무 계획 없이 흘러가는 시간을 더 오래 붙잡습니다.",
  },
  relation: {
    positive: "좋은 것을 발견하면 혼자 알고 지나가기보다, 누군가에게 먼저 알리고 함께 나누고 싶어합니다.",
    negative: "새로운 장소도 혼자 걸어보고 나서야 다른 사람과 다시 가보고 싶은 마음이 듭니다.",
  },
  exploration: {
    positive: "물건을 살 때도 이미 검증된 것보다, 아직 사람들이 잘 모르는 브랜드에 먼저 손이 갑니다.",
    negative: "물건을 살 때도 새로 나온 것보다, 이미 써봐서 확신이 있는 것을 다시 집어듭니다.",
  },
  expression: {
    positive: "옷차림이나 소지품에서도 좋아하는 것을 감추지 않고 그대로 드러내는 편입니다.",
    negative: "혼자만의 기록에는 좋아하는 것을 남기지만, 그것을 굳이 밖으로 꺼내지는 않습니다.",
  },
};

// CORE TASTE 전용 세 번째 층 — interpretation(무엇)·meaning(왜) 다음,
// 이 부분이 흔들리면 왜 이 사람에게 유독 크게 다가오는지("이게 왜
// 중요한가")를 짚는다. AXIS_MEANING보다 한 단계 더 감정적/개인적인
// 결로 쓴다.
const AXIS_STAKES: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative:
      "당신에게 공간은 배경이 아니라 컨디션을 조절하는 장치에 가깝습니다. 낯선 곳에서도 재미를 찾지만, 오래 머물 장소만큼은 몸이 먼저 익숙해질 수 있어야 합니다.",
    positive:
      "당신에게 공간은 그저 넓은 곳이 아니라 생각이 걸리지 않고 흐를 수 있는 조건에 가깝습니다. 아무리 좋아 보이는 곳이어도 시야가 막혀 있으면 오래 머물기 어렵습니다.",
  },
  sensory: {
    positive:
      "당신에게 좋음은 처음 순간의 인상이 아니라 시간이 지나며 어떻게 낡아가는지로 확인됩니다. 첫눈에 완벽해 보이는 것보다, 오래 두고 봐도 실망하지 않을 것에 더 마음이 갑니다.",
    negative:
      "당신에게 좋음은 분위기가 아니라 실제로 잘 만들어졌는가로 확인됩니다. 겉으로 아무리 그럴듯해도 마감이 어긋나 있으면 그 순간 마음이 식습니다.",
  },
  rhythm: {
    positive:
      "당신에게 좋은 순간은 미리 계획한 대로 오는 것이 아니라 지금 이 감각이 왔을 때 붙잡는 것에 가깝습니다. 너무 오래 재다가 그 순간을 놓치는 쪽이 당신에게는 더 아쉬운 일입니다.",
    negative:
      "당신에게 좋은 결정은 빠르게 오는 것이 아니라 시간을 들여야 비로소 믿을 수 있는 것이 됩니다. 서둘러 정한 것은 나중에 꼭 다시 흔들리기 때문입니다.",
  },
  relation: {
    positive: "당신에게 좋은 순간은 혼자 간직하는 것으로는 완성되지 않습니다. 누군가와 나누는 순간 그 경험이 비로소 온전해집니다.",
    negative:
      "당신에게 좋은 컨디션은 사람 수가 아니라 혼자 있는 시간이 얼마나 채워졌는가로 결정됩니다. 그 시간이 없으면 사람을 만나는 일도 점점 버거워집니다.",
  },
  exploration: {
    positive: "당신에게 안전함은 오히려 지루함에 가깝습니다. 아직 확인되지 않은 쪽에 마음이 움직여야 하루가 제대로 시작된 느낌이 듭니다.",
    negative:
      "당신에게 새로움은 그 자체로 목적이 아니라, 이미 확인된 좋음을 다시 확인하는 과정에 가깝습니다. 검증되지 않은 것에 먼저 곁을 내주는 일은 좀처럼 없습니다.",
  },
  expression: {
    positive:
      "당신에게 감정은 담아두는 것이 아니라 흘려보내야 비로소 정리되는 것에 가깝습니다. 좋은 순간을 표현하지 못하고 지나가면 그 자체로 아쉬움이 남습니다.",
    negative: "당신에게 감정은 남에게 확인받아야 완성되는 것이 아닙니다. 스스로 알고 있다는 사실만으로 이미 그 감정은 충분합니다.",
  },
};

// ============================================================
// NARRATIVE CONSISTENCY GUARD (PR #261 Final QA #1 대응, 2026-08).
//
// 문제: BEHAVIOR_SCENE/BEHAVIOR_SCENE_SECONDARY의 일부 문장은 자기
// 축(axis) domain을 넘어 "다른 축의 방향"까지 함께 단정한다 — 예를
// 들어 exploration+ 문장 하나가 "계획이 틀어지는 것을 오히려
// 반깁니다"처럼 RHYTHM+ 까지 암묵적으로 전제한다. 사용자가 실제로는
// 그 축에서 강하게 반대 방향(rhythm 강한 음수 = 신중/계획적)이면,
// 이 문장은 사용자가 고르지 않은, 심지어 반대되는 행동을 사실처럼
// 서술하게 된다(Final QA에서 발견한 축 간 확장 문제).
//
// 이 guard는 "A라고 답했으니 반드시 A 문장을 써라"가 아니라,
// "명백한 반대 증거가 있는데 정반대 행동을 단정하지는 마라"만
// 막는다(contradiction prevention). 15문항/scoring/6축/Evidence/
// Relationship/Tension 계산은 전혀 바꾸지 않았다 — 여기서는 이미 계산된
// aggregate[axis].score만 "충돌 여부 판정"에 읽기 전용으로 참조한다.
// ============================================================
type CrossDomainRequirement = { axis: TasteV3AxisKey; direction: "positive" | "negative" };

// 옵션 하나의 strong evidence 가중치(±15)와 같은 크기 — 그 축에 strong
// evidence 하나 분량 이상 반대로 쌓여 있어야 "명백한 충돌"로 본다.
// 약한/중립 신호(0~10)까지는 충돌로 보지 않는다(과잉 검열 방지).
const CONTRADICTION_THRESHOLD = 15;

function isContradicted(aggregate: V3AxisAggregate, requirement: CrossDomainRequirement): boolean {
  const score = aggregate[requirement.axis].score;
  return requirement.direction === "positive" ? score <= -CONTRADICTION_THRESHOLD : score >= CONTRADICTION_THRESHOLD;
}

// BEHAVIOR_SCENE/BEHAVIOR_SCENE_SECONDARY 전수 감사 결과, 다른 축까지
// 단정하는 항목만 최소로 표시한다 — 여기 없는 항목(대부분)은 이미 자기
// 축 domain 안에서만 말하므로 guard가 필요 없다고 판단했다(예:
// "이사할 때도 넓이보다 빨리 손에 익을지"는 space만 말하지 다른 축을
// 끌어오지 않는다). PRACTICAL_CONSEQUENCE(THE INTERESTING PART)는 이미
// Relationship/Tension 정의 자체가 "두 축이 동시에 강함"을 검증한 뒤에만
// 만들어지므로 같은 문제가 구조적으로 발생하지 않는다 — 별도
// requirement 없이 그대로 통과시킨다(감사 완료, 새 guard 불필요).
const BEHAVIOR_SCENE_REQUIRES: Partial<Record<TasteV3AxisKey, Partial<Record<"positive" | "negative", CrossDomainRequirement>>>> = {
  // "계획이 틀어지는 것을 오히려 반깁니다" → RHYTHM+(즉흥) 전제.
  exploration: { positive: { axis: "rhythm", direction: "positive" } },
};

const BEHAVIOR_SCENE_SECONDARY_REQUIRES: Partial<Record<TasteV3AxisKey, Partial<Record<"positive" | "negative", CrossDomainRequirement>>>> = {
  // "그 순간 마음이 맞으면 바로 만나는 쪽을 더 좋아합니다" → RELATION+
  // (사람과의 즉흥 만남을 반긴다) 전제.
  rhythm: { positive: { axis: "relation", direction: "positive" } },
  // "먼저 알리고 함께 나누고 싶어합니다" → EXPRESSION+(드러내는 쪽) 전제.
  relation: { positive: { axis: "expression", direction: "positive" } },
  // "시간이 지나며 자연스러워지는 모습에 더 마음이 갑니다"(사람에 대한
  // 판단) → RHYTHM-(천천히 확인) 전제. RHYTHM+(즉흥적으로 빨리 판단)와
  // 충돌한다.
  sensory: { positive: { axis: "rhythm", direction: "negative" } },
};

type AxisDirectionText = Record<TasteV3AxisKey, { positive: string; negative: string }>;

// 후보 문장이 충돌하면 §9 우선순위대로: ① 같은 축의 다른(guard를 통과한)
// behavior 문장 → ② 없으면 생략. 새 filler 문장을 만들어 채워 넣지
// 않는다(§15) — 분량이 줄어드는 쪽이 틀린 단정보다 낫다.
function guardedBehaviorLine(
  pool: AxisDirectionText,
  requires: Partial<Record<TasteV3AxisKey, Partial<Record<"positive" | "negative", CrossDomainRequirement>>>>,
  axis: TasteV3AxisKey,
  direction: "positive" | "negative",
  aggregate: V3AxisAggregate
): string {
  const text = pool[axis][direction];
  const requirement = requires[axis]?.[direction];
  if (requirement && isContradicted(aggregate, requirement)) return "";
  return text;
}

// CORE TASTE/HOW IT SHOWS UP의 visual cue(이미지 asset의 scene에서 온
// 문장) 바로 뒤에 붙는 한 문장 — 같은 이미지를 쓰더라도 그 장면을
// "어떻게 읽는가"는 축마다 달라야 하므로, visual cue가 혼자 서 있지
// 않고 이 문장과 한 호흡으로 이어진다(§7). AXIS_INTERPRETATION과는
// 달리 "그 장면 앞에서 시선이 먼저 어디로 가는가"라는 지각의 순간에
// 집중한다.
const VISUAL_LINK: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "당신의 눈은 넓은 트임보다 손에 익은 밀도를 먼저 찾습니다.",
    positive: "당신의 눈은 채워진 것보다 비워진 자리를 먼저 찾습니다.",
  },
  sensory: {
    positive: "당신의 시선은 매끈한 새것보다 시간이 지나간 흔적에 먼저 머뭅니다.",
    negative: "당신의 시선은 분위기보다 선과 마감이 맞는지를 먼저 훑습니다.",
  },
  rhythm: {
    positive: "당신은 오래 살피기보다 마음이 움직이는 순간을 먼저 붙잡습니다.",
    negative: "당신은 첫인상보다 시간을 들인 뒤의 느낌을 더 신뢰합니다.",
  },
  relation: {
    positive: "당신은 혼자 두기보다 누군가와 나눌 자리부터 떠올립니다.",
    negative: "당신은 사람보다 먼저 혼자만의 여백이 있는지를 확인합니다.",
  },
  exploration: {
    positive: "당신의 시선은 정돈된 익숙함보다 예측할 수 없는 쪽으로 먼저 튑니다.",
    negative: "당신의 시선은 처음 보는 것보다 좋았던 기억이 있는 쪽으로 먼저 돌아갑니다.",
  },
  expression: {
    positive: "당신에게 이 순간은 눈에 담고 끝나는 것이 아니라 누군가에게 곧장 전하고 싶어지는 쪽입니다.",
    negative: "당신에게 이 순간은 남에게 보여줄 필요 없이 눈으로만 담아도 되는 쪽입니다.",
  },
};

const SCENE_LINK_SINGLE = [
  "이 장면 하나만으로도 충분히 짐작됩니다.",
  "망설임 없이 이쪽으로 마음이 갑니다.",
  "다른 설명이 필요 없을 만큼 분명합니다.",
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
function iGa(text: string): string {
  return hasBatchim(text) ? "이" : "가";
}
function stripTrailingPunct(text: string): string {
  return text.trim().replace(/[.!?]+$/, "");
}

// PLACE/OBJECT 이미지가 실제로 무엇을 담고 있는지(magazineVisualAssets
// 의 scene 메타데이터)로 각 축 섹션의 첫 문장을 만든다. 지금은 asset이
// 사용자마다 다른 variant가 아니라 하나뿐이라(§7의 알려진 한계),
// visual cue 자체는 모든 profile에서 동일한 장면 묘사가 된다 — 그래서
// cue 문장이 혼자 서 있지 않고 VISUAL_LINK(축마다 다른, "이 장면 앞에서
// 시선이 먼저 어디로 가는가")와 한 문장으로 묶여야, 이미지는 같아도
// 해석은 profile마다 달라진다. asset이 나중에 variant별로 늘어나도
// 이 함수는 그대로 동작한다.
function buildVisualOpeningLine(scene: NonNullable<MagazineVisualAsset["scene"]>, axis: TasteV3AxisKey, direction: "positive" | "negative"): string {
  const lastDetail = scene.details[scene.details.length - 1] ?? "";
  const cueClause = `${scene.light}${iGa(scene.light)} ${scene.setting}에 내려앉고 ${scene.details.join(", ")}${iGa(lastDetail)} 그대로 놓인 이 장면처럼`;
  return `${cueClause}, ${VISUAL_LINK[axis][direction]}`;
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
// 문단으로 엮는다.
//
// 구조(4차 라운드): visual opening line(이미지 scene + VISUAL_LINK가
// 한 문장으로 묶인 것) → personal observation(그 사람 자신의 evidence로
// 만든 장면) → interpretation(무엇) → 세 번째 층.
//
// role="why"(CORE TASTE)는 "왜 끌리는가"에 집중해 AXIS_INTERPRETATION
// (무엇)→AXIS_MEANING(왜)→AXIS_STAKES(왜 중요한가) 3층으로 내려가고,
// role="behavior"(HOW IT SHOWS UP)는 "실제로 어떻게 나타나는가"에
// 집중해 서로 다른 생활 영역의 BEHAVIOR_SCENE→BEHAVIOR_SCENE_SECONDARY
// 2개 장면을 쓴다 — 서로 다른 정보만 담아 반복을 피한다(§6). 범용
// 클로저(모든 profile에 똑같이 붙는 문장)는 절대 다시 추가하지 않는다
// — 여기 있는 모든 새 문장은 axis(+방향) 키에 따라 달라진다.
// ============================================================
function buildAxisSection(
  axis: TasteV3AxisKey,
  headline: string,
  visualAsset: MagazineVisualAsset,
  aggregate: V3AxisAggregate,
  usage: UsageTracker,
  seed: number,
  role: "why" | "behavior"
): { headline: string; body: string; axisLabel: string } {
  const axisLabel = AXIS_LABEL_KO[axis];
  const sorted = strongestEvidenceForAxis(aggregate, axis);
  const anchor = sorted[0];
  const direction = aggregate[axis].score >= 0 ? "positive" : "negative";
  const visualOpening = visualAsset.scene ? buildVisualOpeningLine(visualAsset.scene, axis, direction) : "";
  if (!anchor) {
    return { headline, body: [visualOpening, "여기서는 어느 한쪽으로 뚜렷하게 기울지 않고 고르게 나뉩니다."].filter(Boolean).join(" "), axisLabel };
  }
  usage.use(anchor.questionId);
  const supporting = sorted.find((e) => e.questionId !== anchor.questionId);
  if (supporting) usage.use(supporting.questionId);

  const personalScene = supporting ? sceneList([anchor.optionLabel, supporting.optionLabel]) : sceneList([anchor.optionLabel]);
  const bridge = supporting ? pickByIndex(SCENE_LINK, seed) : pickByIndex(SCENE_LINK_SINGLE, seed);

  const content =
    role === "why"
      ? [AXIS_INTERPRETATION[axis][direction], AXIS_MEANING[axis][direction], AXIS_STAKES[axis][direction]]
      : [
          guardedBehaviorLine(BEHAVIOR_SCENE, BEHAVIOR_SCENE_REQUIRES, axis, direction, aggregate),
          guardedBehaviorLine(BEHAVIOR_SCENE_SECONDARY, BEHAVIOR_SCENE_SECONDARY_REQUIRES, axis, direction, aggregate),
        ];

  const body = [visualOpening, personalScene, bridge, ...content].filter(Boolean).join(" ");
  return { headline, body, axisLabel };
}

// ============================================================
// OPENING — 결과 전체를 요약하지 않는다. 4차 라운드부터 hook 한 줄
// 뒤에 이 profile의 Relationship/Tension(또는 축)에서 파생된 해석
// 한 줄(OPENING_INSIGHT/OPENING_FRAME)을 붙인다 — CORE TASTE 내용을
// 전부 끌어오지는 않되, 첫 문단 안에 이 사람만의 특징이 이미 하나
// 드러나야 한다는 §5 요구를 만족한다. Opening에서 쓴 def.id는 THE
// INTERESTING PART에서 다시 쓰이지 않으므로(코드에서 이미 제외 처리),
// OPENING_INSIGHT와 PRACTICAL_CONSEQUENCE가 한 결과 안에서 같은 def를
// 두 번 말하는 일은 없다.
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

// Relationship/Tension id별 Opening 해석 한 줄 — PRACTICAL_CONSEQUENCE
// ("그래서 실제로는")와는 다른 각도로, "이 조합이 삶에서 어떤 무게로
// 다가오는가"를 짧게 짚는다.
const OPENING_INSIGHT: Record<string, string> = {
  "r1-space-exploration": "당신에게 낯선 장소는 삶의 기반을 흔드는 일이 아니라, 익숙한 하루에 작은 변화를 넣는 방식에 가깝습니다.",
  "r2-sensory-expression": "감각은 예민하게 받아들이면서도 그것을 굳이 증명하려 들지 않는, 조용히 확신하는 쪽입니다.",
  "r3-rhythm-exploration": "발견의 속도와 확신의 속도가 다르다는 것은, 당신에게는 성급함이 아니라 두 가지 다른 기준을 쓰고 있다는 뜻입니다.",
  "r4-relation-expression": "관계는 넓게 열어두면서도, 그 안에서 무엇을 보여줄지는 스스로 정하는 쪽입니다.",
  "r5-textural-first": "정돈된 구조보다 시간이 남긴 흔적이 먼저 눈에 들어오는, 촉각에 가까운 감각을 가졌습니다.",
  "r5-structural-first": "분위기보다 선과 비율이 먼저 눈에 들어오는, 시각적으로 정밀한 감각을 가졌습니다.",
  "r6-rhythm-relation": "사람과 함께 있는 시간을 좋아하면서도, 그 시간의 속도까지 내주지는 않는 쪽입니다.",
  "r7-exploration-expression": "새로움을 좇는 기준이 유행이 아니라 당신 자신에게 있다는 뜻에 가깝습니다.",
  "r8-space-expression": "취향을 설명하기보다, 공간이 대신 말하게 두는 쪽에 가깝습니다.",
  "t1-familiar-space-new-place": "안정된 기반이 있어야 비로소 더 멀리 나가볼 수 있는, 얼핏 반대로 보이는 두 마음이 사실은 하나로 이어져 있습니다.",
  "t2-sensitive-not-visible": "많이 느끼는 것과 많이 드러내는 것은 당신에게는 전혀 다른 회로로 움직입니다.",
  "t3-fast-discovery-slow-choice": "새로운 것을 만나는 속도와 그것을 내 것으로 정하는 속도는, 당신 안에서는 전혀 다른 두 개의 시계로 움직입니다.",
  "t4-share-but-keep-autonomy": "나누고 싶은 마음과 혼자이고 싶은 마음이 부딪히지 않고, 같은 사람 안에서 번갈아 나타납니다.",
  "t5-keep-long-seek-new": "오래 곁에 두는 것과 새로 찾아 나서는 것은, 당신에게는 서로 다른 층에서 따로 움직이는 두 가지 진심입니다.",
};

// Relationship/Tension이 하나도 없을 때(axis-fallback)만 쓰는 Opening
// 해석 한 줄 — 대비 구조로 짧게 짚는다. 같은 축이 CORE TASTE에서 다시
// 다뤄지므로 VISUAL_LINK/AXIS_INTERPRETATION/MEANING/STAKES와는 다른
// "예고" 성격의 각도로 쓴다.
const OPENING_FRAME: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "여행 사진을 보면 이곳저곳 다닌 것 같지만, 정작 좋아하는 카페나 식당은 몇 곳으로 정해져 있습니다.",
    positive: "물건을 새로 들이는 일에는 관심이 없어도, 책상 위 각도 하나는 자주 다시 맞추는 편입니다.",
  },
  sensory: {
    positive: "쇼핑을 할 때 리뷰 개수보다, 그 물건이 몇 년 뒤에 어떤 모습일지가 더 궁금합니다.",
    negative: "가격표를 보기 전에 손끝으로 재질부터 훑는 버릇이 있습니다.",
  },
  rhythm: {
    positive: "약속 장소를 정할 때도 미리 검색하기보다, 그날 지나가다 마음에 든 곳으로 발길을 돌립니다.",
    negative: "물건 하나를 사기까지 장바구니에 며칠씩 담아두는 편입니다.",
  },
  relation: {
    positive: "휴대폰 사진첩에는 혼자 찍은 풍경보다 누군가와 함께 찍은 사진이 훨씬 많습니다.",
    negative: "주말 일정을 짤 때 약속보다 아무 일정 없는 하루를 먼저 비워 둡니다.",
  },
  exploration: {
    positive: "맛집 리스트를 아무리 채워도, 결국 처음 가보는 골목 하나를 더 궁금해하는 쪽입니다.",
    negative: "메뉴판을 오래 보다가도, 결국 지난번에 만족했던 메뉴로 손이 갑니다.",
  },
  expression: {
    positive: "특별한 이유 없이도 좋았던 하루를 사진 몇 장으로 남겨두는 편입니다.",
    negative: "좋았던 하루도 굳이 기록으로 남기지 않고 그냥 지나가는 경우가 많습니다.",
  },
};

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
    const insight = OPENING_INSIGHT[t.id] ?? "";
    return {
      headline: t.headline,
      summary: [scene, pickByIndex(OPENING_HOOK_PAIR, ev[0]?.qNumber ?? 0), insight].filter(Boolean).join(" "),
      source: `tension:${t.id}`,
    };
  }
  if (relationships.length > 0) {
    const r = relationships[0];
    const ev = r.evidence.slice(0, 2);
    ev.forEach((e) => usage.use(e.questionId));
    const scene = sceneList(ev.map((e) => e.optionLabel));
    const insight = OPENING_INSIGHT[r.def.id] ?? "";
    return {
      headline: r.def.headline,
      summary: [scene, pickByIndex(OPENING_HOOK_PAIR, ev[0]?.qNumber ?? 1), insight].filter(Boolean).join(" "),
      source: `relationship:${r.def.id}`,
    };
  }
  const topAxis = axisRanking[0];
  const top = strongestEvidenceForAxis(aggregate, topAxis)[0];
  if (top) usage.use(top.questionId);
  const direction = aggregate[topAxis].score >= 0 ? "positive" : "negative";
  return {
    headline: "여러 장면이 아니라,\n하나의 시선으로 이어지는 사람.",
    summary: top
      ? [sceneList([top.optionLabel]), pickByIndex(OPENING_HOOK_SINGLE, top.qNumber), OPENING_FRAME[topAxis][direction]].filter(Boolean).join(" ")
      : "여러 장면이 하나의 시선으로 이어집니다.",
    source: `axis-fallback:${topAxis}`,
  };
}

// ============================================================
// THE INTERESTING PART — strongest tension > relationship > axis-pair
// fallback. 결과에서 가장 personal해야 하는 섹션이라, "A 성향 + B
// 성향"을 나열하는 R1~R8/T1~T5의 interestingPartBody(frozen, 그대로
// 사용)에서 멈추지 않고 "그래서 실제로는 이렇게 삽니다"까지 한 겹
// 더 내려간다. 그 한 겹은 이전 라운드처럼 아무 조합에나 붙는 범용
// 클로저(INTERESTING_CLOSERS/LIFE_ECHO, 3차 라운드에서 제거)가 아니라
// Relationship/Tension id마다 다른 PRACTICAL_CONSEQUENCE 한 줄이다 —
// 그래서 서로 다른 조합을 가진 profile끼리 이 섹션만 떼어 읽어도
// 구별된다.
// ============================================================
const FALLBACK_INTERESTING_HEADLINES = [
  "가장 강하게 남은 건,\n어느 한쪽이 아니라 그 사이였습니다.",
  "정답을 정해두지 않아도,\n방향은 이미 뚜렷했습니다.",
];

// R1~R8(R5는 2개 표현형 포함, 9개)·T1~T5, 총 14개 def.id 전부를
// 키로 가진다 — "그래서 실제로는" 한 줄. interestingPartBody(무엇이
// 함께 있는지)에서 한 겹 더 내려가 그 조합이 어떤 구체적 행동으로
// 이어지는지 보여준다. tasteRelationshipsV3.ts/tasteTensionsV3.ts는
// 건드리지 않고, 이 표현은 전부 이 파일(presentation layer)에만 있다.
const PRACTICAL_CONSEQUENCE: Record<string, string> = {
  "r1-space-exploration":
    "그래서 여행을 가더라도 숙소만큼은 오래 걸어도 되는 익숙한 동네에 잡아두고, 낮 동안은 마음껏 낯선 골목으로 나섭니다.",
  "r2-sensory-expression":
    "그래서 마음에 드는 것을 발견해도 곧바로 남에게 보여주기보다, 혼자 한 번 더 들여다본 뒤에야 꺼내 놓습니다.",
  "r3-rhythm-exploration":
    "그래서 새로 생긴 곳은 그 주에 바로 가보지만, 정말 마음에 든 물건 하나는 장바구니에 넣어두고 며칠을 더 들여다봅니다.",
  "r4-relation-expression":
    "그래서 좋은 곳을 발견하면 가까운 한둘에게는 바로 알리지만, 그 밖의 자리에 남기는 일은 거의 없습니다.",
  "r5-textural-first":
    "그래서 새로운 공간에 들어서면 가구 배치보다 빛이 스민 자리, 벽의 질감 같은 흔적부터 먼저 눈에 담깁니다.",
  "r5-structural-first": "그래서 새로운 공간에 들어서면 분위기보다 동선과 비율이 맞는지가 먼저 눈에 들어옵니다.",
  "r6-rhythm-relation":
    "그래서 약속을 잡을 때도 누구를 만나는지만큼이나, 그날 얼마나 여유 있게 움직일 수 있는지를 함께 헤아립니다.",
  "r7-exploration-expression":
    "그래서 아직 사람들이 잘 모르는 곳을 알게 되면 반갑지만, 그곳이 갑자기 유명해지고 나면 오히려 발길이 뜸해집니다.",
  "r8-space-expression": "그래서 취향을 말로 설명하기보다, 방에 물건 하나를 들이는 방식으로 표현하는 쪽에 가깝습니다.",
  "t1-familiar-space-new-place":
    "그래서 이사할 마음은 없어도 다음 여행 계획은 늘 세워두는 편이고, 정작 가장 좋았던 기억은 돌아와 익숙한 방에 짐을 푸는 순간일 때가 많습니다.",
  "t2-sensitive-not-visible": "그래서 좋아하는 것에 대해 남들보다 훨씬 많이 알고 있지만, 먼저 나서서 설명하는 일은 드뭅니다.",
  "t3-fast-discovery-slow-choice":
    "그래서 낯선 곳은 망설임 없이 들어가 보지만, 그 안에서 마음에 든 물건 하나를 집으로 데려오는 데는 며칠이 걸립니다.",
  "t4-share-but-keep-autonomy":
    "그래서 좋은 곳을 발견하면 가장 먼저 떠오르는 사람에게 알리면서도, 정작 그 자리에 함께 갈 땐 각자 움직이는 시간을 따로 남겨둡니다.",
  "t5-keep-long-seek-new":
    "그래서 몇 년째 쓰는 물건 하나는 좀처럼 바꾸지 않으면서, 한번 유명해진 다른 물건 앞에서는 미련 없이 또 다른 것을 찾아 나섭니다.",
};

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
    const consequence = PRACTICAL_CONSEQUENCE[nextTension.def.id] ?? "";
    return {
      headline: nextTension.def.headline,
      body: [nextTension.def.interestingPartBody, consequence].filter(Boolean).join(" "),
      source: `tension:${nextTension.def.id}`,
    };
  }
  if (nextRelationship) {
    const consequence = PRACTICAL_CONSEQUENCE[nextRelationship.def.id] ?? "";
    return {
      headline: nextRelationship.def.headline,
      body: [nextRelationship.def.interestingPartBody, consequence].filter(Boolean).join(" "),
      source: `relationship:${nextRelationship.def.id}`,
    };
  }

  // Relationship/Tension이 하나도 없을 때만 쓰는 폴백 — 이때도 범용
  // 클로저 대신, 두 축 각각의 BEHAVIOR_SCENE(첫 문장만)을 "그런데"로
  // 이어 "상황 A에서는 이렇게, 상황 B에서는 저렇게"까지 내려간다.
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
  const directionA = a.score >= 0 ? "positive" : "negative";
  const directionB = b.score >= 0 ? "positive" : "negative";
  const firstSentence = (text: string) => (text ? text.split(". ")[0]?.trim() + "." : "");
  // guard: 이 fallback도 BEHAVIOR_SCENE을 직접 인용하므로 HOW IT SHOWS UP과
  // 같은 축 간 확장 위험이 그대로 있다 — 같은 guard를 통과한 문장만 쓴다.
  const behaviorA = firstSentence(guardedBehaviorLine(BEHAVIOR_SCENE, BEHAVIOR_SCENE_REQUIRES, a.key, directionA, aggregate));
  const behaviorB = firstSentence(guardedBehaviorLine(BEHAVIOR_SCENE, BEHAVIOR_SCENE_REQUIRES, b.key, directionB, aggregate));
  // 대비 문장("그래서 A. 그런데 B.")은 양쪽이 다 있어야 성립한다 — 한쪽이
  // guard에 걸려 사라지면 "그런데" 대비를 억지로 유지하지 않고 남은
  // 한쪽만 진술하거나(§9 우선순위 ①), 둘 다 사라지면 그 문장 자체를
  // 생략한다(§9 우선순위 ④, 새 filler 금지).
  const consequenceLine = behaviorA && behaviorB ? `그래서 ${behaviorA} 그런데 ${behaviorB}` : behaviorA ? `그래서 ${behaviorA}` : behaviorB ? `그래서 ${behaviorB}` : "";
  const body = [
    scene.length > 0 ? sceneList(scene) : "",
    `${labelA}${gwaWa(labelA)} ${labelB}${eunNeun(labelB)} 이렇게 다른 크기로 나타났다는 것은, 이 둘을 애초에 같은 무게로 쓰고 있지 않다는 뜻입니다.`,
    consequenceLine,
  ]
    .filter(Boolean)
    .join(" ");
  return { headline, body, source: `axis-pair-fallback:${a.key}x${b.key}` };
}

// ============================================================
// ENDING — summary가 아니라 "소장하고 싶은 마무리". 4차 라운드부터
// 어떤 결과에나 붙던 범용 ENDING_CLOSERS를 없애고, 취향의 중심이 된
// 축(coreTaste의 axis1)마다 다른 ENDING_INSIGHT로 바꿨다 — "이 취향을
// 어떻게 다루면 더 선명해지는가"를 advice 톤이 아니라 관찰 톤으로
// 짧게 남긴다.
// ============================================================
// AXIS_STAKES와 같은 축을 다루지만 어휘/이미지를 겹치지 않게 썼다 —
// STAKES는 "이게 왜 중요한가"(컨디션·마감·시야 같은 단어), ENDING은
// "이 취향이 어떻게 자라는가"(동네·물건·사람 같은 다른 구체어)로
// 서로 다른 그림을 그린다.
const ENDING_INSIGHT: Record<TasteV3AxisKey, { positive: string; negative: string }> = {
  space: {
    negative: "당신의 취향은 새로운 동네를 넓혀가는 데서 자라기보다, 이미 아는 골목을 더 깊이 걸어볼 때 더 선명해집니다.",
    positive: "당신의 취향은 물건을 하나씩 들이는 데서 자라기보다, 자리 하나를 그대로 비워 둘 줄 알 때 더 선명해집니다.",
  },
  sensory: {
    positive: "당신의 취향은 새것을 자주 들이는 데서 자라기보다, 하나를 오래 곁에 두고 그 변화를 지켜볼 때 더 선명해집니다.",
    negative: "당신의 취향은 여러 개를 두루 갖추는 데서 자라기보다, 하나를 제대로 알아보는 눈을 키울 때 더 선명해집니다.",
  },
  rhythm: {
    positive: "당신의 취향은 일정을 촘촘히 채우는 데서 자라기보다, 마음이 이끄는 하루 하나를 그대로 따라갈 때 더 선명해집니다.",
    negative: "당신의 취향은 빠른 결정을 늘리는 데서 자라기보다, 하나에 충분히 머물러 볼 때 더 선명해집니다.",
  },
  relation: {
    positive: "당신의 취향은 더 많은 사람을 만나는 데서 자라기보다, 한 사람과 깊이 겹쳐질 때 더 선명해집니다.",
    negative: "당신의 취향은 사람을 피하는 데서 자라기보다, 온전히 자신과 마주 앉는 시간에서 더 선명해집니다.",
  },
  exploration: {
    positive: "당신의 취향은 새로운 것을 많이 갖는 데서 자라기보다, 이미 좋아하는 것 사이에 새로운 장면 하나를 들여놓을 때 더 선명해집니다.",
    negative: "당신의 취향은 매번 다른 것을 시도하는 데서 자라기보다, 좋아하는 것 하나를 여러 번 다시 찾아갈 때 더 선명해집니다.",
  },
  expression: {
    positive: "당신의 취향은 많이 말하는 데서 자라기보다, 좋았던 순간을 놓치지 않고 남길 때 더 선명해집니다.",
    negative: "당신의 취향은 알리는 데서 자라기보다, 굳이 말하지 않은 채로도 오래 잘 간직될 때 더 선명해집니다.",
  },
};

function buildEnding(
  openingHeadline: string,
  howItShowsUp: { axisLabel: string },
  coreTaste: { axisLabel: string },
  axis1: TasteV3AxisKey,
  aggregate: V3AxisAggregate
): { body: string; pullQuote: string } {
  const callback = openingHeadline.replace(/\n/g, " ");
  const cleanCallback = stripTrailingPunct(callback);
  const direction1 = aggregate[axis1].score >= 0 ? "positive" : "negative";
  const body = [
    `"${cleanCallback}"${iRaneun(cleanCallback)} 첫 장면으로 돌아가 보면, ${coreTaste.axisLabel}${gwaWa(coreTaste.axisLabel)} ${howItShowsUp.axisLabel}${eunNeun(howItShowsUp.axisLabel)} 서로 다른 자리에서 같은 사람을 가리키고 있었습니다.`,
    ENDING_INSIGHT[axis1][direction1],
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

  // CORE TASTE는 PLACE 이미지, HOW IT SHOWS UP은 OBJECT 이미지 위에
  // 놓인다(TasteMagazineResultV3.tsx) — 그래서 각 섹션의 visual cue도
  // 그 이미지의 실제 scene 메타데이터에서 가져온다.
  const axis1 = axisRanking[0];
  const coreTaste = buildAxisSection(axis1, "취향의 중심", magazineVisualAssets.taste.place, aggregate, usage, axis1.length + 1, "why");

  const axis2 = axisRanking[1];
  const howItShowsUp = buildAxisSection(
    axis2,
    "생활에서 나타나는 방식",
    magazineVisualAssets.taste.object,
    aggregate,
    usage,
    axis2.length + 2,
    "behavior"
  );

  const interestingPartResult = buildInterestingPart(aggregate, relationships, tensions, openingResult.source);
  const interestingPart = { headline: interestingPartResult.headline, body: interestingPartResult.body };

  const ending = buildEnding(opening.headline, howItShowsUp, coreTaste, axis1, aggregate);

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

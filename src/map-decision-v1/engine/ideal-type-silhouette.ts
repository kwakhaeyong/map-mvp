// 이상형 결과의 "외모 취향 실루엣" — 사용자 본인이 아니라 "어떤 사람에게
// 끌리는가"를 그림으로 보여준다. ideal-type-tags.ts와 완전히 같은
// 방식이다: AI를 호출하지 않고, 퀴즈 답변(session.quizAnswers)에서
// 코드로 결정적으로 부품을 고른다 — 같은 답변이면 항상 같은 그림.
//
// ★얼굴 이목구비(눈/코/입)는 어떤 부품에도 없다 — 특정 인상이 박히면
// 절반은 "내 취향 아닌데"가 되기 때문이다. ★체형·몸매도 유형화하지
// 않는다 — 구분은 오직 머리·상의 실루엣·자세·소품·색으로만 한다.
//
// 부품 매핑(문항 확장 이후 재설계):
// - 머리(hair) ← hairStyle, 상의(top) ← clothingStyle, 색(color) ←
//   colorImpression — 이상형 퀴즈에 새로 생긴 "외모" 전용 빠른 탭
//   문항과 1:1로 대응시켰다. 세 문항 모두 선택지가 4개라 부품도
//   4가지씩이다(선택지보다 부품을 더 만들어봤자 도달할 수 없다).
// - 자세(pose) ← lifestyle. 태그(ideal-type-tags.ts)가 쓰는 축과
//   똑같은 축이다 — "태그는 #집순이집돌이형인데 그림은 야외 활동적"
//   같은 모순이 아예 생기지 않게, 자세만큼은 몸이 아니라 생활 패턴에서
//   가져오고 태그와 정확히 같은 소스·같은 방향으로 묶었다.
// - 소품(accessory) ← appearance("끌리는 분위기는?"). 머리·상의·색이
//   이미 hairStyle/clothingStyle/colorImpression을 쓰고 있어서, 같은
//   "외모" 계열이면서 아직 안 쓰인 appearance를 분위기를 상징하는
//   소품으로 표현했다. bodyFeel(체형 느낌)은 의도적으로 어떤 부품에도
//   연결하지 않았다 — 자세나 몸통에 연결하면 "체형 취향 → 그림 속
//   체형"으로 읽힐 위험이 있어, 체형 유형화 금지 원칙을 지키기 위해
//   아예 시각화하지 않는 쪽을 택했다(답변 자체는 AI 텍스트 생성에는
//   그대로 쓰인다).
import { IdealTypeSilhouetteParts, SilhouetteAccessory, SilhouetteColor, SilhouetteHair, SilhouettePose, SilhouetteTop } from "../types";

export type { IdealTypeSilhouetteParts };

// 축의 최상위 선택지 라벨 -> 부품. TopicQuiz.tsx가 세부 선택지를
// 골랐어도 그 부모 칩의 라벨로 기록해주므로(session.quizAnswers), 여기
// 매핑도 topics.ts에 실제로 존재하는 최상위 라벨만 키로 갖는다.
const HAIR_BY_HAIR_STYLE: Record<string, SilhouetteHair> = {
  "짧은 머리": "shortHair",
  "어깨 정도 길이": "shoulderHair",
  "긴 머리": "longHair",
  "스타일보다 분위기가 중요": "neutralHair",
};

const TOP_BY_CLOTHING_STYLE: Record<string, SilhouetteTop> = {
  "깔끔한 정장·셋업": "structuredBlazer",
  "편안한 캐주얼": "looseCasual",
  "스트릿·개성있는": "layeredAsymmetric",
  "심플한 기본템": "minimalShirt",
};

// 태그의 "라이프스타일" 축과 같은 소스 — 실내/차분 계열은 항상
// relaxedLean이나 upright처럼 정적인 자세로, 야외/활동 계열은 항상
// striding처럼 동적인 자세로 묶는다. (문항 확장 이전과 동일 — lifestyle
// 자체는 이번 개편에서 바뀌지 않았다.)
const POSE_BY_LIFESTYLE: Record<string, SilhouettePose> = {
  "집순이·집돌이": "relaxedLean",
  "각자 시간 존중": "relaxedLean",
  "액티브·야외파": "striding",
  "여행 좋아하는": "striding",
  "취미 공유": "engaged",
  "규칙적인 생활": "upright",
};

const ACCESSORY_BY_APPEARANCE: Record<string, SilhouetteAccessory> = {
  "청량·상큼": "glasses",
  "시크·도시적": "scarf",
  "부드럽고 포근": "mug",
  "개성있는·유니크": "backpack",
  "단정한·클래식": "notebook",
};

const COLOR_BY_COLOR_IMPRESSION: Record<string, SilhouetteColor> = {
  "밝고 화사한 느낌": "warm",
  "차분하고 톤다운된 느낌": "calm",
  "대비가 선명한 느낌": "bold",
  "자연스러운 느낌": "fresh",
};

// 필수 문항만 답해도 hairStyle/clothingStyle/lifestyle/appearance/
// colorImpression은 전부 채워져 있다(모두 필수 축). 그래도 이 기능
// 이전에 저장된 세션처럼 quizAnswers 자체가 없거나 특정 축이 비어 있을
// 수 있으니, 빈 곳 없이 그려지도록 각 축의 첫 번째 선택지를 기본값으로
// 둔다.
const DEFAULT_PARTS: IdealTypeSilhouetteParts = {
  hair: "shortHair",
  top: "minimalShirt",
  pose: "upright",
  accessory: "notebook",
  color: "calm",
};

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

export function getIdealTypeSilhouette(quizAnswers: Record<string, string[]> | undefined): IdealTypeSilhouetteParts {
  const hairStyle = firstLabel(quizAnswers, "hairStyle");
  const clothingStyle = firstLabel(quizAnswers, "clothingStyle");
  const lifestyle = firstLabel(quizAnswers, "lifestyle");
  const appearance = firstLabel(quizAnswers, "appearance");
  const colorImpression = firstLabel(quizAnswers, "colorImpression");

  return {
    hair: (hairStyle && HAIR_BY_HAIR_STYLE[hairStyle]) || DEFAULT_PARTS.hair,
    top: (clothingStyle && TOP_BY_CLOTHING_STYLE[clothingStyle]) || DEFAULT_PARTS.top,
    pose: (lifestyle && POSE_BY_LIFESTYLE[lifestyle]) || DEFAULT_PARTS.pose,
    accessory: (appearance && ACCESSORY_BY_APPEARANCE[appearance]) || DEFAULT_PARTS.accessory,
    color: (colorImpression && COLOR_BY_COLOR_IMPRESSION[colorImpression]) || DEFAULT_PARTS.color,
  };
}

const HAIR_DESCRIPTION: Record<SilhouetteHair, string> = {
  shortHair: "짧은 헤어",
  shoulderHair: "어깨 길이 헤어",
  longHair: "긴 헤어",
  neutralHair: "단정한 헤어",
};

const TOP_DESCRIPTION: Record<SilhouetteTop, string> = {
  structuredBlazer: "각진 재킷",
  looseCasual: "루즈한 캐주얼",
  layeredAsymmetric: "레이어드 비대칭",
  minimalShirt: "미니멀한 셔츠",
};

const POSE_DESCRIPTION: Record<SilhouettePose, string> = {
  relaxedLean: "편안한 거리감",
  striding: "활기찬 분위기",
  engaged: "몰입한 분위기",
  upright: "반듯한 분위기",
};

const COLOR_DESCRIPTION: Record<SilhouetteColor, string> = {
  warm: "밝고 화사한 색",
  calm: "차분하고 톤다운된 색",
  bold: "대비가 선명한 색",
  fresh: "자연스러운 색",
};

// 그림 아래에 붙일 짧은 설명 3개 — 그림만 있으면 무슨 뜻인지 모른다는
// 지적에 따라, 실제로 선택된 부품(머리/상의는 생략하고 분위기·색·거리감
// 위주로) 중 가장 "느낌"을 전달하는 3가지를 문장으로 압축한다.
export function describeSilhouette(parts: IdealTypeSilhouetteParts): string[] {
  return [`${TOP_DESCRIPTION[parts.top]}`, `${COLOR_DESCRIPTION[parts.color]}`, `${POSE_DESCRIPTION[parts.pose]}`];
}

// 이상형 결과의 "외모 취향 실루엣" — 사용자 본인이 아니라 "어떤 사람에게
// 끌리는가"를 그림으로 보여준다. ideal-type-tags.ts와 완전히 같은
// 방식이다: AI를 호출하지 않고, 퀴즈 답변(session.quizAnswers)에서
// 코드로 결정적으로 부품을 고른다 — 같은 답변이면 항상 같은 그림.
//
// ★얼굴 이목구비(눈/코/입)는 어떤 부품에도 없다 — 특정 인상이 박히면
// 절반은 "내 취향 아닌데"가 되기 때문이다. ★체형·몸매도 유형화하지
// 않는다 — 구분은 오직 머리·상의 실루엣·자세·소품·색으로만 한다.
//
// 태그(ideal-type-tags.ts)와 같은 축(lifestyle)을 일부 공유한다 —
// "태그가 #집순이집돌이형인데 그림이 야외 활동적이면 안 된다"는 요구를
// 만족시키는 가장 확실한 방법은 같은 답변에서 같은 방향으로 파생시키는
// 것이다. 자세(pose) 매핑에서 lifestyle의 "집순이·집돌이"류 답변은
// 전부 실내/차분 계열 자세로, "액티브·야외파"류 답변은 전부 동적 계열
// 자세로 묶어서 태그와 그림이 서로 다른 얘기를 하지 않게 했다.

import { IdealTypeSilhouetteParts, SilhouetteAccessory, SilhouetteColor, SilhouetteHair, SilhouettePose, SilhouetteTop } from "../types";

export type { IdealTypeSilhouetteParts };

// 축의 최상위 선택지 라벨 -> 부품. TopicQuiz.tsx가 세부 선택지를
// 골랐어도 그 부모 칩의 라벨로 기록해주므로(session.quizAnswers), 여기
// 매핑도 topics.ts에 실제로 존재하는 최상위 라벨만 키로 갖는다.
const HAIR_BY_APPEARANCE: Record<string, SilhouetteHair> = {
  "청량·상큼": "lightBob",
  "시크·도시적": "sleekStraight",
  "부드럽고 포근": "softWave",
  "개성있는·유니크": "asymmetricCrop",
  "단정한·클래식": "neatPart",
  "건강하고 탄탄한": "activeShort",
};

const TOP_BY_PERSONALITY: Record<string, SilhouetteTop> = {
  "다정다감": "roundKnit",
  "유쾌·활발": "looseCasual",
  "차분·침착": "minimalShirt",
  "리더십 있는": "structuredBlazer",
  "무뚝뚝해도 속 깊은": "oversizedHoodie",
  "4차원·엉뚱": "layeredAsymmetric",
};

// 태그의 "라이프스타일" 축과 같은 소스 — 실내/차분 계열은 항상
// relaxedLean이나 upright처럼 정적인 자세로, 야외/활동 계열은 항상
// striding처럼 동적인 자세로 묶는다.
const POSE_BY_LIFESTYLE: Record<string, SilhouettePose> = {
  "집순이·집돌이": "relaxedLean",
  "각자 시간 존중": "relaxedLean",
  "액티브·야외파": "striding",
  "여행 좋아하는": "striding",
  "취미 공유": "engaged",
  "규칙적인 생활": "upright",
};

const ACCESSORY_BY_VALUES: Record<string, SilhouetteAccessory> = {
  "성실·책임감": "mug",
  "안정·가정적": "mug",
  "유머·긍정": "scarf",
  "야망·성장": "notebook",
  "자유·독립": "backpack",
  "배려·존중": "glasses",
};

const COLOR_BY_SPARK_MOMENT: Record<string, SilhouetteColor> = {
  "웃을 때 반짝이는": "warm",
  "몰입해서 뭔가 할 때": "deep",
  "배려하는 모습을 볼 때": "soft",
  "자신감 있게 말할 때": "bold",
  "의외의 모습을 보일 때": "fresh",
  "나를 편하게 해줄 때": "calm",
};

// 필수 문항만 답해도 appearance/personality/lifestyle/values/sparkMoment는
// 전부 채워져 있다(모두 필수 축). 그래도 이 기능 이전에 저장된 세션처럼
// quizAnswers 자체가 없거나 특정 축이 비어 있을 수 있으니, 빈 곳 없이
// 그려지도록 각 축의 첫 번째 선택지를 기본값으로 둔다.
const DEFAULT_PARTS: IdealTypeSilhouetteParts = {
  hair: "lightBob",
  top: "roundKnit",
  pose: "upright",
  accessory: "mug",
  color: "calm",
};

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

export function getIdealTypeSilhouette(quizAnswers: Record<string, string[]> | undefined): IdealTypeSilhouetteParts {
  const appearance = firstLabel(quizAnswers, "appearance");
  const personality = firstLabel(quizAnswers, "personality");
  const lifestyle = firstLabel(quizAnswers, "lifestyle");
  const values = firstLabel(quizAnswers, "values");
  const sparkMoment = firstLabel(quizAnswers, "sparkMoment");

  return {
    hair: (appearance && HAIR_BY_APPEARANCE[appearance]) || DEFAULT_PARTS.hair,
    top: (personality && TOP_BY_PERSONALITY[personality]) || DEFAULT_PARTS.top,
    pose: (lifestyle && POSE_BY_LIFESTYLE[lifestyle]) || DEFAULT_PARTS.pose,
    accessory: (values && ACCESSORY_BY_VALUES[values]) || DEFAULT_PARTS.accessory,
    color: (sparkMoment && COLOR_BY_SPARK_MOMENT[sparkMoment]) || DEFAULT_PARTS.color,
  };
}

const HAIR_DESCRIPTION: Record<SilhouetteHair, string> = {
  lightBob: "가벼운 단발",
  sleekStraight: "슬릭한 긴 생머리",
  softWave: "부드러운 웨이브",
  asymmetricCrop: "비대칭 크롭",
  neatPart: "단정한 가르마",
  activeShort: "짧은 액티브컷",
};

const TOP_DESCRIPTION: Record<SilhouetteTop, string> = {
  roundKnit: "둥근 니트 실루엣",
  looseCasual: "루즈한 캐주얼",
  minimalShirt: "미니멀한 셔츠",
  structuredBlazer: "각진 재킷",
  oversizedHoodie: "오버사이즈 후드",
  layeredAsymmetric: "레이어드 비대칭",
};

const POSE_DESCRIPTION: Record<SilhouettePose, string> = {
  relaxedLean: "편안한 거리감",
  striding: "활기찬 분위기",
  engaged: "몰입한 분위기",
  upright: "반듯한 분위기",
};

const COLOR_DESCRIPTION: Record<SilhouetteColor, string> = {
  warm: "밝고 따뜻한 색",
  deep: "차분하고 깊은 색",
  soft: "부드러운 색",
  bold: "선명하고 강한 색",
  fresh: "산뜻한 색",
  calm: "은은한 뉴트럴 색",
};

// 그림 아래에 붙일 짧은 설명 3개 — 그림만 있으면 무슨 뜻인지 모른다는
// 지적에 따라, 실제로 선택된 부품(머리/상의는 생략하고 분위기·색·거리감
// 위주로) 중 가장 "느낌"을 전달하는 3가지를 문장으로 압축한다.
export function describeSilhouette(parts: IdealTypeSilhouetteParts): string[] {
  return [`${TOP_DESCRIPTION[parts.top]}`, `${COLOR_DESCRIPTION[parts.color]}`, `${POSE_DESCRIPTION[parts.pose]}`];
}

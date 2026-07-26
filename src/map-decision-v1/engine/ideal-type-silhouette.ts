// 이상형 결과의 "외모 취향 실루엣" — 사용자가 퀴즈에서 직접 고른 그림
// 그대로를 결과 카드·공유 링크에 다시 보여준다. AI가 만들지 않는다 —
// 퀴즈 답변(session.quizAnswers)에서 코드로 결정적으로 부품을 고른다
// (ideal-type-tags.ts의 공유 태그와 같은 방식).
//
// ★저장 값은 라벨 텍스트다(부품 ID가 아니다). IdealTypeResult.silhouette
// 에는 사용자가 실제로 고른 라벨 5개(IdealTypeSilhouetteLabels)를 그대로
// 저장하고, 라벨 → 부품 키 매핑은 "렌더링 시점"에 이 파일이 담당한다
// (resolveSilhouetteParts). 나중에 topics.ts의 옵션 라벨이 또 바뀌어도
// 이미 저장된 과거 결과·공유 링크의 라벨은 그대로 있으니 안 깨지고,
// 이 파일의 매핑 테이블에 새 라벨만 추가하면 된다.
//
// ★scripts/silhouette-check.mjs가 quality gate에서 아래 5개 매핑
// 테이블이 topics.ts의 현재 옵션 라벨을 전부 커버하는지 빌드 시점에
// 검사한다 — 라벨이 하나라도 빠지면 조용히 기본값으로 떨어지는 대신
// 빌드가 실패한다. PR #79가 겪은 문제(라벨이 바뀌었는데 매핑 테이블은
// 그대로라 결과 그림이 항상 기본값만 나옴)를 다시 겪지 않기 위한
// 안전장치다 — 이 파일의 테이블을 고칠 때마다 그 스크립트도 같이
// 확인하라.
import { IdealTypeSilhouetteLabels } from "../types";

export const HAIR_KEYS = ["lightBob", "sleekStraight", "softWave", "asymmetricCrop", "neatPart", "activeShort"] as const;
export const HAIR_COLOR_KEYS = ["black", "darkBrown", "lightBrown", "blonde", "dyed"] as const;
export const COLLAR_KEYS = ["shirtCollar", "knitNeckline", "hoodieNeckline", "turtleneck", "blazerCollar", "basicTee"] as const;
export const ACCESSORY_KEYS = ["none", "glasses", "earring", "hat", "scarf"] as const;
export const COLOR_KEYS = ["warm", "deep", "soft", "bold", "fresh", "calm"] as const;

export type HairKey = (typeof HAIR_KEYS)[number];
export type HairColorKey = (typeof HAIR_COLOR_KEYS)[number];
export type CollarKey = (typeof COLLAR_KEYS)[number];
export type AccessoryKey = (typeof ACCESSORY_KEYS)[number];
export type ColorKey = (typeof COLOR_KEYS)[number];

export type IdealTypeSilhouetteParts = {
  hair: HairKey;
  hairColor: HairColorKey;
  collar: CollarKey;
  accessory: AccessoryKey;
  color: ColorKey;
};

// topics.ts의 hairStyle 옵션 라벨 → IdealTypeVisualParts.tsx의 부품 키.
export const HAIR_STYLE_LABEL_TO_KEY: Record<string, HairKey> = {
  "가벼운 단발": "lightBob",
  "슬릭한 생머리": "sleekStraight",
  "부드러운 웨이브": "softWave",
  "비대칭 크롭": "asymmetricCrop",
  "단정한 가르마": "neatPart",
  "짧은 액티브컷": "activeShort",
};

// topics.ts의 hairColor 옵션 라벨 → 부품 키.
export const HAIR_COLOR_LABEL_TO_KEY: Record<string, HairColorKey> = {
  "흑발": "black",
  "짙은 갈색": "darkBrown",
  "밝은 갈색": "lightBrown",
  "밝은 톤": "blonde",
  "염색 톤": "dyed",
};

// topics.ts의 clothingStyle(옷깃·넥라인) 옵션 라벨 → 부품 키.
export const CLOTHING_STYLE_LABEL_TO_KEY: Record<string, CollarKey> = {
  "셔츠 칼라": "shirtCollar",
  "니트 넥라인": "knitNeckline",
  "후드 넥라인": "hoodieNeckline",
  "터틀넥": "turtleneck",
  "재킷 칼라": "blazerCollar",
  "기본 티 넥라인": "basicTee",
};

// topics.ts의 accessory 옵션 라벨 → 부품 키.
export const ACCESSORY_LABEL_TO_KEY: Record<string, AccessoryKey> = {
  "없음": "none",
  "안경": "glasses",
  "귀걸이": "earring",
  "모자": "hat",
  "목도리": "scarf",
};

// topics.ts의 colorImpression(배경 색감) 옵션 라벨 → 부품 키.
export const COLOR_IMPRESSION_LABEL_TO_KEY: Record<string, ColorKey> = {
  "밝고 따뜻한 색": "warm",
  "차분하고 깊은 색": "deep",
  "부드러운 색": "soft",
  "선명하고 강한 색": "bold",
  "산뜻한 색": "fresh",
  "은은한 뉴트럴 색": "calm",
};

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

// 필수 문항만 답해도 hairStyle/hairColor/clothingStyle/accessory/
// colorImpression은 전부 채워져 있다(모두 필수 축). 5개 중 하나라도
// 없으면(이 기능 이전에 저장된 세션 등) undefined를 돌려주고, 결과에는
// silhouette 필드 자체가 안 붙는다 — 화면은 그림 없이 텍스트만 보여준다.
export function getIdealTypeSilhouetteLabels(quizAnswers: Record<string, string[]> | undefined): IdealTypeSilhouetteLabels | undefined {
  const hairStyle = firstLabel(quizAnswers, "hairStyle");
  const hairColor = firstLabel(quizAnswers, "hairColor");
  const clothingStyle = firstLabel(quizAnswers, "clothingStyle");
  const accessory = firstLabel(quizAnswers, "accessory");
  const colorImpression = firstLabel(quizAnswers, "colorImpression");
  if (!hairStyle || !hairColor || !clothingStyle || !accessory || !colorImpression) return undefined;
  return { hairStyle, hairColor, clothingStyle, accessory, colorImpression };
}

// 라벨 → 부품 키 변환은 "렌더링 시점"에만 일어난다(저장 시점이 아니다).
// 라벨 중 하나라도 지금 매핑 테이블에 없으면(아주 오래된 공유 링크가
// 그사이 없어진 옛날 라벨을 들고 있는 경우 등) null을 돌려주고, 호출부가
// 깨진 그림 대신 기존 텍스트 표시로 자연스럽게 넘어가게 한다.
export function resolveSilhouetteParts(labels: IdealTypeSilhouetteLabels): IdealTypeSilhouetteParts | null {
  const hair = HAIR_STYLE_LABEL_TO_KEY[labels.hairStyle];
  const hairColor = HAIR_COLOR_LABEL_TO_KEY[labels.hairColor];
  const collar = CLOTHING_STYLE_LABEL_TO_KEY[labels.clothingStyle];
  const accessory = ACCESSORY_LABEL_TO_KEY[labels.accessory];
  const color = COLOR_IMPRESSION_LABEL_TO_KEY[labels.colorImpression];
  if (!hair || !hairColor || !collar || !accessory || !color) return null;
  return { hair, hairColor, collar, accessory, color };
}

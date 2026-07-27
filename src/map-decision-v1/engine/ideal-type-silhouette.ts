// 이상형 결과에 "외모 취향" 답변 라벨을 붙인다 — 태그(ideal-type-
// tags.ts)와 같은 방식으로 AI를 호출하지 않고 퀴즈 답변(session.
// quizAnswers)에서 코드로 결정적으로 뽑는다.
//
// ★예전에는 이 라벨들로 부품 SVG를 조합해 실루엣 그림을 그렸지만
// (PR #83/#84), 그림 품질이 프로덕션 기준에 못 미쳐 그림 렌더링(라벨→
// 부품 매핑, SVG 조합 컴포넌트)만 걷어냈다 — 답변 자체는 여전히
// 유효한 정보라 텍스트 칩으로 계속 보여준다. 그래서 이 파일에는 라벨을
// 뽑는 함수만 남아 있다.
import { IdealTypeSilhouetteLabels } from "../types";

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

// 필수 문항만 답해도 hairStyle/hairColor/clothingStyle/accessory/
// colorImpression은 전부 채워져 있다(모두 필수 축). 5개 중 하나라도
// 없으면(이 기능 이전에 저장된 세션 등) undefined를 돌려주고, 결과에는
// silhouette 필드 자체가 안 붙는다 — 화면은 칩 줄만 생략한다.
export function getIdealTypeSilhouetteLabels(quizAnswers: Record<string, string[]> | undefined): IdealTypeSilhouetteLabels | undefined {
  const hairStyle = firstLabel(quizAnswers, "hairStyle");
  const hairColor = firstLabel(quizAnswers, "hairColor");
  const clothingStyle = firstLabel(quizAnswers, "clothingStyle");
  const accessory = firstLabel(quizAnswers, "accessory");
  const colorImpression = firstLabel(quizAnswers, "colorImpression");
  if (!hairStyle || !hairColor || !clothingStyle || !accessory || !colorImpression) return undefined;
  return { hairStyle, hairColor, clothingStyle, accessory, colorImpression };
}

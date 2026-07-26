// 이상형 결과의 "공유 태그" — MBTI의 "ENFP"처럼, 서로 다른 결과라도
// 같은 답을 고르면 같은 단어가 나와서 친구끼리 바로 비교할 수 있게
// 하는 공용 어휘. 타이틀(title)은 여전히 AI가 자유롭게 짓는 고유한
// 별명이고, 태그는 그 옆에 곁들이는 "알아볼 수 있는" 표식이다.
//
// ★AI를 호출하지 않는다. 아래 사전은 고정 목록이고, 어떤 답변이 어떤
// 태그가 되는지는 이 파일의 매핑 테이블로만 결정된다 — 같은 답변을
// 고른 두 사람은 항상 같은 태그를 받는다. 결과 생성 스키마
// (ideal-type-generator.ts의 IDEAL_TYPE_SCHEMA)는 건드리지 않는다;
// 태그는 AI 응답을 파싱한 뒤 코드에서 별도로 붙인다.
//
// 사전은 6개 축(카테고리) × 4~6개 태그로 총 34개다. 카드에는 그중
// 4개 축(모두 필수 문항이라 필수만 답해도 항상 나옴)만 노출한다 —
// MBTI도 축마다 실제로는 여러 문항을 종합하지만 보여주는 건 "네 글자"
// 뿐인 것과 같은 이유로, 화면 한 줄에 다 담을 수 있는 개수로 제한했다.
// 나머지 2개 축(가치관·관계 온도)은 사전에는 있지만 이번 버전 카드에는
// 표시하지 않는다 — 나중에 비교·필터 기능이 생기면 바로 쓸 수 있다.

type TagCategory = {
  id: string;
  label: string;
  axisId: string;
  // 축의 최상위 선택지 라벨 -> 태그. TopicQuiz.tsx가 세부 선택지를
  // 골랐어도 그 부모 칩의 라벨로 기록해주므로(session.quizAnswers), 이
  // 매핑은 축(topics.ts)에 실제로 존재하는 최상위 라벨만 키로 갖는다.
  mapping: Record<string, string>;
  displayed: boolean;
};

export const TAG_CATEGORIES: TagCategory[] = [
  {
    id: "relationshipWants",
    label: "관계에서 원하는 것",
    axisId: "relationship",
    displayed: true,
    mapping: {
      "표현 많이 해주기": "#표현중시형",
      "서로 존중하는 거리감": "#거리존중형",
      "함께 많은 시간": "#함께시간형",
      "티키타카 잘 통하기": "#티키타카중시형",
      "든든한 안정감": "#안정감중시형",
      "빠른 갈등 해결": "#갈등해결형",
    },
  },
  {
    id: "lifestyle",
    label: "라이프스타일",
    axisId: "lifestyle",
    displayed: true,
    mapping: {
      "집순이·집돌이": "#집순이집돌이형",
      "액티브·야외파": "#액티브형",
      "취미 공유": "#취미공유형",
      "각자 시간 존중": "#각자시간형",
      "여행 좋아하는": "#여행형",
      "규칙적인 생활": "#루틴형",
    },
  },
  {
    id: "sparkMoment",
    label: "끌림 포인트",
    axisId: "sparkMoment",
    displayed: true,
    mapping: {
      "웃을 때 반짝이는": "#미소포인트형",
      "몰입해서 뭔가 할 때": "#몰입매력형",
      "배려하는 모습을 볼 때": "#배려포인트형",
      "자신감 있게 말할 때": "#자신감포인트형",
      "의외의 모습을 보일 때": "#반전매력형",
      "나를 편하게 해줄 때": "#편안포인트형",
    },
  },
  {
    id: "conflictPattern",
    label: "갈등 대처 방식",
    axisId: "experienceStressResponse",
    displayed: true,
    mapping: {
      "바로 이야기하는 편": "#직진소통형",
      "혼자 삭이는 편": "#혼자정리형",
      "거리를 두는 편": "#거리두기형",
      "주변에 털어놓는 편": "#나눔형",
    },
  },
  {
    id: "values",
    label: "가치관",
    axisId: "values",
    displayed: false,
    mapping: {
      "성실·책임감": "#신뢰중시형",
      "유머·긍정": "#긍정에너지형",
      "야망·성장": "#성장지향형",
      "안정·가정적": "#안정지향형",
      "자유·독립": "#자유중시형",
      "배려·존중": "#존중중시형",
    },
  },
  {
    id: "relationshipTemperature",
    label: "관계 온도",
    // 이진 선택 3개(binary1/binary3/binaryHonesty)를 한 축으로 묶었다 —
    // 6개 선택지 각각이 서로 다른 이진 질문에서 나오지만, 카드에는
    // 이 축 전체에서 하나만 뽑아 보여준다는 전제(이번 버전은 미노출)라
    // 값이 겹치지 않는 한 어떤 이진 질문 답이 오든 매핑 하나로 처리한다.
    axisId: "binary1",
    displayed: false,
    mapping: {
      "오래 편안한 사람": "#편안함추구형",
      "매일 설레는 사람": "#설렘추구형",
      "내가 리드하는 관계": "#주도형",
      "상대가 리드하는 관계": "#동행형",
      "솔직하게 말해주는 사람": "#직설환영형",
      "배려해서 말해주는 사람": "#다정배려형",
    },
  },
];

// relationshipTemperature 카테고리는 binary1/binary3/binaryHonesty 세
// 축의 답을 모두 참고해야 하므로, 위 표의 axisId 하나로는 표현이 안
// 된다 — 아래에서 이 카테고리만 특별히 다룬다.
const RELATIONSHIP_TEMPERATURE_AXIS_IDS = ["binary1", "binary3", "binaryHonesty"];

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

// 카드에 보여줄 태그(기본 4개, 서로 다른 축에서 하나씩, 겹치지 않음).
// session.quizAnswers가 없는(이 기능 이전에 저장된) 세션·결과는 빈
// 배열을 반환한다 — 화면은 이 경우 태그 줄 자체를 생략한다.
export function getIdealTypeTags(quizAnswers: Record<string, string[]> | undefined): string[] {
  if (!quizAnswers) return [];
  const tags: string[] = [];
  for (const category of TAG_CATEGORIES) {
    if (!category.displayed) continue;
    const label = firstLabel(quizAnswers, category.axisId);
    const tag = label ? category.mapping[label] : undefined;
    if (tag) tags.push(tag);
  }
  return tags;
}

// 사전 전체(미노출 카테고리 포함)를 결정적으로 계산 — 카드에는 안 쓰지만
// 나중에 비교 기능 등에서 재사용할 수 있게 별도로 노출해둔다.
export function getAllIdealTypeTags(quizAnswers: Record<string, string[]> | undefined): Record<string, string | undefined> {
  if (!quizAnswers) return {};
  const result: Record<string, string | undefined> = {};
  for (const category of TAG_CATEGORIES) {
    if (category.id === "relationshipTemperature") {
      const label = RELATIONSHIP_TEMPERATURE_AXIS_IDS.map((axisId) => firstLabel(quizAnswers, axisId)).find(
        (candidate) => candidate && category.mapping[candidate],
      );
      result[category.id] = label ? category.mapping[label] : undefined;
      continue;
    }
    const label = firstLabel(quizAnswers, category.axisId);
    result[category.id] = label ? category.mapping[label] : undefined;
  }
  return result;
}

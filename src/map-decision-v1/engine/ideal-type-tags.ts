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
// 정확히 4개 축, 총 18개 태그 — 정의된 축은 전부 카드에 표시된다(카드에
// 안 쓰는 "죽은" 카테고리를 사전에 남겨두지 않는다). 처음에는 6개 축을
// 만들고 그중 4개만 표시하는 구조였는데, 실제로 5세트를 뽑아보니
// (모든 축이 선택지 4~6개짜리라) 서로 다른 두 사람의 태그가 하나도
// 안 겹치는 경우가 나왔다 — 이러면 "친구끼리 비교"라는 이 기능의
// 목적이 무너진다. MBTI가 항상 비교되는 이유는 축이 2지선다라 두
// 사람이 우연히도 절반 확률로 겹치기 때문이다. 그래서 네 번째 축을
// 선택지 6개짜리(끌림 포인트)에서 2지선다(관계 리듬)로 바꿨다 — 이
// 축 하나만으로는 "모든 두 사람이 반드시 겹친다"는 수학적 보장까지는
// 아니지만(각자 독립적으로 고르면 그래도 50% 확률), 6개 중 하나가
// 겹칠 확률(약 17%)보다는 훨씬 자주 공통 태그가 생긴다.
type TagCategory = {
  id: string;
  label: string;
  axisId: string;
  // 축의 최상위 선택지 라벨 -> 태그. TopicQuiz.tsx가 세부 선택지를
  // 골랐어도 그 부모 칩의 라벨로 기록해주므로(session.quizAnswers), 이
  // 매핑은 축(topics.ts)에 실제로 존재하는 최상위 라벨만 키로 갖는다.
  mapping: Record<string, string>;
};

export const TAG_CATEGORIES: TagCategory[] = [
  {
    id: "relationshipWants",
    label: "관계에서 원하는 것",
    axisId: "relationship",
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
    id: "conflictPattern",
    label: "갈등 대처 방식",
    axisId: "experienceStressResponse",
    mapping: {
      "바로 이야기하는 편": "#직진소통형",
      "혼자 삭이는 편": "#혼자정리형",
      "거리를 두는 편": "#거리두기형",
      "주변에 털어놓는 편": "#나눔형",
    },
  },
  {
    id: "relationshipRhythm",
    label: "관계 리듬",
    // 원래 "관계 온도"는 binary1/binary3/binaryHonesty 세 이진 질문을
    // 하나로 묶어서, 어느 걸 표시할지 임의로 골라야 하는 구조였다. 지금은
    // binary1 하나만 쓴다 — 임의 선택 문제가 없어지고, 2지선다라 겹칠
    // 확률도 가장 높다.
    axisId: "binary1",
    mapping: {
      "오래 편안한 사람": "#편안함추구형",
      "매일 설레는 사람": "#설렘추구형",
    },
  },
];

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

// 카드에 보여줄 태그(항상 4개, 서로 다른 축에서 하나씩, 겹치지 않음).
// session.quizAnswers가 없는(이 기능 이전에 저장된) 세션·결과는 빈
// 배열을 반환한다 — 화면은 이 경우 태그 줄 자체를 생략한다.
export function getIdealTypeTags(quizAnswers: Record<string, string[]> | undefined): string[] {
  if (!quizAnswers) return [];
  const tags: string[] = [];
  for (const category of TAG_CATEGORIES) {
    const label = firstLabel(quizAnswers, category.axisId);
    const tag = label ? category.mapping[label] : undefined;
    if (tag) tags.push(tag);
  }
  return tags;
}

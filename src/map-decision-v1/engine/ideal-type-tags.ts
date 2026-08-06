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
// 정확히 4개 축, 총 42개 태그(카테고리별 매핑 항목 합) — 정의된 축은
// 전부 카드에 표시된다(카드에 안 쓰는 "죽은" 카테고리를 사전에 남겨두지
// 않는다). 처음에는 6개 축을 만들고 그중 4개만 표시하는 구조였는데,
// 실제로 5세트를 뽑아보니(모든 축이 선택지 4~6개짜리라) 서로 다른 두
// 사람의 태그가 하나도 안 겹치는 경우가 나왔다 — 이러면 "친구끼리
// 비교"라는 이 기능의 목적이 무너진다. MBTI가 항상 비교되는 이유는
// 축이 2지선다라 두 사람이 우연히도 절반 확률로 겹치기 때문이다.
// 그래서 네 번째 축을 선택지 6개짜리(끌림 포인트)에서 2지선다(관계
// 리듬)로 바꿨다 — 이 축 하나만으로는 "모든 두 사람이 반드시 겹친다"는
// 수학적 보장까지는 아니지만(각자 독립적으로 고르면 그래도 50% 확률),
// 6개 중 하나가 겹칠 확률(약 17%)보다는 훨씬 자주 공통 태그가 생긴다.
//
// conflictPattern은 이상형만 다른 축을 쓴다(topicId 분기, PR: 이상형
// 스트레스 대처 태그 축 분리). 이상형·나 소개의 experienceStressResponse
// 문항 원문이 완전히 같아서 같은 사람이 다르게 답할 이유가 없고, 그
// 결과 이 카테고리의 태그가 두 결과에서 항상 겹쳐 궁합 비교가 무의미
// 해졌다 — 이상형 쪽만 "이상형에게 원하는 스트레스 대처 방식"을 묻는
// 새 축(idealStressResponse)으로 옮기고, 나 소개·친구·인간관계는 기존
// 축(experienceStressResponse)을 그대로 쓴다.
//
// 세 번째 주제(친구·인간관계)를 추가하면서 relationshipWants·
// relationshipRhythm도 topicId 분기가 필요해졌다 — 이 두 카테고리는
// 이상형·나 소개에서는 "상대에게 원하는 것"을 묻지만, 친구·인간관계는
// 애초에 "상대"(연애 상대)라는 개념이 없어 같은 질문을 재사용할 수
// 없다. 그래서 friendship만 자기 자신에 대해 묻는 축(friendRole/
// friendDistance)을 새로 연결하고, 이상형·나 소개는 기존 축(relationship/
// binary1)을 그대로 쓴다. lifestyle만 예외적으로 세 주제 모두 축 이름과
// 질문 성격이 같아(친구·인간관계의 lifestyle 문항은 나 소개 것을 원문
// 그대로 복사했다) 문자열 하나를 계속 공유한다.
//
// 네 번째 주제(일할 때의 나, work)도 같은 방식으로 연결한다. lifestyle과
// conflictPattern은 work의 문항(lifestyle/experienceStressResponse)이
// 나 소개 것을 원문 그대로 복사한 것이라 축 이름과 질문 성격이 완전히
// 같아 그대로 공유한다. 반면 relationshipWants·relationshipRhythm은
// "관계"를 전제로 한 질문이라 일할 때의 나에는 맞지 않는다 — 대신 "일이
// 굴러갈 때 내 역할"을 묻는 workRole, "일하는 속도 패턴"을 묻는
// workPace로 연결하고, 태그도 새로 짓는다(기존 태그와 겹치지 않게).
type TagTopicId = "idealType" | "selfIntro" | "friendship" | "work";
type TagCategory = {
  id: string;
  label: string;
  // 대부분 여러 주제가 같은 축을 공유해 문자열 하나로 충분하다(예:
  // lifestyle). 주제마다 다른 축을 써야 하는 카테고리만 topicId를 키로
  // 하는 부분 맵으로 axisId를 따로 둔다 — 전부 다시 나열할 필요 없이,
  // 다른 주제와 다른 축을 쓰는 주제만 등록하면 된다.
  axisId: string | Partial<Record<TagTopicId, string>>;
  // 축의 최상위 선택지 라벨 -> 태그. TopicQuiz.tsx가 세부 선택지를
  // 골랐어도 그 부모 칩의 라벨로 기록해주므로(session.quizAnswers), 이
  // 매핑은 축(topics.ts)에 실제로 존재하는 최상위 라벨만 키로 갖는다.
  mapping: Record<string, string>;
};

function resolveAxisId(category: TagCategory, topicId: TagTopicId): string | undefined {
  return typeof category.axisId === "string" ? category.axisId : category.axisId[topicId];
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    id: "relationshipWants",
    label: "관계에서 원하는 것",
    // 이상형·나 소개는 "상대에게 원하는 것"을 묻는 relationship 축을
    // 공유하지만, 친구·인간관계에는 "연애 상대"라는 개념이 없어 같은
    // 문항을 쓸 수 없다 — 대신 "모임에서 나는 어떤 역할인지"를 묻는
    // friendRole로 연결한다(위 파일 상단 주석 참고).
    axisId: { idealType: "relationship", selfIntro: "relationship", friendship: "friendRole", work: "workRole" },
    mapping: {
      // 이상형·나 소개 전용(기존 6개, 삭제하지 않음).
      "표현 많이 해주기": "#표현중시형",
      "서로 존중하는 거리감": "#거리존중형",
      "함께 많은 시간": "#함께시간형",
      "티키타카 잘 통하기": "#티키타카중시형",
      "든든한 안정감": "#안정감중시형",
      "빠른 갈등 해결": "#갈등해결형",
      // 친구·인간관계 전용(신규 6개) — 모임에서의 역할에 대한 답.
      "판을 벌이는 사람": "#주도형",
      "분위기를 띄우는 사람": "#분위기메이커형",
      "중간에서 조율하는 사람": "#조율형",
      "조용히 챙기는 사람": "#조용한챙김형",
      "흐름을 따라가는 사람": "#순응형",
      "관찰하는 사람": "#관찰형",
      // 일할 때의 나 전용(신규 6개) — 일이 굴러갈 때 내 역할에 대한 답.
      "판을 짜는 쪽": "#설계형",
      "끝까지 밀어붙이는 쪽": "#추진형",
      "빈틈을 메우는 쪽": "#보완형",
      "사람을 붙이는 쪽": "#연결형",
      "기준을 지키는 쪽": "#기준수호형",
      "흐름에 맞추는 쪽": "#흐름형",
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
    // 이상형은 새 축(idealStressResponse, "상대가 이랬으면 좋겠다")을
    // 쓰고, 나 소개·친구·인간관계는 기존 축(experienceStressResponse,
    // "나는 실제로 이렇게 한다")을 그대로 쓴다 — 위 파일 상단 주석 참고.
    axisId: { idealType: "idealStressResponse", selfIntro: "experienceStressResponse", friendship: "experienceStressResponse", work: "experienceStressResponse" },
    mapping: {
      // 나 소개 전용(기존 4개, 삭제하지 않음) — "나는 실제로 어떻게
      // 하는지"에 대한 답.
      "바로 이야기하는 편": "#직진소통형",
      "혼자 삭이는 편": "#혼자정리형",
      "거리를 두는 편": "#거리두기형",
      "주변에 털어놓는 편": "#나눔형",
      // 이상형 전용(신규 4개) — "상대가 이랬으면 좋겠다"는 답. 기존
      // 4개와 문자열이 절대 겹치지 않게 새로 지었다(TAG_TO_CATEGORY가
      // 태그 문자열을 키로 쓰는 Map이라, 겹치면 나중에 등록되는 쪽만
      // 남고 먼저 등록된 쪽이 조회 불가능해진다).
      "바로 이야기해서 푸는 사람": "#직진소통바람형",
      "혼자 정리하고 넘어가는 사람": "#혼자정리바람형",
      "잠깐 거리를 두는 사람": "#거리두기바람형",
      "주변에 털어놓는 사람": "#나눔바람형",
    },
  },
  {
    id: "relationshipRhythm",
    label: "관계 리듬",
    // 원래 "관계 온도"는 binary1/binary3/binaryHonesty 세 이진 질문을
    // 하나로 묶어서, 어느 걸 표시할지 임의로 골라야 하는 구조였다. 지금은
    // binary1 하나만 쓴다 — 임의 선택 문제가 없어지고, 2지선다라 겹칠
    // 확률도 가장 높다. 친구·인간관계는 binary1(연애 상대 개념 전제)
    // 대신 "혼자 지내는 게 편한지 vs 여럿과 어울리는지"를 묻는
    // friendDistance로 연결한다.
    axisId: { idealType: "binary1", selfIntro: "binary1", friendship: "friendDistance", work: "workPace" },
    mapping: {
      // 이상형·나 소개 전용(기존 2개, 삭제하지 않음).
      "오래 편안한 사람": "#편안함추구형",
      "매일 설레는 사람": "#설렘추구형",
      // 친구·인간관계 전용(신규 4개) — 관계를 맺는 폭에 대한 답.
      "몇 명과 깊게 지내는 사람": "#소수깊음형",
      "두루두루 넓게 지내는 사람": "#폭넓은관계형",
      "상황에 따라 유연한 사람": "#상황유연형",
      "혼자 있는 시간이 더 많은 사람": "#혼자시간형",
      // 일할 때의 나 전용(신규 4개) — 일하는 속도 패턴에 대한 답.
      "미리 끝내두는 사람": "#선행형",
      "몰아서 집중하는 사람": "#몰입형",
      "꾸준히 일정하게 하는 사람": "#꾸준형",
      "컨디션 따라 들쭉날쭉한 사람": "#기복형",
    },
  },
];

function firstLabel(quizAnswers: Record<string, string[]> | undefined, axisId: string): string | undefined {
  return quizAnswers?.[axisId]?.[0];
}

// 카드에 보여줄 태그(항상 4개, 서로 다른 축에서 하나씩, 겹치지 않음).
// session.quizAnswers가 없는(이 기능 이전에 저장된) 세션·결과는 빈
// 배열을 반환한다 — 화면은 이 경우 태그 줄 자체를 생략한다. topicId는
// 퀴즈별로 axisId가 다른 카테고리를 올바른 축으로 풀어내는 데만 쓰인다
// (resolveAxisId) — axisId가 문자열 하나뿐인 카테고리는 topicId와
// 무관하게 항상 같은 축을 본다. resolveAxisId가 undefined를 돌려주는
// 경우(이론상 지금은 없다 — 4개 카테고리 전부 네 주제 모두에 axisId가
// 등록돼 있다)는 그 카테고리만 조용히 건너뛴다, 존재하지 않는 축을
// 조회해서 엉뚱한 답을 태그로 착각하는 사고를 막기 위해서다.
export function getIdealTypeTags(quizAnswers: Record<string, string[]> | undefined, topicId: TagTopicId): string[] {
  if (!quizAnswers) return [];
  const tags: string[] = [];
  for (const category of TAG_CATEGORIES) {
    const axisId = resolveAxisId(category, topicId);
    const label = axisId ? firstLabel(quizAnswers, axisId) : undefined;
    const tag = label ? category.mapping[label] : undefined;
    if (tag) tags.push(tag);
  }
  return tags;
}

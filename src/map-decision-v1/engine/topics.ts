// MAP 종류(주제) 레지스트리.
//
// 지금은 career(진로·커리어, 대화형)와 idealType(이상형, 퀴즈형)만
// 실제로 연결돼 있다. 나머지 8개는 종류 선택 화면(Landing.tsx)에
// "준비 중"으로 노출되지만 implemented: false라 눌러도 대화가 시작되지
// 않는다 — conversationFocus/resultFocus는 아직 비어 있고
// entryQuestion/entryChips도 실제 대화 톤에 맞게 다듬어지기 전이다. 각
// 주제가 완성되면 implemented를 true로 바꾸고 내용을 채운다.

export type TopicCategory = "viral" | "depth"; // 바이럴 / 깊이
export type TopicGrade = "flagship" | "light"; // 완성형 / 경량
export type ResultLayoutId =
  | "career" // 완성형 전용 틀
  | "idealType" // 완성형 전용 틀
  | "selfIntro" // 완성형 전용 틀
  | "viral-common" // 경량 공통 틀(바이럴 계열)
  | "depth-common"; // 경량 공통 틀(깊이 계열)

// chat: 기존 대화형(질문→자유 답변) 입력. quiz: 이상형처럼 축별로 선택지
// 칩 + 짧은 직접입력으로 진행하는 스텝형 입력(components/TopicQuiz.tsx).
export type TopicInputMode = "chat" | "quiz";
// label만으로는 결과 생성 프롬프트가 받는 정보가 너무 적어서, 칩마다
// 한 줄 설명(description)을 같이 들고 다닌다. subOptions가 있으면 기본
// 칩을 탭했을 때 펼쳐지는 세부 선택지 — 같은 축을 더 구체화할 뿐, 기본
// 칩 없이 세부만 고를 수는 없다(TopicQuiz.tsx가 항상 기본 칩과 함께
// 노출한다).
export type TopicChoice = { label: string; description: string };
export type TopicOption = TopicChoice & { subOptions?: TopicChoice[] };
export type TopicAxis = { id: string; question: string; options: TopicOption[] };

export type TopicConfig = {
  id: string;
  name: string;
  icon: string;
  oneLiner: string;
  category: TopicCategory;
  grade: TopicGrade;
  // 향후 개별 틀 설계에 참고할 "고정 틀 vs 대화로 채움" 비율(0~100). 이번
  // 단계에서는 저장만 하고 코드에서 사용하지 않는다.
  fixedRatio: number;
  resultLayoutId: ResultLayoutId;
  inputMode: TopicInputMode;
  // inputMode가 "quiz"일 때만 사용. 스텝별 질문 + 선택지 칩.
  axes?: TopicAxis[];
  // quiz 마지막에 넣는 선택형 자유 서술 질문.
  closingPrompt?: string;
  // 대화 중 노드 추출/되묻기 시스템 프롬프트에 끼워넣는 주제별 지시문.
  // career는 기존 프롬프트에 이미 있던 문장을 그대로 옮긴 것 — 새로 지어낸
  // 내용이 아니다.
  conversationFocus: string;
  // 최종 결과 생성 프롬프트에 끼워넣을 주제별 지시문. 지금 결과 생성
  // 프롬프트에는 주제별로 뽑아낼 기존 문장이 없어서, 이번 단계에서는
  // 비워두고 결과 생성 로직 자체는 건드리지 않았다.
  resultFocus: string;
  // 대화 시작 시 첫 질문/선택지 칩(2단계에서 실제로 쓰일 필드). 지금은
  // 어떤 화면도 이 값을 읽지 않는다.
  entryQuestion: string;
  entryChips: string[];
  implemented: boolean;
};

export const TOPICS: Record<string, TopicConfig> = {
  career: {
    id: "career",
    name: "진로·커리어",
    icon: "🧭",
    oneLiner: "다음 방향을 정할 때 필요한 정보를 함께 정리해요.",
    category: "depth",
    grade: "flagship",
    fixedRatio: 45,
    resultLayoutId: "career",
    inputMode: "chat",
    conversationFocus:
      "예를 들어 커리어 상담이면 지향하는 직무, 제약 조건, 실패 경험, 우선순위 갈등처럼 핵심적인 내용을 우선하고",
    resultFocus: "",
    entryQuestion: "요즘 진로에서 가장 걸리는 게 뭐예요?",
    entryChips: ["방향을 못 정하겠어요", "이직을 고민 중이에요", "지금 일이 안 맞는 것 같아요"],
    implemented: true,
  },
  idealType: {
    id: "idealType",
    name: "이상형",
    icon: "💘",
    oneLiner: "끌리는 사람의 기준을 한 장으로 정리해요.",
    category: "viral",
    grade: "flagship",
    fixedRatio: 75,
    resultLayoutId: "idealType",
    inputMode: "quiz",
    axes: [
      {
        id: "appearance",
        question: "끌리는 분위기는?",
        options: [
          {
            label: "청량·상큼",
            description: "보기만 해도 기분 좋아지는 산뜻한 느낌",
            subOptions: [
              { label: "맑은 피부톤", description: "화장 안 해도 화사해 보이는" },
              { label: "산뜻한 스타일링", description: "캐주얼해도 깔끔한 룩" },
              { label: "눈웃음이 예쁜", description: "웃을 때 분위기가 확 밝아지는" },
              { label: "자연스러운 헤어", description: "꾸안꾸 느낌 나는 머리" },
            ],
          },
          {
            label: "시크·도시적",
            description: "어딘가 세련되고 도도한 느낌",
            subOptions: [
              { label: "무채색 스타일", description: "블랙·그레이 톤이 잘 어울리는" },
              { label: "표정이 담백한", description: "리액션이 크지 않아 멋있어 보이는" },
              { label: "정제된 말투", description: "군더더기 없이 깔끔하게 말하는" },
              { label: "도시 야경 느낌", description: "밤에 더 매력적인 분위기" },
            ],
          },
          {
            label: "부드럽고 포근",
            description: "옆에 있으면 마음이 편안해지는",
            subOptions: [
              { label: "둥근 인상", description: "선이 부드러워 편안해 보이는" },
              { label: "따뜻한 목소리", description: "톤 자체가 안정감 주는" },
              { label: "자연스러운 미소", description: "늘 온화한 표정을 짓는" },
              { label: "포근한 스타일", description: "니트처럼 부드러운 옷차림" },
            ],
          },
          {
            label: "개성있는·유니크",
            description: "어디서도 본 적 없는 나만의 느낌",
            subOptions: [
              { label: "과감한 스타일링", description: "남들과 다른 옷을 소화하는" },
              { label: "독특한 취향이 드러나는", description: "소품·액세서리로 티가 나는" },
              { label: "예측 안 되는 매력", description: "뻔하지 않은 분위기" },
              { label: "자기만의 색이 뚜렷한", description: "유행 안 따라가도 멋있는" },
            ],
          },
          {
            label: "단정한·클래식",
            description: "볼수록 믿음이 가는 반듯한 느낌",
            subOptions: [
              { label: "깔끔한 옷매무새", description: "늘 정돈된 느낌을 주는" },
              { label: "바른 자세", description: "서 있는 것만으로도 단정한" },
              { label: "차분한 색감", description: "튀지 않는 색을 즐겨 입는" },
              { label: "신뢰가 가는 인상", description: "첫인상부터 성실해 보이는" },
            ],
          },
          {
            label: "건강하고 탄탄한",
            description: "자기관리가 느껴지는 활기찬 느낌",
            subOptions: [
              { label: "꾸준히 운동하는", description: "체형 관리가 습관인" },
              { label: "밝은 혈색", description: "생기있어 보이는 얼굴" },
              { label: "야외 활동이 잘 어울리는", description: "햇살 아래서도 멋진" },
              { label: "활기찬 걸음걸이", description: "걷는 것만 봐도 에너지 있는" },
            ],
          },
        ],
      },
      {
        id: "personality",
        question: "어떤 성격에 끌려?",
        options: [
          {
            label: "다정다감",
            description: "챙겨주는 말 한마디를 잘 건네는 사람",
            subOptions: [
              { label: "먼저 안부를 묻는", description: "사소한 것도 먼저 물어봐주는" },
              { label: "스킨십에 다정한", description: "손 잡고 걷는 걸 좋아하는" },
              { label: "기념일을 잘 챙기는", description: "작은 날도 그냥 안 넘어가는" },
              { label: "말투가 다정한", description: "평소 말투 자체가 부드러운" },
            ],
          },
          {
            label: "유쾌·활발",
            description: "처음 봐도 말이 잘 통하고 분위기를 띄우는 사람",
            subOptions: [
              { label: "리액션이 좋은", description: "대화가 재밌어지는 리액션 부자" },
              { label: "텐션이 높은 편인", description: "같이 있으면 기분이 업되는" },
              { label: "유머 감각이 뛰어난", description: "웃음 포인트를 잘 아는" },
              { label: "먼저 다가가는", description: "낯가림 없이 분위기 메이커인" },
            ],
          },
          {
            label: "차분·침착",
            description: "흔들림 없이 안정적인 텐션을 가진 사람",
            subOptions: [
              { label: "목소리 톤이 일정한", description: "화나도 언성이 안 높아지는" },
              { label: "서두르지 않는", description: "급한 상황에서도 침착한" },
              { label: "말수가 적당한", description: "필요한 말만 조용히 하는" },
              { label: "생각하고 말하는", description: "즉흥적으로 말 안 하는" },
            ],
          },
          {
            label: "리더십 있는",
            description: "결정을 내리고 이끌어가는 걸 편해하는 사람",
            subOptions: [
              { label: "계획을 잘 짜는", description: "데이트 코스도 알아서 짜오는" },
              { label: "결단력 있는", description: "고민될 때 방향을 잡아주는" },
              { label: "책임감 있게 나서는", description: "문제 생기면 먼저 해결하는" },
              { label: "주도적으로 이끄는", description: "관계에서 리드하길 좋아하는" },
            ],
          },
          {
            label: "무뚝뚝해도 속 깊은",
            description: "표현은 적어도 마음은 깊은 사람",
            subOptions: [
              { label: "행동으로 챙기는", description: "말보다 행동으로 표현하는" },
              { label: "뒤에서 살펴봐주는", description: "티 안 나게 신경 써주는" },
              { label: "은근한 다정함", description: "무심한 듯 챙기는 스타일" },
              { label: "진심이 늦게 드러나는", description: "알고 보면 세심한" },
            ],
          },
          {
            label: "4차원·엉뚱",
            description: "생각의 결이 남다르고 재밌는 사람",
            subOptions: [
              { label: "대화 소재가 독특한", description: "예상 못한 이야기를 꺼내는" },
              { label: "상상력이 풍부한", description: "엉뚱한 상상을 잘하는" },
              { label: "반응이 예측 안 되는", description: "늘 새로운 리액션을 주는" },
              { label: "자기만의 세계가 있는", description: "취향과 관심사가 독특한" },
            ],
          },
        ],
      },
      {
        id: "values",
        question: "상대에게 중요한 건?",
        options: [
          {
            label: "성실·책임감",
            description: "맡은 일은 끝까지 해내는 사람",
            subOptions: [
              { label: "약속을 잘 지키는", description: "사소한 약속도 허투루 안 하는" },
              { label: "꾸준함이 있는", description: "한번 시작하면 끝을 보는" },
              { label: "자기 할 일을 잘 챙기는", description: "알아서 관리가 되는" },
              { label: "말과 행동이 일치하는", description: "말한 대로 지키는" },
            ],
          },
          {
            label: "유머·긍정",
            description: "힘든 상황도 가볍게 넘기는 사람",
            subOptions: [
              { label: "긍정적으로 해석하는", description: "안 좋은 일도 좋게 넘기는" },
              { label: "유머로 풀어내는", description: "갈등도 웃음으로 푸는" },
              { label: "걱정을 오래 안 하는", description: "빨리 털고 일어나는" },
              { label: "밝은 에너지를 주는", description: "옆에 있으면 기분이 좋아지는" },
            ],
          },
          {
            label: "야망·성장",
            description: "계속 나아지려고 노력하는 사람",
            subOptions: [
              { label: "목표가 뚜렷한", description: "하고 싶은 게 분명한" },
              { label: "자기계발에 진심인", description: "배우는 걸 즐기는" },
              { label: "도전을 두려워 않는", description: "새로운 일에 뛰어드는" },
              { label: "발전하는 모습을 보이는", description: "만날 때마다 성장이 느껴지는" },
            ],
          },
          {
            label: "안정·가정적",
            description: "편안하고 오래가는 관계를 중요하게 여기는 사람",
            subOptions: [
              { label: "미래를 함께 그리는", description: "장기적인 계획을 같이 세우는" },
              { label: "가족을 소중히 하는", description: "가족과의 시간을 우선하는" },
              { label: "생활 패턴이 안정적인", description: "루틴이 일정한" },
              { label: "정서적으로 안정된", description: "감정 기복이 크지 않은" },
            ],
          },
          {
            label: "자유·독립",
            description: "각자의 삶을 존중하는 걸 중요하게 여기는 사람",
            subOptions: [
              { label: "자기 시간을 존중받길 원하는", description: "혼자만의 시간이 필요한" },
              { label: "경제적으로 독립적인", description: "스스로 알아서 하는" },
              { label: "구속을 싫어하는", description: "서로 얽매이지 않길 바라는" },
              { label: "자기 결정을 존중받길 원하는", description: "간섭받는 걸 안 좋아하는" },
            ],
          },
          {
            label: "배려·존중",
            description: "상대 입장을 먼저 생각하는 사람",
            subOptions: [
              { label: "경청을 잘하는", description: "이야기를 끝까지 들어주는" },
              { label: "감정을 세심하게 살피는", description: "기분 변화를 잘 알아채는" },
              { label: "예의를 지키는", description: "편해져도 선을 안 넘는" },
              { label: "다름을 인정하는", description: "생각이 달라도 존중해주는" },
            ],
          },
        ],
      },
      {
        id: "relationship",
        question: "연애할 때 원하는 건?",
        options: [
          {
            label: "표현 많이 해주기",
            description: "마음을 말과 행동으로 자주 드러내는 것",
            subOptions: [
              { label: "애정표현이 잦은", description: "\"좋아해\" 같은 말을 자주 하는" },
              { label: "스킨십을 편하게 하는", description: "자연스러운 스킨십을 즐기는" },
              { label: "칭찬을 아끼지 않는", description: "작은 것도 예쁘게 봐주는" },
              { label: "감정을 솔직히 말하는", description: "서운함도 숨기지 않고 말하는" },
            ],
          },
          {
            label: "서로 존중하는 거리감",
            description: "각자의 공간을 지켜주는 것",
            subOptions: [
              { label: "연락을 강요하지 않는", description: "답장이 늦어도 이해해주는" },
              { label: "각자 시간을 인정하는", description: "따로 보내는 시간도 존중하는" },
              { label: "사생활을 존중하는", description: "지나치게 궁금해하지 않는" },
              { label: "적당한 거리를 유지하는", description: "붙어있지 않아도 편안한" },
            ],
          },
          {
            label: "함께 많은 시간",
            description: "붙어있는 시간 자체를 소중히 여기는 것",
            subOptions: [
              { label: "데이트를 자주 하고 싶은", description: "자주 만나는 걸 좋아하는" },
              { label: "일상을 공유하고 싶은", description: "소소한 하루를 나누고 싶은" },
              { label: "같이 하는 활동이 많은", description: "취미를 함께 즐기는" },
              { label: "연락을 자주 하는", description: "하루 중 자주 연락하는" },
            ],
          },
          {
            label: "티키타카 잘 통하기",
            description: "대화가 막힘없이 이어지는 것",
            subOptions: [
              { label: "농담 코드가 맞는", description: "웃음 포인트가 비슷한" },
              { label: "대화 주제가 끊이지 않는", description: "할 얘기가 계속 있는" },
              { label: "눈치가 잘 통하는", description: "말 안 해도 알아채는" },
              { label: "관심사가 비슷한", description: "좋아하는 게 겹치는" },
            ],
          },
          {
            label: "든든한 안정감",
            description: "흔들림 없이 믿고 기댈 수 있는 것",
            subOptions: [
              { label: "감정 기복이 적은", description: "변덕 없이 한결같은" },
              { label: "힘들 때 의지가 되는", description: "어려운 순간에 곁을 지키는" },
              { label: "약속을 지키는", description: "말한 건 꼭 지키는" },
              { label: "한결같은 마음을 주는", description: "시간이 지나도 변치 않는" },
            ],
          },
          {
            label: "빠른 갈등 해결",
            description: "다퉈도 오래 끌지 않는 것",
            subOptions: [
              { label: "대화로 풀어가는", description: "싸워도 대화로 해결하려는" },
              { label: "먼저 사과할 줄 아는", description: "자존심보다 관계를 우선하는" },
              { label: "감정을 오래 담아두지 않는", description: "화가 나도 금방 푸는" },
              { label: "문제를 회피하지 않는", description: "불편한 얘기도 피하지 않는" },
            ],
          },
        ],
      },
      {
        id: "lifestyle",
        question: "잘 맞는 생활은?",
        options: [
          {
            label: "집순이·집돌이",
            description: "집에서 보내는 시간이 제일 편한 사람",
            subOptions: [
              { label: "넷플릭스 같이 보는", description: "집에서 영화·드라마 보는 걸 좋아하는" },
              { label: "요리해먹는 걸 좋아하는", description: "같이 해먹는 데이트를 즐기는" },
              { label: "집에서 노는 게 편한", description: "굳이 나가지 않아도 되는" },
              { label: "아늑한 분위기를 좋아하는", description: "조용한 저녁을 선호하는" },
            ],
          },
          {
            label: "액티브·야외파",
            description: "밖에서 몸을 움직이는 걸 좋아하는 사람",
            subOptions: [
              { label: "운동을 같이 하는", description: "함께 땀 흘리는 걸 즐기는" },
              { label: "야외 데이트를 즐기는", description: "산책·나들이를 좋아하는" },
              { label: "새로운 곳 탐방을 좋아하는", description: "안 가본 곳에 가보는 걸 즐기는" },
              { label: "액티비티를 즐기는", description: "체험형 데이트를 좋아하는" },
            ],
          },
          {
            label: "취미 공유",
            description: "좋아하는 걸 함께 즐기는 사람",
            subOptions: [
              { label: "같은 취미가 있는", description: "겹치는 관심사가 있는" },
              { label: "새로운 취미에 열려있는", description: "같이 배워보는 걸 좋아하는" },
              { label: "덕질을 이해해주는", description: "좋아하는 걸 존중해주는" },
              { label: "취향을 공유하고 싶은", description: "좋아하는 걸 나누고 싶어하는" },
            ],
          },
          {
            label: "각자 시간 존중",
            description: "따로 보내는 시간도 자연스러운 사람",
            subOptions: [
              { label: "각자 취미 시간을 존중하는", description: "혼자 하는 활동도 응원하는" },
              { label: "친구 만남을 존중하는", description: "각자 인간관계를 지켜주는" },
              { label: "혼자 있는 시간을 이해하는", description: "붙어있지 않아도 편안한" },
              { label: "서로의 루틴을 지켜주는", description: "생활 패턴을 침해하지 않는" },
            ],
          },
          {
            label: "여행 좋아하는",
            description: "떠나는 것 자체를 즐기는 사람",
            subOptions: [
              { label: "즉흥 여행을 좋아하는", description: "계획 없이 떠나는 것도 즐기는" },
              { label: "계획 짜는 걸 좋아하는", description: "여행 코스 짜는 걸 즐기는" },
              { label: "새로운 나라에 관심 많은", description: "해외여행을 좋아하는" },
              { label: "국내 여행도 즐기는", description: "가까운 곳도 자주 다니는" },
            ],
          },
          {
            label: "규칙적인 생활",
            description: "일상의 리듬이 안정적인 사람",
            subOptions: [
              { label: "일찍 자고 일찍 일어나는", description: "생활 패턴이 건강한" },
              { label: "자기관리가 습관인", description: "운동·식단을 꾸준히 챙기는" },
              { label: "계획적으로 하루를 보내는", description: "즉흥보다 계획을 선호하는" },
              { label: "일과 삶의 균형을 지키는", description: "워라밸을 중요하게 여기는" },
            ],
          },
        ],
      },
    ],
    closingPrompt: "이상형에 대해 더 하고 싶은 말이 있나요?",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "어떤 사람에게 끌리세요?",
    entryChips: ["성격이 잘 맞는 사람", "편안한 관계", "아직 잘 모르겠어요"],
    implemented: true,
  },
  selfIntro: {
    id: "selfIntro",
    name: "나 소개·성격",
    icon: "🪞",
    oneLiner: "나라는 사람을 한 장으로 소개해요.",
    category: "viral",
    grade: "flagship",
    fixedRatio: 75,
    resultLayoutId: "selfIntro",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "요즘 나를 한마디로 표현하면 뭐예요?",
    entryChips: ["에너지가 넘쳐요", "차분한 편이에요", "잘 모르겠어요"],
    implemented: false,
  },
  loveStyle: {
    id: "loveStyle",
    name: "연애 스타일",
    icon: "💌",
    oneLiner: "내가 연애에서 반복하는 패턴을 정리해요.",
    category: "viral",
    grade: "light",
    fixedRatio: 70,
    resultLayoutId: "viral-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "연애할 때 나는 어떤 편이에요?",
    entryChips: ["표현을 많이 해요", "감정을 아끼는 편이에요", "잘 모르겠어요"],
    implemented: false,
  },
  compatibility: {
    id: "compatibility",
    name: "궁합",
    icon: "🔮",
    oneLiner: "두 사람의 결이 어떻게 맞는지 정리해요.",
    category: "viral",
    grade: "light",
    fixedRatio: 75,
    resultLayoutId: "viral-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "누구와의 궁합이 궁금해요?",
    entryChips: ["연인", "짝사랑 상대", "친구"],
    implemented: false,
  },
  taste: {
    id: "taste",
    name: "취향",
    icon: "🎨",
    oneLiner: "내 취향의 결을 한 장으로 정리해요.",
    category: "viral",
    grade: "light",
    fixedRatio: 70,
    resultLayoutId: "viral-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "요즘 제일 끌리는 게 뭐예요?",
    entryChips: ["분위기 있는 것", "실용적인 것", "잘 모르겠어요"],
    implemented: false,
  },
  travelStyle: {
    id: "travelStyle",
    name: "여행 스타일",
    icon: "✈️",
    oneLiner: "나에게 맞는 여행 방식을 정리해요.",
    category: "viral",
    grade: "light",
    fixedRatio: 70,
    resultLayoutId: "viral-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "여행 갈 때 뭘 제일 중요하게 봐요?",
    entryChips: ["새로운 경험", "여유로운 휴식", "잘 모르겠어요"],
    implemented: false,
  },
  jobChange: {
    id: "jobChange",
    name: "이직",
    icon: "🚪",
    oneLiner: "지금 이직이 맞는 선택인지 정리해요.",
    category: "depth",
    grade: "light",
    fixedRatio: 45,
    resultLayoutId: "depth-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "이직을 고민하는 가장 큰 이유가 뭐예요?",
    entryChips: ["성장이 정체된 느낌", "사람·조직 문제", "돈 조건"],
    implemented: false,
  },
  bigDecision: {
    id: "bigDecision",
    name: "큰 결정·소비/재무",
    icon: "💰",
    oneLiner: "돈이 걸린 큰 결정을 정리해요.",
    category: "depth",
    grade: "light",
    fixedRatio: 45,
    resultLayoutId: "depth-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "지금 고민 중인 결정이 뭐예요?",
    entryChips: ["큰 지출", "저축·투자", "잘 모르겠어요"],
    implemented: false,
  },
  freeform: {
    id: "freeform",
    name: "자유 고민",
    icon: "💬",
    oneLiner: "어디에도 안 맞으면 편하게 이야기해도 괜찮아요.",
    category: "depth",
    grade: "light",
    fixedRatio: 40,
    resultLayoutId: "depth-common",
    inputMode: "chat",
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "오늘은 어떤 생각을 같이 정리해볼까요?",
    entryChips: [],
    implemented: false,
  },
};

export const DEFAULT_TOPIC_ID = "career";

// 아직 화면에서 topicId를 지정하는 곳이 없으므로(2단계에서 생김), 없는
// 경우와 알 수 없는 값 모두 career로 떨어진다 — 이게 바로 "구조만 바뀌고
// 동작은 그대로"를 보장하는 지점이다.
export function resolveTopic(topicId?: string): TopicConfig {
  return TOPICS[topicId ?? DEFAULT_TOPIC_ID] ?? TOPICS[DEFAULT_TOPIC_ID];
}

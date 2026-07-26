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
// preference: 지금까지의 칩 선택형(복수 선택, 최대 3개). binary: 둘 중
// 하나만 강제로 고르는 양자택일형 — 우선순위를 가려내는 게 목적이라
// TopicQuiz.tsx의 BinaryStep이 단일 선택만 허용한다. experience: 과거에
// 실제로 어땠는지를 묻는 경험·행동형 — 선호가 아니라 패턴을 물어서
// 자기성찰 블록의 재료가 된다. UI 형태는 preference와 같다(복수 선택
// 허용).
export type TopicQuestionType = "preference" | "binary" | "experience";
// required=false인 문항은 "심화" 구간으로, 필수 문항을 다 답한 뒤에만
// 볼지 말지 선택할 수 있다(TopicQuiz.tsx의 결정 화면 참고).
export type TopicAxis = { id: string; type: TopicQuestionType; question: string; options: TopicOption[]; required: boolean };

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
        type: "preference",
        required: true,
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
        type: "preference",
        required: true,
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
        id: "binary1",
        type: "binary",
        required: true,
        question: "오래 편안한 사람 vs 매일 설레는 사람, 하나만 고른다면?",
        options: [
          { label: "오래 편안한 사람", description: "시간이 지나도 무너지지 않는 편안함이 있는 사람" },
          { label: "매일 설레는 사람", description: "만날 때마다 두근거림을 주는 사람" },
        ],
      },
      {
        id: "values",
        type: "preference",
        required: true,
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
        type: "preference",
        required: true,
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
        id: "binaryHonesty",
        type: "binary",
        required: true,
        question: "듣기 아파도 솔직하게 말해주는 사람 vs 듣기 편하게 배려해서 말해주는 사람, 더 원하는 쪽은?",
        options: [
          { label: "솔직하게 말해주는 사람", description: "불편해도 진짜 생각을 알려주는 사람" },
          { label: "배려해서 말해주는 사람", description: "마음 다치지 않게 표현을 골라주는 사람" },
        ],
      },
      {
        id: "lifestyle",
        type: "preference",
        required: true,
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
      {
        id: "communication",
        type: "preference",
        required: false,
        question: "연락할 때 어떤 모습이 좋아?",
        options: [
          {
            label: "자주 연락하는",
            description: "하루 중 틈틈이 연락을 주고받는 걸 좋아하는",
            subOptions: [
              { label: "답장이 빠른", description: "연락을 오래 기다리게 안 하는" },
              { label: "먼저 연락하는", description: "안부를 먼저 물어봐주는" },
              { label: "통화를 좋아하는", description: "목소리로 얘기하는 걸 즐기는" },
              { label: "일상을 공유하는", description: "소소한 순간도 나누고 싶어하는" },
            ],
          },
          {
            label: "필요할 때 연락하는",
            description: "연락 빈도보다 내용을 더 중요하게 여기는",
            subOptions: [
              { label: "용건 위주로 연락하는", description: "짧고 명확하게 소통하는" },
              { label: "급할 때만 연락하는", description: "평소엔 각자 리듬대로 지내는" },
              { label: "만나서 얘기하길 좋아하는", description: "연락보다 직접 보는 걸 선호하는" },
              { label: "답장을 서두르지 않는", description: "늦어도 이해해주는" },
            ],
          },
          {
            label: "텍스트로 표현 잘하는",
            description: "메시지로 마음을 잘 전달하는",
            subOptions: [
              { label: "장문 메시지를 보내는", description: "생각을 길게 적어 보내는" },
              { label: "이모티콘을 잘 쓰는", description: "메시지에 감정을 담아 보내는" },
              { label: "사진을 자주 공유하는", description: "일상 사진을 보내주는" },
              { label: "문자로 다정한 표현을 하는", description: "글로 애정을 잘 표현하는" },
            ],
          },
          {
            label: "통화를 편하게 여기는",
            description: "목소리로 대화하는 걸 자연스러워하는",
            subOptions: [
              { label: "자기 전 통화를 좋아하는", description: "하루를 마무리하며 통화하는" },
              { label: "오래 통화해도 편한", description: "통화가 길어져도 어색하지 않은" },
              { label: "영상통화를 좋아하는", description: "얼굴 보며 얘기하는 걸 즐기는" },
              { label: "목소리 톤이 편안한", description: "통화할 때 안정감을 주는" },
            ],
          },
          {
            label: "만나서 얘기하는 걸 선호하는",
            description: "연락보다 직접 만나는 걸 우선하는",
            subOptions: [
              { label: "자주 만나고 싶어하는", description: "얼굴 보는 걸 더 중요하게 여기는" },
              { label: "계획을 미리 잡는", description: "만날 약속을 여유 있게 정하는" },
              { label: "즉흥 만남도 좋아하는", description: "갑자기 보자고 해도 반가운" },
              { label: "함께 있는 시간에 집중하는", description: "만났을 때 연락보다 대화에 집중하는" },
            ],
          },
          {
            label: "연락에 유연한",
            description: "상황에 따라 자연스럽게 맞춰주는",
            subOptions: [
              { label: "바쁠 땐 이해해주는", description: "답장이 늦어도 서운해하지 않는" },
              { label: "각자 리듬을 존중하는", description: "연락 패턴을 강요하지 않는" },
              { label: "필요하면 바로 맞춰주는", description: "중요한 순간엔 빠르게 응답하는" },
              { label: "연락보다 진심을 중요하게 여기는", description: "빈도보다 마음을 우선하는" },
            ],
          },
        ],
      },
      {
        id: "binary3",
        type: "binary",
        required: true,
        question: "내가 리드하는 관계 vs 상대가 리드하는 관계, 더 편한 쪽은?",
        options: [
          { label: "내가 리드하는 관계", description: "내가 방향을 정하고 이끄는 게 편한 관계" },
          { label: "상대가 리드하는 관계", description: "상대가 먼저 이끌어줄 때 편안한 관계" },
        ],
      },
      {
        id: "sparkMoment",
        type: "preference",
        required: true,
        question: "어떤 순간에 확 끌려?",
        options: [
          {
            label: "웃을 때 반짝이는",
            description: "웃는 모습이 유독 매력적인 순간",
            subOptions: [
              { label: "눈이 사라지게 웃는", description: "활짝 웃는 표정이 매력적인" },
              { label: "갑자기 웃음이 터지는", description: "웃음 포인트가 독특한" },
              { label: "장난스럽게 웃는", description: "짓궂은 웃음이 매력적인" },
              { label: "편하게 웃어주는", description: "내 앞에서 편안하게 웃는" },
            ],
          },
          {
            label: "몰입해서 뭔가 할 때",
            description: "자기 일에 집중한 모습이 멋있어 보이는",
            subOptions: [
              { label: "일에 진지한", description: "몰입한 표정이 매력적인" },
              { label: "취미에 열정적인", description: "좋아하는 걸 할 때 눈빛이 달라지는" },
              { label: "설명을 잘하는", description: "뭔가에 대해 신나게 설명하는" },
              { label: "배우는 걸 즐기는", description: "새로운 걸 익힐 때 열심인" },
            ],
          },
          {
            label: "배려하는 모습을 볼 때",
            description: "다른 사람 챙기는 모습에 끌리는",
            subOptions: [
              { label: "약자를 배려하는", description: "어려운 사람을 지나치지 않는" },
              { label: "뒤에서 챙겨주는", description: "티 안 나게 배려하는" },
              { label: "매너가 몸에 밴", description: "자연스러운 배려가 습관인" },
              { label: "내 편이 되어주는", description: "결정적일 때 내 편을 들어주는" },
            ],
          },
          {
            label: "자신감 있게 말할 때",
            description: "확신에 찬 태도가 매력적인",
            subOptions: [
              { label: "의견을 분명히 말하는", description: "자기 생각이 뚜렷한" },
              { label: "당당한 걸음걸이", description: "자세와 태도에서 자신감이 느껴지는" },
              { label: "실수해도 당당한", description: "실수를 쿨하게 넘기는" },
              { label: "눈을 마주치며 말하는", description: "시선 처리가 자연스러운" },
            ],
          },
          {
            label: "의외의 모습을 보일 때",
            description: "반전 매력이 있는 순간",
            subOptions: [
              { label: "츤데레 같은", description: "무심한 듯 챙겨주는 반전이 있는" },
              { label: "예상 밖 취미가 있는", description: "의외의 분야에 진심인" },
              { label: "평소와 다른 진지함", description: "가볍다가도 진지해지는 순간이 있는" },
              { label: "숨겨진 재능이 있는", description: "몰랐던 능력이 툭 튀어나오는" },
            ],
          },
          {
            label: "나를 편하게 해줄 때",
            description: "같이 있으면 긴장이 풀리는 순간",
            subOptions: [
              { label: "침묵도 어색하지 않은", description: "말 없어도 편안한" },
              { label: "있는 그대로 봐주는", description: "꾸미지 않아도 편한 사람으로 대해주는" },
              { label: "먼저 편하게 대해주는", description: "어색함을 빨리 풀어주는" },
              { label: "내 얘기를 편하게 들어주는", description: "뭘 말해도 받아주는" },
            ],
          },
        ],
      },
      {
        id: "pacing",
        type: "preference",
        required: false,
        question: "썸 탈 때, 어떤 속도가 좋아?",
        options: [
          {
            label: "천천히 알아가는",
            description: "서두르지 않고 서로를 알아가는 속도",
            subOptions: [
              { label: "단계를 밟아가는", description: "순서대로 가까워지는 걸 좋아하는" },
              { label: "신중하게 확인하는", description: "확신이 들 때까지 지켜보는" },
              { label: "친구처럼 시작하는", description: "편한 사이부터 만들어가는" },
              { label: "시간을 두고 확신을 쌓는", description: "서두르지 않아도 괜찮은" },
            ],
          },
          {
            label: "빠르게 가까워지는",
            description: "마음이 확인되면 빠르게 진전되는 속도",
            subOptions: [
              { label: "직진하는", description: "마음을 숨기지 않고 바로 표현하는" },
              { label: "빠른 스킨십에 편한", description: "가까워지면 스킨십도 자연스러운" },
              { label: "확신이 서면 바로 고백하는", description: "재지 않고 마음을 전하는" },
              { label: "초반부터 자주 만나는", description: "만남 빈도를 빠르게 늘리는" },
            ],
          },
          {
            label: "자연스럽게 흘러가는",
            description: "억지로 정의하지 않고 흘러가는 대로 두는",
            subOptions: [
              { label: "관계에 이름 붙이는 걸 서두르지 않는", description: "자연스레 정해지길 기다리는" },
              { label: "상황에 맡기는", description: "흐름을 억지로 만들지 않는" },
              { label: "편한 대로 만나는", description: "형식에 얽매이지 않는" },
              { label: "마음 가는 대로 하는", description: "계산하지 않고 편하게 다가가는" },
            ],
          },
          {
            label: "확실한 신호부터 확인하는",
            description: "마음을 확인하고 나서 움직이는",
            subOptions: [
              { label: "티키타카부터 확인하는", description: "대화 궁합을 먼저 보는" },
              { label: "상대 마음을 먼저 확인하는", description: "짝사랑으로 끝나지 않게 신중한" },
              { label: "표현을 명확히 하는", description: "애매한 신호를 안 좋아하는" },
              { label: "관계를 분명히 하고 싶어하는", description: "썸 기간이 길어지는 걸 안 좋아하는" },
            ],
          },
          {
            label: "밀당을 즐기는",
            description: "적당한 긴장감이 있는 초반을 좋아하는",
            subOptions: [
              { label: "적당한 거리를 두는", description: "너무 티 안 내는 것도 매력이라 생각하는" },
              { label: "은근한 표현을 좋아하는", description: "직접적이지 않은 신호를 즐기는" },
              { label: "궁금증을 유발하는", description: "다 보여주지 않는 매력을 아는" },
              { label: "페이스 조절을 잘하는", description: "밀고 당기는 타이밍을 아는" },
            ],
          },
          {
            label: "편한 페이스를 맞춰가는",
            description: "서로 속도를 맞추는 걸 중요하게 여기는",
            subOptions: [
              { label: "대화로 속도를 맞추는", description: "서로 원하는 속도를 확인하는" },
              { label: "상대 페이스를 존중하는", description: "밀어붙이지 않는" },
              { label: "부담 주지 않는", description: "상대가 편한 만큼만 다가가는" },
              { label: "같이 맞춰나가는 재미를 아는", description: "속도 맞추는 과정 자체를 즐기는" },
            ],
          },
        ],
      },
      {
        id: "binary4",
        type: "binary",
        required: false,
        question: "표현이 많은 사람 vs 무게감 있는 사람, 더 끌리는 쪽은?",
        options: [
          { label: "표현이 많은 사람", description: "마음을 자주, 확실하게 드러내는 사람" },
          { label: "무게감 있는 사람", description: "말수는 적어도 진중함이 느껴지는 사람" },
        ],
      },
      {
        id: "binaryWarmth",
        type: "binary",
        required: false,
        question: "내 사람에게만 잘하는 사람 vs 누구에게나 두루 잘하는 사람, 더 끌리는 쪽은?",
        options: [
          { label: "내 사람에게만 잘하는 사람", description: "가까운 사람에게 유독 다정한, 낯가림 있는 다정함" },
          { label: "누구에게나 두루 잘하는 사람", description: "누구에게나 배려가 몸에 밴 사람" },
        ],
      },
      {
        id: "experienceEnding",
        type: "experience",
        required: true,
        question: "가까웠던 관계가 멀어질 때, 보통 어느 쪽이었어?",
        options: [
          {
            label: "내가 먼저 지쳤다",
            description: "마음이 먼저 식어서 정리한 경우가 많았다",
            subOptions: [
              { label: "반복되는 갈등에 지쳤다", description: "같은 문제가 계속 반복돼서" },
              { label: "소중함을 못 느꼈다", description: "노력이 안 느껴져서" },
              { label: "다른 관계에 더 마음이 쏠렸다", description: "마음이 자연스레 옮겨가서" },
              { label: "그냥 마음이 식었다", description: "특별한 이유 없이 감정이 사라져서" },
            ],
          },
          {
            label: "상대가 멀어졌다",
            description: "상대의 마음이 먼저 식어가는 걸 느낀 경우가 많았다",
            subOptions: [
              { label: "연락이 줄어들었다", description: "점점 무심해지는 게 느껴졌다" },
              { label: "이유를 잘 몰랐다", description: "갑자기 멀어져서 당황스러웠다" },
              { label: "다른 관계가 우선이 된 것 같았다", description: "마음이 다른 데로 간 것 같았다" },
              { label: "표현이 줄어들었다", description: "다정함이 점점 사라졌다" },
            ],
          },
          {
            label: "서서히 흐지부지됐다",
            description: "누가 먼저랄 것도 없이 자연스럽게 멀어졌다",
            subOptions: [
              { label: "연락 빈도가 줄면서", description: "자연스럽게 뜸해지다가" },
              { label: "서로 바빠지면서", description: "각자 생활에 집중하다가" },
              { label: "특별한 계기 없이", description: "정확한 이유는 잘 모르겠다" },
              { label: "다시 가까워지지 못했다", description: "한번 멀어진 뒤 회복이 안 됐다" },
            ],
          },
          {
            label: "대화로 잘 정리했다",
            description: "서로 이야기하고 납득하며 끝난 경우가 많았다",
            subOptions: [
              { label: "서로 다름을 인정했다", description: "안 맞는 부분을 확인하고 정리했다" },
              { label: "가는 방향이 달랐다", description: "각자 원하는 방향이 달라서" },
              { label: "감정적으로 잘 마무리했다", description: "좋게 정리한 편이다" },
              { label: "관계가 완전히 끊기진 않았다", description: "연락 정도는 유지했다" },
            ],
          },
        ],
      },
      {
        id: "experienceEarlyStyle",
        type: "experience",
        required: false,
        question: "연애 초반, 나는 보통 어떤 모습이었어?",
        options: [
          {
            label: "마음을 빨리 표현하는 편",
            description: "좋아하면 티가 금방 나는 편이었다",
            subOptions: [
              { label: "고백을 먼저 하는 편", description: "마음을 확인하면 바로 표현했다" },
              { label: "적극적으로 다가간 편", description: "연락도 만남도 먼저 시도한 편이다" },
              { label: "스킨십도 빨리 편해진 편", description: "가까워지는 속도가 빠른 편이다" },
              { label: "티가 잘 나는 편", description: "숨기지 못하고 표현이 드러난 편이다" },
            ],
          },
          {
            label: "마음을 천천히 확인하는 편",
            description: "신중하게 감정을 확인해온 편이었다",
            subOptions: [
              { label: "관찰을 먼저 하는 편", description: "상대를 충분히 지켜본 뒤 다가갔다" },
              { label: "확신이 서야 움직이는 편", description: "애매하면 먼저 나서지 않았다" },
              { label: "친구 기간이 긴 편", description: "편해지고 나서야 마음을 열었다" },
              { label: "표현을 아끼는 편", description: "마음을 바로 드러내지 않는 편이다" },
            ],
          },
          {
            label: "상대의 리드를 따라간 편",
            description: "상대가 이끄는 대로 자연스럽게 따라간 편이었다",
            subOptions: [
              { label: "고백을 받는 쪽이었던 편", description: "먼저 다가오길 기다린 편이다" },
              { label: "흐름에 맡긴 편", description: "굳이 정의하려 하지 않았다" },
              { label: "편하게 받아들인 편", description: "부담 없이 관계를 시작한 편이다" },
              { label: "서두르지 않아도 괜찮았던 편", description: "상대 속도에 맞춰갔다" },
            ],
          },
          {
            label: "매번 다른 모습이었다",
            description: "상대나 상황에 따라 태도가 달라졌다",
            subOptions: [
              { label: "끌림의 정도에 따라 달랐다", description: "마음의 크기가 태도를 바꿨다" },
              { label: "상대 스타일에 맞춰갔다", description: "상대가 어떤 사람이냐에 따라 달랐다" },
              { label: "그때그때 달랐다", description: "정해진 패턴이 없는 편이다" },
              { label: "상황에 영향을 많이 받았다", description: "타이밍이나 환경에 따라 달라졌다" },
            ],
          },
          { label: "아직 연애 경험이 없다", description: "이 질문은 아직 해당 사항이 없다" },
        ],
      },
      {
        id: "binary6",
        type: "binary",
        required: false,
        question: "이성적으로 대화하는 사람 vs 감정에 공감해주는 사람, 힘들 때 더 필요한 쪽은?",
        options: [
          { label: "이성적으로 대화하는 사람", description: "문제를 침착하게 같이 풀어가는 사람" },
          { label: "감정에 공감해주는 사람", description: "내 감정을 먼저 알아주고 다독여주는 사람" },
        ],
      },
      {
        id: "experienceStressResponse",
        type: "experience",
        required: true,
        question: "가까운 사람과 갈등이 있을 때, 스트레스를 어떻게 푸는 편이야?",
        options: [
          {
            label: "바로 이야기하는 편",
            description: "마음에 걸리면 바로 대화로 푸는 편이다",
            subOptions: [
              { label: "그 자리에서 말하는 편", description: "담아두지 않고 바로 표현하는 편이다" },
              { label: "차분히 설명하는 편", description: "감정보다 상황을 정리해서 말하는 편이다" },
              { label: "먼저 다가가서 얘기하는 편", description: "어색해도 대화를 먼저 꺼내는 편이다" },
              { label: "짧게라도 짚고 넘어가는 편", description: "사소한 것도 그냥 안 넘기는 편이다" },
            ],
          },
          {
            label: "혼자 삭이는 편",
            description: "일단 혼자 정리한 뒤에 넘어가는 편이다",
            subOptions: [
              { label: "시간을 두고 삭이는 편", description: "감정이 가라앉을 때까지 기다리는 편이다" },
              { label: "티 안 내려는 편", description: "겉으로 내색하지 않는 편이다" },
              { label: "혼자 생각을 정리하는 편", description: "대화 전에 스스로 이유를 찾아보는 편이다" },
              { label: "나중에 얘기하는 편", description: "마음이 정리된 뒤에야 말을 꺼내는 편이다" },
            ],
          },
          {
            label: "거리를 두는 편",
            description: "잠깐 떨어져서 감정을 가라앉히는 편이다",
            subOptions: [
              { label: "연락을 잠깐 줄이는 편", description: "시간을 두고 다시 얘기하는 편이다" },
              { label: "혼자만의 시간을 갖는 편", description: "환기가 필요한 편이다" },
              { label: "답장이 느려지는 편", description: "바로 반응하지 않는 편이다" },
              { label: "자연스레 멀어졌다 다시 가까워지는 편", description: "시간이 해결해주는 편이다" },
            ],
          },
          {
            label: "주변에 털어놓는 편",
            description: "다른 사람에게 얘기하며 정리하는 편이다",
            subOptions: [
              { label: "조언을 구하는 편", description: "다른 사람 시각을 참고하는 편이다" },
              { label: "얘기하면서 감정을 정리하는 편", description: "말하다 보면 풀리는 편이다" },
              { label: "공감받고 나서 움직이는 편", description: "위로받은 뒤에 다시 생각하는 편이다" },
              { label: "털어놓고 나면 괜찮아지는 편", description: "말하는 것만으로 해소되는 편이다" },
            ],
          },
        ],
      },
      {
        id: "experienceRegret",
        type: "experience",
        required: true,
        question: "돌아보면, 가까운 관계에서 어떤 부분을 더 채워주고 싶었어?",
        options: [
          {
            label: "표현을 더 자주 할걸",
            description: "마음을 더 자주 표현했으면 좋았겠다 싶다",
            subOptions: [
              { label: "고맙다는 말을 더 할걸", description: "당연하게 여기지 말걸 싶다" },
              { label: "애정표현을 더 할걸", description: "마음을 아끼지 말걸 싶다" },
              { label: "칭찬을 더 해줄걸", description: "좋은 점을 더 말해줄걸 싶다" },
              { label: "먼저 다가갈걸", description: "자존심 세우지 말걸 싶다" },
            ],
          },
          {
            label: "대화를 더 시도할걸",
            description: "갈등을 피하지 말고 더 얘기할걸 싶다",
            subOptions: [
              { label: "서운함을 바로 말할걸", description: "참지 말고 그때그때 말할걸 싶다" },
              { label: "오해를 풀려고 노력할걸", description: "넘겨짚지 말고 확인할걸 싶다" },
              { label: "힘든 얘기도 꺼낼걸", description: "불편해도 얘기했어야 했다 싶다" },
              { label: "끝까지 들어줄걸", description: "중간에 끊지 말걸 싶다" },
            ],
          },
          {
            label: "시간을 더 낼걸",
            description: "바쁘다는 핑계로 소홀했던 게 아쉽다",
            subOptions: [
              { label: "연락을 더 자주 할걸", description: "바쁠 때도 신경 쓸걸 싶다" },
              { label: "만날 때 더 신경 쓸걸", description: "준비를 더 정성껏 할걸 싶다" },
              { label: "기념일을 더 챙길걸", description: "특별한 날을 그냥 넘기지 말걸 싶다" },
              { label: "우선순위를 더 둘걸", description: "다른 일보다 먼저 챙길걸 싶다" },
            ],
          },
          {
            label: "내 감정에 더 솔직할걸",
            description: "괜찮은 척하지 말고 솔직했으면 싶다",
            subOptions: [
              { label: "힘들 때 티를 낼걸", description: "혼자 참지 말걸 싶다" },
              { label: "원하는 걸 말할걸", description: "눈치 보지 말고 말할걸 싶다" },
              { label: "불편함을 숨기지 말걸", description: "맞춰주기만 하지 말걸 싶다" },
              { label: "내 생각을 더 말할걸", description: "상대 의견만 따르지 말걸 싶다" },
            ],
          },
        ],
      },
      {
        id: "experienceEmotion",
        type: "experience",
        required: false,
        question: "가까운 관계에서, 나는 어떤 감정에 좀 더 예민한 편이야?",
        options: [
          {
            label: "불안함",
            description: "상대 마음이 변할까 봐 걱정하는 감정",
            subOptions: [
              { label: "연락이 안 되면 불안한", description: "답장이 늦으면 신경 쓰이는" },
              { label: "확인받고 싶은", description: "계속 사랑받고 있다는 확신이 필요한" },
              { label: "비교하게 되는", description: "다른 사람과 비교하며 불안해지는" },
              { label: "관계가 끝날까 걱정되는", description: "사소한 일에도 이별을 떠올리는" },
            ],
          },
          {
            label: "서운함",
            description: "기대만큼 안 돌아올 때 드는 감정",
            subOptions: [
              { label: "표현이 적으면 서운한", description: "애정표현이 부족하면 신경 쓰이는" },
              { label: "우선순위에서 밀리면 서운한", description: "뒷전이 되는 느낌이 싫은" },
              { label: "무심하면 서운한", description: "관심이 줄어드는 게 느껴지면 신경 쓰이는" },
              { label: "노력이 안 보이면 서운한", description: "일방적인 느낌이 들면 힘든" },
            ],
          },
          {
            label: "답답함",
            description: "마음이 잘 안 통할 때 드는 감정",
            subOptions: [
              { label: "대화가 안 통하면 답답한", description: "설명해도 이해 못 받으면 힘든" },
              { label: "결정을 미루면 답답한", description: "우유부단한 모습에 답답함을 느끼는" },
              { label: "속마음을 안 보여주면 답답한", description: "무슨 생각인지 몰라서 답답한" },
              { label: "같은 말을 반복해야 하면 답답한", description: "매번 다시 설명해야 하면 지치는" },
            ],
          },
          {
            label: "무덤덤함",
            description: "크게 흔들리지 않고 담담한 편",
            subOptions: [
              { label: "감정 기복이 적은 편", description: "웬만한 일엔 크게 동요 안 하는" },
              { label: "상황을 객관적으로 보는 편", description: "감정보다 상황 판단이 먼저인" },
              { label: "시간이 지나면 괜찮아지는 편", description: "감정이 오래 안 가는 편인" },
              { label: "크게 내색 안 하는 편", description: "힘들어도 티가 잘 안 나는" },
            ],
          },
        ],
      },
      {
        id: "experienceChange",
        type: "experience",
        required: false,
        question: "예전과 비교하면, 나는 관계 맺는 방식이 어떻게 달라졌어?",
        options: [
          {
            label: "더 신중해졌다",
            description: "예전보다 조심스럽게 다가가게 됐다",
            subOptions: [
              { label: "상처를 덜 받으려 조심하는", description: "미리 방어하게 되는" },
              { label: "확신이 들어야 움직이는", description: "예전보다 신중해진" },
              { label: "속도를 늦추게 된", description: "서두르지 않게 된" },
              { label: "과거를 참고하게 되는", description: "예전 경험을 떠올리며 판단하는" },
            ],
          },
          {
            label: "더 솔직해졌다",
            description: "예전보다 마음을 더 잘 표현하게 됐다",
            subOptions: [
              { label: "감정을 더 잘 말하는", description: "참기보다 표현하게 된" },
              { label: "원하는 걸 분명히 말하는", description: "눈치 보기보다 말하게 된" },
              { label: "갈등을 피하지 않는", description: "예전보다 대화를 시도하게 된" },
              { label: "나를 더 보여주는", description: "꾸미지 않고 있는 그대로 보여주는" },
            ],
          },
          {
            label: "크게 달라지지 않았다",
            description: "예전이나 지금이나 비슷한 편이다",
            subOptions: [
              { label: "원래 스타일을 유지하는", description: "큰 변화 없이 비슷한 편인" },
              { label: "성향 자체가 그대로인", description: "연애관이 잘 안 바뀌는 편인" },
              { label: "좋았던 방식을 유지하는", description: "바꿀 필요를 못 느끼는" },
              { label: "상대에 따라만 조금 다른", description: "사람마다 조금씩 달라지는 정도인" },
            ],
          },
          {
            label: "기준이 명확해졌다",
            description: "원하는 게 뭔지 더 뚜렷해졌다",
            subOptions: [
              { label: "우선순위가 분명해진", description: "뭐가 중요한지 알게 된" },
              { label: "타협 못 할 것을 아는", description: "절대 안 되는 것도 알게 된" },
              { label: "나에게 맞는 사람을 아는", description: "어떤 사람과 잘 맞는지 감이 생긴" },
              { label: "예전보다 선택이 빨라진", description: "판단 기준이 생겨서 빨라진" },
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

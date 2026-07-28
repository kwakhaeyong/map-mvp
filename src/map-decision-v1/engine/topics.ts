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
// 허용). quickTap: 문항 수가 많아지면서(필수 12→30) 생긴 새 형식 —
// 단일 선택 + 세부 선택지 없음 + 고르는 즉시 자동으로 다음 문항으로
// 넘어간다(TopicQuiz.tsx의 QuickTapStep). 설명(description)은 데이터에는
// 있어도 화면에는 안 보여준다("한눈에 고르기"가 목적) — AI에게 보내는
// 답변 텍스트에는 여전히 포함된다. ranking: 옵션 전부를 원하는 순서대로 매긴다
// (RankingStep) — "제일 좋은 것"만 아니라 전체 우선순위를 알아낼 때
// 쓴다. slider: 양 끝 사이의 정도를 고른다(SliderStep) — 데이터 구조는
// preference형처럼 options 배열이지만, 양자택일로 자르기 애매한 축을
// 5단계 정도로 표현할 때 쓴다. scenario: 특성을 직접 묻지 않고 구체적
// 상황을 던져서 반응을 고르게 한다(ScenarioStep) — 동작은 quickTap과
// 같고 화면 톤만 다르다. reflection: 문항 하나에 짧게 한 줄 적는
// 자유 서술형(ReflectionStep) — options는 항상 빈 배열이고, 건너뛰기가
// 가능하다.
export type TopicQuestionType =
  | "preference"
  | "binary"
  | "experience"
  | "quickTap"
  | "ranking"
  | "slider"
  | "scenario"
  | "reflection";
// required=false인 문항은 "심화" 구간으로, 필수 문항을 다 답한 뒤에만
// 볼지 말지 선택할 수 있다(TopicQuiz.tsx의 결정 화면 참고).
export type TopicAxis = {
  id: string;
  type: TopicQuestionType;
  question: string;
  options: TopicOption[];
  required: boolean;
  // reflection(자유 서술) 문항에서만 사용. 예시 답변을 보여줘서 "이 정도
  // 길이·구체성으로 쓰면 되는구나"를 느끼게 한다 — 빈 입력창만 있으면
  // 뭘 얼마나 써야 할지 몰라 한두 단어로 끝나기 쉽다.
  placeholder?: string;
};

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
  // axes의 문항 수·순서·타입 구성이 quizStep 숫자의 의미를 바꿀 만큼
  // 바뀔 때마다 올린다(예: 6문항 → 20문항 개편). session.quizStep은
  // "몇 번째"라는 숫자일 뿐이라, 축 배열이 바뀌면 예전 세션의 quizStep이
  // 완전히 다른 문항을 가리키게 된다 — TopicQuiz.tsx가 이 값과
  // session.quizVersion을 비교해서 안 맞으면 퀴즈 진행을 안전하게
  // 새로 시작시킨다. quiz가 아닌 주제는 신경 쓸 필요 없어 생략 가능.
  quizVersion?: number;
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
    // 1: 원래 프로덕션의 6문항(5축+마무리) 구조. 2: 필수 12+선택 8 구조로
    // 축 순서·개수·타입이 전면 개편됐다. 3: 필수 30+선택 8(총 38문항)로
    // 확장하면서 "빠른 탭"(quickTap) 형식이 새로 생겼다. 4: 빠른 탭을
    // 앞에 몰아둔 구성이 단조롭다는 피드백을 받아, 시간 단축에서 퀄리티
    // 방향으로 다시 짰다 — 외모 3문항을 텍스트에서 시각적 선택(썸네일
    // 그리드)으로 바꾸고, 순위 매기기·슬라이더·상황 제시형을 새로 넣어
    // 형식을 다양화했고, 경험형 문항 뒤에 짧은 자유 서술 3개를 끼워
    // 넣었다. 5: 외모 실루엣을 전신에서 어깨 위 구도(증명사진 스타일)로
    // 바꿨다 — 체형을 아예 그리지 않아서 bodyFeel(체형 느낌) 문항을
    // 없앴고, 대신 머리 색(hairColor)·소품(accessory) 시각 선택을
    // 새로 추가했다. clothingStyle은 "옷 실루엣"에서 "옷깃·넥라인"으로
    // 의미가 바뀌었다(질문·옵션 내용 변경). 필수 36→37개로 늘었다
    // (외모 클러스터가 bodyFeel 제거 1개 + hairColor/accessory 추가
    // 2개로 순증가 1개). 6: 시각적 외모 관련 요소를 전부 제거했다 —
    // hairStyle/hairColor/clothingStyle/accessory/colorImpression 5개
    // 문항(썸네일 그리드로 고르던 시각 선택)과 결과 화면의 실루엣
    // 잔여물(외모 취향 블록·탭, IdealTypeSilhouetteLabels 타입,
    // ideal-type-silhouette.ts, IdealTypeVisualParts.tsx)을 전부 없앴다.
    // 태그 4축(relationship/lifestyle/experienceStressResponse/binary1)은
    // 이 5개 축과 무관해 영향 없다. 필수 37→32개로 줄었다. 7: 심화
    // 8문항 중 experienceApology(사과 방식)·experienceEarlyStyle(연애
    // 초반 스타일) 2개를 필수로 승격했다 — 프로덕션에서 나온 최고의
    // 자기성찰 두 개가 전부 experienceApology에서 나왔는데, 심화라서
    // 건너뛴 사용자는 못 받고 있었다. experienceEarlyStyle은
    // firstMoveStyle(이상형에게 바라는 썸 초반 스타일)과 이미 필수에
    // 있는 짝이 있어 승격 우선순위가 높았다. experienceCommitment·
    // experienceSupport는 짝이 되는 선호형 문항이 필수에 없어 이번엔
    // 보류했다.
    //
    // ★신규 문항 3개(mySignatureShow/decisionOutcome/myWarmthRange)를
    // 넣어 필수 37개로 만드는 안을 한 차례 시도했었지만, 실제 테스터
    // 피드백("32문항에 7분 넘게 걸림")을 받고 문항 수를 늘리는 방향은
    // 폐기했다 — 그 3개는 만들지 않는다. 이번엔 승격 2개만 반영해서
    // 필수 32→34개, 심화는 8→6개로 줄었다(총 문항 풀은 그대로, 심화 2개가
    // 필수로 자리만 옮김). 8: 1~14번에 "나"에 대한 문항이 하나도 없다는
    // 지적(34문항 전수 조사 결과)에 따라, 원래 27번째였던 currentMood
    // (요즘 마음 상태)를 맨 앞으로 옮겼다 — 짝이 되는 선호 문항이 없는
    // 독립 quickTap 축이라 이동에 제약이 없었다. myRelationshipRole과
    // experience형 7개는 그대로 둔다("무거운 자기 문항으로 시작하면
    // 기대와 어긋난다"는 우려, 그리고 experienceApology·
    // experienceEarlyStyle은 각각 reconcileStyle·firstMoveStyle과
    // 나란히 대비되도록 의도적으로 배치돼 있어 짝 없이 옮길 수 없다).
    // 태그 4축(relationship/lifestyle/experienceStressResponse/binary1)과
    // 결과 생성 프롬프트는 배열 위치가 아니라 axisId·문항 종류/개수만
    // 참조하므로 이 이동으로 영향받지 않는다. 9: binary6("이성적 대화
    // vs 감정 공감")을 scenarioAdvice(회사 스트레스를 얘기했을 때
    // 조언 vs 공감 반응)로 교체했다 — "깻잎 논쟁형" 시범 적용 1건.
    // 기존 scenario 3개와 달리 "이상형이라면"이 아니라 "나"의 반응을
    // 묻는 문항이라 SYSTEM_PROMPT에서 별도로 구분해 selfReflection
    // 재료로 쓰도록 지시했다. 10: scenarioAdvice를 32번에서 4번으로
    // 옮겼다 — 32번은 "형식이 실제로 재밌는지" 반응을 볼 수 없을 만큼
    // 뒤쪽이었다. scenarioCancel(6번)과 바로 붙지 않고, scenarioMood
    // (13번)와도 3연속이 되지 않는 자리다. 동시에 선택지를 "조언 긍정
    // 1 : 부정 3"에서 "조언 긍정 2 : 공감 선호 2"로 다시 짰다 — 강도
    // 차이가 아니라 서로 다른 이유의 선택지 4개로, 어느 쪽도 정답처럼
    // 보이지 않게 했다.
    quizVersion: 10,
    axes: [
      {
        id: "currentMood",
        type: "quickTap",
        required: true,
        question: "요즘 마음 상태에 가장 가까운 건?",
        options: [
          { label: "새로운 인연에 열려있어", description: "누군가를 만나고 싶은 마음이 있는 상태" },
          { label: "그냥 무난하게 지내", description: "특별한 마음의 동요 없이 평범한 상태" },
          { label: "요즘 좀 지쳐있어", description: "마음의 여유가 크지 않은 상태" },
          { label: "혼자만의 시간이 편해", description: "지금은 나 자신에게 집중하고 싶은 상태" },
        ],
      },
      {
        id: "appearance",
        type: "quickTap",
        required: true,
        question: "끌리는 분위기는?",
        options: [
          { label: "청량·상큼", description: "보기만 해도 기분 좋아지는 산뜻한 느낌" },
          { label: "시크·도시적", description: "어딘가 세련되고 도도한 느낌" },
          { label: "부드럽고 포근", description: "옆에 있으면 마음이 편안해지는" },
          { label: "개성있는·유니크", description: "어디서도 본 적 없는 나만의 느낌" },
          { label: "단정한·클래식", description: "볼수록 믿음이 가는 반듯한 느낌" },
        ],
      },
      {
        id: "giftStyle",
        type: "ranking",
        required: true,
        question: "마음을 표현받는 방식, 좋아하는 순서대로 골라줘",
        options: [
          { label: "손편지·메시지", description: "글로 마음을 전하는 걸 더 좋아함" },
          { label: "깜짝 이벤트", description: "예상 못한 서프라이즈를 좋아함" },
          { label: "필요한 걸 알아서 챙겨주기", description: "말 안 해도 알아서 챙겨주는 걸 좋아함" },
          { label: "함께하는 시간 자체", description: "물건보다 같이 보내는 시간이 더 중요함" },
        ],
      },
      // ── 상황 제시형 4(신규, quizVersion 10) ───────────────────────
      // 기존 binary6("이성적 대화 vs 감정 공감")을 교체한 것 — 추상적인
      // 양자택일 대신 구체적 장면을 주고 반응을 고르게 했다("깻잎
      // 논쟁형"). ★scenarioCancel/scenarioMood/scenarioSilence와 달리
      // 이건 "이상형이라면"이 아니라 "나"의 반응을 묻는 문항이다 —
      // ideal-type-generator.ts SYSTEM_PROMPT에서 반드시 구분해서
      // selfReflection 재료로 쓰도록 지시해야 한다(다른 3개는 그대로
      // 상대 취향 신호). 선택지는 "조언 긍정 2 : 공감 선호 2"로
      // 대등하게 짜서 어느 쪽도 정답처럼 보이지 않게 했고, 같은 방향
      // 안에서도 이유가 다르게(강도 차이가 아니라) 만들었다 — 오너
      // 피드백 반영. 4번 문항으로 둬서 10번 이내에 놓이면서도
      // scenarioCancel(6번)과 바로 붙지 않게, scenarioMood(13번)와도
      // 3연속이 되지 않게 배치했다.
      {
        id: "scenarioAdvice",
        type: "scenario",
        required: true,
        question: "회사에서 힘든 일이 있었다고 얘기했어. 상대가 \"그래서 어떻게 됐는데, 이렇게 해보는 게 어때?\"라고 답해. 기분이 어때?",
        options: [
          { label: "해결책이 있어서 든든해", description: "문제를 같이 풀어주는 것 같아 안심되는 반응" },
          { label: "나도 그렇게 답하는 편이라 편해", description: "익숙한 방식이라 자연스럽게 느껴지는 반응" },
          { label: "지금은 그냥 들어주면 좋겠는데 싶어", description: "해결책보다 공감이 먼저 필요한 반응" },
          { label: "이미 생각해본 방법이라 아쉬워", description: "새로운 도움보다 그냥 알아주길 바랐던 반응" },
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
      // ── 상황 제시형 1 ─────────────────────────────────────────────
      // 특성을 직접 묻지 않고 구체적인 상황을 던져서 반응을 고르게
      // 한다 — "배려심이 많나요?"보다 훨씬 진한 신호가 나온다.
      {
        id: "scenarioCancel",
        type: "scenario",
        required: true,
        question: "약속 30분 전에 상대가 갑자기 취소했어. 어떤 반응이 더 편해?",
        options: [
          { label: "괜찮다고 쿨하게 넘기는 반응", description: "이유를 캐묻지 않고 다음을 기약하는" },
          { label: "무슨 일 있었는지 걱정하며 물어보는 반응", description: "괜찮은지부터 확인하는" },
          { label: "살짝 서운하지만 티 안 내는 반응", description: "속으로 아쉬워도 내색 않는" },
          { label: "바로 다른 약속을 다시 잡자고 하는 반응", description: "미루지 않고 바로 재조정하는" },
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
        id: "talkStyle",
        type: "quickTap",
        required: true,
        question: "듣고 싶은 말투는?",
        options: [
          { label: "다정한 존댓말", description: "예의 있으면서도 다정한 말투" },
          { label: "편안한 반말", description: "친근하고 편안한 말투" },
          { label: "애교 섞인 말투", description: "귀엽고 사랑스러운 말투" },
          { label: "담백하고 진지한 말투", description: "꾸밈없이 진지한 말투" },
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
        id: "decisionStyle",
        type: "quickTap",
        required: true,
        question: "결정할 때 이상형은 어떤 쪽이 좋아?",
        options: [
          { label: "빠르게 결정하는", description: "고민을 오래 안 하고 바로 정하는" },
          { label: "신중하게 고민하는", description: "여러 번 따져보고 정하는" },
          { label: "같이 의논하는", description: "혼자 정하지 않고 같이 얘기해서 정하는" },
          { label: "직관을 믿는", description: "느낌 가는 대로 정하는" },
        ],
      },
      // ── 상황 제시형 2 ─────────────────────────────────────────────
      {
        id: "scenarioMood",
        type: "scenario",
        required: true,
        question: "내가 무심코 한 말에 상대 표정이 안 좋아졌어. 이상형이라면 어떻게 반응할까?",
        options: [
          { label: "바로 왜 그런지 물어봐주는 반응", description: "감정을 숨기지 않고 확인하는" },
          { label: "시간을 두고 스스로 풀리길 기다리는 반응", description: "몰아붙이지 않고 여유를 주는" },
          { label: "장난스럽게 분위기를 바꾸려는 반응", description: "가볍게 넘기며 풀어주는" },
          { label: "먼저 미안하다고 말하는 반응", description: "이유를 몰라도 일단 사과하는" },
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
        id: "reconcileStyle",
        type: "quickTap",
        required: true,
        question: "다툰 뒤 화해는 어떤 방식이 좋아?",
        options: [
          { label: "바로 안아주며 사과하는", description: "스킨십으로 먼저 마음을 푸는" },
          { label: "시간 두고 차분히 대화하는", description: "감정이 가라앉은 뒤 얘기하는" },
          { label: "장난스럽게 풀어주는", description: "가볍게 농담으로 분위기를 푸는" },
          { label: "메시지로 마음을 전하는", description: "글로 먼저 마음을 표현하는" },
        ],
      },
      // ── 심화에서 필수로 승격(quizVersion 7) ───────────────────────
      // 프로덕션에서 나온 최고의 자기성찰 두 개가 전부 이 문항에서
      // 나왔는데, 심화라서 건너뛴 사용자는 못 받고 있었다. 화해 방식
      // 선호(reconcileStyle) 바로 뒤에 둬서 "화해는 어떻게 하고
      // 싶은지"와 "사과는 실제로 어떻게 하는지"가 나란히 대비된다.
      {
        id: "experienceApology",
        type: "experience",
        required: true,
        question: "내가 잘못했을 때, 사과는 보통 어떻게 하는 편이야?",
        options: [
          { label: "바로 인정하고 사과하는 편", description: "잘못을 깨달으면 바로 말하는 편이다" },
          { label: "시간이 좀 지나야 사과하는 편", description: "마음을 정리한 뒤에 사과하는 편이다" },
          { label: "행동으로 갚는 편", description: "말보다 행동으로 미안함을 표현하는 편이다" },
          { label: "자존심 때문에 잘 못하는 편", description: "알면서도 먼저 말을 못 꺼내는 편이다" },
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
      // ── 짧은 자유 서술 1: 경험형 바로 뒤 ────────────────────────────
      // 지금까지 결과에서 가장 날카로운 통찰은 늘 자유 서술에서
      // 나왔다 — 그런데 맨 끝에 하나뿐이고 선택 사항이라 대부분
      // 건너뛴다. 경험형 문항 바로 뒤에 짧게(2~3줄) 물어서 "왜
      // 그랬는지"까지 재료로 확보한다. 건너뛰기는 허용하되 부담을
      // 낮추려고 "한 줄이면 충분해요"를 문항 자체에 못박는다.
      {
        id: "reflectionEnding",
        type: "reflection",
        required: true,
        question: "가장 최근에 그렇게 멀어졌던 관계, 언제였어요?\n무슨 일이 있었는지 적어주세요",
        placeholder: "예: 작년에 만나던 사람이 연락이 점점 줄었는데, 저도 먼저 연락 안 하고 그냥 뒀어요",
        options: [],
      },
      {
        id: "firstMoveStyle",
        type: "quickTap",
        required: true,
        question: "썸 초반, 이상형은 어떤 쪽이 좋아?",
        options: [
          { label: "적극적으로 먼저 다가오는", description: "마음을 숨기지 않고 먼저 다가오는" },
          { label: "은근하게 티 내는", description: "직접 말은 안 해도 티가 나는" },
          { label: "내가 다가가면 잘 받아주는", description: "먼저 다가가면 편하게 받아주는" },
          { label: "자연스럽게 친구처럼 시작하는", description: "부담 없이 친구처럼 다가오는" },
        ],
      },
      // ── 심화에서 필수로 승격(quizVersion 7) ───────────────────────
      // firstMoveStyle(이상형에게 바라는 썸 초반 스타일) 바로 뒤에 둬서
      // "이상형에게 바라는 것"과 "내가 실제로 했던 것"이 나란히
      // 대비된다 — 이미 짝이 있는 문항이라 승격 우선순위가 가장
      // 높았다. "아직 연애 경험이 없다" 이탈 옵션이 있어서 필수로
      // 옮겨도 경험 없는 사용자를 막다른 길로 몰지 않는다.
      {
        id: "experienceEarlyStyle",
        type: "experience",
        required: true,
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
      // ── 짧은 자유 서술 2: 경험형 바로 뒤 ────────────────────────────
      {
        id: "reflectionStress",
        type: "reflection",
        required: true,
        question: "최근에 그렇게 스트레스를 풀었던 때가 언제였어요?\n그때 어떤 상황이었어요?",
        placeholder: "예: 저번 주에 친구랑 트러블 있었을 때 게임하면서 풀었는데, 다음 날 먼저 연락해서 풀었어요",
        options: [],
      },
      {
        id: "energyLevel",
        type: "quickTap",
        required: true,
        question: "사람 만날 때 에너지는 어떤 쪽이 좋아?",
        options: [
          { label: "사람 많은 자리를 즐기는", description: "여럿이 모이는 자리에서 에너지를 얻는" },
          { label: "소수와 깊게 만나는 걸 좋아하는", description: "한두 명과 깊은 대화를 좋아하는" },
          { label: "혼자만의 시간이 꼭 필요한", description: "충전을 위해 혼자 있는 시간이 필요한" },
          { label: "상황에 따라 유연한", description: "때에 따라 다르게 맞추는" },
        ],
      },
      // ── 상황 제시형 3 ─────────────────────────────────────────────
      {
        id: "scenarioSilence",
        type: "scenario",
        required: true,
        question: "오랜만에 만난 자리에서 내가 계속 말이 없어. 이상형이라면 어떻게 할까?",
        options: [
          { label: "무슨 일 있냐고 조심스럽게 물어보는 반응", description: "먼저 상태를 확인해주는" },
          { label: "그냥 편하게 같이 있어주는 반응", description: "캐묻지 않고 곁을 지켜주는" },
          { label: "재밌는 얘기로 분위기를 풀어주는 반응", description: "분위기를 자연스레 바꿔주는" },
          { label: "혼자만의 시간이 필요한가보다 하고 두는 반응", description: "굳이 개입하지 않고 존중하는" },
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
      // ── 짧은 자유 서술 3: 경험형 바로 뒤 ────────────────────────────
      {
        id: "reflectionRegret",
        type: "reflection",
        required: true,
        question: "그 아쉬움이 가장 크게 남았던 순간이 언제였어요?\n그때 실제로 어떻게 했어요?",
        placeholder: "예: 헤어지기 전에 서운했던 걸 말 안 하고 참았는데, 결국 곪아서 터졌어요",
        options: [],
      },
      {
        id: "communication",
        type: "preference",
        required: true,
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
        id: "binary4",
        type: "binary",
        required: true,
        question: "표현이 많은 사람 vs 무게감 있는 사람, 더 끌리는 쪽은?",
        options: [
          { label: "표현이 많은 사람", description: "마음을 자주, 확실하게 드러내는 사람" },
          { label: "무게감 있는 사람", description: "말수는 적어도 진중함이 느껴지는 사람" },
        ],
      },
      {
        id: "myRelationshipRole",
        type: "quickTap",
        required: true,
        question: "친구든 썸이든, 관계에서 나는 보통 어떤 역할이야?",
        options: [
          { label: "먼저 다가가고 챙기는 편", description: "적극적으로 먼저 움직이는 역할" },
          { label: "편하게 맞춰주는 편", description: "상대에게 맞춰가는 역할" },
          { label: "분위기를 띄우는 편", description: "즐거운 분위기를 만드는 역할" },
          { label: "조용히 지켜보는 편", description: "나서기보다 지켜보는 역할" },
        ],
      },
      // ── 슬라이더 ──────────────────────────────────────────────────
      // binaryWarmth를 강제 양자택일에서 5단계 슬라이더로 바꿨다 —
      // MBTI가 쓰는 방식처럼 "완전히 A"부터 "완전히 B"까지 정도를
      // 표현할 수 있게 해서, 둘 중 하나로 자르기 애매한 사람도 자기
      // 위치를 더 정확하게 고를 수 있다. 태그·자세 매핑과 무관한
      // 축이라 안전하게 바꿀 수 있었다.
      {
        id: "binaryWarmth",
        type: "slider",
        required: true,
        question: "내 사람에게만 잘하는 사람 ↔ 누구에게나 두루 잘하는 사람, 어느 쪽에 더 가까워?",
        options: [
          { label: "내 사람에게만 잘하는 사람", description: "가까운 사람에게 유독 다정한, 낯가림 있는 다정함" },
          { label: "그래도 내 사람 위주인 사람", description: "두루 잘해도 내 사람에게 더 마음이 가는 사람" },
          { label: "반반인 사람", description: "가까운 사람과 아닌 사람을 크게 구분 안 하는 사람" },
          { label: "그래도 두루두루인 사람", description: "내 사람도 챙기지만 남에게도 잘하는 사람" },
          { label: "누구에게나 두루 잘하는 사람", description: "누구에게나 배려가 몸에 밴 사람" },
        ],
      },
      {
        id: "experienceEmotion",
        type: "experience",
        required: true,
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
        required: true,
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
      // ── 심화(선택) 6문항 ──────────────────────────────────────────
      // experienceEarlyStyle·experienceApology는 quizVersion 7에서
      // 필수로 승격돼 위쪽으로 옮겨갔다(firstMoveStyle·reconcileStyle
      // 근처 참고) — 여기 있던 자리다.
      {
        id: "experienceCommitment",
        type: "experience",
        required: false,
        question: "관계가 진지해지는 순간(사귀자고 말할 때 등), 나는 보통 어느 쪽이었어?",
        options: [
          { label: "내가 먼저 말하는 편", description: "마음을 확인하면 먼저 표현하는 편이다" },
          { label: "상대가 먼저 말해주길 기다리는 편", description: "고백받는 쪽을 편하게 여기는 편이다" },
          { label: "자연스럽게 흘러가는 편", description: "누가 먼저랄 것 없이 정해지는 편이다" },
          { label: "확신이 들 때까지 계속 미루는 편", description: "확실해지기 전까지는 정의하지 않는 편이다" },
        ],
      },
      {
        id: "experienceSupport",
        type: "experience",
        required: false,
        question: "가까운 사람이 잘될 때(성취·좋은 일), 나는 보통 어떤 반응이야?",
        options: [
          { label: "내 일처럼 기뻐하는 편", description: "진심으로 같이 신나하는 편이다" },
          { label: "티는 안 내도 진심으로 응원하는 편", description: "겉으로 크게 표현은 안 하는 편이다" },
          { label: "약간의 부러움도 함께 느끼는 편", description: "축하하면서도 나를 돌아보게 되는 편이다" },
          { label: "축하부터 챙기는 행동파", description: "말보다 먼저 뭔가 해주는 편이다" },
        ],
      },
      {
        id: "binaryPlanning",
        type: "binary",
        required: false,
        question: "계획적으로 움직이는 사람 vs 즉흥적으로 움직이는 사람, 더 끌리는 쪽은?",
        options: [
          { label: "계획적으로 움직이는 사람", description: "미리 정하고 움직이는 걸 편안해하는 사람" },
          { label: "즉흥적으로 움직이는 사람", description: "그때그때 흐름을 즐기는 사람" },
        ],
      },
      {
        id: "binarySimilarity",
        type: "binary",
        required: false,
        question: "나와 비슷한 사람 vs 나와 다른 사람, 더 끌리는 쪽은?",
        options: [
          { label: "나와 비슷한 사람", description: "취향과 성향이 잘 통하는 사람" },
          { label: "나와 다른 사람", description: "나한테 없는 걸 채워주는 사람" },
        ],
      },
      {
        id: "idealDate",
        type: "preference",
        required: false,
        question: "이상적인 데이트는 어떤 모습이야?",
        options: [
          { label: "카페에서 대화", description: "편하게 앉아서 얘기 나누는 시간" },
          { label: "야외 활동·산책", description: "함께 걷거나 몸을 움직이는 시간" },
          { label: "문화생활(전시·공연·영화)", description: "같이 보고 느끼는 시간" },
          { label: "맛집 탐방", description: "맛있는 걸 같이 찾아다니는 시간" },
          { label: "집에서 편안하게", description: "나가지 않고 편하게 보내는 시간" },
        ],
      },
      {
        id: "socialCircle",
        type: "preference",
        required: false,
        question: "친구·지인들과의 관계는 어떤 게 좋아?",
        options: [
          { label: "내 친구들과도 잘 어울리는 사람", description: "내 사람들과 자연스럽게 섞이는 사람" },
          { label: "우리 둘만의 시간을 더 중요하게 여기는 사람", description: "다른 관계보다 둘을 우선하는 사람" },
          { label: "자연스럽게 어울리되 무리하지 않는 사람", description: "부담 없이 적당히 어울리는 사람" },
          { label: "각자 친구 관계는 존중해주는 사람", description: "서로의 인간관계를 간섭하지 않는 사람" },
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

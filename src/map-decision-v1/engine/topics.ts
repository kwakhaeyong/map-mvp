// MAP 종류(주제) 레지스트리.
//
// 지금은 career(진로·커리어)만 실제로 연결돼 있다(오늘 이미 작동하는
// 대화 추출/결과 생성 로직을 그대로 가리킨다). 나머지 9개는 종류 선택
// 화면(Landing.tsx)에 "준비 중"으로 노출되지만 implemented: false라
// 눌러도 대화가 시작되지 않는다 — conversationFocus/resultFocus는 아직
// 비어 있고 entryQuestion/entryChips도 실제 대화 톤에 맞게 다듬어지기
// 전이다. 각 주제가 완성되면 implemented를 true로 바꾸고 내용을 채운다.

export type TopicCategory = "viral" | "depth"; // 바이럴 / 깊이
export type TopicGrade = "flagship" | "light"; // 완성형 / 경량
export type ResultLayoutId =
  | "career" // 완성형 전용 틀
  | "idealType" // 완성형 전용 틀
  | "selfIntro" // 완성형 전용 틀
  | "viral-common" // 경량 공통 틀(바이럴 계열)
  | "depth-common"; // 경량 공통 틀(깊이 계열)

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
    conversationFocus: "",
    resultFocus: "",
    entryQuestion: "어떤 사람에게 끌리세요?",
    entryChips: ["성격이 잘 맞는 사람", "편안한 관계", "아직 잘 모르겠어요"],
    implemented: false,
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

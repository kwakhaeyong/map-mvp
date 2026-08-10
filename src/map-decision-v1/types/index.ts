export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "map-decision-v1-session";

export type Role = "ai" | "user";
export type MapOutputType = "thinking" | "decision" | "execution" | "priority" | "comparison" | "career" | "process" | "patientJourney" | "handover";
// "profile"은 주제를 고른 직후, 첫 문항(대화든 퀴즈든)보다 앞에 오는
// 화면이다(MapDecisionProduct.tsx가 ProfileStep.tsx를 렌더링). 프로필
// 입력을 마치거나 건너뛰면 "conversation"으로 넘어간다.
export type SessionStage = "landing" | "profile" | "conversation" | "result";
export type Confidence = "user" | "ai" | "confirmed";
export type NodeKind = "topic" | "trigger" | "fact" | "emotion" | "person" | "value" | "reason" | "constraint" | "option" | "benefit" | "risk" | "missing" | "direction" | "action" | "correction";
export type RelationKind = "원인" | "영향" | "충돌" | "대안" | "장점" | "리스크" | "확인 필요" | "다음 행동";

// axisId는 이 메시지가 TopicQuiz.tsx의 어떤 문항(topics.ts axis)에 대한
// 질문·답변인지 표시한다. "이전" 버튼으로 되돌아가 같은 axisId를 다시
// 답했을 때 예전 쌍을 찾아 제거하는 데만 쓴다(TopicQuiz.tsx의
// commitAnswer 참고) — 자유 대화(Conversation.tsx)나 마무리 질문처럼
// axisId가 없는 메시지는 이 값이 그냥 undefined다.
export type Message = { id: string; role: Role; text: string; timestamp: string; checkpoint?: boolean; provider?: "local" | "api"; followUpQuestions?: string[]; axisId?: string };
export type MapNode = { id: string; kind: NodeKind; label: string; text: string; confidence: Confidence; createdAt: string };
export type MapRelation = { id: string; from: string; to: string; kind: RelationKind; strength: "solid" | "dotted" | "accent" };
export type MapSession = {
  version: number;
  stage: SessionStage;
  selectedTopic?: string;
  topicId?: string;
  preferredMapType: MapOutputType;
  messages: Message[];
  nodes: MapNode[];
  relations: MapRelation[];
  checkpointStatus?: "pending" | "confirmed" | "correcting";
  startedAt: string;
  updatedAt: string;
  isDemo?: boolean;
  demoStep?: number;
  quizStep?: number;
  // 축 id -> 그 축에서 고른 선택지의 "최상위" 라벨(세부 선택지를 골랐어도
  // 그 부모 칩의 라벨로 기록됨) 배열. engine/ideal-type-tags.ts가 이
  // 값만 보고 코드로 결정적으로 공유 태그를 뽑는다(AI 호출 없음, 같은
  // 답변이면 항상 같은 태그). 자유 서술(추가로 적은 말)은 포함하지
  // 않는다 — 태그 매핑은 고정 선택지 라벨에만 의존해야 결정적이다.
  quizAnswers?: Record<string, string[]>;
  // quizStep이 어느 axes 구성 기준으로 저장됐는지 — topics.ts의
  // TopicConfig.quizVersion과 비교해서 안 맞으면(예: 예전 6문항 구조로
  // 진행 중이던 세션이 새 20문항 구조를 만난 경우) TopicQuiz.tsx가
  // 퀴즈 진행 상태를 안전하게 초기화하고 새로 시작한다.
  quizVersion?: number;
  localDraft?: string;
  // ProfileStep.tsx(주제 선택 직후, 첫 문항 전 화면)에서 채운다. 세
  // 항목 모두 건너뛸 수 있고, 건너뛴 항목은 undefined다 — 이 필드가
  // 생기기 전 세션(profile 자체가 undefined)도 같은 방식으로 다뤄진다.
  // 결과 타입(SelfIntroResult 등 6종)에는 절대 넣지 않는다 — 넣으면
  // 공유 링크·카드 이미지(engine/share-store.ts의 SharedResultRecord는
  // topicId별 result만 저장)에 그대로 실려 나갈 위험이 생긴다. 이 필드는
  // 오직 (1) 각 생성기의 프롬프트 참고 자료, (2) Landing.tsx의 work
  // 주제 카드 노출 여부 판단, 두 곳에서만 읽는다.
  profile?: { ageRange?: string; occupationStatus?: string; gender?: string };
  result?: FinalResult;
  idealTypeResult?: IdealTypeResult;
  // 이상형 퀴즈를 필수 34문항에서 끝냈는지("quick"), 선택 6문항까지
  // 마쳤는지("deep") — quizVersion 11(심화 경로 제거)부터는 새로 값이
  // 채워지지 않는다. 이미 "deep"으로 저장된 예전 결과의 공유 배지
  // 표시(share-store.ts 참고)만 위해 필드를 남겨둔다.
  idealTypeQuizDepth?: "quick" | "deep";
  // 친구가 공유한 이상형 카드(/r/{id})의 "너도 만들어봐"를 타고 들어와
  // 퀴즈를 시작했을 때, 그 친구의 공유 ID. 결과 화면에서 "친구와의 궁합
  // 보기" 배너를 띄울지 판단하는 데만 쓴다 — 이 값이 있어도 AI 호출이나
  // 결과 생성 로직에는 전혀 영향을 주지 않는다.
  compareWithId?: string;
  // 나 소개·성격(selfIntro) 결과 — idealTypeResult와 완전히 같은 역할을
  // 하는 별도 필드다. TopicQuiz.tsx가 topic.id에 따라 이 필드와
  // idealTypeResult 중 하나를 골라 쓴다(같은 필드를 공유하면 두 주제를
  // 오가며 진행할 때 결과가 서로 덮어써진다).
  selfIntroResult?: SelfIntroResult;
  // 나 소개 퀴즈를 필수 34문항에서 끝냈는지("quick"), 선택 6문항까지
  // 마쳤는지("deep") — quizVersion 2(심화 경로 제거)부터는 새로 값이
  // 채워지지 않는다. 이미 "deep"으로 저장된 예전 결과의 공유 배지
  // 표시(share-store.ts 참고)만 위해 필드를 남겨둔다.
  selfIntroQuizDepth?: "quick" | "deep";
  // 친구·인간관계(friendship) 결과 — idealTypeResult/selfIntroResult와
  // 완전히 같은 역할을 하는 별도 필드다. 심화(선택) 경로 자체가 없는
  // 주제라 quizDepth/resuming류 필드는 없다.
  friendshipResult?: FriendshipResult;
  // 일할 때의 나(work) 결과 — 위 세 결과 필드와 완전히 같은 역할이다.
  // 친구·인간관계와 마찬가지로 심화(선택) 경로가 없어 quizDepth류
  // 필드는 없다.
  workResult?: WorkResult;
  // 취향(taste) 결과 — 위 네 결과 필드와 완전히 같은 역할이다. 심화
  // (선택) 경로가 없어 quizDepth류 필드는 없다.
  tasteResult?: TasteResult;
  // 여행 스타일(travelStyle) 결과 — 위 다섯 결과 필드와 완전히 같은
  // 역할이다. 심화(선택) 경로가 없어 quizDepth류 필드는 없다.
  travelResult?: TravelResult;
  // /api/share가 "이 서버가 실제로 만든 결과인가"를 검증할 때 쓰는 HMAC
  // 서명(engine/result-signature.ts). 생성 라우트가 결과와 함께 내려주고,
  // 공유 시에만 그대로 옆에 실어 보낸다 — 대화 원문처럼 민감한 값이
  // 아니라 그냥 16진수 문자열이라 세션에 그대로 저장해도 된다.
  idealTypeResultSignature?: string | null;
  selfIntroResultSignature?: string | null;
  friendshipResultSignature?: string | null;
  workResultSignature?: string | null;
  tasteResultSignature?: string | null;
  travelResultSignature?: string | null;
  // 진로 결과는 블록별로 따로 재생성할 수 있어(Result.tsx의
  // regenerateBlock), 결과 전체가 아니라 블록마다 독립된 서명을 가진다 —
  // 한 블록만 다시 만들어도 그 블록의 서명만 갱신되고 나머지는 그대로다.
  resultBlockSignatures?: Partial<Record<ResultBlockKey, string | null>>;
  // 6개 퀴즈형 주제(IdealTypeCard 등)가 결과 생성 요청을 보내기 직전에
  // true로 세팅하고, 응답이 도착하면(성공·차단·오류 어느 쪽이든) 다시
  // false로 되돌린다. 한 세션에서 동시에 두 주제를 생성할 일은 없으므로
  // (topicId 하나당 결과 필드도 하나) 주제별로 나누지 않고 이 필드
  // 하나만 둔다. 목적은 "탭이 배경에서 메모리 압박으로 폐기됐다가
  // 새로고침으로 돌아온 경우"를 감지하는 것뿐이다 — 이 필드가 true인
  // 채로 페이지가 새로 로드되면(정상 응답 경로를 못 타고 죽었다는 뜻),
  // 다음 마운트는 "이전에 시작한 생성이 있었다"를 알 수 있다. 서버 쪽
  // 캐시(generation-cache.ts)가 실제로 결과를 갖고 있는지는 이 필드로
  // 알 수 없다 — 그저 "물어볼 가치가 있다"는 힌트일 뿐이라, 대기 화면
  // 첫 문구를 바꾸는 데만 쓴다(각 *Card.tsx의 isResuming 참고).
  pendingResultGeneration?: boolean;
};

export type FactorMatrixItem = { id: string; text: string; kind: NodeKind; x: number; y: number };
export type FactorMatrixBlock = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  factors: FactorMatrixItem[];
};

export type ScenarioItem = { id: string; name: string; summary: string; pros: string[]; cons: string[] };
export type ScenarioBlock = {
  scenarios: ScenarioItem[];
  closestFit: { scenarioId: string; reasoning: string } | null;
};

export type TimelinePhase = { id: string; label: string; actions: string[] };
export type TimelineBlock = { phases: TimelinePhase[] };

export type InsightBlock = { messages: string[] };

export type FinalResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5" | "claude-haiku-4-5";
  factorMatrix: FactorMatrixBlock;
  scenarios: ScenarioBlock;
  timeline: TimelineBlock;
  insights: InsightBlock;
};

export type ResultBlockKey = "factorMatrix" | "scenarios" | "timeline" | "insights";
// generate-result/route.ts(생성)와 share/route.ts(공유 저장 시 서명 검증)가
// 같은 블록 목록을 써야 한다 — 한쪽만 목록을 바꾸면 새/삭제된 블록의
// 서명이 조용히 검증되지 않거나 항상 실패하게 된다.
export const RESULT_BLOCK_KEYS: ResultBlockKey[] = ["factorMatrix", "scenarios", "timeline", "insights"];

// 이상형 결과는 "입력을 정리"하는 게 아니라 "입력을 재료로 발견을 주는"
// 7요소 구조다. 배열은 전부 개수 제한 없이(Structured Outputs가
// maxItems/minItems를 지원하지 않는 문제를 피하려고) 선언하고, 화면에
// 너무 많이 나오지 않도록 자르는 건 항상 코드(.slice())에서 한다 —
// engine/ideal-type-generator.ts 참고.
export type IdealTypeCriteria = { mustHave: string[]; niceToHave: string[]; canCompromise: string[] };
export type IdealTypeMatrixPoint = { label: string; description: string; x: number; y: number };
export type IdealTypeMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: IdealTypeMatrixPoint[];
};
export type IdealTypeFlags = { green: string[]; red: string[] };
export type IdealTypeSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
export type IdealTypeRoadmapPhase = { label: string; actions: string[] };
export type IdealTypeRoadmap = { firstAction: string; phases: IdealTypeRoadmapPhase[] };

export type IdealTypeResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  criteria: IdealTypeCriteria;
  attractionPatterns: string[];
  matrix: IdealTypeMatrix;
  flags: IdealTypeFlags;
  selfReflection: IdealTypeSelfReflection;
  roadmap: IdealTypeRoadmap;
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts가 퀴즈 답변(session.
  // quizAnswers)만 보고 고정 사전에서 코드로 결정적으로 골라 여기 얹는다.
  // 이 필드가 생기기 전에 만들어진 결과·공유 링크는 undefined로 읽히고,
  // 화면은 그 경우 태그 줄만 생략하고 나머지는 그대로 보여준다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

// 나 소개·성격(selfIntro) 결과 — 이상형과 태그 4축(relationship/
// lifestyle/experienceStressResponse/binary1)을 공유하지만, 질문은
// "상대에게 원하는 것"이 아니라 "나는 실제로 어떻게 행동하는지"를
// 묻는다(docs/NASOGAE_DESIGN.md 참고). 필드 이름은 이상형과 다르게
// 붙였지만(coreValues/patterns/traits), selfReflection만은 발상이
// 완전히 같아 그대로 재사용한다. 배열에 개수 제한을 두지 않는 이유는
// 이상형과 동일(Structured Outputs가 maxItems/minItems를 지원하지
// 않음) — engine/self-intro-generator.ts에서 코드로 자른다.
export type SelfIntroCoreValues = { mustKeep: string[]; important: string[]; flexible: string[] };
export type SelfIntroMatrixPoint = { label: string; description: string; x: number; y: number };
export type SelfIntroMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: SelfIntroMatrixPoint[];
};
export type SelfIntroTraits = { strengths: string[]; cautions: string[] };
export type SelfIntroRoadmapPhase = { label: string; actions: string[] };
export type SelfIntroRoadmap = { firstAction: string; phases: SelfIntroRoadmapPhase[] };

export type SelfIntroResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  coreValues: SelfIntroCoreValues;
  patterns: string[];
  matrix: SelfIntroMatrix;
  traits: SelfIntroTraits;
  selfReflection: IdealTypeSelfReflection;
  roadmap: SelfIntroRoadmap;
  // 이상형과 같은 4축·18개 태그 사전(engine/ideal-type-tags.ts)을 그대로
  // 재사용한다 — 나소개×이상형 교차 비교(engine/compatibility.ts)가
  // 성립하려면 두 결과의 태그가 같은 문자열 체계여야 한다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

// 친구·인간관계(friendship) 결과 — 이상형·나 소개와 태그 축 일부를
// 공유하지만(engine/ideal-type-tags.ts, 태그 시스템을 세 번째 주제까지
// 확장한 PR 참고), 질문은 "연애 상대"가 아니라 "내가 관계를 맺고
// 유지하는 방식"을 묻는다. 필드 이름은 이상형·나 소개 둘 다와
// 다르게 붙였다(friendCriteria/friendTypes) — "상대"라는 개념이 없는
// 주제라 그대로 재사용하면 어색해서다. selfReflection만은 발상이
// 완전히 같아 그대로 재사용한다. 배열에 개수 제한을 두지 않는 이유는
// 이상형·나 소개와 동일(Structured Outputs가 maxItems/minItems를
// 지원하지 않음) — engine/friendship-generator.ts에서 코드로 자른다.
export type FriendshipCriteria = { essential: string[]; bonus: string[]; flexible: string[] };
export type FriendshipMatrixPoint = { label: string; description: string; x: number; y: number };
export type FriendshipMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: FriendshipMatrixPoint[];
};
export type FriendshipTypes = { wellMatched: string[]; friction: string[] };
export type FriendshipRoadmapPhase = { label: string; actions: string[] };
export type FriendshipRoadmap = { firstAction: string; phases: FriendshipRoadmapPhase[] };

export type FriendshipResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  friendCriteria: FriendshipCriteria;
  patterns: string[];
  matrix: FriendshipMatrix;
  friendTypes: FriendshipTypes;
  selfReflection: IdealTypeSelfReflection;
  roadmap: FriendshipRoadmap;
  // 이상형·나 소개와 일부 축을 공유하는 태그 사전(engine/ideal-type-tags.ts)을
  // 재사용한다 — 세 주제 사이 교차 비교(engine/compatibility.ts)가
  // 성립하려면 결과의 태그가 같은 문자열 체계여야 한다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

// 일할 때의 나(work) 결과 — 이상형·나 소개·친구와 태그 축 일부를
// 공유하지만(engine/ideal-type-tags.ts, 태그 시스템을 네 번째 주제까지
// 확장한 PR 참고), career(진로·이직·큰 결정)와는 완전히 다른 성격이다 —
// career는 "다음에 뭘 할까"를 정하는 자유 대화형 의사결정이고, work는
// "나는 어떻게 일하는 사람인가"를 진단하는 퀴즈형 성향 결과다. 필드
// 이름도 career(factorMatrix/scenarios/timeline/insights)와 다르게,
// 다른 세 퀴즈형 주제(criteria/patterns/matrix/…selfReflection/roadmap)
// 골격을 따른다. selfReflection만은 그 셋과 발상이 다르다 — 30번 문항
// (자기평가)과 1~29번 행동 답변 사이의 간극을 짚는 게 핵심이라 필드
// 이름을 strengths/blindSpots로 새로 지었다(engine/work-generator.ts
// 참고). 배열에 개수 제한을 두지 않는 이유는 다른 주제와 동일
// (Structured Outputs가 maxItems/minItems를 지원하지 않음) —
// engine/work-generator.ts에서 코드로 자른다.
export type WorkDrivers = { essential: string[]; boost: string[]; optional: string[] };
export type WorkMatrixPoint = { label: string; description: string; x: number; y: number };
export type WorkMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: WorkMatrixPoint[];
};
export type WorkFit = { thriving: string[]; draining: string[] };
export type WorkSelfReflection = { strengths: string[]; blindSpots: string[] };
export type WorkRoadmapPhase = { label: string; actions: string[] };
export type WorkRoadmap = { firstAction: string; phases: WorkRoadmapPhase[] };

export type WorkResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  workDrivers: WorkDrivers;
  patterns: string[];
  matrix: WorkMatrix;
  workFit: WorkFit;
  selfReflection: WorkSelfReflection;
  roadmap: WorkRoadmap;
  // 이상형·나 소개·친구와 일부 축을 공유하는 태그 사전(engine/ideal-type-tags.ts)을
  // 재사용한다 — 네 주제 사이 교차 비교(engine/compatibility.ts)가
  // 성립하려면 결과의 태그가 같은 문자열 체계여야 한다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

// work(strengths/blindSpots)와 이름이 다른 이유: taste는 재해석 축이
// "확실한/상황따라/안 끌리는"(tasteCore) + "취향 인식 vs 실제 사용
// 습관 간극"과 "자기평가 vs 답변 간극"(selfReflection)이라 발상이
// 다르다 — engine/taste-generator.ts 참고. 배열에 개수 제한을 두지
// 않는 이유는 다른 주제와 동일(Structured Outputs가 maxItems/minItems를
// 지원하지 않음) — engine/taste-generator.ts에서 코드로 자른다.
export type TasteCore = { certain: string[]; conditional: string[]; indifferent: string[] };
export type TasteMatrixPoint = { label: string; description: string; x: number; y: number };
export type TasteMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: TasteMatrixPoint[];
};
export type TasteMap = { expand: string[]; avoid: string[] };
export type TasteSelfReflection = { awareness: string[]; blindSpots: string[] };
export type TasteRoadmapPhase = { label: string; actions: string[] };
export type TasteRoadmap = { firstAction: string; phases: TasteRoadmapPhase[] };

export type TasteResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  tasteCore: TasteCore;
  patterns: string[];
  matrix: TasteMatrix;
  tasteMap: TasteMap;
  selfReflection: TasteSelfReflection;
  roadmap: TasteRoadmap;
  // 이상형·나 소개·친구·일할 때의 나와 일부 축을 공유하는 태그 사전
  // (engine/ideal-type-tags.ts)을 재사용한다 — 다섯 주제 사이 교차
  // 비교(engine/compatibility.ts)가 성립하려면 결과의 태그가 같은
  // 문자열 체계여야 한다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

// 6블록(travelCriteria/patterns/matrix/travelFit/selfReflection/roadmap)에서
// 4블록(discovery/matrix/fit/roadmap)으로 재설계했다 — 프로덕션 결과
// 분석에서 같은 발견이 patterns·matrix·selfReflection 세 곳에 반복되고,
// travelCriteria/travelFit도 같은 세 가지를 명사형/문장형으로 두 번
// 쓰는 것에 가까웠다. discovery는 기존 patterns(반복 패턴)와
// selfReflection(자기인식-실제행동 간극)을 한 배열로 합친 것이고, fit은
// 기존 travelCriteria(3단 분류)와 travelFit(잘맞음/안맞음)을 합치되
// 3단 분류는 없애고 잘맞음/안맞음 두 갈래만 남겼다. engine/
// travel-generator.ts 참고. 배열에 개수 제한을 두지 않는 이유는 다른
// 주제와 동일(Structured Outputs가 maxItems/minItems를 지원하지 않음)
// — engine/travel-generator.ts에서 코드로 자른다.
export type TravelMatrixPoint = { label: string; description: string; x: number; y: number };
export type TravelMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: TravelMatrixPoint[];
};
export type TravelFit = { goodFit: string[]; poorFit: string[] };
export type TravelRoadmapPhase = { label: string; actions: string[] };
export type TravelRoadmap = { firstAction: string; phases: TravelRoadmapPhase[] };

export type TravelResult = {
  version: number;
  generatedAt: string;
  model: "claude-sonnet-5";
  title: string;
  oneLiner: string;
  discovery: string[];
  matrix: TravelMatrix;
  fit: TravelFit;
  roadmap: TravelRoadmap;
  // 이상형·나 소개·친구·일할 때의 나·취향과 일부 축을 공유하는 태그
  // 사전(engine/ideal-type-tags.ts)을 재사용한다 — 여섯 주제 사이 교차
  // 비교(engine/compatibility.ts)가 성립하려면 결과의 태그가 같은
  // 문자열 체계여야 한다.
  tags?: string[];
  // AI가 만들지 않는다 — engine/ideal-type-tags.ts의 getStatusLabel이
  // 퀴즈 답변(session.quizAnswers)만 보고 고정 사전에서 코드로
  // 결정적으로 골라 여기 얹는다. 이 필드가 생기기 전에 만들어진
  // 결과·공유 링크는 undefined로 읽히고, 화면은 그 경우 라벨 줄만
  // 생략하고 나머지는 그대로 보여준다.
  statusLabel?: string;
};

export type ConversationProvider = {
  id: "local" | "api";
  nextReply(session: MapSession, latestUserText: string, followUpQuestions?: string[]): Message;
};

export type VoiceProviderState = {
  supported: boolean;
  listening: boolean;
  seconds: number;
  error: string;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

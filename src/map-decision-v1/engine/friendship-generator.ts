import Anthropic from "@anthropic-ai/sdk";
import { FriendshipMatrixPoint, FriendshipResult, FriendshipRoadmapPhase, MapSession } from "../types";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";
import { logGenerationAttempt } from "./generation-timing";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 이상형(ideal-type-generator.ts)·나 소개(self-intro-generator.ts)·
// 진로(final-result-generator.ts)와 완전히 분리된, 친구·인간관계 전용
// 생성기다. 그 세 파일은 건드리지 않는다.
//
// 나 소개와 같은 반전 구조다: "행동만 물었는데 인물 묘사가 나온다."
// 사용자는 시종일관 "이럴 때 실제로 뭐 했어?"라는 행동 질문에만
// 답하고, "당신은 이런 친구입니다"라는 요약은 한 번도 직접 말하지
// 않았는데 AI가 종합해서 던져준다. 다만 이 주제만의 반전이 하나
// 더 있다 — 마지막 문항(30번, "나는 좋은 친구인 것 같아?")이 유일한
// 자기평가 문항이라, 그 대답과 앞선 29개 행동 답변 사이의 간극(또는
// 일치)이 selfReflection의 핵심 재료가 된다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "관계 발견 엔진"이다. 사용자가 친구·인간관계 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 행동 패턴만 물어봤는데도 그 사람이 친구 관계에서 어떤 사람인지 종합해서 보여준다.

퀴즈는 총 30문항이고 전부 필수다. 전부 "실제로 있었던 일에서 실제로 어떻게 행동했는지"만 묻는다 — "당신은 사교적인 사람인가요?" 같은 추상적인 자기평가 문항은 하나도 없다(마지막 30번만 예외 — 아래에서 따로 설명한다). 문항은 관계 맺는 방식(새로운 사람을 만나는 태도·친해지는 속도·지금의 인간관계 구성)·무리에서의 역할(모임을 주도하는지 관찰하는지·약속을 잡는 방식·갈등이 생겼을 때의 위치)·연락과 거리(연락 빈도·오래 연락이 끊겨도 괜찮은지·부담스러운 부탁에 대한 반응)와, 4개 축(이 4개는 태그를 정하는 축이다 — 아래에서 별도로 설명한다)·주고받음(친구를 챙기는 방식·힘들 때 나의 반응·주고받음의 균형)·갈등과 거리(비밀을 지키는 방식·상처받았을 때의 반응·실망한 뒤 관계가 회복됐는지·비교당할 때의 감정)·멀어짐(관계가 끝나는 패턴·다시 연락해본 경험·돌아봤을 때의 아쉬움)·변화와 지금(사람 사귀는 방식이 달라진 계기·바라는 친구상)까지 훨씬 다양한 실생활 영역을 다룬다. 경험형 문항 3개(친구가 힘들어했던 상황·가까웠던 친구와 멀어질 때·예전과 달라진 점) 바로 뒤에는 "그게 언제였고 그때 어떤 상황이었는지"를 한 줄로 적는 자유 서술이 붙어있다(건너뛸 수 있지만, 답했다면 그 경험 답변의 실제 배경을 사용자가 직접 설명한 것이니 가장 근거가 확실한 재료다) — 있다면 patterns와 특히 selfReflection에서 반드시 근거로 활용하라.

앞서 말한 4개 축("모임에서 나는 보통 어떤 역할이야?", "평소 생활에서, 나와 더 가까운 모습은?", "가까운 사람과 갈등이 있을 때, 스트레스를 어떻게 푸는 편이야?", "나는 어떤 쪽에 더 가까워?")은 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 이상형·나 소개 결과와 태그 체계 일부를 공유해서, 태그로 궁합을 비교하는 기능의 재료다. 앞의 세 문항은 최대 3개까지 고를 수 있고, 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다. 태그는 그중 1순위 하나로만 정해진다(사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 마지막 문항("나는 어떤 쪽에 더 가까워?")은 네 가지 중 하나만 고르는 단일 선택이라 고른 답 하나가 전부다. 이 네 문항에서 가장 먼저 고른 답과 다른 결론을 내는 것 자체는 금지가 아니다 — 오히려 답변 사이의 간극을 짚는 것이 selfReflection의 핵심이다. 다만 다른 결론을 낼 때는 가장 먼저 고른 답이 무엇인지 문장 안에서 알 수 있게 쓰고 그 차이를 간극으로 드러내라(예: "~을 가장 먼저 꼽았고, 다른 답변에서는 ~한 모습도 함께 나타난다", "~을 먼저 골랐고, 동시에 ~한 결도 보인다"). 가장 먼저 고른 답을 문장에서 알아볼 수 없는 채로 그와 반대되는 성향으로 단정하지 마라. 두 번째·세 번째로 고른 답을 마치 가장 먼저 고른 답인 것처럼 대표 성향으로 서술하지 마라. 이 규칙은 이 네 문항에 대한 서술 톤에만 적용되고, 다른 문항의 해석 방식에는 영향을 주지 않는다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

★가장 중요한 재해석★: 마지막 문항("나는 좋은 친구인 것 같아?")은 사용자가 스스로를 평가한 유일한 문항이다 — 나머지 29개는 전부 구체적인 행동·상황을 물었을 뿐, "나는 이런 친구다"라고 직접 말한 적이 없다. 이 자기평가와 앞선 행동 답변들 사이의 간극(또는 일치)을 짚는 것이 이 결과의 가장 중요한 재해석 축이다. 예를 들어 "잘 모르겠다"고 답했는데 실제로는 먼저 챙기고 곁을 지키는 행동 패턴이 여러 번 나왔다면 그 간극을, 반대로 "그런 편인 것 같다"고 답했는데 정작 연락도 뜸하고 거리를 두는 답변이 많았다면 그 간극을 selfReflection에서 반드시 짚어라. 다만 이 자기평가는 스스로에 대한 인상 하나일 뿐이다 — 이 간극을 "사실은 좋은 친구가 아니다", "그렇게 생각하는 건 착각이다"처럼 자기 인식 자체를 부정하는 단정으로 쓰지 마라. 대신 "스스로는 좋은 친구인지 확신하지 못하지만, 실제 행동에서는 먼저 챙기고 곁을 지키는 모습이 자주 나타난다"처럼 자기평가와 행동이 서로 다른 결로 함께 있는 것으로 서술하라. 자기평가와 행동 답변이 실제로 서로 맞아떨어지는 경우라면, 그 대신 "왜 그 자기평가가 답변들과 맞아떨어지는지"를 근거로 짚어라. 이 문항이 "자기평가", "마지막 문항"이라는 구조에서 나왔다는 것 자체는 드러내지 말고, 자연스러운 문장으로 풀어 써라.

여러 경험형 답변이 있다고 해서 patterns나 selfReflection의 개수를 억지로 늘리지 마라 — 개수는 각 항목 설명에 적힌 범위 안에서 자연스럽게 정한다. 대신 patterns와 selfReflection 중 최소 한 곳에는 아래 중 하나 이상을 반드시 포함하라 — 단순 요약으로는 쓸 수 없는, 여러 답변을 근거로 삼아야만 쓸 수 있는 문장이어야 한다.
· 예측 — 앞으로 비슷한 상황에서 나타날 가능성이 높은 패턴을 전망하는 문장
· 변화 — "예전과 비교해 사람 사귀는 방식이 어떻게 달라졌는지"에 대한 답을 근거로, 예전과 지금의 차이를 짚는 문장
· 교차 — 서로 다른 질문에 대한 답 2개 이상을 연결해서 만든 해석. 단순 나열이 아니라 두 답변을 이어야만 성립하는 해석이어야 한다.

사용자가 직접 적은 자유 서술 답변에는 친구·인간관계와 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 정상적인 답변으로 다뤄라. 직장·연애·감정에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 불편하더라도 정확하게 써라. title/oneLiner/friendCriteria/patterns/friendTypes/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 사용자가 "혼자 삭이는 편"을 골랐다고 해서 "당신은 혼자 삭이는 편이군요"라고 쓰면 실패다. 대신 "왜 그런 패턴이 반복되는지", "그게 다른 관계에서는 어떻게 나타나는지", "본인은 어떤 친구일 가능성이 높은지"까지 한 걸음 더 들어가야 한다.

★새 원칙 — 반복 금지★: 같은 발견을 여러 블록에서 반복해서 쓰지 마라. 여섯 블록은 서로 다른 역할을 맡는다 — friendCriteria는 답변 전체를 근거로 이 사람에겐 꼭 있어야 하는 것/있으면 좋은 것/없어도 괜찮은 것을 분류하고, patterns는 서로 다른 영역(관계 맺기·역할·연락과 거리·갈등·이별 등)의 답변을 교차했을 때 왜 그런 관계 패턴이 반복되는지를 해석하고, matrix는 그 패턴이 여러 관계 상황(처음 만날 때·무리 안에서·갈등할 때·멀어질 때 등)에서 어떻게 다르게 나타나는지를 위치로 보여주고, friendTypes는 그 패턴을 바탕으로 나와 잘 맞는 사람과 부딪히기 쉬운 사람을 짚고, selfReflection은 그 패턴이 채워주는 필요와 자기평가·실제 행동 사이의 간극(또는 일치)을 다루고, roadmap은 그래서 무엇을 해볼지 구체적인 행동을 담는다. 특히 patterns와 selfReflection이 겹치기 가장 쉽다 — patterns에서 이미 짚은 결을 selfReflection에서 같은 근거·같은 문장으로 다시 쓰지 마라. 최종 결론이 두 블록에서 겹치더라도 그 결론에 도달하는 근거나 적용 범위는 블록마다 달라야 한다 — patterns에 이미 쓴 결이라면 selfReflection에서는 아예 다른 답변 조합에서 나온 다른 결을 찾아 써라.

각 항목 작성 원칙:
- title: "얘 친구로는 ___인 애래"라는 문장에 그대로 넣었을 때 자연스러운, 사용자를 짧게 서술하는 말이다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "다정한", "따뜻한", "든든한" 같은 일반적인 성격 형용사만으로 title을 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 행동·상황·선택을 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. "X한데 속은 Y한", "X하지만 Y한" 같은 대비 구조를 기본값으로 쓰지 마라 — 답변에서 대비가 실제로 두드러질 때만 쓰고, 쓰더라도 많아야 1개까지다. 형용사를 3개 이상 나열하지 않는다. 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. 정해진 유형 목록에서 고르듯 뻔하게 쓰지 말고 매번 새롭게 만들되, 읽자마자 이해되지 않는 표현은 개성이 아니라 실패다. title은 반드시 명사 또는 명사구로 끝나야 한다 — "얘 친구로는 ___인 애래"에 그대로 넣었을 때 문장이 완결돼야 하기 때문이다. "~는", "~한", "~던"처럼 관형절로 끝나서 뒤에 명사가 빠진 채 마무리되면 안 된다. 좋은 예: "거리 두다가도 먼저 연락하는 편", "무리보다 한 명이 편한 사람". 나쁜 예: "거리 두다가도 먼저 연락하는"(뒤에 명사가 없어 문장이 안 끝난다), "무리보다 한 명이 편한"(마찬가지).
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- friendCriteria(essential/bonus/flexible): 사용자의 답변에서 추론해 "이 사람에겐 꼭 있어야 하는 것 / 있으면 좋은 것 / 없어도 괜찮은 것"으로 분류한다. 사용자가 직접 말한 적 없는, 답변을 근거로 역추론한 기준이어야 한다. 각 2~4개.
- patterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 관계 패턴을 짚어준다. 단순 요약이 아니라 "왜 그런 패턴이 반복되는지"에 대한 해석을 담는다. 서로 다른 영역(관계 맺기·역할·갈등·이별 등)의 답변을 최소 2개 이상 교차해서 나온 패턴을 최소 1개는 반드시 반영한다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 두 답을 대조하듯 가르는 간극형 문장으로만 채우지 말고, 반복되는 행동 자체를 짚는 문장, 상황에 따라 달라지는 모습을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚는 문장 자체는 계속 써도 된다 — 골격이 반복되는 것만 피하면 되고, 짚을 때도 두 모습이 공존하는 것으로 자연스럽게 풀어 써라. 2~4개. 항목 하나는 두 문장 이내로 쓴다. 위 ★반복 금지★ 원칙이 이 골격 다양화 지시보다 우선한다 — 먼저 반복 금지 원칙에 따라 이 블록에 남길 결을 추린 뒤, 그렇게 남은 항목들 사이에서만 문장 골격을 다양화하라. 골격을 다양하게 채우겠다고 selfReflection에 넘겨야 할 결(자기평가와의 간극)을 이 블록에 욱여넣지 말고, 반대로 이 블록에서 이미 다룬 결을 골격만 바꿔 selfReflection에 다시 밀어넣지도 마라.
- matrix: 사용자의 답변에서 도출한 2개 축으로 4사분면을 만들고(예: "적극적"↔"신중함", "깊음"↔"넓음" 같이 사용자 답변에 맞는 축을 매번 새로 골라라), 그 위에 사용자 자신의 여러 관계 모습(예: 처음 만날 때의 나 / 무리 안에서의 나 / 갈등할 때의 나 / 멀어질 때의 나)을 각각 하나의 사분면에 배치한다. x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- friendTypes(wellMatched/friction): 사용자의 답변 패턴을 근거로 "나와 잘 맞는 사람" / "부딪히기 쉬운 사람"을 짚는다. 실존 인물이나 정해진 유형이 아니라 성향으로 서술한다. 각 2~4개.
- selfReflection(whatYouOffer/whatToImprove): ★가장 중요한 항목★. whatYouOffer는 patterns에서 이미 다룬 패턴 자체나 그 이유를 다시 확인해주는 자리가 아니다 — patterns가 "무엇이 반복되는지"를 다뤘다면, whatYouOffer는 그 패턴이 친구 관계에서 실제로 어떤 역할을 하는지, 즉 그 패턴이 채워주는 심리적·실용적 필요(예: 안정감, 소속감, 통제감, 신뢰 확보, 거리 조절 등)를 답변을 근거로 짚는다. "그런 편이죠"처럼 이미 아는 내용을 확인해주는 문장으로 끝내지 마라 — patterns와 다른 질문("그게 왜 이 사람에게 필요한지")에 답해야 한다. whatToImprove는 여러 답변을 교차했을 때 드러나는 모순이나 반복되는 약점을 짚는다 — 마지막 문항의 자기평가와 앞선 행동 답변 사이의 간극(또는 일치)을 최소 1개는 반드시 포함한다(위 ★가장 중요한 재해석★ 참고). 짧게 요약하지 말되 두 문장 안에서 끝내라 — 얕게 쓰라는 게 아니라 압축해서 쓰라는 뜻이다. 각 2~4개. ★대조 구문 금지★: patterns와 selfReflection 어디에서도 "~라고 답했지만", "~라고 했지만", "~인데 정작", "~지만 실제로는"처럼 앞 문장의 내용을 뒤 문장이 뒤집는 대조 접속 구조를 쓰지 마라 — 답변자를 모순된 사람으로 단정하는 인상을 준다. 간극을 짚으라는 지시 자체는 그대로다 — 대신 두 모습을 각각 병렬로 서술한 뒤, 그 둘이 어떻게 함께 있을 수 있는지를 설명하는 방식으로 써라(예: "A인 것과 B인 것은 다른 얘기다"처럼, 어느 한쪽도 부정하지 않고 두 사실이 동시에 성립하는 이유를 짚는다).
- roadmap: firstAction은 24시간 안에 시도해볼 수 있는 아주 구체적인 행동 하나(예: "오늘, 연락 안 한 지 오래된 친구한테 안부 문자 하나만 먼저 보내보기"). phases는 이런 상황에서 시도해볼 것들을 30일 동안 단계별로 담는다("1주 이내", "2주 이내", "한 달 이내" 등) 2~4단계, 각 단계에 실행 항목 2~3개.
- 실존 인물이나 유명인의 이름은 절대 언급하지 않는다.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음을 다양하게 쓴다. 기본 어조는 "해요체"(예: "반복돼요", "가능성이 높아요")지만, 같은 어미가 연속 3번 이상 나오면 안 된다 — 특히 "~예요"/"~이에요"/"~거예요"가 줄줄이 이어지지 않게, 평서형 종결(예: "반복된다", "그게 패턴이다"), 명사형 마무리(예: "~하는 편", "~라는 신호"), 짧은 단정(예: "이유는 이거다.")을 같은 블록 안에서 의도적으로 섞어 쓴다 — title/oneLiner/friendCriteria/patterns/matrix의 설명/friendTypes/selfReflection/roadmap 전부 예외 없이 해당된다. 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 예측 문장에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다.
- 길이는 충분히 쓴다. 내용을 줄이지 마라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const FRIENDSHIP_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    friendCriteria: {
      type: "object",
      properties: {
        essential: { type: "array", items: { type: "string" } },
        bonus: { type: "array", items: { type: "string" } },
        flexible: { type: "array", items: { type: "string" } },
      },
      required: ["essential", "bonus", "flexible"],
      additionalProperties: false,
    },
    patterns: { type: "array", items: { type: "string" } },
    matrix: {
      type: "object",
      properties: {
        xAxisLabel: {
          type: "object",
          properties: { low: { type: "string" }, high: { type: "string" } },
          required: ["low", "high"],
          additionalProperties: false,
        },
        yAxisLabel: {
          type: "object",
          properties: { low: { type: "string" }, high: { type: "string" } },
          required: ["low", "high"],
          additionalProperties: false,
        },
        types: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              description: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
            },
            required: ["label", "description", "x", "y"],
            additionalProperties: false,
          },
        },
      },
      required: ["xAxisLabel", "yAxisLabel", "types"],
      additionalProperties: false,
    },
    friendTypes: {
      type: "object",
      properties: {
        wellMatched: { type: "array", items: { type: "string" } },
        friction: { type: "array", items: { type: "string" } },
      },
      required: ["wellMatched", "friction"],
      additionalProperties: false,
    },
    selfReflection: {
      type: "object",
      properties: {
        whatYouOffer: { type: "array", items: { type: "string" } },
        whatToImprove: { type: "array", items: { type: "string" } },
      },
      required: ["whatYouOffer", "whatToImprove"],
      additionalProperties: false,
    },
    roadmap: {
      type: "object",
      properties: {
        firstAction: { type: "string" },
        phases: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              actions: { type: "array", items: { type: "string" } },
            },
            required: ["label", "actions"],
            additionalProperties: false,
          },
        },
      },
      required: ["firstAction", "phases"],
      additionalProperties: false,
    },
  },
  required: ["title", "oneLiner", "friendCriteria", "patterns", "matrix", "friendTypes", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawFriendCriteria = { essential: string[]; bonus: string[]; flexible: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawFriendTypes = { wellMatched: string[]; friction: string[] };
type RawSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawFriendship = {
  title: string;
  oneLiner: string;
  friendCriteria: RawFriendCriteria;
  patterns: string[];
  matrix: RawMatrix;
  friendTypes: RawFriendTypes;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_friend_criteria"
  | "invalid_patterns"
  | "invalid_matrix"
  | "invalid_friend_types"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawFriendship } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidFriendCriteria(value: unknown): value is RawFriendCriteria {
  const c = value as Partial<RawFriendCriteria> | undefined;
  return typeof c === "object" && c !== null && isStringArray(c.essential) && isStringArray(c.bonus) && isStringArray(c.flexible);
}

function isValidMatrix(value: unknown): value is RawMatrix {
  const m = value as Partial<RawMatrix> | undefined;
  if (typeof m !== "object" || m === null) return false;
  if (typeof m.xAxisLabel !== "object" || m.xAxisLabel === null || typeof m.xAxisLabel.low !== "string" || typeof m.xAxisLabel.high !== "string") return false;
  if (typeof m.yAxisLabel !== "object" || m.yAxisLabel === null || typeof m.yAxisLabel.low !== "string" || typeof m.yAxisLabel.high !== "string") return false;
  if (!Array.isArray(m.types)) return false;
  return m.types.every(
    (point) =>
      typeof point === "object" && point !== null &&
      typeof point.label === "string" && typeof point.description === "string" &&
      typeof point.x === "number" && typeof point.y === "number",
  );
}

function isValidFriendTypes(value: unknown): value is RawFriendTypes {
  const t = value as Partial<RawFriendTypes> | undefined;
  return typeof t === "object" && t !== null && isStringArray(t.wellMatched) && isStringArray(t.friction);
}

function isValidSelfReflection(value: unknown): value is RawSelfReflection {
  const s = value as Partial<RawSelfReflection> | undefined;
  return typeof s === "object" && s !== null && isStringArray(s.whatYouOffer) && isStringArray(s.whatToImprove);
}

function isValidRoadmap(value: unknown): value is RawRoadmap {
  const r = value as Partial<RawRoadmap> | undefined;
  if (typeof r !== "object" || r === null || typeof r.firstAction !== "string" || !Array.isArray(r.phases)) return false;
  return r.phases.every((phase) => typeof phase === "object" && phase !== null && typeof phase.label === "string" && isStringArray(phase.actions));
}

// AI 응답 본문(사용자 퀴즈 답변을 그대로 반영)을 로그에 남기지 않기
// 위해 실패 사유만 반환한다 — self-intro-generator.ts와 같은 방식이다.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawFriendship>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidFriendCriteria(candidate.friendCriteria)) return { ok: false, reason: "invalid_friend_criteria" };
  if (!isStringArray(candidate.patterns)) return { ok: false, reason: "invalid_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidFriendTypes(candidate.friendTypes)) return { ok: false, reason: "invalid_friend_types" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawFriendship };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다(이상형·나 소개와 같은 이유).
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): FriendshipMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): FriendshipRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// 이상형·나 소개와 같은 이유(Sonnet 5의 기본 사고 토큰이 max_tokens
// 예산에 포함됨)로 같은 상한·재시도 방식을 그대로 쓴다 —
// engine/ideal-type-generator.ts 참고.
const FRIENDSHIP_MAX_TOKENS = 16384;
const FRIENDSHIP_MAX_TOKENS_RETRY = 16384;

// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한에 넣을지.
// 서버 쪽 원인(engine/generation-error.ts)은 false, 빈 응답·스키마
// 검증 실패는 항상 true — ideal-type-generator.ts와 같은 원칙이다.
async function attemptGeneration(
  client: Anthropic,
  session: MapSession,
  maxTokens: number,
  attempt: number,
  generationStartedAt: number,
): Promise<{ result: FriendshipResult | null; truncated: boolean; countsAsFailure: boolean }> {
  let responseText: string | undefined;
  let truncated = false;
  let outputTokens: number | null = null;
  let thinkingTokens: number | null = null;
  // getGenerationEffort()는 호출될 때마다 "[generation] effort=..."를
  // 로그로 남긴다 — 아래 계측 로그에도 같은 값을 실어야 하니 한 번만
  // 불러 변수에 담아 재사용한다(두 번 부르면 그 로그도 두 번 남는다).
  const effort = getGenerationEffort();
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `사용자가 친구·인간관계 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort,
        format: { type: "json_schema", schema: FRIENDSHIP_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    outputTokens = response.usage?.output_tokens ?? null;
    thinkingTokens = response.usage?.output_tokens_details?.thinking_tokens ?? null;
    if (truncated) {
      console.warn("[friendship-generator] response truncated by max_tokens", {
        maxTokens,
        outputTokens,
        thinkingTokens,
      });
    }
    responseText = response.content.find((block) => block.type === "text")?.text;
  } catch (error) {
    // status를 별도 필드로 분리해 Vercel 로그 검색으로 원인(401/429/타임아웃 등)을
    // 바로 구분할 수 있게 한다. error 객체를 통째로 넘기지 않는 이유는 Anthropic
    // SDK의 APIError.error(응답 JSON 본문)에 어떤 내용이 실릴지 보장할 수 없어서다
    // — status/type/message처럼 원인 구분에 필요한 안전한 필드만 남긴다.
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    const type = error instanceof Anthropic.APIError ? error.type : undefined;
    const serverSide = isServerSideGenerationError(error);
    console.error("[friendship-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    logGenerationAttempt({ topic: "friendship", attempt, generationStartedAt, effort, outcome: { kind: "api_error" } });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[friendship-generator] empty response from Claude");
    logGenerationAttempt({
      topic: "friendship",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "api_error" },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[friendship-generator] response failed schema validation", { reason: parsed.reason, truncated });
    logGenerationAttempt({
      topic: "friendship",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "schema_invalid", outputTokens, thinkingTokens },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const data = parsed.data;
  const result: FriendshipResult = {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    friendCriteria: {
      essential: capArray(data.friendCriteria.essential, 4),
      bonus: capArray(data.friendCriteria.bonus, 4),
      flexible: capArray(data.friendCriteria.flexible, 4),
    },
    patterns: capArray(data.patterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    friendTypes: {
      wellMatched: capArray(data.friendTypes.wellMatched, 4),
      friction: capArray(data.friendTypes.friction, 4),
    },
    selfReflection: {
      whatYouOffer: capArray(data.selfReflection.whatYouOffer, 4),
      whatToImprove: capArray(data.selfReflection.whatToImprove, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // 이상형·나 소개와 축 일부를 공유하는 태그 사전을 그대로 재사용한다 —
    // 세 주제 사이 교차 비교(engine/compatibility.ts)가 성립하려면
    // 결과의 태그가 같은 문자열 체계여야 한다.
    tags: getIdealTypeTags(session.quizAnswers, "friendship"),
  };
  logGenerationAttempt({ topic: "friendship", attempt, generationStartedAt, effort, outcome: { kind: "success", outputTokens, thinkingTokens } });
  return { result, truncated, countsAsFailure: false };
}

// 2회 재시도는 잘림(truncation)으로 실패한 요청을 "같은 max_tokens 상한"으로
// 다시 돌리는 구조라 실제로 구제되는지 불확실한 반면(잘려서 실패한 이유가
// 그대로면 재시도도 같은 이유로 다시 잘릴 수 있다), 1회당 실측 최대 151초
// 걸리는 시도를 두 번 이어 돌리면 151×2=302초로 maxDuration(300초, Hobby +
// Fluid Compute 상한이라 이 이상 올릴 수 없다)을 확실히 넘겨 504로 끊긴다
// — 실제 프로덕션 타임아웃 2건이 정확히 이 패턴이었다. 불확실한 구제
// 효과보다 확실한 타임아웃을 피하는 쪽을 택해 1로 낮춘다. 재시도 루프
// 구조 자체는 그대로 남겨둔다 — 나중에 시간 예산이 늘어나면(예: 플랜
// 업그레이드) 이 값만 다시 올리면 된다.
const MAX_GENERATION_ATTEMPTS = 1;

export type FriendshipGenerationOutcome = { result: FriendshipResult | null; countsAsFailure: boolean };

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// countsAsFailure(반환값): ideal-type-generator.ts의 같은 이름 값과
// 같은 규칙 — 재시도 2회 중 하나라도 입력/출력 내용 때문에 실패했으면
// 최종적으로도 카운트한다.
export async function generateFriendshipResult(session: MapSession): Promise<FriendshipGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[friendship-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  const generationStartedAt = Date.now();
  let maxTokens = FRIENDSHIP_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptGeneration(client, session, maxTokens, attempt, generationStartedAt);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = FRIENDSHIP_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

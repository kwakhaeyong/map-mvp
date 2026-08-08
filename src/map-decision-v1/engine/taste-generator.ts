import Anthropic from "@anthropic-ai/sdk";
import { MapSession, TasteMatrixPoint, TasteResult, TasteRoadmapPhase } from "../types";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";
import { logGenerationAttempt } from "./generation-timing";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 이상형·나 소개·친구·인간관계·일할 때의 나(work-generator.ts)와 완전히
// 분리된, 취향 전용 생성기다. 그 다섯 파일은 건드리지 않는다.
//
// work와 같은 성격의 퀴즈형 성향 주제이지만, 문항이 20개뿐이라 다른
// 다섯 주제(30~38문항)보다 근거가 훨씬 적다 — SYSTEM_PROMPT 전반에
// "과도하게 단정하지 말라"는 지시를 넣은 이유다. 이 주제만의 반전은
// 두 갈래다: (1) 1번(혼자 있을 때 뭘 하는지에 대한 자기인식)과 2번(최근
// 일주일 실제 시간 사용)의 간극, (2) 20번(취향이 뚜렷한지에 대한
// 자기평가)과 앞선 19개 답변 사이의 간극. work는 반전이 1개(마지막
// 자기평가 vs 행동)뿐이지만 taste는 2개다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "취향 발견 엔진"이다. 사용자가 취향 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 낱개 선택으로는 안 보이던 취향의 결을 종합해서 보여준다.

퀴즈는 총 20문항이고 전부 필수다. 이상형·나 소개·친구·인간관계·일할 때의 나(30~38문항)보다 훨씬 짧다 — 그만큼 근거가 적다는 뜻이다. 확신에 찬 단정을 피하고, 여러 답변이 같은 방향을 가리킬 때만 뚜렷하게 쓰고 그렇지 않으면 조심스럽게 짚어라. 문항은 시간을 쓰는 방식(혼자 있는 시간·최근 일주일 실제 사용·몰입 방식·발견 경로·여윳돈의 행방)·무엇에 끌리는가(분위기·이야기에서 중요한 것·편한 공간·음식 앞에서의 태도·눈이 가는 스타일과 4개 축 중 하나인 생활 습관)·취향의 온도(공유하는 태도·유행에 대한 태도·반복 감상·남들에게 말 못할 취향·변화 양상)·취향과 나(자유 서술·취향의 의미·잘 맞는 사람과의 만남·마지막 자기평가)까지 4개 구간으로 이어진다. 자유 서술은 17번("최근에 뭔가에 푹 빠졌던 게 언제였어요? 그게 뭐였고 왜 좋았는지 적어주세요") 하나뿐이다 — 다른 다섯 주제는 자유 서술이 2~3개씩 있는데, taste는 1개뿐이라 이 답변의 비중이 상대적으로 크다. 답했다면(건너뛸 수 있다) 가장 근거가 확실한 재료이니 tasteCore·patterns·selfReflection에서 반드시 활용하라. 건너뛰었다면 그 사실을 지적하지 말고 다른 답변만으로 자연스럽게 채워라.

이 중 4개 축("혼자 있는 시간에 나는 주로 뭘 해?", "평소 생활에서, 나와 더 가까운 모습은?", "예전과 비교하면 내 취향은?", "좋아하는 게 생기면 나는 어느 쪽이야?")은 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 이상형·나 소개·친구·인간관계·일할 때의 나 결과와 태그 체계 일부를 공유해서, 태그로 궁합을 비교하는 기능의 재료다. 이 네 문항 중 "평소 생활에서..." 하나만 최대 3개까지 고를 수 있어 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다(태그는 그중 1순위 하나로만 정해진다 — 사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 나머지 세 문항("혼자 있는 시간에...", "예전과 비교하면...", "좋아하는 게 생기면...")은 전부 하나만 고르는 단일 선택이라 우선순위 개념 자체가 없다 — 고른 답 하나가 전부다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

★핵심 재해석 (1)★: 1번 문항("혼자 있는 시간에 나는 주로 뭘 해?")은 딱 하나만 고르는 자기인식 답변이고, 2번 문항("최근 일주일, 실제로 시간을 가장 많이 쓴 건?")은 최대 3개까지 고를 수 있는 실제 사용 기록이다(2번에서 여러 개를 골랐다면 그중 1순위, 즉 가장 먼저 고른 것과 비교하라). 이 둘 사이의 간극이 이 결과의 핵심 재료 중 하나다 — 예를 들어 1번에서 "읽는 편"이라고 답했는데 2번의 1순위가 "영상 보기"처럼 실제로는 다른 방식으로 시간을 썼다면, 그 간극을 짚어라. 다만 2번은 "최근 일주일"이라는 짧은 표본일 뿐이다 — 이 간극을 "평소 이미지가 틀렸다", "실제로는 그런 사람이 아니다"처럼 자기 인식 자체를 부정하는 단정으로 쓰지 마라. 대신 "평소에는 책을 붙잡고 있는 시간이 많은 편이지만, 최근 한 주는 유독 영상에 시간을 많이 썼다"처럼 평소 이미지와 최근 한 주가 다르게 나타난 것으로 서술하고, 왜 그 한 주만 달랐을지 다른 답변에서 근거를 찾을 수 있다면 함께 짚어라. 두 답이 실제로 같은 방향이라면(예: 1번 "읽는 편" + 2번 1순위 "책·글 읽기") 억지로 간극을 만들지 말고, 대신 왜 그 두 답이 서로 맞아떨어지는지를 근거로 짚어라.

★핵심 재해석 (2)★: 마지막 문항("나는 취향이 뚜렷한 사람인 것 같아?")은 사용자가 스스로를 평가한 유일한 문항이다 — 나머지 19개는 전부 구체적인 선호·행동을 물었을 뿐, "내 취향은 이렇다"라고 직접 말한 적이 없다. 이 자기평가와 앞선 19개 답변 사이의 간극(또는 일치)을 짚는 것이 이 결과의 또 다른 핵심 재해석 축이다. 예를 들어 "잘 모르겠다"고 답한 것과 분위기·이야기·스타일 답변이 뚜렷하게 한 방향으로 모여 있었던 것은 다른 얘기다. 반대로 "그런 편인 것 같다"고 답한 것과 답변들이 서로 다른 방향으로 흩어져 있었던 것도 다른 얘기다. 이런 간극을 selfReflection에서 반드시 짚어라. 자기평가와 답변들이 실제로 서로 맞아떨어지는 경우라면, 그 대신 왜 그 자기평가가 답변들과 맞아떨어지는지를 근거로 짚어라.

위 두 재해석은 반드시 selfReflection에서 다뤄야 한다(하나는 확실히, 나머지 하나도 가능하면 함께). 이 문항들이 "자기인식 문항", "마지막 문항"이라는 구조에서 나왔다는 것 자체는 드러내지 말고, 자연스러운 문장으로 풀어 써라.

★중요★: 취향에 우열을 매기지 마라. "이런 취향이 더 좋다", "더 깊이 있다", "더 고급스럽다" 같은 뉘앙스는 절대 쓰지 않는다. 어떤 취향이든 그 사람에게 의미가 있다는 전제로 서술하라. patterns·tasteMap·selfReflection처럼 방향을 나누는 항목에서도, "넓혀볼 만한 방향"은 지금 것보다 나은 대안이 아니라 그냥 아직 안 가본 결이라는 톤으로 써라.

★중요★: 특정 브랜드명·작품명(영화·드라마·게임·음악 제목 등)·실존 인물명(연예인·유튜버 등)을 결과에 쓰지 마라. "넷플릭스"가 아니라 "영상 스트리밍", "아이유"가 아니라 "좋아하는 아티스트"처럼 범주로만 서술한다. 다만 사용자가 자유 서술(17번)에 직접 브랜드명·작품명·인물명을 적었다면, 그건 사용자 본인이 쓴 말이니 그 부분만은 그대로 다뤄도 된다 — 사용자가 적지 않은 구체적인 이름을 AI가 새로 지어내 결과에 넣지 말라는 뜻이다.

사용자가 직접 적은 자유 서술 답변에는 취향과 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 정상적인 답변으로 다뤄라. 남들에게 말하기 애매한 취향(17번·15번)에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 불편하더라도 정확하게 써라. title/oneLiner/tasteCore/patterns/tasteMap/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 사용자가 "혼자 간직하는 편"을 골랐다고 해서 "당신은 혼자 간직하는 편이군요"라고 쓰면 실패다. 대신 "왜 그런 태도가 반복되는지", "그게 다른 상황에서는 어떻게 나타나는지", "본인의 취향이 실제로 어떤 결일 가능성이 높은지"까지 한 걸음 더 들어가야 한다.

★새 원칙 — 반복 금지★: 같은 발견을 여러 블록에서 반복해서 쓰지 마라. 여섯 블록은 서로 다른 역할을 맡는다 — tasteCore는 답변 전체를 근거로 무엇에 확실히/상황에 따라/무관심하게 끌리는지를 나눠 분류하고, patterns는 서로 다른 구간의 답변을 교차했을 때 왜 그런 결이 반복되는지를 해석하고, matrix는 그 결이 여러 상황(새로운 것을 접할 때·몰입할 때·나눌 때·유행 앞에서 등)에서 어떻게 다르게 나타나는지를 위치로 보여주고, tasteMap은 그 결을 바탕으로 앞으로 넓혀볼 만한 방향과 안 맞을 방향을 짚고, selfReflection은 사용자가 스스로 아는 것·모르는 것과 실제 답변 사이의 간극 또는 일치를 다루고, roadmap은 그래서 무엇을 해볼지 구체적인 행동을 담는다. 특히 patterns와 selfReflection이 겹치기 가장 쉽다 — patterns에서 이미 짚은 결(예: "혼자 간직하는 편이다", "분위기가 기준이다")을 selfReflection에서 같은 근거·같은 문장으로 다시 쓰지 마라. 최종 결론이 두 블록에서 겹치더라도 그 결론에 도달하는 근거나 적용 범위는 블록마다 달라야 한다 — patterns에 이미 쓴 결이라면 selfReflection에서는 아예 다른 답변 조합에서 나온 다른 결을 찾아 써라.

각 항목 작성 원칙:
- title: "내 취향은 한마디로 ___"라는 문장에 그대로 넣었을 때 자연스러운, 사용자의 취향을 짧게 서술하는 말이다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "감성적인", "다양한" 같은 일반적인 형용사만으로 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 분위기·경로·태도를 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. 형용사를 3개 이상 나열하지 않는다. 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. title은 반드시 명사 또는 명사구로 끝나야 한다 — "내 취향은 한마디로 ___"에 그대로 넣었을 때 문장이 완결돼야 하기 때문이다. "~는", "~한", "~던"처럼 관형절로 끝나서 뒤에 명사가 빠진 채 마무리되면 안 된다. 좋은 예: "한번 꽂히면 끝까지 파는 몰입러", "낯선 것에 먼저 손 가는 탐험가". 나쁜 예: "한번 꽂히면 끝까지 파는"(뒤에 명사가 없어 문장이 안 끝난다), "낯선 것에 먼저 손 가는"(마찬가지).
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- tasteCore(certain/conditional/indifferent): 사용자의 취향을 세 단계로 나눈다. certain은 답변에서 일관되게 드러나는, 확실히 끌리는 것. conditional은 답변에 따라 상황(기분·맥락)에 따라 달라지는 것. indifferent는 답변에서 딱히 끌리지 않거나 무관심하게 나타난 것. 사용자가 직접 말한 적 없는, 답변을 근거로 종합한 결과여야 한다. 각 2~4개.
- patterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 취향의 결을 짚어준다. 단순 요약이 아니라 "왜 그런 결이 반복되는지"에 대한 해석을 담는다. 서로 다른 구간(시간 사용·끌림·온도·자기인식 등)의 답변을 최소 2개 이상 교차해서 나온 패턴을 최소 1개는 반드시 반영한다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 두 답을 대조하듯 가르는 간극형 문장으로만 채우지 말고, 반복되는 태도 자체를 짚는 문장, 상황에 따라 달라지는 모습을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚을 때도 두 모습이 공존하는 것으로 자연스럽게 풀어 써라. 2~4개. 위 ★반복 금지★ 원칙이 이 골격 다양화 지시보다 우선한다 — 먼저 반복 금지 원칙에 따라 이 블록에 남길 결을 추린 뒤, 그렇게 남은 항목들 사이에서만 문장 골격을 다양화하라. 골격을 다양하게 채우겠다고 selfReflection에 넘겨야 할 결(자기인식과의 간극)을 이 블록에 욱여넣지 마라.
- matrix: 사용자의 답변에서 도출한 2개 축으로 4사분면을 만들고(예: "익숙함"↔"낯섦", "혼자"↔"같이" 같이 사용자 답변에 맞는 축을 매번 새로 골라라), 그 위에 사용자의 여러 취향 모습(예: 새로운 걸 접할 때의 나 / 몰입할 때의 나 / 남과 취향을 나눌 때의 나 / 유행 앞에서의 나)을 각각 하나의 사분면에 배치한다. x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- tasteMap(expand/avoid): 사용자의 답변 패턴을 근거로 "넓혀볼 만한 방향" / "안 맞을 방향"을 짚는다. 위 ★중요★(우열 금지) 원칙을 반드시 지켜라 — "넓혀볼 만한 방향"은 더 나은 취향이 아니라 지금 결과 자연스럽게 이어질 법한, 아직 안 가본 결이라는 톤으로 쓰고, "안 맞을 방향"도 부족하다는 뉘앙스 없이 그냥 지금 결과 안 맞을 뿐이라는 톤으로 쓴다. 구체적인 브랜드·작품명이 아니라 범주로 서술한다. 각 2~4개.
- selfReflection(awareness/blindSpots): ★가장 중요한 항목★. awareness는 patterns에서 이미 다룬 결 자체나 그 이유를 다시 확인해주는 자리가 아니다 — patterns가 "무엇이 반복되는지"를 다뤘다면, awareness는 그 결이 이 사람에게 실제로 어떤 역할을 하는지, 즉 그 결이 채워주는 심리적·실용적 필요(예: 안정감, 통제감, 몰입, 회복, 정체성 표현, 관계에서의 안전거리 등)를 답변을 근거로 짚는다. "그런 편이죠", "이미 느끼고 있을 습관이다"처럼 이미 아는 내용을 확인해주는 문장으로 끝내지 마라 — patterns와 다른 질문("그게 왜 이 사람에게 필요한지")에 답해야 한다. blindSpots는 여러 답변을 교차했을 때 드러나는, 본인은 잘 모를 수 있는 결이다 — 위 ★핵심 재해석 (1)★과 ★핵심 재해석 (2)★ 중 최소 하나는 반드시 포함한다. 각 정확히 2개 — 가장 강한 발견만 고른다. ★대조 구문 금지★: patterns와 selfReflection 어디에서도 "~라고 답했지만", "~라고 했지만", "~인데 정작", "~지만 실제로는"처럼 앞 문장의 내용을 뒤 문장이 뒤집는 대조 접속 구조를 쓰지 마라 — 답변자를 모순된 사람으로 단정하는 인상을 준다. 간극을 짚으라는 지시 자체는 그대로다 — 대신 두 모습을 각각 병렬로 서술한 뒤, 그 둘이 어떻게 함께 있을 수 있는지를 설명하는 방식으로 써라(예: "A인 것과 B인 것은 다른 얘기다"처럼, 어느 한쪽도 부정하지 않고 두 사실이 동시에 성립하는 이유를 짚는다).
- roadmap: firstAction은 24시간 안에 시도해볼 수 있는 아주 구체적인 행동 하나(예: "오늘, 평소라면 안 골랐을 분위기의 콘텐츠 하나만 틀어보기"). phases는 취향을 조금씩 넓혀보거나 지금 결을 더 즐기는 방법을 30일 동안 단계별로 담는다("1주 이내", "2주 이내", "한 달 이내" 등) 2~4단계, 각 단계에 실행 항목 2~3개.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음을 다양하게 쓴다. 기본 어조는 "해요체"(예: "반복돼요", "가능성이 높아요")지만, 같은 어미가 연속 3번 이상 나오면 안 된다 — 특히 "~예요"/"~이에요"/"~거예요"가 줄줄이 이어지지 않게, 평서형 종결(예: "반복된다", "그게 결이다"), 명사형 마무리(예: "~하는 편", "~라는 신호"), 짧은 단정(예: "이유는 이거다.")을 같은 블록 안에서 의도적으로 섞어 쓴다 — title/oneLiner/tasteCore/patterns/matrix의 설명/tasteMap/selfReflection/roadmap 전부 예외 없이 해당된다. 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 재해석 문장에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다.
- 근거가 20문항뿐이라는 점을 항상 의식하라. 확실한 근거가 있을 때만 뚜렷하게 단정하고, 근거가 약하면 "~인 편으로 보여요", "~일 수 있어요"처럼 여지를 남기는 표현을 섞어 써라. 다만 이 지시가 애매하고 흐릿한 결과를 쓰라는 뜻은 아니다 — 근거가 확실한 부분은 확실하게 쓰고, 그렇지 않은 부분만 조심스럽게 쓰라는 뜻이다.
- 깊이는 줄이지 마라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const TASTE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    tasteCore: {
      type: "object",
      properties: {
        certain: { type: "array", items: { type: "string" } },
        conditional: { type: "array", items: { type: "string" } },
        indifferent: { type: "array", items: { type: "string" } },
      },
      required: ["certain", "conditional", "indifferent"],
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
    tasteMap: {
      type: "object",
      properties: {
        expand: { type: "array", items: { type: "string" } },
        avoid: { type: "array", items: { type: "string" } },
      },
      required: ["expand", "avoid"],
      additionalProperties: false,
    },
    selfReflection: {
      type: "object",
      properties: {
        awareness: { type: "array", items: { type: "string" } },
        blindSpots: { type: "array", items: { type: "string" } },
      },
      required: ["awareness", "blindSpots"],
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
  required: ["title", "oneLiner", "tasteCore", "patterns", "matrix", "tasteMap", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawTasteCore = { certain: string[]; conditional: string[]; indifferent: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawTasteMap = { expand: string[]; avoid: string[] };
type RawSelfReflection = { awareness: string[]; blindSpots: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawTaste = {
  title: string;
  oneLiner: string;
  tasteCore: RawTasteCore;
  patterns: string[];
  matrix: RawMatrix;
  tasteMap: RawTasteMap;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_taste_core"
  | "invalid_patterns"
  | "invalid_matrix"
  | "invalid_taste_map"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawTaste } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidTasteCore(value: unknown): value is RawTasteCore {
  const c = value as Partial<RawTasteCore> | undefined;
  return typeof c === "object" && c !== null && isStringArray(c.certain) && isStringArray(c.conditional) && isStringArray(c.indifferent);
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

function isValidTasteMap(value: unknown): value is RawTasteMap {
  const t = value as Partial<RawTasteMap> | undefined;
  return typeof t === "object" && t !== null && isStringArray(t.expand) && isStringArray(t.avoid);
}

function isValidSelfReflection(value: unknown): value is RawSelfReflection {
  const s = value as Partial<RawSelfReflection> | undefined;
  return typeof s === "object" && s !== null && isStringArray(s.awareness) && isStringArray(s.blindSpots);
}

function isValidRoadmap(value: unknown): value is RawRoadmap {
  const r = value as Partial<RawRoadmap> | undefined;
  if (typeof r !== "object" || r === null || typeof r.firstAction !== "string" || !Array.isArray(r.phases)) return false;
  return r.phases.every((phase) => typeof phase === "object" && phase !== null && typeof phase.label === "string" && isStringArray(phase.actions));
}

// AI 응답 본문(사용자 퀴즈 답변을 그대로 반영)을 로그에 남기지 않기
// 위해 실패 사유만 반환한다 — work-generator.ts와 같은 방식이다.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawTaste>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidTasteCore(candidate.tasteCore)) return { ok: false, reason: "invalid_taste_core" };
  if (!isStringArray(candidate.patterns)) return { ok: false, reason: "invalid_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidTasteMap(candidate.tasteMap)) return { ok: false, reason: "invalid_taste_map" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawTaste };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다(다른 다섯 주제와 같은 이유).
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): TasteMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): TasteRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// 다른 다섯 주제와 같은 이유(Sonnet 5의 기본 사고 토큰이 max_tokens
// 예산에 포함됨)로 같은 상한·재시도 방식을 그대로 쓴다 —
// engine/ideal-type-generator.ts 참고.
const TASTE_MAX_TOKENS = 16384;
const TASTE_MAX_TOKENS_RETRY = 16384;

// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한에 넣을지.
// 서버 쪽 원인(engine/generation-error.ts)은 false, 빈 응답·스키마
// 검증 실패는 항상 true — work-generator.ts와 같은 원칙이다.
async function attemptGeneration(
  client: Anthropic,
  session: MapSession,
  maxTokens: number,
  attempt: number,
  generationStartedAt: number,
): Promise<{ result: TasteResult | null; truncated: boolean; countsAsFailure: boolean }> {
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
          content: `사용자가 취향 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort,
        format: { type: "json_schema", schema: TASTE_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    outputTokens = response.usage?.output_tokens ?? null;
    thinkingTokens = response.usage?.output_tokens_details?.thinking_tokens ?? null;
    if (truncated) {
      console.warn("[taste-generator] response truncated by max_tokens", {
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
    console.error("[taste-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    logGenerationAttempt({ topic: "taste", attempt, generationStartedAt, effort, outcome: { kind: "api_error" } });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[taste-generator] empty response from Claude");
    logGenerationAttempt({
      topic: "taste",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "api_error" },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[taste-generator] response failed schema validation", { reason: parsed.reason, truncated });
    logGenerationAttempt({
      topic: "taste",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "schema_invalid", outputTokens, thinkingTokens },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const data = parsed.data;
  const result: TasteResult = {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    tasteCore: {
      certain: capArray(data.tasteCore.certain, 4),
      conditional: capArray(data.tasteCore.conditional, 4),
      indifferent: capArray(data.tasteCore.indifferent, 4),
    },
    patterns: capArray(data.patterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    tasteMap: {
      expand: capArray(data.tasteMap.expand, 4),
      avoid: capArray(data.tasteMap.avoid, 4),
    },
    selfReflection: {
      awareness: capArray(data.selfReflection.awareness, 4),
      blindSpots: capArray(data.selfReflection.blindSpots, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // 이상형·나 소개·친구·일할 때의 나와 축 일부를 공유하는 태그 사전을
    // 그대로 재사용한다 — 다섯 주제 사이 교차 비교(engine/compatibility.ts)가
    // 성립하려면 결과의 태그가 같은 문자열 체계여야 한다.
    tags: getIdealTypeTags(session.quizAnswers, "taste"),
  };
  logGenerationAttempt({ topic: "taste", attempt, generationStartedAt, effort, outcome: { kind: "success", outputTokens, thinkingTokens } });
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

export type TasteGenerationOutcome = { result: TasteResult | null; countsAsFailure: boolean };

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// countsAsFailure(반환값): ideal-type-generator.ts의 같은 이름 값과
// 같은 규칙 — 재시도 2회 중 하나라도 입력/출력 내용 때문에 실패했으면
// 최종적으로도 카운트한다.
export async function generateTasteResult(session: MapSession): Promise<TasteGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[taste-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  const generationStartedAt = Date.now();
  let maxTokens = TASTE_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptGeneration(client, session, maxTokens, attempt, generationStartedAt);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = TASTE_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

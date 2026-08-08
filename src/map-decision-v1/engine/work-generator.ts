import Anthropic from "@anthropic-ai/sdk";
import { MapSession, WorkMatrixPoint, WorkResult, WorkRoadmapPhase } from "../types";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";
import { logGenerationAttempt } from "./generation-timing";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 이상형(ideal-type-generator.ts)·나 소개(self-intro-generator.ts)·
// 친구·인간관계(friendship-generator.ts)·진로(final-result-generator.ts)와
// 완전히 분리된, 일할 때의 나 전용 생성기다. 그 네 파일은 건드리지 않는다.
//
// career(진로·이직·큰 결정)와 성격이 다르다 — career는 "다음에 뭘 할까"를
// 정하는 자유 대화형 의사결정 주제이고, work는 "나는 어떻게 일하는
// 사람인가"를 진단하는 퀴즈형 성향 주제다(topics.ts의 work 정의 참고).
// 구조는 친구·인간관계와 같다: "행동만 물었는데 인물 묘사가 나온다."
// 사용자는 시종일관 "이럴 때 실제로 어떻게 했어?"라는 행동 질문에만
// 답하고, "당신은 이렇게 일하는 사람입니다"라는 요약은 한 번도 직접
// 말하지 않았는데 AI가 종합해서 던져준다. 이 주제만의 반전은 마지막
// 문항(30번, "나는 일 잘하는 사람인 것 같아?")이 유일한 자기평가
// 문항이라, 그 대답과 앞선 29개 행동 답변 사이의 간극(또는 일치)이
// selfReflection의 핵심 재료가 된다는 점이다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "일 발견 엔진"이다. 사용자가 일할 때의 나 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 행동 패턴만 물어봤는데도 그 사람이 일할 때 어떤 사람인지 종합해서 보여준다.

퀴즈는 총 30문항이고 전부 필수다. 전부 "실제로 있었던 일에서 실제로 어떻게 행동했는지"만 묻는다 — "당신은 계획적인 사람인가요?" 같은 추상적인 자기평가 문항은 하나도 없다(마지막 30번만 예외 — 아래에서 따로 설명한다). 문항은 지금의 일 상태(요즘 기분·일하는 속도·새 일을 시작하는 방식·나를 움직이는 동기)·일을 대하는 태도(내 역할·완성도 기준·혼자/같이 일할 때·애매한 지시에 대한 반응·시간이 부족할 때의 선택)·사람과 소통(지적받았을 때·문제를 발견했을 때·의견이 갈렸을 때·기여가 안 알려졌을 때)과, 4개 축(이 4개는 태그를 정하는 축이다 — 아래에서 별도로 설명한다)·압박과 회복(스트레스 상황·압박이 심할 때·회복 방식·퇴근 후 경계)·실패와 배움(잘 안 풀렸을 때·배워야 할 때·달라진 점)·조직과 환경(잘 맞는 환경·못 견디는 것·그만두고 싶었던 순간·앞으로 원하는 것)·자기평가(같이 일하고 싶은 사람·마지막 자기평가)까지 훨씬 다양한 실생활 영역을 다룬다. 경험형 문항 3개(일 때문에 힘들었던 순간·가장 아쉬웠던 일·예전과 달라진 계기) 바로 뒤에는 "그게 언제였고 그때 어떤 상황이었는지"를 한 줄로 적는 자유 서술이 붙어있다(건너뛸 수 있지만, 답했다면 그 경험 답변의 실제 배경을 사용자가 직접 설명한 것이니 가장 근거가 확실한 재료다) — 있다면 patterns와 특히 selfReflection에서 반드시 근거로 활용하라.

앞서 말한 4개 축("일이 굴러갈 때 나는 보통 어떤 쪽이야?", "평소 생활에서, 나와 더 가까운 모습은?", "가까운 사람과 갈등이 있을 때, 스트레스를 어떻게 푸는 편이야?", "일할 때 나는 어떤 쪽에 더 가까워?")은 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 이상형·나 소개·친구·인간관계 결과와 태그 체계 일부를 공유해서, 태그로 궁합을 비교하는 기능의 재료다. 앞의 두 문항("일이 굴러갈 때...", "평소 생활에서...")과 세 번째 문항("가까운 사람과 갈등이...")은 최대 3개까지 고를 수 있고, 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다. 태그는 그중 1순위 하나로만 정해진다(사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 마지막 문항("일할 때 나는 어떤 쪽에 더 가까워?")은 네 가지 중 하나만 고르는 단일 선택이라 고른 답 하나가 전부다. 이 네 문항에서 가장 먼저 고른 답과 다른 결론을 내는 것 자체는 금지가 아니다 — 오히려 답변 사이의 간극을 짚는 것이 selfReflection의 핵심이다. 다만 다른 결론을 낼 때는 가장 먼저 고른 답이 무엇인지 문장 안에서 알 수 있게 쓰고 그 차이를 간극으로 드러내라(예: "~을 가장 먼저 꼽았고, 다른 답변에서는 ~한 모습도 함께 나타난다", "~을 먼저 골랐고, 동시에 ~한 결도 보인다"). 가장 먼저 고른 답을 문장에서 알아볼 수 없는 채로 그와 반대되는 성향으로 단정하지 마라. 두 번째·세 번째로 고른 답을 마치 가장 먼저 고른 답인 것처럼 대표 성향으로 서술하지 마라. 이 규칙은 이 네 문항에 대한 서술 톤에만 적용되고, 다른 문항의 해석 방식에는 영향을 주지 않는다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

★가장 중요한 재해석★: 마지막 문항("나는 일 잘하는 사람인 것 같아?")은 사용자가 스스로를 평가한 유일한 문항이다 — 나머지 29개는 전부 구체적인 행동·상황을 물었을 뿐, "나는 이렇게 일하는 사람이다"라고 직접 말한 적이 없다. 이 자기평가와 앞선 행동 답변들 사이의 간극(또는 일치)을 짚는 것이 이 결과의 가장 중요한 재해석 축이다. 예를 들어 "잘 모르겠다"고 답했는데 실제로는 완성도를 지키고 문제를 먼저 짚는 행동 패턴이 여러 번 나왔다면 그 간극을, 반대로 "그런 편인 것 같다"고 답했는데 정작 마감을 자주 놓치거나 피드백에 방어적인 답변이 많았다면 그 간극을 selfReflection에서 반드시 짚어라. 다만 이 자기평가는 스스로에 대한 인상 하나일 뿐이다 — 이 간극을 "사실은 일을 못하는 사람이다", "그렇게 생각하는 건 착각이다"처럼 자기 인식 자체를 부정하는 단정으로 쓰지 마라. 대신 "스스로는 일을 잘하는지 확신하지 못하지만, 실제 행동에서는 완성도를 지키고 문제를 먼저 짚는 모습이 자주 나타난다"처럼 자기평가와 행동이 서로 다른 결로 함께 있는 것으로 서술하라. 자기평가와 행동 답변이 실제로 서로 맞아떨어지는 경우라면, 그 대신 "왜 그 자기평가가 답변들과 맞아떨어지는지"를 근거로 짚어라. 이 문항이 "자기평가", "마지막 문항"이라는 구조에서 나왔다는 것 자체는 드러내지 말고, 자연스러운 문장으로 풀어 써라.

여러 경험형 답변이 있다고 해서 patterns나 selfReflection의 개수를 억지로 늘리지 마라 — 개수는 각 항목 설명에 적힌 범위 안에서 자연스럽게 정한다. 대신 patterns와 selfReflection 중 최소 한 곳에는 아래 중 하나 이상을 반드시 포함하라 — 단순 요약으로는 쓸 수 없는, 여러 답변을 근거로 삼아야만 쓸 수 있는 문장이어야 한다.
· 예측 — 앞으로 비슷한 상황에서 나타날 가능성이 높은 패턴을 전망하는 문장
· 변화 — "예전과 비교해 일하는 방식이 어떻게 달라졌는지"에 대한 답을 근거로, 예전과 지금의 차이를 짚는 문장
· 교차 — 서로 다른 질문에 대한 답 2개 이상을 연결해서 만든 해석. 단순 나열이 아니라 두 답변을 이어야만 성립하는 해석이어야 한다.

사용자가 직접 적은 자유 서술 답변에는 일할 때의 나와 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 정상적인 답변으로 다뤄라. 직장·연애·감정에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 불편하더라도 정확하게 써라. title/oneLiner/workDrivers/patterns/workFit/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.

이 주제는 상사·동료·팀장 같은 제3자가 답변에 등장할 확률이 높다. 실존 인물이나 유명인의 이름은 절대 언급하지 않는다. 사용자가 대화 중(자유 서술 답변)에 상사·동료·팀장·거래처 등 제3자를 실명이나 특정 개인임을 알 수 있는 호칭으로 언급했더라도, title·oneLiner·workDrivers·patterns·workFit·selfReflection·roadmap 어디에도 그 이름이나 호칭을 그대로 옮기지 마라. 대신 "상사", "동료", "팀장", "거래처"처럼 관계를 가리키는 일반적인 표현으로 바꿔 쓴다 — 이런 관계 표현은 결과를 이해하는 데 필요하므로 그대로 써도 된다. 이건 식별 정보만 지우라는 지시이지, 그 인물이 얽힌 상황·감정·갈등의 내용을 얼버무리거나 완곡하게 순화하라는 뜻이 아니다 — 위에서 말했듯 불편하더라도 내용 자체는 그대로 정확하게 써라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 사용자가 "혼자 삭이는 편"을 골랐다고 해서 "당신은 혼자 삭이는 편이군요"라고 쓰면 실패다. 대신 "왜 그런 패턴이 반복되는지", "그게 다른 업무 상황에서는 어떻게 나타나는지", "본인은 어떻게 일하는 사람일 가능성이 높은지"까지 한 걸음 더 들어가야 한다.

★새 원칙 — 반복 금지★: 같은 발견을 여러 블록에서 반복해서 쓰지 마라. 여섯 블록은 서로 다른 역할을 맡는다 — workDrivers는 답변 전체를 근거로 이게 없으면 못 버티는 것/있으면 힘이 나는 것/없어도 괜찮은 것을 분류하고, patterns는 서로 다른 영역(태도·소통·압박과 회복·조직과 환경 등)의 답변을 교차했을 때 왜 그런 일하는 방식이 반복되는지를 해석하고, matrix는 그 방식이 여러 업무 상황(새 일을 시작할 때·압박받을 때·피드백 받을 때·팀에서 등)에서 어떻게 다르게 나타나는지를 위치로 보여주고, workFit은 그 방식을 바탕으로 나에게 잘 맞는 환경과 나를 소모시키는 환경을 짚고, selfReflection은 그 방식이 채워주는 필요와 자기평가·실제 행동 사이의 간극(또는 일치)을 다루고, roadmap은 그래서 무엇을 해볼지 구체적인 행동을 담는다. 특히 patterns와 selfReflection이 겹치기 가장 쉽다 — patterns에서 이미 짚은 결을 selfReflection에서 같은 근거·같은 문장으로 다시 쓰지 마라. 최종 결론이 두 블록에서 겹치더라도 그 결론에 도달하는 근거나 적용 범위는 블록마다 달라야 한다 — patterns에 이미 쓴 결이라면 selfReflection에서는 아예 다른 답변 조합에서 나온 다른 결을 찾아 써라.

각 항목 작성 원칙:
- title: "일할 때 나는 ___인 사람"이라는 문장에 그대로 넣었을 때 자연스러운, 사용자를 짧게 서술하는 말이다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "성실한", "책임감 있는", "꼼꼼한" 같은 일반적인 성격 형용사만으로 title을 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 행동·상황·선택을 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. "X한데 속은 Y한", "X하지만 Y한" 같은 대비 구조를 기본값으로 쓰지 마라 — 답변에서 대비가 실제로 두드러질 때만 쓰고, 쓰더라도 많아야 1개까지다. 형용사를 3개 이상 나열하지 않는다. 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. 정해진 유형 목록에서 고르듯 뻔하게 쓰지 말고 매번 새롭게 만들되, 읽자마자 이해되지 않는 표현은 개성이 아니라 실패다. title은 반드시 명사 또는 명사구로 끝나야 한다 — "일할 때 나는 ___인 사람"에 그대로 넣었을 때 문장이 완결돼야 하기 때문이다. "~는", "~한", "~던"처럼 관형절로 끝나서 뒤에 명사가 빠진 채 마무리되면 안 된다. 좋은 예: "판 짜놓고 밀어붙이는 실행러", "묻기 전에 먼저 채우는 사람". 나쁜 예: "판 짜놓고 밀어붙이는"(뒤에 명사가 없어 문장이 안 끝난다), "묻기 전에 먼저 채우는"(마찬가지).
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- workDrivers(essential/boost/optional): 사용자의 답변에서 추론해 일할 때 나를 움직이는 동력을 "이게 없으면 못 버티는 것 / 있으면 확실히 힘이 나는 것 / 없어도 괜찮은 것"으로 분류한다. 사용자가 직접 말한 적 없는, 답변을 근거로 역추론한 동력이어야 한다. 각 2~4개.
- patterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 일하는 방식을 짚어준다. 단순 요약이 아니라 "왜 그런 패턴이 반복되는지"에 대한 해석을 담는다. 서로 다른 영역(태도·소통·회복·환경 등)의 답변을 최소 2개 이상 교차해서 나온 패턴을 최소 1개는 반드시 반영한다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 두 답을 대조하듯 가르는 간극형 문장으로만 채우지 말고, 반복되는 행동 자체를 짚는 문장, 상황에 따라 달라지는 모습을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚는 문장 자체는 계속 써도 된다 — 골격이 반복되는 것만 피하면 되고, 짚을 때도 두 모습이 공존하는 것으로 자연스럽게 풀어 써라. 2~4개. 위 ★반복 금지★ 원칙이 이 골격 다양화 지시보다 우선한다 — 먼저 반복 금지 원칙에 따라 이 블록에 남길 결을 추린 뒤, 그렇게 남은 항목들 사이에서만 문장 골격을 다양화하라. 골격을 다양하게 채우겠다고 selfReflection에 넘겨야 할 결(자기평가와의 간극)을 이 블록에 욱여넣지 말고, 반대로 이 블록에서 이미 다룬 결을 골격만 바꿔 selfReflection에 다시 밀어넣지도 마라.
- matrix: 사용자의 답변에서 도출한 2개 축으로 4사분면을 만들고(예: "주도적"↔"신중함", "혼자"↔"같이" 같이 사용자 답변에 맞는 축을 매번 새로 골라라), 그 위에 사용자 자신의 여러 업무 모습(예: 새 일을 시작할 때의 나 / 압박받을 때의 나 / 피드백 받을 때의 나 / 팀에서의 나)을 각각 하나의 사분면에 배치한다. x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- workFit(thriving/draining): 사용자의 답변 패턴을 근거로 "나에게 잘 맞는 환경" / "나를 소모시키는 환경"을 짚는다. 특정 회사·직무가 아니라 환경의 성격으로 서술한다. 각 2~4개.
- selfReflection(strengths/blindSpots): ★가장 중요한 항목★. strengths는 patterns에서 이미 다룬 패턴 자체나 그 이유를 다시 확인해주는 자리가 아니다 — patterns가 "무엇이 반복되는지"를 다뤘다면, strengths는 그 패턴이 일에서 실제로 어떤 기능을 하는지, 즉 채워주는 실용적·심리적 필요(예: 효능감, 통제감, 인정, 안전 확보, 갈등 회피, 신뢰 구축 등)를 답변을 근거로 짚는다. "그런 편이죠"처럼 이미 아는 내용을 확인해주는 문장으로 끝내지 마라 — patterns와 다른 질문("그게 일에서 왜 필요한지")에 답해야 한다. blindSpots는 여러 답변을 교차했을 때 드러나는 모순이나 반복되는 약점을 짚는다 — 마지막 문항의 자기평가와 앞선 행동 답변 사이의 간극(또는 일치)을 최소 1개는 반드시 포함한다(위 ★가장 중요한 재해석★ 참고). 짧게 요약하면 성립하지 않는 통찰이니 필요한 만큼 충분히 써라. 각 2~4개. ★대조 구문 금지★: patterns와 selfReflection 어디에서도 "~라고 답했지만", "~라고 했지만", "~인데 정작", "~지만 실제로는"처럼 앞 문장의 내용을 뒤 문장이 뒤집는 대조 접속 구조를 쓰지 마라 — 답변자를 모순된 사람으로 단정하는 인상을 준다. 간극을 짚으라는 지시 자체는 그대로다 — 대신 두 모습을 각각 병렬로 서술한 뒤, 그 둘이 어떻게 함께 있을 수 있는지를 설명하는 방식으로 써라(예: "A인 것과 B인 것은 다른 얘기다"처럼, 어느 한쪽도 부정하지 않고 두 사실이 동시에 성립하는 이유를 짚는다).
- roadmap: firstAction은 24시간 안에 시도해볼 수 있는 아주 구체적인 행동 하나(예: "오늘, 미뤄둔 피드백 하나만 짧게라도 먼저 전해보기"). phases는 이런 상황에서 시도해볼 것들을 30일 동안 단계별로 담는다("1주 이내", "2주 이내", "한 달 이내" 등) 2~4단계, 각 단계에 실행 항목 2~3개.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음을 다양하게 쓴다. 기본 어조는 "해요체"(예: "반복돼요", "가능성이 높아요")지만, 같은 어미가 연속 3번 이상 나오면 안 된다 — 특히 "~예요"/"~이에요"/"~거예요"가 줄줄이 이어지지 않게, 평서형 종결(예: "반복된다", "그게 패턴이다"), 명사형 마무리(예: "~하는 편", "~라는 신호"), 짧은 단정(예: "이유는 이거다.")을 같은 블록 안에서 의도적으로 섞어 쓴다 — title/oneLiner/workDrivers/patterns/matrix의 설명/workFit/selfReflection/roadmap 전부 예외 없이 해당된다. 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 예측 문장에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다.
- 길이는 충분히 쓴다. 내용을 줄이지 마라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const WORK_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    workDrivers: {
      type: "object",
      properties: {
        essential: { type: "array", items: { type: "string" } },
        boost: { type: "array", items: { type: "string" } },
        optional: { type: "array", items: { type: "string" } },
      },
      required: ["essential", "boost", "optional"],
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
    workFit: {
      type: "object",
      properties: {
        thriving: { type: "array", items: { type: "string" } },
        draining: { type: "array", items: { type: "string" } },
      },
      required: ["thriving", "draining"],
      additionalProperties: false,
    },
    selfReflection: {
      type: "object",
      properties: {
        strengths: { type: "array", items: { type: "string" } },
        blindSpots: { type: "array", items: { type: "string" } },
      },
      required: ["strengths", "blindSpots"],
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
  required: ["title", "oneLiner", "workDrivers", "patterns", "matrix", "workFit", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawWorkDrivers = { essential: string[]; boost: string[]; optional: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawWorkFit = { thriving: string[]; draining: string[] };
type RawSelfReflection = { strengths: string[]; blindSpots: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawWork = {
  title: string;
  oneLiner: string;
  workDrivers: RawWorkDrivers;
  patterns: string[];
  matrix: RawMatrix;
  workFit: RawWorkFit;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_work_drivers"
  | "invalid_patterns"
  | "invalid_matrix"
  | "invalid_work_fit"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawWork } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidWorkDrivers(value: unknown): value is RawWorkDrivers {
  const d = value as Partial<RawWorkDrivers> | undefined;
  return typeof d === "object" && d !== null && isStringArray(d.essential) && isStringArray(d.boost) && isStringArray(d.optional);
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

function isValidWorkFit(value: unknown): value is RawWorkFit {
  const t = value as Partial<RawWorkFit> | undefined;
  return typeof t === "object" && t !== null && isStringArray(t.thriving) && isStringArray(t.draining);
}

function isValidSelfReflection(value: unknown): value is RawSelfReflection {
  const s = value as Partial<RawSelfReflection> | undefined;
  return typeof s === "object" && s !== null && isStringArray(s.strengths) && isStringArray(s.blindSpots);
}

function isValidRoadmap(value: unknown): value is RawRoadmap {
  const r = value as Partial<RawRoadmap> | undefined;
  if (typeof r !== "object" || r === null || typeof r.firstAction !== "string" || !Array.isArray(r.phases)) return false;
  return r.phases.every((phase) => typeof phase === "object" && phase !== null && typeof phase.label === "string" && isStringArray(phase.actions));
}

// AI 응답 본문(사용자 퀴즈 답변을 그대로 반영)을 로그에 남기지 않기
// 위해 실패 사유만 반환한다 — friendship-generator.ts와 같은 방식이다.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawWork>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidWorkDrivers(candidate.workDrivers)) return { ok: false, reason: "invalid_work_drivers" };
  if (!isStringArray(candidate.patterns)) return { ok: false, reason: "invalid_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidWorkFit(candidate.workFit)) return { ok: false, reason: "invalid_work_fit" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawWork };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다(이상형·나 소개·친구와 같은 이유).
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): WorkMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): WorkRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// 이상형·나 소개·친구와 같은 이유(Sonnet 5의 기본 사고 토큰이 max_tokens
// 예산에 포함됨)로 같은 상한·재시도 방식을 그대로 쓴다 —
// engine/ideal-type-generator.ts 참고.
const WORK_MAX_TOKENS = 16384;
const WORK_MAX_TOKENS_RETRY = 16384;

// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한에 넣을지.
// 서버 쪽 원인(engine/generation-error.ts)은 false, 빈 응답·스키마
// 검증 실패는 항상 true — ideal-type-generator.ts와 같은 원칙이다.
async function attemptGeneration(
  client: Anthropic,
  session: MapSession,
  maxTokens: number,
  attempt: number,
  generationStartedAt: number,
): Promise<{ result: WorkResult | null; truncated: boolean; countsAsFailure: boolean }> {
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
          content: `사용자가 일할 때의 나 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort,
        format: { type: "json_schema", schema: WORK_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    outputTokens = response.usage?.output_tokens ?? null;
    thinkingTokens = response.usage?.output_tokens_details?.thinking_tokens ?? null;
    if (truncated) {
      console.warn("[work-generator] response truncated by max_tokens", {
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
    console.error("[work-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    logGenerationAttempt({ topic: "work", attempt, generationStartedAt, effort, outcome: { kind: "api_error" } });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[work-generator] empty response from Claude");
    logGenerationAttempt({
      topic: "work",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "api_error" },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[work-generator] response failed schema validation", { reason: parsed.reason, truncated });
    logGenerationAttempt({
      topic: "work",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "schema_invalid", outputTokens, thinkingTokens },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const data = parsed.data;
  const result: WorkResult = {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    workDrivers: {
      essential: capArray(data.workDrivers.essential, 4),
      boost: capArray(data.workDrivers.boost, 4),
      optional: capArray(data.workDrivers.optional, 4),
    },
    patterns: capArray(data.patterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    workFit: {
      thriving: capArray(data.workFit.thriving, 4),
      draining: capArray(data.workFit.draining, 4),
    },
    selfReflection: {
      strengths: capArray(data.selfReflection.strengths, 4),
      blindSpots: capArray(data.selfReflection.blindSpots, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // 이상형·나 소개·친구와 축 일부를 공유하는 태그 사전을 그대로
    // 재사용한다 — 네 주제 사이 교차 비교(engine/compatibility.ts)가
    // 성립하려면 결과의 태그가 같은 문자열 체계여야 한다.
    tags: getIdealTypeTags(session.quizAnswers, "work"),
  };
  logGenerationAttempt({ topic: "work", attempt, generationStartedAt, effort, outcome: { kind: "success", outputTokens, thinkingTokens } });
  return { result, truncated, countsAsFailure: false };
}

const MAX_GENERATION_ATTEMPTS = 2;

export type WorkGenerationOutcome = { result: WorkResult | null; countsAsFailure: boolean };

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// countsAsFailure(반환값): ideal-type-generator.ts의 같은 이름 값과
// 같은 규칙 — 재시도 2회 중 하나라도 입력/출력 내용 때문에 실패했으면
// 최종적으로도 카운트한다.
export async function generateWorkResult(session: MapSession): Promise<WorkGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[work-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  const generationStartedAt = Date.now();
  let maxTokens = WORK_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptGeneration(client, session, maxTokens, attempt, generationStartedAt);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = WORK_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

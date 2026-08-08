import Anthropic from "@anthropic-ai/sdk";
import { MapSession, TravelMatrixPoint, TravelResult, TravelRoadmapPhase } from "../types";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";
import { logGenerationAttempt } from "./generation-timing";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 이상형·나 소개·친구·인간관계·일할 때의 나·취향(taste-generator.ts)과
// 완전히 분리된, 여행 스타일 전용 생성기다. 그 여섯 파일은 건드리지
// 않는다.
//
// taste와 같은 성격의 짧은 퀴즈형 성향 주제(20문항)다. taste와 다른
// 점은 재해석 축이 두 겹이 아니라 세 겹이라는 것 — (1) 2번-3번(여행
// 준비에 대한 자기인식 vs 실제 행동) 간극, (2) 17번(하고 싶은 여행)과
// 3·6·7번(실제 준비·지출·숙소) 간극, (3) 20번(마지막 자기평가)과 앞선
// 답변 사이의 간극. taste는 두 겹(1-2번 간극, 마지막 자기평가 간극)
// 이었다.
//
// 결과 구조를 6블록(travelCriteria/patterns/matrix/travelFit/
// selfReflection/roadmap)에서 4블록(discovery/matrix/fit/roadmap)으로
// 재설계했다 — 프로덕션 결과 분석에서 같은 발견이 patterns·matrix·
// selfReflection 세 곳에 반복되고("즉흥이 아니라 위임이다" 류), 로망
// 간극도 patterns·matrix·selfReflection 세 곳에 반복됐다.
// travelCriteria와 travelFit도 사실상 같은 세 가지를 명사형/문장형으로
// 두 번 쓰는 것에 가까웠다. 이번 재설계는 스키마·생성기까지만이고,
// 결과 화면(TravelResultBlocks.tsx) 재설계는 다음 작업이다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "여행 발견 엔진"이다. 사용자가 여행 스타일 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 낱개 선택으로는 안 보이던 여행 방식의 결을 종합해서 보여준다.

퀴즈는 총 20문항이고 전부 필수다. 이상형·나 소개·친구·인간관계·일할 때의 나(30~38문항)보다 훨씬 짧다 — 그만큼 근거가 적다는 뜻이다. 확신에 찬 단정을 피하고, 여러 답변이 같은 방향을 가리킬 때만 뚜렷하게 쓰고 그렇지 않으면 조심스럽게 짚어라. 문항은 여행을 대하는 방식(가는 이유·준비 성향·최근 여행 준비·하루 페이스·동행 선호)·실제로 하는 것(지출·숙소 선호·계획이 틀어졌을 때의 반응·기록 방식·안 가본 곳과 좋았던 곳 중 어디를 더 갔는지와 4개 축 중 하나인 생활 습관)·여행에서의 나(현지인과의 접촉·음식 앞에서의 태도·혼자 여행 경험·돌아온 뒤의 모습·자유 서술)·원하는 것과 실제(꿈꾸는 여행·못 가는 이유·실제 빈도·마지막 자기평가)까지 4개 구간으로 이어진다. 자유 서술은 16번("기억에 남는 여행이 언제였어요? 어디였고 왜 기억에 남는지 적어주세요") 하나뿐이다 — 다른 주제는 자유 서술이 2~3개씩 있는데, 이 주제는 1개뿐이라 이 답변의 비중이 상대적으로 크다. 답했다면(건너뛸 수 있다) 가장 근거가 확실한 재료이니 discovery에서 반드시 활용하라. 건너뛰었다면 그 사실을 지적하지 말고 다른 답변만으로 자연스럽게 채워라.

이 중 4개 축("여행 준비, 나는 어떤 쪽에 더 가까워?", "평소 생활에서, 나와 더 가까운 모습은?", "여행지에서 하루는 어떤 쪽이 좋아?", "여행은 누구와 갈 때가 제일 좋아?")은 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 이상형·나 소개·친구·인간관계·일할 때의 나·취향 결과와 태그 체계 일부를 공유해서, 태그로 궁합을 비교하는 기능의 재료다. 이 네 문항 중 "평소 생활에서..." 하나만 최대 3개까지 고를 수 있어 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다(태그는 그중 1순위 하나로만 정해진다 — 사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 나머지 세 문항("여행 준비...", "여행지에서 하루는...", "여행은 누구와...")은 전부 하나만 고르는 단일 선택이라 우선순위 개념 자체가 없다 — 고른 답 하나가 전부다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

★핵심 재해석 (1)★: 2번 문항("여행 준비, 나는 어떤 쪽에 더 가까워?")은 스스로 생각하는 준비 성향에 대한 답이고, 3번 문항("가장 최근 여행, 실제로 어떻게 준비했어?")은 실제로 있었던 단 한 번의 준비 과정에 대한 답이다. 이 둘 사이의 간극이 이 결과의 핵심 재료 중 하나다 — 예를 들어 2번에서 "미리 다 짜두는 사람"이라고 답했는데 3번에서는 "며칠 전에 급하게 정했다"거나 "거의 안 짜고 그냥 갔다"를 골랐다면, 그 간극을 반드시 짚어라. 다만 3번은 "가장 최근 여행" 단 한 번의 사례일 뿐이다 — 이 간극을 "실제로는 그런 사람이 아니다", "평소 이미지가 틀렸다"처럼 자기 인식 자체를 정체성 차원에서 부정하는 단정으로 쓰지 마라. 대신 "평소에는 미리 계획을 짜두는 편이지만, 가장 최근 여행은 유독 준비가 늦어졌다"처럼 평소 성향과 최근 한 번이 다르게 나타난 상황적 차이로 서술하고, 왜 그 한 번만 달랐을지 다른 답변에서 근거를 찾을 수 있다면 함께 짚어라. 두 답이 실제로 같은 방향이라면 억지로 간극을 만들지 말고, 대신 왜 그 두 답이 서로 맞아떨어지는지를 근거로 짚어라.

★핵심 재해석 (2)★: 17번 문항("언젠가 해보고 싶은 여행은?")은 원하는 여행에 대한 답이고, 3번·6번·7번 문항(실제 준비 방식·돈을 더 쓰는 곳·숙소 선호)은 실제로 하는 여행에 대한 답이다. 이 둘 사이의 간극도 핵심 재료다 — 예를 들어 "고생스러운 여행"이나 "잘 안 알려진 곳"을 꿈꾼다고 답했는데, 실제로는 숙소에 돈을 많이 쓰고("숙소") 준비도 임박해서 하거나 남에게 맡기는 편이라면, 원하는 것과 실제 하는 것 사이의 간극을 짚어라. 이 경우에도 두 방향이 실제로 일치하면 왜 일치하는지를 근거로 짚어라.

★핵심 재해석 (3)★: 마지막 문항("나는 여행을 잘 즐기는 사람인 것 같아?")은 사용자가 스스로를 평가한 유일한 문항이다 — 나머지 19개는 전부 구체적인 선호·행동을 물었을 뿐, "나는 이런 여행자다"라고 직접 말한 적이 없다. 이 자기평가와 앞선 19개 답변 사이의 간극(또는 일치)을 짚는 것이 세 번째 핵심 재해석 축이다. 예를 들어 "잘 모르겠다"고 답한 것과 답변들이 뚜렷한 선호로 모여 있었던 것은 다른 얘기다. 반대로 "그런 편인 것 같다"고 답한 것과 답변들이 서로 어긋나 있었던 것도 다른 얘기다. 이런 간극을 discovery에서 반드시 짚어라. 자기평가와 답변들이 실제로 서로 맞아떨어지는 경우라면, 그 대신 왜 그 자기평가가 답변들과 맞아떨어지는지를 근거로 짚어라.

위 세 재해석 중 최소 두 개는 반드시 discovery에서 다뤄야 한다(가능하면 세 개 전부). 이 문항들이 "자기인식 문항", "마지막 문항"이라는 구조에서 나왔다는 것 자체는 드러내지 말고, 자연스러운 문장으로 풀어 써라.

★중요★: 여행 빈도가 낮거나 여행 경험이 적다고 부정적으로 서술하지 마라. 18번("여행을 못 가게 만드는 건 주로?")과 19번("실제로 여행은 얼마나 자주 가?")은 성향이 아니라 상황 요인을 묻는 문항이다 — 시간이 없어서, 돈이 부담돼서, 같이 갈 사람이 없어서 여행을 못 가는 것은 그 사람의 부족함이나 성격적 결함이 아니라 그때그때의 사정이다. "여행을 잘 안 다녀서 아쉽다", "경험이 부족하다" 같은 뉘앙스를 절대 쓰지 말고, 이 두 문항의 답은 그 사람이 처한 상황을 있는 그대로 설명하는 재료로만 다뤄라.

★중요★: 특정 여행지·항공사·숙박 브랜드·플랫폼명을 결과에 쓰지 마라. 범주로만 서술한다(예: 특정 도시명이 아니라 "번잡한 도시"나 "한적한 지역"처럼). 다만 사용자가 자유 서술(16번)에 직접 지명이나 장소를 적었다면, 그건 사용자 본인이 쓴 말이니 그 부분만은 그대로 다뤄도 된다 — 사용자가 적지 않은 구체적인 지명을 AI가 새로 지어내 결과에 넣지 말라는 뜻이다. 특정 실존 인물의 이름이나, 실명임을 알 수 있는 호칭도 결과에 그대로 옮기지 마라 — 사용자가 자유 서술에 동행자·지인의 이름을 적었더라도 "동행자", "친구" 같은 역할로 바꿔 써라.

사용자가 직접 적은 자유 서술 답변에는 여행과 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 정상적인 답변으로 다뤄라. 여행 중 있었던 일은 물론, 그 여행과 얽힌 직장·연애·감정에 대한 솔직한 서술도 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 discovery는 사용자를 정면으로 비추는 통찰이어야 한다: 불편하더라도 정확하게 써라. title/oneLiner/discovery/matrix의 설명/fit/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 사용자가 "혼자"를 골랐다고 해서 "당신은 혼자 다니는 편이군요"라고 쓰면 실패다. 대신 "왜 그런 방식이 반복되는지", "그게 다른 여행 상황에서는 어떻게 나타나는지", "본인이 실제로 어떤 여행자일 가능성이 높은지"까지 한 걸음 더 들어가야 한다.

★새 원칙 — 반복 금지★: 같은 발견을 여러 블록에서 반복해서 쓰지 마라. 예를 들어 "즉흥이 아니라 위임이다" 같은 발견은 discovery에 한 번만 쓰고, matrix의 사분면 설명이나 fit의 잘 맞는/안 맞는 방식에서 같은 근거로 같은 결론을 다시 쓰지 마라. 세 블록은 서로 다른 각도를 맡는다 — discovery는 "무엇을 발견했는지"(해석), matrix는 "그 발견이 여러 여행 상황에서 어떻게 다르게 나타나는지를 위치로 보여주기"(배치), fit은 "그 발견을 바탕으로 실제로 뭐가 잘 맞고 안 맞는지"(적용)를 담는다. 최종 결론이 겹치더라도 그 결론에 도달하는 근거나 적용 범위는 블록마다 달라야 한다.

각 항목 작성 원칙:
- title: "내 여행 스타일은 한마디로 ___"라는 문장에 그대로 넣었을 때 자연스러운, 사용자의 여행 방식을 짧게 서술하는 말이다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "활발한", "여유로운" 같은 일반적인 형용사만으로 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 준비 방식·페이스·동행 선호를 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. 형용사를 3개 이상 나열하지 않는다. 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. title은 반드시 명사 또는 명사구로 끝나야 한다 — "내 여행 스타일은 한마디로 ___"에 그대로 넣었을 때 문장이 완결돼야 하기 때문이다. "~는", "~한", "~던"처럼 관형절로 끝나서 뒤에 명사가 빠진 채 마무리되면 안 된다. 좋은 예: "큰 틀만 정하고 나머진 즉흥인 여행자", "숙소에서 충전하는 느긋파". 나쁜 예: "큰 틀만 정하고 나머진 즉흥인"(뒤에 명사가 없어 문장이 안 끝난다), "숙소에서 충전하는"(마찬가지).
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- discovery: ★가장 중요한 항목★. 이 결과의 핵심이다. 정확히 3개를 쓴다. 각 항목은 다음 둘 중 하나다 — (a) 위 ★핵심 재해석 (1)★·(2)★·(3)★ 중 하나가 드러내는, 자기인식과 실제 행동·원하는 것 사이의 간극(최소 두 개는 반드시 이 재해석에서 나와야 한다), (b) 서로 다른 구간의 답변을 최소 2개 이상 교차했을 때만 드러나는, 사용자가 몰랐을 반복 패턴. "이미 알고 있을 법한 내용"은 정의상 발견이 아니니 쓰지 마라 — 답변을 교차해야만 보이는 것만 쓴다. 단순 요약이나 사용자가 고른 선택지를 그대로 옮기는 문장도 쓰지 마라. 첫 번째 항목에는 가장 강한 발견을 놓는다 — 이 문장이 그대로 공유되는 한 줄이 되므로, 가장 구체적이고 인상적인 발견을 맨 앞에 둔다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 두 답을 대조하듯 가르는 간극형 문장으로만 채우지 말고, 반복되는 행동 자체를 짚는 문장, 상황에 따라 달라지는 모습을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚을 때도 두 모습이 공존하는 것으로 자연스럽게 풀어 써라. ★대조 구문 금지★: discovery 어디에서도 "~라고 답했지만", "~라고 했지만", "~인데 정작", "~지만 실제로는"처럼 앞 문장의 내용을 뒤 문장이 뒤집는 대조 접속 구조를 쓰지 마라 — 답변자를 모순된 사람으로 단정하는 인상을 준다. 간극을 짚으라는 지시 자체는 그대로다 — 대신 두 모습을 각각 병렬로 서술한 뒤, 그 둘이 어떻게 함께 있을 수 있는지를 설명하는 방식으로 써라(예: "A인 것과 B인 것은 다른 얘기다"처럼, 어느 한쪽도 부정하지 않고 두 사실이 동시에 성립하는 이유를 짚는다).
- matrix: 사용자의 답변에서 도출한 2개 축으로 4사분면을 만들고(예: "계획형"↔"즉흥형", "혼자"↔"함께" 같이 사용자 답변에 맞는 축을 매번 새로 골라라), 그 위에 사용자의 여러 여행 모습(예: 준비할 때의 나 / 여행지에서의 나 / 계획이 틀어졌을 때의 나 / 돌아온 뒤의 나)을 각각 하나의 사분면에 배치한다. x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다. 각 항목의 description은 한 문장(15~25자 내외)으로 짧게 쓴다 — 사분면에서 이 사람의 위치를 읽을 수 있게 하는 최소한의 설명만 남기고, discovery에서 이미 쓴 해석을 여기서 다시 풀어 쓰지 마라.
- fit(goodFit/poorFit): 기존의 3단 분류(포기 못 하는 것/있으면 좋은 것/없어도 되는 것)는 없앴다. 사용자의 답변 패턴을 근거로 "잘 맞는 여행 방식"(goodFit)과 "안 맞는 방식"(poorFit) 두 갈래만 쓴다. 특정 여행지나 상품이 아니라 방식의 성격으로 서술한다(예: 특정 도시명이 아니라 "일정이 빡빡한 단체 여행"처럼). 각 2~4개.
- roadmap: firstAction은 24시간 안에 시도해볼 수 있는 아주 구체적인 행동 하나(예: "오늘, 다음에 가고 싶은 곳을 딱 하나만 검색해보기"). phases는 여행 방식을 조금씩 넓혀보거나 지금 스타일을 더 즐기는 방법을 30일 동안 단계별로 담는다("1주 이내", "2주 이내", "한 달 이내" 등) 2~4단계, 각 단계에 실행 항목 2~3개.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음은 기본적으로 "해요체"로 쓴다(예: "반복돼요", "가능성이 높아요") — 이게 이 결과의 기본 어조이며, 절반을 넘는 대다수 문장이 해요체여야 한다. 평서형 종결(예: "반복된다", "그게 패턴이다")·명사형 마무리(예: "~하는 편", "~라는 신호")·짧은 단정(예: "이유는 이거다.")은 가끔 리듬을 깨는 용도로만 예외적으로 섞는 양념이지, 기본값이 아니다. 다만 같은 어미("~예요"/"~이에요"/"~거예요" 등)가 연속 3번 이상 나오는 것은 피한다 — 이때도 평서형·명사형·단정으로 도피하듯 채우지 말고, 먼저 해요체 안에서 문장 구조와 어미를 바꿔라(예: "~예요" 다음은 "~거예요"나 "~네요"로). 한 항목이 여러 문장으로 이어질 때는 특히 주의한다 — 그 항목 안에서 평서형·명사형·단정 종결만 연달아 쓰지 마라. 최소 한 문장은 해요체로 남겨서 항목 전체가 기본 어조에서 완전히 벗어나지 않게 한다. title/oneLiner/discovery/matrix의 설명/fit/roadmap 전부 예외 없이 해당된다. 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 재해석 문장에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다.
- 근거가 20문항뿐이라는 점을 항상 의식하라. 확실한 근거가 있을 때만 뚜렷하게 단정하고, 근거가 약하면 "~인 편으로 보여요", "~일 수 있어요"처럼 여지를 남기는 표현을 섞어 써라. 다만 이 지시가 애매하고 흐릿한 결과를 쓰라는 뜻은 아니다 — 근거가 확실한 부분은 확실하게 쓰고, 그렇지 않은 부분만 조심스럽게 쓰라는 뜻이다.
- 깊이는 줄이지 마라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const TRAVEL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    discovery: { type: "array", items: { type: "string" } },
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
    fit: {
      type: "object",
      properties: {
        goodFit: { type: "array", items: { type: "string" } },
        poorFit: { type: "array", items: { type: "string" } },
      },
      required: ["goodFit", "poorFit"],
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
  required: ["title", "oneLiner", "discovery", "matrix", "fit", "roadmap"],
  additionalProperties: false,
} as const;

type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawTravelFit = { goodFit: string[]; poorFit: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawTravel = {
  title: string;
  oneLiner: string;
  discovery: string[];
  matrix: RawMatrix;
  fit: RawTravelFit;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_discovery"
  | "invalid_matrix"
  | "invalid_fit"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawTravel } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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

function isValidTravelFit(value: unknown): value is RawTravelFit {
  const t = value as Partial<RawTravelFit> | undefined;
  return typeof t === "object" && t !== null && isStringArray(t.goodFit) && isStringArray(t.poorFit);
}

function isValidRoadmap(value: unknown): value is RawRoadmap {
  const r = value as Partial<RawRoadmap> | undefined;
  if (typeof r !== "object" || r === null || typeof r.firstAction !== "string" || !Array.isArray(r.phases)) return false;
  return r.phases.every((phase) => typeof phase === "object" && phase !== null && typeof phase.label === "string" && isStringArray(phase.actions));
}

// AI 응답 본문(사용자 퀴즈 답변을 그대로 반영)을 로그에 남기지 않기
// 위해 실패 사유만 반환한다 — taste-generator.ts와 같은 방식이다.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawTravel>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isStringArray(candidate.discovery)) return { ok: false, reason: "invalid_discovery" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidTravelFit(candidate.fit)) return { ok: false, reason: "invalid_fit" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawTravel };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다(다른 여섯 주제와 같은 이유).
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): TravelMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): TravelRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// 다른 여섯 주제와 같은 이유(Sonnet 5의 기본 사고 토큰이 max_tokens
// 예산에 포함됨)로 같은 상한·재시도 방식을 그대로 쓴다 —
// engine/ideal-type-generator.ts 참고.
const TRAVEL_MAX_TOKENS = 16384;
const TRAVEL_MAX_TOKENS_RETRY = 16384;

// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한에 넣을지.
// 서버 쪽 원인(engine/generation-error.ts)은 false, 빈 응답·스키마
// 검증 실패는 항상 true — taste-generator.ts와 같은 원칙이다.
async function attemptGeneration(
  client: Anthropic,
  session: MapSession,
  maxTokens: number,
  attempt: number,
  generationStartedAt: number,
): Promise<{ result: TravelResult | null; truncated: boolean; countsAsFailure: boolean }> {
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
          content: `사용자가 여행 스타일 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort,
        format: { type: "json_schema", schema: TRAVEL_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    outputTokens = response.usage?.output_tokens ?? null;
    thinkingTokens = response.usage?.output_tokens_details?.thinking_tokens ?? null;
    if (truncated) {
      console.warn("[travel-generator] response truncated by max_tokens", {
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
    console.error("[travel-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    logGenerationAttempt({ topic: "travelStyle", attempt, generationStartedAt, effort, outcome: { kind: "api_error" } });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[travel-generator] empty response from Claude");
    logGenerationAttempt({
      topic: "travelStyle",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "api_error" },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[travel-generator] response failed schema validation", { reason: parsed.reason, truncated });
    logGenerationAttempt({
      topic: "travelStyle",
      attempt,
      generationStartedAt,
      effort,
      outcome: truncated ? { kind: "truncated", outputTokens, thinkingTokens } : { kind: "schema_invalid", outputTokens, thinkingTokens },
    });
    return { result: null, truncated, countsAsFailure: true };
  }

  const data = parsed.data;
  const result: TravelResult = {
    version: 1,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    discovery: capArray(data.discovery, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    fit: {
      goodFit: capArray(data.fit.goodFit, 4),
      poorFit: capArray(data.fit.poorFit, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // 이상형·나 소개·친구·일할 때의 나·취향과 축 일부를 공유하는 태그
    // 사전을 그대로 재사용한다 — 여섯 주제 사이 교차
    // 비교(engine/compatibility.ts)가 성립하려면 결과의 태그가 같은
    // 문자열 체계여야 한다.
    tags: getIdealTypeTags(session.quizAnswers, "travelStyle"),
  };
  logGenerationAttempt({ topic: "travelStyle", attempt, generationStartedAt, effort, outcome: { kind: "success", outputTokens, thinkingTokens } });
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

export type TravelGenerationOutcome = { result: TravelResult | null; countsAsFailure: boolean };

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// countsAsFailure(반환값): ideal-type-generator.ts의 같은 이름 값과
// 같은 규칙 — 재시도 2회 중 하나라도 입력/출력 내용 때문에 실패했으면
// 최종적으로도 카운트한다.
export async function generateTravelResult(session: MapSession): Promise<TravelGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[travel-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  const generationStartedAt = Date.now();
  let maxTokens = TRAVEL_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptGeneration(client, session, maxTokens, attempt, generationStartedAt);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = TRAVEL_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

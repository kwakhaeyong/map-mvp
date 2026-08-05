import Anthropic from "@anthropic-ai/sdk";
import { IdealTypeMatrixPoint, IdealTypeResult, IdealTypeRoadmapPhase, MapSession } from "../types";
import { getGenerationEffort } from "./generation-config";
import { isServerSideGenerationError } from "./generation-error";
import { getIdealTypeTags } from "./ideal-type-tags";
import { now } from "./session";

// 진로(final-result-generator.ts)와 완전히 분리된, 이상형 전용 생성기.
// 진로의 4블록 로직/스키마는 건드리지 않는다.
//
// 이상형 결과는 얕은 "정리"가 아니라 입력을 재료로 한 "발견"이어야 한다.
// 특히 attractionPatterns(끌림 패턴)와 selfReflection(자기 성찰)은
// 사용자가 스스로 말하지 않은 것을 짚어야 이 기능의 임팩트가 산다 —
// 시스템 프롬프트에서 이 두 항목을 특히 강하게 강조한다.

const SYSTEM_PROMPT = `너는 MAP Decision의 "이상형 발견 엔진"이다. 사용자가 이상형 퀴즈에서 고른 선택지와 직접 적은 말을 재료로, 그 사람도 몰랐던 자신의 끌림 패턴과 관계 성향을 발견해서 보여준다.

퀴즈는 총 38문항이고 전부 필수다(빠른 탭형 9개 — 대부분 외모·스타일·말투 등 이상형에 대한 단순한 취향을 한눈에 골라 답하는 질문이지만, 그중 2개(요즘 마음 상태, 관계에서 주로 맡는 역할)는 이상형이 아니라 지금 사용자 자신의 상태·역할을 묻는 질문이다 / 순위 매기기형 1개 — 마음을 표현받는 방식 여러 개를 좋아하는 순서대로 매긴 질문, 1순위뿐 아니라 전체 우선순위가 답변에 들어있다 / 슬라이더형 1개 — "내 사람에게만 잘하는 사람"부터 "누구에게나 두루 잘하는 사람"까지 정도를 고른 질문 / 상황 제시형 4개 — 약속 취소·표정 변화·침묵·회사 스트레스 같은 구체적 상황에서의 반응을 고른 질문, 특성을 직접 물은 것보다 진한 신호다. ★이 중 3개(약속 취소·표정 변화·침묵)는 "이상형이라면 어떻게 할까"를 물어 상대에게 바라는 반응을 나타내는 반면, 나머지 1개(회사에서 힘든 일이 있었다고 말했을 때 상대가 조언을 건네는 상황)는 "그 상황에서 나는 기분이 어때?"로 사용자 자신의 반응을 묻는 질문이다 — 이 답은 절대 이상형 취향으로 해석하지 말고, 조언과 공감 중 어느 쪽을 편하게 느끼는지에 대한 자기성찰 재료로만 써라 / 선호형 6개 — 성격, 가치관, 연애 방식, 라이프스타일, 끌리는 순간, 연락 스타일 등 여러 선택지 중 우선순위를 고르는 질문 / 양자택일형 5개 — 둘 중 하나를 고르는 우선순위 질문(그중 1개는 "나와 비슷한 사람 vs 나와 다른 사람"처럼 유사성 자체에 대한 선호를 묻는다) / 경험·행동형 9개 — 가까운 관계에서 실제로 어땠는지 묻는 질문, 예: 사과 방식, 관계가 멀어질 때의 패턴, 연애 초반 스타일, 갈등 시 스트레스 대처, 돌아봤을 때의 아쉬움, 감정 기복, 예전과 달라진 점, 관계가 진지해지는 순간(사귀자고 말할 때 등)에 실제로 어떻게 행동하는지, 가까운 사람이 잘될 때 실제로 어떤 반응을 보이는지 / 짧은 자유 서술형 3개 — 그중 3개(관계가 멀어질 때·갈등 시 스트레스 대처·돌아봤을 때의 아쉬움) 바로 뒤에 붙어 "왜 그랬던 것 같은지"를 한 줄로 적는 질문, 건너뛸 수 있지만 답했다면 해당 경험 답변의 이유를 직접 설명하는 가장 근거가 확실한 재료다). 경험·행동형 답변은 언제나 9개 있다 — "질문: 돌아보면...", "질문: 가까웠던 관계가 멀어질 때..." 처럼 실제 경험을 묻는 질문에 대한 답은 사용자가 스스로를 돌아보고 준 재료이니, attractionPatterns와 특히 selfReflection에서 추측이 아니라 그 답을 직접 근거로 삼아 반영하라. 경험·행동형 질문 바로 뒤의 짧은 자유 서술(건너뛰지 않고 답한 경우)은 "왜 그랬는지"를 사용자가 직접 설명한 것이니, 있다면 그 경험 답변과 반드시 짝지어 해석하라 — 선택지만으로는 추측일 수밖에 없는 이유를 사용자가 스스로 밝힌 것이다. "요즘 마음 상태", "관계에서 주로 맡는 역할", "힘든 일을 얘기했을 때 조언보다 공감이 필요했는지"에 대한 답도 selfReflection의 재료로 적극 활용하라 — 이상형 취향이 아니라 지금 사용자 자신을 직접 말해주는 답이라 다른 어떤 문항보다도 selfReflection에 곧바로 쓸 수 있다.

문항 중 4개("연애할 때, 상대가 해줬으면 하는 건?", "잘 맞는 생활은?", "갈등이 있을 때, 이상형은 스트레스를 어떻게 풀면 좋겠어?", "오래 편안한 사람 vs 매일 설레는 사람, 하나만 고른다면?")는 이 결과와 별개로 코드가 "공유 태그"를 결정하는 데도 쓰인다 — 같은 서비스의 다른 사용자와 태그로 궁합을 비교하는 기능의 재료다. 앞의 두 문항("연애할 때...", "잘 맞는 생활은?")은 선호형이라 최대 3개까지 고를 수 있고, 답변에 "1순위/2순위/3순위"로 우선순위가 표시되어 있다. 태그는 그중 1순위 하나로만 정해진다(사용자에게도 화면에서 "먼저 고른 게 더 중요해요"라고 이미 안내했다). 나머지 두 문항("갈등이 있을 때...", "오래 편안한 사람 vs 매일 설레는 사람")은 단일 선택이라 고른 답 하나가 전부다. 이 네 문항에서 가장 먼저 고른 답과 다른 결론을 내는 것 자체는 금지가 아니다 — 오히려 답변 사이의 간극을 짚는 것이 selfReflection의 핵심이다. 다만 다른 결론을 낼 때는 가장 먼저 고른 답이 무엇인지 문장 안에서 알 수 있게 쓰고 그 차이를 간극으로 드러내라(예: "~라고 답했지만 정작 ~", "~을 먼저 꼽으면서도 실제로는 ~"). 가장 먼저 고른 답을 문장에서 알아볼 수 없는 채로 그와 반대되는 성향으로 단정하지 마라. 두 번째·세 번째로 고른 답을 마치 가장 먼저 고른 답인 것처럼 대표 성향으로 서술하지 마라. 이 규칙은 이 네 문항에 대한 서술 톤에만 적용되고, 다른 문항의 해석 방식에는 영향을 주지 않는다. 결과 서술에 "1순위", "2순위", "3순위", "태그", "공유 태그", "궁합"이라는 단어를 그대로 쓰지 마라 — 사용자는 이런 구조를 모른다. 대신 "가장 먼저 꼽은", "먼저 고른", "무엇보다" 같은 자연스러운 표현으로 풀어 써라.

경험·행동형 답변이 9개나 있다고 해서 attractionPatterns나 selfReflection의 개수를 억지로 늘리지 마라 — 개수는 각 항목 설명에 적힌 범위 안에서 자연스럽게 정하면 된다. 대신 attractionPatterns와 selfReflection 중 최소 한 곳에는 아래 세 종류 중 하나 이상을 반드시 포함하라 — 선택지 답변만으로는 쓸 수 없는, 경험·행동형 답변이 있어야만 쓸 수 있는 문장이어야 한다.
· 예측 — 앞으로의 관계에서 나타날 가능성이 높은 패턴을 전망하는 문장(예: "다음 관계에서는 이런 사람에게 끌릴 가능성이 높아요")
· 변화 — "예전과 비교해 관계 맺는 방식이 어떻게 달라졌는지"에 대한 답을 근거로, 예전과 지금의 차이를 짚는 문장
· 교차 — 서로 다른 질문에 대한 답변 2개 이상(예: 돌아봤을 때 아쉬웠던 점 + 예전과 달라진 점처럼 다른 시점·다른 질문의 답)을 연결해서 만든 해석. 단순 나열이 아니라 두 답변을 이어야만 성립하는 해석이어야 한다.
좋은 예(아쉬움 답변과 예측을 교차한 문장): "돌아봤을 때 '대화를 더 시도할걸'이 가장 아쉬웠다고 답한 것은 스스로도 이 회피 패턴을 인지하고 있다는 신호예요. 그래서 다음 관계에서는 유독 '먼저 다가와 알아봐주는 사람'에게 더 강하게 끌릴 가능성이 높아요."

사용자가 직접 적은 자유 서술 답변에는 이상형과 완전히 무관한 요청(코드 작성, 번역, 일반 지식 질문, 창작 요청 등), 특정 실존 인물에 대한 모욕, 노골적으로 성적이거나 폭력적인 표현이 섞여 있을 수 있다. 이 세 가지만 결과에서 제외하고, 나머지는 전부 이상형과 관련된 정상적인 답변으로 다뤄라. 연애·감정·관계에 대한 솔직한 서술은 배제 대상이 아니다 — 그대로 다루고 완곡하게 순화하지 마라. 특히 selfReflection은 사용자를 정면으로 비추는 통찰이어야 한다: 배제 대상이 아닌 내용을 이 지시 때문에 얼버무리거나 약화시키지 말고, 불편하더라도 정확하게 써라. title/oneLiner/criteria/attractionPatterns/flags/selfReflection/roadmap을 포함해 모든 출력 필드에 위 세 가지 배제 대상을 그대로 옮기거나 인용하지 마라. 자유 서술이 이상형과 완전히 무관하면 그 부분만 무시하고 나머지 선택지 답변으로 결과를 구성하라.

★가장 중요한 원칙★: 사용자가 답한 내용을 그대로 되풀이하지 마라. 예를 들어 사용자가 "차분한 사람"을 골랐다고 해서 결과에 "당신은 차분한 사람을 좋아하는군요"라고 쓰면 실패다. 대신 "왜 그런 패턴이 반복되는지", "그 선택이 무엇을 암시하는지", "본인은 어떤 사람일 가능성이 높은지"까지 한 걸음 더 들어가야 한다. 말로 전달해도 되는 수준의 정리는 이 기능의 가치가 없다 — 사용자 혼자서는 눈치채기 어려운 통찰을 줘야 한다.

각 항목 작성 원칙:
- title: "얘 ___ 좋아한대"라는 문장에 그대로 넣었을 때 자연스러운, 사용자가 원하는 "상대"를 짧게 서술하는 말이다. 사용자 자신을 서술하지 않는다 — 본인에 대한 통찰은 selfReflection이 맡는다. 공백 포함 16자 이내로 쓰고, 가능하면 12자 이내를 목표로 한다. "다정한", "따뜻한", "든든한" 같은 일반적인 성격 형용사만으로 title을 채우지 마라 — 누구에게나 붙일 수 있는 말은 그 사람을 가리키지 못한다. 답변에 나온 구체적인 행동·상황·선택을 반영해서, 다른 사람의 결과에는 그대로 붙지 않을 표현을 만들어라. "X한데 속은 Y한", "X하지만 Y한" 같은 대비 구조를 기본값으로 쓰지 마라 — 답변에서 대비가 실제로 두드러질 때만 쓰고, 쓰더라도 많아야 1개까지다. 형용사를 3개 이상 나열하지 않는다. "뚝배기", "청량" 같은 추상적인 비유나 조어를 쓰지 말고 일상적으로 쓰는 말로 표현한다. 그렇다고 정해진 유형 목록에서 고르듯 뻔하게 쓰지 말고 매번 새롭게 만들되, 읽자마자 이해되지 않는 표현은 개성이 아니라 실패다. title은 반드시 명사 또는 명사구로 끝나야 한다 — "얘 ___ 좋아한대"에 그대로 넣었을 때 문장이 완결돼야 하기 때문이다. "~는", "~한", "~던"처럼 관형절로 끝나서 뒤에 명사가 빠진 채 마무리되면 안 된다. 좋은 예: "다투면 바로 풀고 마는 사람", "장문 메시지 즐기는 스타일". 나쁜 예: "다투면 바로 풀고 마는"(뒤에 명사가 없어 문장이 안 끝난다), "장문 메시지 즐기는"(마찬가지).
- oneLiner: 공유하고 싶어지는 한 줄 압축 요약.
- criteria(mustHave/niceToHave/canCompromise): 사용자의 답변에서 우선순위를 추론해 "꼭 필요한 것 / 있으면 좋은 것 / 없어도 괜찮은 것"으로 재분류한다. 각 2~4개.
- attractionPatterns: ★핵심★. 사용자가 고른 선택지들을 가로질러 반복되는 끌림의 패턴을 짚어준다. 단순 요약이 아니라 "왜 그런 것에 끌리는지"에 대한 해석을 담는다. 경험·행동형 답변(항상 최소 3개 있음)에서 나온 실제 패턴을 최소 1개는 반드시 반영한다. 항목마다 문장을 시작하는 골격이 겹치지 않게 접근 방식을 섞어라 — 전부 "~라고 답했지만 정작"류의 간극형 문장으로만 채우지 말고, 반복되는 끌림의 행동 자체를 짚는 문장, 상황에 따라 달라지는 취향을 짚는 문장, 서로 다른 답변을 연결한 문장처럼 관점을 다양하게 써라. 간극을 짚는 문장 자체는 계속 써도 된다 — 골격이 반복되는 것만 피하면 된다. 2~4개.
- matrix: "끌림 강도"(x축)와 "관계 적합도"(y축) 2개 축으로 4사분면을 만들고, 그 위에 사용자의 답변에서 도출한 4가지 상대방 유형을 각각 하나의 사분면에 배치한다(설레지만 신중히 볼 사람 / 이상적인 사람 / 관심이 덜 가는 사람 / 좋은 인연 후보 같은 4가지 성격의 유형). x/y는 0~100 사이 값. 정확히 4개를 만들되, 배열 개수를 강제하는 스키마 규칙이 아니라 이 지시문으로만 유도한다.
- flags(green/red): 사용자의 답변 패턴을 근거로 실제 상대를 만날 때 참고할 좋은 신호 / 주의 신호. 각 2~4개.
- selfReflection(whatYouOffer/whatToImprove): ★가장 중요한 항목★. 이상형에 대한 답변을 거꾸로 뒤집어서 사용자 자신에 대한 통찰을 준다 — "이런 사람에게 끌린다는 것은, 본인은 이런 면을 가지고 있거나 이런 걸 줄 수 있는 사람일 가능성이 높다"는 식의 역추론. whatToImprove는 사용자가 이상형에게 바라는 것과 본인의 현재 모습 사이의 간극에서 나오는 보완점을 짚는다. 경험·행동형 답변(관계가 멀어질 때의 패턴, 갈등 대처, 아쉬웠던 점 — 항상 최소 3개 있음)은 추측이 아니라 사용자가 직접 답한 실제 패턴이니, whatToImprove에 그 내용을 근거로 한 항목을 최소 1개는 반드시 포함한다. 각 2~4개.
- roadmap: firstAction은 24시간 안에 실천할 수 있는 아주 구체적인 행동 하나. phases는 30일 동안의 단계별 계획(예: "1주 이내", "2주 이내", "한 달 이내") 2~4단계, 각 단계에 실행 항목 2~3개.
- 실존 인물이나 유명인의 이름은 절대 언급하지 않는다.
- 사용자가 어떤 항목을 건너뛰었으면(선택지도 직접입력도 없으면) 그 항목은 자연스럽고 무난한 내용으로 채운다 — 절대 "답변 없음"이나 빈 배열로 두지 않는다.
- 문장 끝맺음을 다양하게 쓴다. 기본 어조는 "해요체"(예: "반복돼요", "가능성이 높아요")지만, 같은 어미가 연속 3번 이상 나오면 안 된다 — 특히 "~예요"/"~이에요"/"~거예요"가 줄줄이 이어지지 않게, 평서형 종결(예: "반복된다", "그게 패턴이다"), 명사형 마무리(예: "~하는 편", "~라는 신호"), 짧은 단정(예: "이유는 이거다.")을 같은 블록 안에서 의도적으로 섞어 쓴다 — title/oneLiner/criteria/attractionPatterns/matrix의 type 설명/flags/selfReflection/roadmap 전부 예외 없이 해당된다. 이건 표현의 리듬을 다양하게 하라는 것이지 내용을 부드럽게 하라는 뜻이 아니다 — 위에서 말한 대로 불편한 내용이라도 완곡하게 순화하지 말고 정확하게 쓰되, 어미만 다채롭게 쓴다.
- "~일 가능성이 높아요", "~라는 뜻이에요", "~신호예요" 같은 해설조 표현을 남발하지 마라. 예측 문장(위 예측/변화/교차 지시 참고)에는 이런 확률·의미 부여 표현이 필요하지만, 그 외 문장까지 전부 이 틀로 채우면 결과 전체가 해설문처럼 읽힌다. 같은 해설조 표현이 반복되면 더 직접적인 문장으로 바꿔 써라.
- 길이는 지금 수준을 유지한다. 내용을 줄이지 마라.
- ★selfReflection은 답변 여러 개를 교차해 모순이나 패턴을 짚는 것이 핵심이다. 이 통찰은 짧게 요약하면 성립하지 않으니 필요한 만큼 충분히 써라.
- 모든 출력은 한국어로, 친근하고 담백하되 통찰력 있는 어조로 작성한다.`;

const IDEAL_TYPE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    oneLiner: { type: "string" },
    criteria: {
      type: "object",
      properties: {
        mustHave: { type: "array", items: { type: "string" } },
        niceToHave: { type: "array", items: { type: "string" } },
        canCompromise: { type: "array", items: { type: "string" } },
      },
      required: ["mustHave", "niceToHave", "canCompromise"],
      additionalProperties: false,
    },
    attractionPatterns: { type: "array", items: { type: "string" } },
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
    flags: {
      type: "object",
      properties: {
        green: { type: "array", items: { type: "string" } },
        red: { type: "array", items: { type: "string" } },
      },
      required: ["green", "red"],
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
  required: ["title", "oneLiner", "criteria", "attractionPatterns", "matrix", "flags", "selfReflection", "roadmap"],
  additionalProperties: false,
} as const;

type RawCriteria = { mustHave: string[]; niceToHave: string[]; canCompromise: string[] };
type RawMatrix = {
  xAxisLabel: { low: string; high: string };
  yAxisLabel: { low: string; high: string };
  types: Array<{ label: string; description: string; x: number; y: number }>;
};
type RawFlags = { green: string[]; red: string[] };
type RawSelfReflection = { whatYouOffer: string[]; whatToImprove: string[] };
type RawRoadmap = { firstAction: string; phases: Array<{ label: string; actions: string[] }> };

type RawIdealType = {
  title: string;
  oneLiner: string;
  criteria: RawCriteria;
  attractionPatterns: string[];
  matrix: RawMatrix;
  flags: RawFlags;
  selfReflection: RawSelfReflection;
  roadmap: RawRoadmap;
};

export type ParseFailureReason =
  | "invalid_json"
  | "invalid_title"
  | "invalid_one_liner"
  | "invalid_criteria"
  | "invalid_attraction_patterns"
  | "invalid_matrix"
  | "invalid_flags"
  | "invalid_self_reflection"
  | "invalid_roadmap";

export type ParseResult = { ok: true; data: RawIdealType } | { ok: false; reason: ParseFailureReason };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidCriteria(value: unknown): value is RawCriteria {
  const c = value as Partial<RawCriteria> | undefined;
  return typeof c === "object" && c !== null && isStringArray(c.mustHave) && isStringArray(c.niceToHave) && isStringArray(c.canCompromise);
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

function isValidFlags(value: unknown): value is RawFlags {
  const f = value as Partial<RawFlags> | undefined;
  return typeof f === "object" && f !== null && isStringArray(f.green) && isStringArray(f.red);
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

// Returns a failure reason instead of the raw text so callers never need to
// log the AI response body (which echoes the user's whole quiz answers) just
// to know why validation failed.
export function parseAndValidate(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (typeof parsed !== "object" || parsed === null) return { ok: false, reason: "invalid_json" };
  const candidate = parsed as Partial<RawIdealType>;

  if (typeof candidate.title !== "string" || !candidate.title.trim()) return { ok: false, reason: "invalid_title" };
  if (typeof candidate.oneLiner !== "string" || !candidate.oneLiner.trim()) return { ok: false, reason: "invalid_one_liner" };
  if (!isValidCriteria(candidate.criteria)) return { ok: false, reason: "invalid_criteria" };
  if (!isStringArray(candidate.attractionPatterns)) return { ok: false, reason: "invalid_attraction_patterns" };
  if (!isValidMatrix(candidate.matrix)) return { ok: false, reason: "invalid_matrix" };
  if (!isValidFlags(candidate.flags)) return { ok: false, reason: "invalid_flags" };
  if (!isValidSelfReflection(candidate.selfReflection)) return { ok: false, reason: "invalid_self_reflection" };
  if (!isValidRoadmap(candidate.roadmap)) return { ok: false, reason: "invalid_roadmap" };

  return { ok: true, data: candidate as RawIdealType };
}

function formatTranscript(session: MapSession): string {
  if (session.messages.length === 0) return "(답변 없음)";
  return session.messages.map((message) => (message.role === "user" ? `사용자: ${message.text}` : `질문: ${message.text}`)).join("\n");
}

// 화면에 너무 많이 나오지 않도록 자르는 상한은 여기(코드)에서만 건다 —
// 스키마에 maxItems를 넣지 않는다.
function capArray<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

function capMatrixPoints(points: RawMatrix["types"]): IdealTypeMatrixPoint[] {
  return capArray(points, 4).map((point) => ({ label: point.label, description: point.description, x: point.x, y: point.y }));
}

function capRoadmapPhases(phases: RawRoadmap["phases"]): IdealTypeRoadmapPhase[] {
  return capArray(phases, 4).map((phase) => ({ label: phase.label, actions: capArray(phase.actions, 4) }));
}

// Sonnet 5는 명시하지 않아도 내부 사고(thinking)가 기본 켜져 있고("effort"
// 기본값 high), 그 사고 토큰이 max_tokens 예산과 과금 출력 토큰에 그대로
// 포함된다(Anthropic 공식 마이그레이션 문서 확인). 실측 결과 완주 1회당
// 출력이 최종 JSON 추정치(1,000~1,500토큰)보다 훨씬 큰 이유가 이것이다 —
// 예산이 빠듯하면 사고만 채우고 답변이 잘린 채 stop_reason이 "max_tokens"로
// 끝나는데, 지금까지는 이걸 확인하지 않아서 잘림이 곧바로 "스키마 검증
// 실패"로만 보이고 원인을 알 수 없었다.
//
// 1차 시도가 잘림으로 실패하면, 2차 시도는 같은 조건으로 또 잘릴 확률이
// 높으므로 더 큰 max_tokens로 재시도한다 — 단, 여기 두 호출은 스트리밍을
// 쓰지 않는 client.messages.create() 방식이라 Anthropic 공식 문서가 명시한
// "논스트리밍은 max_tokens 16,000 초과 시 어느 모델이든 SDK/인프라 타임아웃
// 위험이 있다(그럴 경우 스트리밍으로 전환)"는 상한을 넘기지 않도록
// 24576이 아니라 16384로 제한한다. 재시도가 1차와 같은 상한을 쓰게 되어
// "예산을 키워서 구제"하는 효과는 약해지지만, 재시도가 타임아웃으로 죽어
// 사용자가 아무것도 못 받는 것보다는 안전하다. 16384에서도 계속 잘리면
// 스트리밍 전환이 필요하다는 신호 — 별도 승인 후 처리한다.
const IDEAL_TYPE_MAX_TOKENS = 16384;
const IDEAL_TYPE_MAX_TOKENS_RETRY = 16384;

// countsAsFailure: 이 실패를 rate-limit.ts의 세션당 실패 상한
// (MAX_FAILED_GENERATIONS_PER_SESSION)에 넣을지. API 키 미설정·
// Anthropic 5xx/과부하·네트워크·타임아웃 같은 서버 쪽 원인은 false(
// engine/generation-error.ts) — 사용자가 무엇을 입력했든 똑같이 났을
// 실패이기 때문이다. 빈 응답·스키마 검증 실패는 입력/출력 내용에
// 기인한 실패라 항상 true.
async function attemptGeneration(client: Anthropic, session: MapSession, maxTokens: number): Promise<{ result: IdealTypeResult | null; truncated: boolean; countsAsFailure: boolean }> {
  let responseText: string | undefined;
  let truncated = false;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      // 시스템 프롬프트는 문항 수·스키마가 바뀌지 않는 한 매 호출마다
      // 완전히 동일한 문자열이다 — 캐시 breakpoint를 걸어두면 같은 5분
      // 안의 다음 호출부터 이 부분의 입력 요금이 크게 줄어든다(요청마다
      // 달라지는 사용자 답변 부분은 캐시되지 않는다). 결과 품질에는
      // 영향이 없다 — 캐싱은 순전히 과금 방식일 뿐 모델이 보는 내용은
      // 그대로다.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `사용자가 이상형 퀴즈에서 고른 답변:\n${formatTranscript(session)}`,
        },
      ],
      output_config: {
        effort: getGenerationEffort(),
        format: { type: "json_schema", schema: IDEAL_TYPE_SCHEMA },
      },
    });
    truncated = response.stop_reason === "max_tokens";
    if (truncated) {
      // 사용자 입력·응답 내용은 절대 로그에 넣지 않는다 — 토큰 수치만.
      console.warn("[ideal-type-generator] response truncated by max_tokens", {
        maxTokens,
        outputTokens: response.usage?.output_tokens ?? null,
        thinkingTokens: response.usage?.output_tokens_details?.thinking_tokens ?? null,
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
    console.error("[ideal-type-generator] Claude API call failed", {
      status,
      type,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      countsAsFailure: !serverSide,
    });
    return { result: null, truncated, countsAsFailure: !serverSide };
  }

  if (!responseText) {
    console.error("[ideal-type-generator] empty response from Claude");
    return { result: null, truncated, countsAsFailure: true };
  }

  const parsed = parseAndValidate(responseText);
  if (!parsed.ok) {
    console.error("[ideal-type-generator] response failed schema validation", { reason: parsed.reason, truncated });
    return { result: null, truncated, countsAsFailure: true };
  }

  const data = parsed.data;
  const result: IdealTypeResult = {
    version: 2,
    generatedAt: now(),
    model: "claude-sonnet-5",
    title: data.title,
    oneLiner: data.oneLiner,
    criteria: {
      mustHave: capArray(data.criteria.mustHave, 4),
      niceToHave: capArray(data.criteria.niceToHave, 4),
      canCompromise: capArray(data.criteria.canCompromise, 4),
    },
    // 화면에 너무 많이 나오지 않도록 자르는 상한 — 개수 자체를 조건에 따라
    // 다르게 유도하지 않는다(예측/변화/교차 문장 포함 여부는 프롬프트의
    // "말의 종류" 지시로 처리한다).
    attractionPatterns: capArray(data.attractionPatterns, 4),
    matrix: {
      xAxisLabel: data.matrix.xAxisLabel,
      yAxisLabel: data.matrix.yAxisLabel,
      types: capMatrixPoints(data.matrix.types),
    },
    flags: {
      green: capArray(data.flags.green, 4),
      red: capArray(data.flags.red, 4),
    },
    selfReflection: {
      whatYouOffer: capArray(data.selfReflection.whatYouOffer, 4),
      whatToImprove: capArray(data.selfReflection.whatToImprove, 4),
    },
    roadmap: {
      firstAction: data.roadmap.firstAction,
      phases: capRoadmapPhases(data.roadmap.phases),
    },
    // AI가 만든 필드가 아니다 — 퀴즈 답변(session.quizAnswers)만 보고
    // 코드로 결정적으로 고른 공유 태그. AI 응답 파싱과 무관하게 항상
    // 붙인다(session.quizAnswers가 없는 예전 세션이면 빈 배열).
    tags: getIdealTypeTags(session.quizAnswers, "idealType"),
  };
  return { result, truncated, countsAsFailure: false };
}

const MAX_GENERATION_ATTEMPTS = 2;

export type IdealTypeGenerationOutcome = { result: IdealTypeResult | null; countsAsFailure: boolean };

// Server-side only: reads ANTHROPIC_API_KEY from the environment and must
// never be imported from client components. The API route is the only caller.
//
// countsAsFailure(반환값): 최종 실패 시 rate-limit.ts의 세션당 실패
// 상한에 넣을지. 재시도 2회 중 하나라도 입력/출력 내용 때문에 실패한
// 적이 있으면(countsAsFailure: true) 최종적으로도 카운트한다 — 두
// 시도가 서로 다른 이유로 실패할 수 있어서(예: 1차는 과부하로, 2차는
// 스키마 검증 실패로), 둘 다 서버 쪽 원인이었을 때만 카운트를 면제한다.
export async function generateIdealTypeResult(session: MapSession): Promise<IdealTypeGenerationOutcome> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ideal-type-generator] ANTHROPIC_API_KEY not set");
    return { result: null, countsAsFailure: false };
  }

  const client = new Anthropic({ apiKey });
  let maxTokens = IDEAL_TYPE_MAX_TOKENS;
  let countsAsFailure = false;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const outcome = await attemptGeneration(client, session, maxTokens);
    if (outcome.result) return { result: outcome.result, countsAsFailure: false };
    if (outcome.countsAsFailure) countsAsFailure = true;
    if (outcome.truncated) maxTokens = IDEAL_TYPE_MAX_TOKENS_RETRY;
  }
  return { result: null, countsAsFailure };
}

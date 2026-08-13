// TASTE v3 — §10/§11 COMPOSITIONAL NARRATIVE ENGINE.
//
// 5개 고정 템플릿 중 하나를 고르는 방식(v1 NARRATIVE_COPY)도, 매 결과
// 마다 LLM을 호출하는 방식도 아니다. 6개 축 × 8개(≥6 요구) block
// family를 두고, 사용자의 실제 evidence(어떤 문항에서 그 축이 가장
// 강하게 나왔는가)로 각 섹션의 block을 "선택"한 뒤, 남은 근거를
// 문장으로 엮어 조합한다 — block 조합의 경우의 수가 5개에 갇히지
// 않는다.
//
// PIPELINE(§10): answers → evidence extraction(tasteEvidenceV3) →
// six-axis profile(aggregateV3Axes) → relationship matching
// (tasteRelationshipsV3) → tension matching(tasteTensionsV3) →
// section-specific block selection(이 파일) → repetition arbitration
// (이 파일) → final composition(이 파일).

import { TASTE_V3_AXIS_KEYS, type TasteV3AxisKey } from "./tasteQuestionnaireV3";
import { aggregateV3Axes, extractV3Evidence, type V3AxisAggregate, type V3EvidenceItem } from "./tasteEvidenceV3";
import { matchAllV3Relationships, RELATIONSHIP_DEFS_V3, type V3RelationshipDef, type V3RelationshipMatch } from "./tasteRelationshipsV3";
import { matchAllV3Tensions, type V3TensionMatch } from "./tasteTensionsV3";
import type { TasteV3RawAnswers } from "./tasteQuestionnaireV3";

// ============================================================
// SECTION SHAPE
// ============================================================
export type TasteMagazineNarrativeV3 = {
  opening: { headline: string; summary: string };
  space: { headline: string; body: string };
  sensory: { headline: string; body: string };
  rhythmRelation: { headline: string; body: string };
  explorationExpression: { headline: string; body: string };
  // 매칭된 relationship/tension이 하나도 없어도 buildInterestingPart()가
  // axis-pair fallback으로 항상 채운다 — null이 되지 않는다(§8 요구:
  // "가장 강한 Relationship/Tension 하나를 깊게 쓴다"를 예외 없이 지킨다).
  interestingPart: { headline: string; body: string };
  ending: { body: string; pullQuote: string };
  keywords: string[];
  pullQuote: string; // OwnershipSection 등 기존 컴포넌트 호환용(opening/ending과 동일 톤)
  charCount: number;
  debug: {
    axes: Record<TasteV3AxisKey, number>;
    relationshipMatches: string[];
    tensionMatches: string[];
    openingSource: string;
    interestingPartSource: string | null;
  };
};

const AXIS_LABEL_KO: Record<TasteV3AxisKey, string> = {
  space: "공간을 대하는 방식",
  sensory: "먼저 반응하는 감각",
  rhythm: "리듬",
  relation: "관계 안에서의 거리",
  exploration: "새로움을 대하는 태도",
  expression: "표현하는 방식",
};

// ============================================================
// BLOCK POOL — 축마다 최소 8개(요구 6개 이상) family. 각 family는
// "이 축에서 가장 강한 근거가 된 evidenceTag"로 선택된다.
// ============================================================
type AxisBlock = { evidenceTag: string; core: string };

const SPACE_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "contained / lived-in / layered / warm familiarity",
    core: "잠깐 머물 곳을 고를 때, 트인 공간보다 빛이 부드럽게 들어오고 손때 묻은 물건들이 놓인 작은 공간을 선택했습니다. 공간이 넓은지보다, 그 안에 시간이 쌓여 있는지가 당신에게는 더 중요한 기준입니다. 처음 보는 곳이라도 어딘가에 사람이 머문 흔적이 남아 있으면, 그 공간은 이미 낯설지 않은 곳이 됩니다.",
  },
  {
    evidenceTag: "open / ordered / visually quiet / spatial clarity",
    core: "잠깐 머물 곳을 고를 때, 손때 묻은 아늑함보다 시야가 트이고 선과 면이 정돈된 넓은 공간을 선택했습니다. 공간에 무언가가 쌓여 있는 것보다, 시야가 걸리지 않고 정돈돼 있는 쪽이 당신을 편안하게 합니다. 물건이 많아서 좋은 공간이 아니라, 눈이 쉴 자리가 있는 공간이 당신에게는 더 오래 머물고 싶은 곳입니다.",
  },
  {
    evidenceTag: "visible life / accessible layers",
    core: "자주 쓰는 테이블이라면 지금 쓰는 것들이 어느 정도 보이는 쪽이 더 편하다고 답했습니다. 정리된 상태보다, 지금 살고 있다는 흔적이 눈에 보이는 공간이 당신에게는 더 자연스럽습니다. 완벽하게 비워진 자리보다, 방금까지 쓰던 물건이 놓여 있는 자리에서 오히려 편안함을 느끼는 쪽입니다.",
  },
  {
    evidenceTag: "controlled field / reduced noise",
    core: "자주 쓰는 테이블이라면 쓰지 않는 것은 대부분 치워진 쪽이 더 편하다고 답했습니다. 무언가가 눈에 걸리는 것보다, 통제된 여백이 남아 있는 공간이 당신을 덜 피곤하게 합니다. 지금 필요하지 않은 것은 시야에서 사라져야, 지금 필요한 일에 집중할 수 있는 쪽입니다.",
  },
  {
    evidenceTag: "continuity with evolution",
    core: "오래 좋아해온 장소가 바뀐다면, 익숙한 분위기는 남겨두고 조금씩 달라지는 쪽을 골랐습니다. 완전히 새로워지는 것보다, 알아볼 수 있는 채로 조금씩 변하는 공간을 더 신뢰합니다. 변화 자체를 거부하는 게 아니라, 그 변화 안에서 여전히 나를 알아볼 수 있는지가 당신에게는 더 중요합니다.",
  },
  {
    evidenceTag: "transformation appetite",
    core: "오래 좋아해온 장소가 바뀐다면, 전혀 다른 모습으로 새롭게 바뀌는 쪽을 골랐습니다. 공간에 대한 애착이 그 공간의 모습 자체보다는, 그 공간이 계속 당신에게 새로운 순간을 만들어주는지에 더 걸려 있습니다. 그대로 남아 있는 것보다, 다음에 갔을 때 또 다른 이야기가 생기는 쪽을 더 반깁니다.",
  },
  {
    evidenceTag: "restorative familiarity",
    core: "하루가 비었을 때는 익숙한 곳으로 돌아가 내 방식대로 시간을 보내는 쪽에 더 끌렸습니다. 공간을 고르는 마지막 기준도 결국 새로움이 아니라, 내가 나로 있을 수 있는 자리인지에 있습니다. 아무것도 정해지지 않은 하루일수록, 오히려 가장 잘 아는 곳으로 향하는 편입니다.",
  },
  {
    evidenceTag: "experiential novelty",
    core: "하루가 비었을 때는 아직 모르는 곳으로 가서 새로운 장면을 만드는 쪽에 더 끌렸습니다. 공간을 고르는 마지막 기준이 익숙함이 아니라, 그 공간이 아직 겪어보지 못한 순간을 줄 수 있는지에 있습니다. 아무것도 정해지지 않은 하루일수록, 그 여백을 낯선 장소에 내어주는 편입니다.",
  },
];
const SPACE_CLOSERS = [
  "결국 공간을 판단하는 기준은 크기나 유행이 아니라, 그 안에서 당신이 얼마나 자기다워질 수 있는가에 있습니다. 새로운 공간에 처음 들어서는 몇 초 안에, 이 기준은 거의 자동으로 작동합니다.",
  "공간이 당신에게 좋은 공간이 되는 조건은 정해진 스타일이 아니라, 이 감각이 그대로 지켜지는가입니다. 남들이 좋다고 말하는 공간이라도, 이 조건이 어긋나면 당신에게는 오래갈 이유가 없는 곳으로 남습니다.",
  "이 기준이 지켜지지 않는 공간에서는, 아무리 예쁘고 넓어도 오래 머물지 못하는 편입니다. 반대로 이 기준만 맞으면, 크기나 위치 같은 다른 조건은 상대적으로 쉽게 양보하는 쪽입니다.",
  "공간을 고르는 이 감각은 사소해 보여도, 당신이 하루 중 가장 먼저 편안해지는 순간을 결정합니다. 그래서 이 기준은 집을 고를 때뿐 아니라, 잠깐 들를 카페 하나를 고를 때도 똑같이 작동합니다.",
];

const SENSORY_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "material-detail sensitivity",
    core: "처음 들어간 공간에서는 재료와 질감을 가장 먼저 봅니다. 전체적인 인상보다, 손에 닿거나 눈에 걸리는 구체적인 표면이 당신의 감각을 먼저 붙잡습니다. 그 공간이 어떤 분위기인지는 그 다음에야 정리되는, 두 번째 순서의 판단입니다.",
  },
  {
    evidenceTag: "visual-tone sensitivity",
    core: "처음 들어간 공간에서는 빛과 색을 가장 먼저 봅니다. 무엇이 놓여 있는지보다, 공간 전체를 물들이는 톤과 온도가 당신의 감각을 먼저 붙잡습니다. 물건 하나하나를 살피는 것은 그 분위기에 이미 마음이 놓인 다음의 일입니다.",
  },
  {
    evidenceTag: "patina / attachment",
    core: "오래 곁에 둘 물건을 고른다면, 시간이 지나며 흔적이 생기는 쪽에 가장 마음이 갑니다. 처음의 완벽함보다, 써온 시간이 표면에 남는다는 사실이 당신의 감각을 더 오래 붙잡아둡니다. 흠집이나 색 바램조차 그 물건을 밀어내는 이유가 아니라, 오히려 더 붙잡아두는 이유가 됩니다.",
  },
  {
    evidenceTag: "formal refinement",
    core: "오래 곁에 둘 물건을 고른다면, 형태가 단정하고 완성도가 높은 쪽에 가장 마음이 갑니다. 시간이 남기는 흔적보다, 처음부터 정확하게 만들어진 감각이 당신을 더 오래 붙잡습니다. 시간이 지나 낡아가는 것보다, 처음의 정확함이 얼마나 오래 유지되는지를 더 눈여겨보는 쪽입니다.",
  },
  {
    evidenceTag: "human trace / imperfection tolerance",
    core: "더 오래 보고 싶은 장면을 고른다면, 완벽하게 정리되지는 않았지만 사람의 흔적이 남아 있는 쪽입니다. 정확함보다 그 안에 누군가 있었다는 흔적이 당신의 눈을 더 오래 머물게 합니다. 흐트러진 부분이 결점이 아니라, 오히려 그 장면을 진짜로 만드는 요소로 읽히는 편입니다.",
  },
  {
    evidenceTag: "precision / visual restraint",
    core: "더 오래 보고 싶은 장면을 고른다면, 불필요한 것이 거의 없고 선과 비율이 정확한 쪽입니다. 사람의 흔적보다, 군더더기 없이 맞아떨어지는 정확함이 당신의 눈을 더 오래 머물게 합니다. 여백이 비어 있어서 부족한 게 아니라, 그 여백까지 계산된 결과로 읽히는 편입니다.",
  },
  {
    evidenceTag: "contained / lived-in / layered / warm familiarity",
    core: "감각적으로는 트인 공간의 정돈됨보다, 빛과 손때가 겹겹이 쌓인 밀도 쪽에 먼저 반응합니다. 시각적 명료함보다 축적된 질감이 당신을 먼저 붙잡는 편입니다. 반듯하게 정리된 것보다, 겹겹이 쌓인 시간의 흔적이 더 눈에 오래 남습니다.",
  },
  {
    evidenceTag: "open / ordered / visually quiet / spatial clarity",
    core: "감각적으로는 밀도 있는 질감보다, 트이고 정돈된 시각적 명료함 쪽에 먼저 반응합니다. 축적된 흔적보다 걸리는 것 없는 명료함이 당신을 먼저 붙잡는 편입니다. 무언가 쌓여 있는 것보다, 정확하게 비워진 상태가 더 눈에 오래 남습니다.",
  },
];
const SENSORY_CLOSERS = [
  "무엇을 먼저 보고 무엇을 오래 보는지는, 당신이 세상을 편집하는 순서를 그대로 보여줍니다. 이 순서는 의식적으로 훈련한 것이 아니라, 거의 반사적으로 작동하는 쪽에 가깝습니다.",
  "이 감각의 순서가 곧 당신이 사물을 판단하는 첫 번째 필터입니다. 그 필터를 통과한 다음에야 가격이나 실용성 같은 다른 기준이 끼어드는 편입니다.",
  "다른 사람이 지나치는 지점에서, 당신은 이미 판단을 끝낸 뒤인 경우가 많습니다. 그래서 같은 것을 보고도 당신이 기억하는 디테일은 종종 남들과 다릅니다.",
  "감각이 먼저 반응한 자리에서, 나머지 판단은 대체로 뒤따라옵니다. 이 순서를 거스르는 선택은 아무리 논리적으로 맞아도 당신에게는 어딘가 불편하게 남습니다.",
];

const RHYTHM_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "stay / depth",
    core: "아무 약속 없는 오후라면, 좋아하는 장소에서 오래 머무는 쪽을 고릅니다. 여러 곳을 옮겨 다니기보다, 한 곳에 충분히 머무는 리듬이 당신에게는 더 자연스럽습니다.",
  },
  {
    evidenceTag: "fast commitment",
    core: "마음에 드는 물건 앞에서는 비교적 빨리 결정하는 편입니다. 오래 저울질하는 것보다, 마음이 움직인 순간을 놓치지 않는 리듬으로 움직입니다.",
  },
  {
    evidenceTag: "slow desire validation",
    core: "마음에 드는 물건 앞에서는 며칠을 두고 계속 생각나는지 보는 편입니다. 마음이 움직인 순간을 바로 따라가기보다, 그 마음이 며칠을 견디는지 지켜보는 리듬으로 움직입니다.",
  },
  {
    evidenceTag: "researched exploration",
    core: "처음 가는 동네에서는 평이 좋은 곳 몇 군데를 비교해 고르는 편입니다. 눈에 들어오는 대로 움직이기보다, 잠깐이라도 견주어본 뒤 움직이는 리듬을 씁니다.",
  },
  {
    evidenceTag: "completion rhythm",
    core: "하루를 잘 보냈다고 느끼는 순간은, 계획했던 일을 거의 해냈을 때입니다. 예상 밖의 장면보다, 마음먹은 것을 끝까지 해낸 순간이 당신의 하루를 완성합니다.",
  },
  {
    evidenceTag: "depth rhythm",
    core: "하루를 잘 보냈다고 느끼는 순간은, 한 가지를 충분히 오래 즐겼을 때입니다. 여러 가지를 해내는 것보다, 하나에 충분히 머문 시간이 당신의 하루를 완성합니다.",
  },
  {
    evidenceTag: "shared spontaneity",
    core: "누군가와 하루를 보낼 때는 만나서 기분 따라 움직이는 쪽이 더 편합니다. 미리 정해두는 것보다, 그 자리의 흐름을 따라가는 리듬이 당신에게는 더 자연스럽습니다.",
  },
  {
    evidenceTag: "coordinated relation",
    core: "누군가와 하루를 보낼 때는 어디로 갈지 어느 정도 정해두는 쪽이 더 편합니다. 그때그때 흐름을 따라가기보다, 미리 맞춰둔 리듬이 당신을 더 편안하게 합니다.",
  },
];

const RELATION_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "shared activation",
    core: "아무 약속 없는 오후에도 결국 누군가에게 연락해 같이 뭔가를 합니다. 혼자만의 시간보다, 누군가와 함께 만드는 시간이 당신의 오후를 더 채웁니다.",
  },
  {
    evidenceTag: "private immersion",
    core: "아무 약속 없는 오후에는 미뤄둔 영화나 책, 음악을 혼자 꺼내봅니다. 누군가와 함께하는 시간보다, 혼자 온전히 몰입하는 시간이 당신의 오후를 더 채웁니다.",
  },
  {
    evidenceTag: "active sharing",
    core: "정말 마음에 드는 것을 발견하면 사진이나 링크를 바로 누군가에게 보냅니다. 그 순간을 혼자 간직하기보다, 곧바로 누군가와 이어지는 쪽을 택합니다.",
  },
  {
    evidenceTag: "private possession",
    core: "정말 마음에 드는 것을 발견하면 일단 나만 알고 다시 찾아갑니다. 누군가와 곧바로 나누기보다, 그 발견을 혼자 충분히 누린 뒤에 생각합니다.",
  },
  {
    evidenceTag: "relational fulfilment",
    core: "하루를 잘 보냈다고 느끼는 순간은, 좋아하는 사람과 좋은 시간을 보냈을 때입니다. 무엇을 해냈는지보다, 누구와 함께였는지가 당신의 하루를 완성합니다.",
  },
  {
    evidenceTag: "social-atmosphere sensitivity",
    core: "처음 들어간 공간에서는 그 공간에 있는 사람들의 분위기를 가장 먼저 봅니다. 공간 자체의 구조보다, 그 안의 사람들이 만드는 온도가 당신을 먼저 붙잡습니다.",
  },
  {
    evidenceTag: "parallel intimacy / autonomy",
    core: "누군가와 함께 있을 때도, 각자 하고 싶은 시간을 조금 갖는 쪽이 더 편합니다. 온전히 맞추는 것보다, 함께 있으면서도 자기 리듬을 지키는 방식을 씁니다.",
  },
  {
    evidenceTag: "selective sharing",
    core: "정말 마음에 드는 것을 발견하면 몇 명에게만 조용히 알려줍니다. 널리 알리는 것도, 완전히 혼자 간직하는 것도 아닌, 가까운 관계 안에서만 나누는 쪽을 택합니다.",
  },
];
const RHYTHM_RELATION_BRIDGES = [
  "혼자와 함께라는 두 단어로는 다 담기지 않습니다 — 당신은 사람과 시간을 쓰는 방식 안에서도 자기만의 속도를 놓지 않는 편에 가깝습니다. 누구와 있느냐보다, 그 시간에 어떤 속도가 허락되는가가 당신에게는 더 중요합니다.",
  "빠르다·느리다와 혼자·함께는 서로 독립적으로 움직입니다 — 어떤 상황에 있느냐에 따라 두 기준이 매번 다르게 조합됩니다. 그래서 같은 사람과 있어도, 날에 따라 전혀 다른 리듬으로 시간을 보내는 게 당신에게는 자연스럽습니다.",
  "리듬과 관계는 당신에게 하나의 다이얼이 아니라, 상황마다 따로 돌아가는 두 개의 다이얼에 가깝습니다. 하나가 빨라진다고 다른 하나도 따라 빨라지지는 않습니다.",
  "결정을 서두르는지와 사람을 필요로 하는지는, 당신 안에서 늘 같은 방향으로 움직이지는 않습니다. 이 둘을 하나의 성격으로 뭉뚱그리면, 오히려 당신을 잘못 읽게 됩니다.",
];
const RHYTHM_RELATION_CLOSERS = [
  "결국 리듬과 관계는 따로 움직이지 않고, 당신이 하루를 편집하는 하나의 기준으로 이어집니다. 일정이 아무리 촘촘해도, 이 기준이 지켜지면 당신은 그 하루를 무리 없이 지나갑니다.",
  "이 조합이 당신에게는 하루를 잘 보냈다고 느끼는지 아닌지를 가르는 실질적인 기준입니다. 겉으로 보이는 일정의 양보다, 이 조합이 맞았는지가 하루의 만족도를 더 크게 좌우합니다.",
  "같은 하루라도 이 리듬과 관계의 조합이 어긋나면, 겉보기에 괜찮아도 만족스럽지 않은 하루로 남습니다. 반대로 이 조합만 맞으면, 특별한 일이 없던 평범한 하루도 꽤 괜찮은 하루로 기억됩니다.",
  "이 기준은 상대에 따라 크게 바뀌지 않는, 당신 쪽에서 먼저 정해두는 조건에 가깝습니다. 누구와 있느냐보다, 이 리듬이 지켜지는가가 그 시간의 만족도를 먼저 결정합니다.",
];

const EXPLORATION_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "curated familiarity",
    core: "처음 가는 동네에서 시간이 남으면 미리 저장해둔 곳으로 갑니다. 낯선 선택보다, 이미 확인된 좋음을 놓치지 않는 쪽을 택합니다.",
  },
  {
    evidenceTag: "intuitive discovery",
    core: "처음 가는 동네에서 시간이 남으면 걷다가 눈에 들어오는 곳으로 들어갑니다. 미리 확인된 것보다, 그 순간 마음이 가는 곳을 따라가는 쪽을 택합니다.",
  },
  {
    evidenceTag: "deliberate novelty",
    core: "처음 가는 동네에서 시간이 남으면 일부러 평소라면 안 갈 것 같은 곳을 골라봅니다. 익숙한 선택지를 지나쳐서라도, 낯선 쪽으로 스스로를 밀어보는 편입니다.",
  },
  {
    evidenceTag: "selective differentiation",
    core: "구매를 앞두고는 지금 가진 것과 정말 다른지를 따져봅니다. 마음에 드는지보다, 이미 가진 것과 겹치지 않는지가 최종 결정의 기준이 됩니다.",
  },
  {
    evidenceTag: "novelty migration",
    core: "좋아하던 것이 유명해지면, 다른 새로운 것을 다시 찾아보고 싶어집니다. 이미 알려진 좋음에 머무르기보다, 아직 알려지지 않은 다음을 찾는 쪽으로 마음이 움직입니다.",
  },
  {
    evidenceTag: "transformation appetite",
    core: "오래 좋아해온 장소가 전혀 다른 모습으로 바뀌는 쪽에 더 마음이 갔습니다. 익숙함을 지키는 것보다, 완전히 새로워지는 쪽에서 더 큰 기대를 느낍니다.",
  },
  {
    evidenceTag: "restorative familiarity",
    core: "하루가 비었을 때조차, 새로운 장면보다 익숙한 곳으로 돌아가는 쪽을 골랐습니다. 탐색은 필요할 때 하는 것이지, 매번 찾아 나서야 하는 기본값은 아닙니다.",
  },
  {
    evidenceTag: "experiential novelty",
    core: "하루가 비었을 때, 익숙한 곳보다 아직 모르는 곳에서 새로운 장면을 만드는 쪽을 골랐습니다. 탐색은 예외적인 선택이 아니라, 당신이 먼저 손을 뻗는 기본값에 가깝습니다.",
  },
];

const EXPRESSION_BLOCKS: AxisBlock[] = [
  {
    evidenceTag: "active sharing",
    core: "정말 좋았던 순간은 바로 누군가에게 알리는 편입니다. 취향은 혼자 간직할 때보다, 밖으로 흘러나갈 때 더 완성된다고 느끼는 쪽입니다.",
  },
  {
    evidenceTag: "private possession",
    core: "정말 좋았던 순간도 일단 나만 알고 다시 찾아갑니다. 취향은 밖으로 흘러나갈 때보다, 혼자만의 것으로 남아 있을 때 더 온전하다고 느끼는 쪽입니다.",
  },
  {
    evidenceTag: "wearable expression",
    core: "취향은 옷과 들고 다니는 것에서 가장 잘 드러난다고 답했습니다. 말로 설명하기보다, 몸에 걸치는 것으로 이미 많은 것을 말하고 있는 편입니다.",
  },
  {
    evidenceTag: "private taste",
    core: "취향은 겉으로 생각보다 잘 드러나지 않는다고 답했습니다. 무언가로 증명하기보다, 스스로 알고 있는 것만으로 충분하다고 느끼는 쪽입니다.",
  },
  {
    evidenceTag: "visible life / accessible layers",
    core: "지금 쓰는 것들이 눈에 보이는 테이블을 편하다고 골랐습니다. 정리해서 숨기기보다, 지금의 취향이 자연스럽게 드러나 있는 쪽을 편안하게 여깁니다.",
  },
  {
    evidenceTag: "controlled field / reduced noise",
    core: "쓰지 않는 것은 치워진 테이블을 편하다고 골랐습니다. 있는 그대로 드러내기보다, 필요한 것만 남기고 정리된 상태로 보여주는 쪽을 편안하게 여깁니다.",
  },
  {
    evidenceTag: "shared validation",
    core: "좋아하던 것이 유명해지면 사람들이 알아보는 게 반갑다고 답했습니다. 취향이 나 혼자만의 것으로 남는 것보다, 다른 사람과 통하는 순간에서 더 큰 만족을 느낍니다.",
  },
  {
    evidenceTag: "novelty / distinctiveness",
    core: "오래 곁에 둘 물건이라면 조금 낯설어 계속 눈이 가는 쪽에 마음이 갑니다. 무난하게 어울리는 것보다, 자기만의 색이 뚜렷한 것으로 취향을 드러내는 편입니다.",
  },
];
const EXPLORATION_EXPRESSION_BRIDGES = [
  "새로운 것을 향해 움직이는 속도와, 그것을 밖으로 드러내는 방식은 당신 안에서 반드시 같은 크기로 움직이지는 않습니다. 무언가를 발견하는 순간과 그것을 누군가에게 보여주기로 결정하는 순간은, 당신에게는 서로 다른 저울을 쓰는 별개의 판단입니다.",
  "탐색의 폭과 표현의 크기는 각자 다른 계기로 커지고 작아지는, 서로 독립된 두 개의 축입니다. 어떤 날은 발견만으로 충분하고, 어떤 날은 그 발견을 굳이 밖으로 꺼내고 싶어지는 식입니다.",
  "무언가를 먼저 발견하는 것과 그것을 남에게 보여주는 것은, 당신에게는 순서도 이유도 다른 별개의 행동입니다. 발견은 스스로를 위한 것이지만, 표현은 상대와 상황을 먼저 고려한 뒤에야 나오는 결정입니다.",
  "새로움을 좇는 속도가 표현의 크기를 자동으로 결정하지는 않습니다 — 당신은 그 둘을 각각 따로 조절합니다. 그래서 겉으로 드러나는 모습만 보고 당신이 무엇을 발견했는지 전부 짐작하기는 어렵습니다.",
];
const EXPLORATION_EXPRESSION_CLOSERS = [
  "발견의 폭과 표현의 크기가 다르다는 것은 부족함이 아니라, 당신이 그 둘을 서로 다른 목적으로 쓰고 있다는 뜻에 가깝습니다. 발견은 당신 자신을 위한 것이고, 표현은 그중에서도 나눌 가치가 있다고 판단한 일부에만 쓰입니다.",
  "탐색은 스스로를 위한 것이고, 표현은 그중 일부만 골라 내놓는 별도의 결정입니다. 이 둘을 같은 크기로 맞추라고 하면, 오히려 둘 다 어색해지는 쪽에 가깝습니다.",
  "이 둘의 격차가 클수록, 당신 안에는 남에게 보여주지 않은 발견이 그만큼 더 쌓여 있다는 뜻입니다. 이 쌓임 자체가 부담이 아니라, 당신만의 자료실처럼 조용히 남아 있는 편입니다.",
  "새로움을 향한 감각과 그것을 드러내는 방식은, 당신 안에서 각자의 속도로 자랍니다. 어느 한쪽이 다른 쪽을 앞지르더라도, 당신에게는 자연스러운 리듬으로 느껴지는 편입니다.",
];

const AXIS_BLOCKS: Record<TasteV3AxisKey, AxisBlock[]> = {
  space: SPACE_BLOCKS,
  sensory: SENSORY_BLOCKS,
  rhythm: RHYTHM_BLOCKS,
  relation: RELATION_BLOCKS,
  exploration: EXPLORATION_BLOCKS,
  expression: EXPRESSION_BLOCKS,
};

// ============================================================
// SELECTION — 축마다 "가장 강하게 기여한 evidence"를 anchor로 고르고,
// 그 다음으로 강한 서로 다른 문항의 evidence를 supporting으로 고른다.
// ============================================================
// 동점(같은 |값|) 처리 — Array.sort는 stable이라 evidence 배열 원래
// 순서(=문항 번호 오름차순)를 그대로 tie-break로 쓰면, 낮은 번호 문항이
// 항상 anchor로 이긴다. 15문항 evidence coverage audit에서 실제로
// Q13/Q14처럼 뒷번호 문항이 거의 anchor가 되지 못하는 편향이
// 발견되어(같은 크기의 signal을 가진 다른 문항에 매번 밀림), 문항
// 번호와 무관한 결정적 해시로 2차 정렬 기준을 바꿨다 — 매 실행마다
// 결과가 달라지는 무작위가 아니라, 같은 입력엔 항상 같은 결과를 주는
// 고정 규칙이다(§23 "테스트 통과용 random 금지"에 해당하지 않는다).
function tieBreakHash(item: V3EvidenceItem, axis: TasteV3AxisKey): number {
  const axisSeed = axis.charCodeAt(0) + axis.charCodeAt(axis.length - 1);
  return (item.qNumber * 31 + axisSeed * 7) % 97;
}

function strongestEvidenceForAxis(aggregate: V3AxisAggregate, axis: TasteV3AxisKey): V3EvidenceItem[] {
  return [...aggregate[axis].evidence].sort((a, b) => {
    const diff = Math.abs(b.axes[axis] ?? 0) - Math.abs(a.axes[axis] ?? 0);
    if (diff !== 0) return diff;
    return tieBreakHash(a, axis) - tieBreakHash(b, axis);
  });
}

function findBlock(axis: TasteV3AxisKey, evidenceTag: string): AxisBlock {
  const pool = AXIS_BLOCKS[axis];
  return pool.find((b) => b.evidenceTag === evidenceTag) ?? pool[0];
}

function pickByIndex<T>(pool: T[], seed: number): T {
  return pool[((seed % pool.length) + pool.length) % pool.length];
}

// 반복 통제(§12) — 같은 문항의 evidence를 여러 섹션에서 인용할 때,
// 첫 인용은 "관찰", 두 번째부터는 "심화" 문형으로 바꾼다. 세 번째
// 이상은 인용하지 않는다(quote=null).
class UsageTracker {
  private counts = new Map<number, number>();
  use(qNumber: number): number {
    const next = (this.counts.get(qNumber) ?? 0) + 1;
    this.counts.set(qNumber, next);
    return next;
  }
  peek(qNumber: number): number {
    return this.counts.get(qNumber) ?? 0;
  }
}

function supportingSentence(item: V3EvidenceItem | undefined, usage: UsageTracker): string {
  if (!item) return "";
  const count = usage.use(item.qNumber);
  if (count === 1) return `${item.eyebrow} 질문에서도 ${item.evidenceLabel}는 대목이 같은 방향을 가리켰습니다.`;
  if (count === 2) return `앞서 나온 ${item.eyebrow}의 선택으로 다시 돌아가 보면, 이 태도는 한 장면에서 그치지 않고 다른 장면에서도 되풀이됩니다.`;
  return "";
}

function pickSupporting(evidenceSorted: V3EvidenceItem[], excludeQNumbers: number[]): V3EvidenceItem | undefined {
  return evidenceSorted.find((e) => !excludeQNumbers.includes(e.qNumber));
}

// ============================================================
// SECTION BUILDERS
// ============================================================
function buildSingleAxisSection(
  axis: TasteV3AxisKey,
  headline: string,
  aggregate: V3AxisAggregate,
  usage: UsageTracker,
  closerPool: string[]
): { headline: string; body: string } {
  const sorted = strongestEvidenceForAxis(aggregate, axis);
  const anchor = sorted[0];
  if (!anchor) {
    return { headline, body: "이 축에서는 뚜렷한 방향이 나오지 않았습니다 — 답변이 고르게 나뉘어 어느 한쪽으로 강하게 기울지 않았습니다." };
  }
  usage.use(anchor.qNumber);
  const block = findBlock(axis, anchor.evidenceTag);
  const supportingA = pickSupporting(sorted, [anchor.qNumber]);
  const supportingATxt = supportingSentence(supportingA, usage);
  const supportingB = pickSupporting(sorted, [anchor.qNumber, supportingA?.qNumber ?? -1]);
  const supportingBTxt = supportingB ? supportingSentence(supportingB, usage) : "";
  const closer = pickByIndex(closerPool, anchor.qNumber + (supportingA?.qNumber ?? 0));
  const body = [block.core, supportingATxt, supportingBTxt, closer].filter(Boolean).join(" ");
  return { headline, body };
}

function buildDualAxisSection(
  axisA: TasteV3AxisKey,
  axisB: TasteV3AxisKey,
  headline: string,
  aggregate: V3AxisAggregate,
  usage: UsageTracker,
  bridgePool: string[],
  closerPool: string[]
): { headline: string; body: string } {
  const sortedA = strongestEvidenceForAxis(aggregate, axisA);
  const sortedB = strongestEvidenceForAxis(aggregate, axisB);
  const anchorA = sortedA[0];
  const anchorB = sortedB[0];
  const parts: string[] = [];
  if (anchorA) {
    usage.use(anchorA.qNumber);
    parts.push(findBlock(axisA, anchorA.evidenceTag).core);
    const supA = pickSupporting(sortedA, [anchorA.qNumber, anchorB?.qNumber ?? -1]);
    if (supA) parts.push(supportingSentence(supA, usage));
  }
  if (anchorB) {
    usage.use(anchorB.qNumber);
    parts.push(findBlock(axisB, anchorB.evidenceTag).core);
    const supB = pickSupporting(sortedB, [anchorB.qNumber, anchorA?.qNumber ?? -1]);
    if (supB) parts.push(supportingSentence(supB, usage));
  }
  const seed = (anchorA?.qNumber ?? 0) + (anchorB?.qNumber ?? 0);
  parts.push(pickByIndex(bridgePool, seed), pickByIndex(closerPool, seed + 1));
  return { headline, body: parts.filter(Boolean).join(" ") };
}

// ============================================================
// OPENING — Arbitration: 가장 강한 tension(있으면 우선, §4①류 보호) →
// 가장 강한 relationship → axis 중 최댓값 fallback.
// ============================================================
function buildOpening(
  aggregate: V3AxisAggregate,
  relationships: V3RelationshipMatch[],
  tensions: V3TensionMatch[],
  evidence: V3EvidenceItem[]
): { headline: string; summary: string; source: string; usedQNumbers: number[] } {
  const strongestAxis = TASTE_V3_AXIS_KEYS.map((k) => ({ key: k, score: aggregate[k].score })).sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
  const contextLine = `이 지면은 열다섯 개의 실제 선택 — 머물고 싶은 공간, 오래 곁에 둘 물건, 하루를 보내는 방식, 사람을 대하는 거리 — 을 지나며 나온 결과입니다. 어느 하나도 정답을 고르라는 질문이 아니었고, 그래서 이 결과는 당신이 실제로 움직인 방향을 그대로 옮긴 것에 가깝습니다.`;

  if (tensions.length > 0) {
    const t = tensions[0].def;
    const ev = tensions[0].evidence.slice(0, 2);
    const quotes = ev.map((e) => e.evidenceLabel).join(" 그리고 ");
    return {
      headline: t.headline,
      summary: `당신은 ${quotes} — 서로 다른 두 순간이 한 사람 안에 자연스럽게 겹쳐 있습니다. ${contextLine} 다음 페이지부터는 그 선택들이 어떤 장면과 리듬 위에서 반복되는지를 하나씩 짚어봅니다.`,
      source: `tension:${t.id}`,
      usedQNumbers: ev.map((e) => e.qNumber),
    };
  }
  if (relationships.length > 0) {
    const r = relationships[0];
    const ev = r.evidence.slice(0, 2);
    const quotes = ev.map((e) => e.evidenceLabel).join(" 그리고 ");
    return {
      headline: r.def.headline,
      summary: `${quotes} — 이 두 선택은 우연이 아니라 같은 태도에서 나옵니다. ${contextLine} 다음 페이지부터는 그 선택들이 어떤 장면과 리듬 위에서 반복되는지를 하나씩 짚어봅니다.`,
      source: `relationship:${r.def.id}`,
      usedQNumbers: ev.map((e) => e.qNumber),
    };
  }
  // fallback — 가장 강한 단일 axis
  const top = strongestEvidenceForAxis(aggregate, strongestAxis.key)[0] ?? evidence[0];
  return {
    headline: "여러 개의 선택이 아니라,\n하나의 시선으로 이어지는 사람.",
    summary: top
      ? `${top.evidenceLabel} — 이 선택 하나에서도 당신의 시선이 드러납니다. 특히 ${AXIS_LABEL_KO[strongestAxis.key]}에서 가장 뚜렷한 방향이 나타났습니다. ${contextLine}`
      : "당신의 선택들이 하나의 시선으로 이어집니다.",
    source: `axis-fallback:${strongestAxis.key}`,
    usedQNumbers: top ? [top.qNumber] : [],
  };
}

const FALLBACK_INTERESTING_HEADLINES = [
  "가장 강하게 남은 것은,\n하나의 축이 아니라 그 사이의 간격이었습니다.",
  "정답을 정해두지 않아도,\n선택들은 이미 한 방향을 가리키고 있었습니다.",
];

function buildInterestingPart(
  aggregate: V3AxisAggregate,
  relationships: V3RelationshipMatch[],
  tensions: V3TensionMatch[],
  openingSource: string,
  usage: UsageTracker
): { headline: string; body: string; source: string } {
  const openingIsTension = openingSource.startsWith("tension:");
  const openingIsRelationship = openingSource.startsWith("relationship:");

  const nextTension = tensions.find((t) => !(openingIsTension && openingSource === `tension:${t.def.id}`));
  const nextRelationship = relationships.find((r) => !(openingIsRelationship && openingSource === `relationship:${r.def.id}`));

  function extend(baseBody: string, ev: V3EvidenceItem[], seed: number): string {
    const third = ev.find((e) => usage.peek(e.qNumber) === 0);
    const thirdSentence = third ? `실제로 ${third.eyebrow} 질문에서 ${third.evidenceLabel}는 대목도 같은 결을 뒷받침합니다.` : "";
    if (third) usage.use(third.qNumber);
    const closerPool = [
      "이 조합이 결과 전체에서 가장 '나 같다'고 느껴질 대목일 가능성이 큽니다. 서로 다른 방향처럼 보이는 두 선택이 실제로는 같은 사람 안에서 아무런 마찰 없이 공존하고 있습니다.",
      "여러 축 중에서도 유독 이 지점이 다른 사람과 당신을 가장 분명하게 갈라놓는 대목입니다. 겉으로 보이는 결과만으로는 짐작하기 어려운, 당신만의 조합입니다.",
      "이 부분은 어느 한쪽으로 쉽게 정리되지 않기 때문에, 오히려 가장 당신다운 대목으로 남습니다. 둘 중 하나를 골라 설명을 끝내기보다, 두 가지가 함께 있는 채로 두는 편이 더 정확한 설명입니다.",
    ];
    return [baseBody, thirdSentence, pickByIndex(closerPool, seed)].filter(Boolean).join(" ");
  }

  if (nextTension) {
    return {
      headline: nextTension.def.headline,
      body: extend(nextTension.def.interestingPartBody, nextTension.evidence, nextTension.def.relatedQNumbers.reduce((a, b) => a + b, 0)),
      source: `tension:${nextTension.def.id}`,
    };
  }
  if (nextRelationship) {
    return {
      headline: nextRelationship.def.headline,
      body: extend(nextRelationship.def.interestingPartBody, nextRelationship.evidence, nextRelationship.strength),
      source: `relationship:${nextRelationship.def.id}`,
    };
  }

  // FALLBACK(§8 "가장 강한 Relationship/Tension 하나를 깊게 쓴다" — 매칭된
  // 것이 전혀 없을 때도 THE INTERESTING PART 자체는 비우지 않는다.
  // 서로 다른 두 축 중 부호가 반대인 조합을 찾아 evidence 기반으로
  // 직접 구성한다.
  const axesSorted = TASTE_V3_AXIS_KEYS.map((k) => ({ key: k, score: aggregate[k].score })).sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  const a = axesSorted[0];
  const b = axesSorted.find((x) => x.key !== a.key) ?? axesSorted[1];
  const evA = strongestEvidenceForAxis(aggregate, a.key)[0];
  const evB = strongestEvidenceForAxis(aggregate, b.key)[0];
  const quotes = [evA, evB]
    .filter((e): e is V3EvidenceItem => Boolean(e))
    .map((e) => e.evidenceLabel)
    .join(" 그리고 ");
  const headline = pickByIndex(FALLBACK_INTERESTING_HEADLINES, (evA?.qNumber ?? 0) + (evB?.qNumber ?? 0));
  const body = [
    quotes ? `${quotes}.` : "",
    `${AXIS_LABEL_KO[a.key]}과 ${AXIS_LABEL_KO[b.key]}이 뚜렷하게 다른 크기로 나타났다는 것은, 당신이 이 두 기준을 애초에 같은 무게로 쓰고 있지 않다는 뜻입니다.`,
    "어느 쪽이 진짜 당신인지 굳이 하나로 정리할 필요는 없습니다 — 두 크기가 다른 채로 함께 있는 편이 실제 모습에 더 가깝습니다.",
    "많은 사람이 이 둘을 하나로 맞추려고 애쓰지만, 당신의 답변은 그 둘이 애초에 같은 크기일 필요가 없다고 말하고 있습니다.",
    "결과 전체에서 뚜렷한 관계나 모순이 하나로 정리되지 않았다는 것 자체가, 당신의 취향이 몇 개의 축으로 깔끔하게 접히지 않는다는 증거이기도 합니다.",
  ]
    .filter(Boolean)
    .join(" ");
  return { headline, body, source: `axis-pair-fallback:${a.key}x${b.key}` };
}

function buildEnding(evidence: V3EvidenceItem[], openingHeadline: string, aggregate: V3AxisAggregate): { body: string; pullQuote: string } {
  const q15 = evidence.find((e) => e.qNumber === 15);
  const q3 = evidence.find((e) => e.qNumber === 3);
  const closingScene = q15 ? q15.evidenceLabel.replace(/다고?\s*했다$/, "").replace(/골랐다$/, "골랐습니다") : "당신은 오늘도 자신에게 맞는 장면을 골랐습니다";
  const objectPhrase = q3 ? q3.evidenceLabel.replace(/다고 했다$/, "다는 사실") : "";
  const objectLine = objectPhrase ? `그리고 ${objectPhrase}에서도, 같은 기준이 조용히 다시 한번 확인됩니다.` : "";
  const strongestAxis = TASTE_V3_AXIS_KEYS.map((k) => ({ key: k, score: aggregate[k].score })).sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
  const axisLine = `열다섯 개의 답변 중에서도 가장 뚜렷하게 남은 축은 ${AXIS_LABEL_KO[strongestAxis.key]}이었습니다 — 다른 어떤 선택보다 이 방향으로 자주, 그리고 분명하게 움직였습니다.`;
  const body = [
    `여기까지 열다섯 개의 선택을 지나왔습니다. ${closingScene}.`,
    objectLine,
    axisLine,
    "결과는 하나의 이름표가 아니라, 당신이 실제로 고른 장면과 물건, 리듬과 관계가 겹쳐 만든 한 장의 지면입니다. 어느 한 문항이 아니라 열다섯 개가 겹친 자리에서 나온 결과라서, 다음에 같은 질문을 다시 받아도 아마 비슷한 결이 나올 것입니다.",
    "이 페이지는 오늘로 끝나지 않습니다 — 다음 Chapter에서 당신은 조금 더 구체적으로 읽힐 것입니다. TASTE가 당신이 무엇을 편안해하는지를 보여줬다면, 다음 Chapter들은 그 취향이 여행과 옷차림처럼 구체적인 장면에서 어떻게 이어지는지를 보여줄 차례입니다.",
  ]
    .filter(Boolean)
    .join(" ");
  return { body, pullQuote: openingHeadline.replace(/\n/g, " ") };
}

// ============================================================
// ROOT — §10 8단계 파이프라인의 5~8단계(section block selection →
// repetition arbitration → final composition)를 여기서 수행한다.
// ============================================================
export function buildTasteMagazineNarrativeV3(answers: TasteV3RawAnswers): TasteMagazineNarrativeV3 {
  const evidence = extractV3Evidence(answers);
  const aggregate = aggregateV3Axes(evidence);
  const relationships = matchAllV3Relationships(aggregate);
  const tensions = matchAllV3Tensions(evidence);
  const usage = new UsageTracker();

  const openingResult = buildOpening(aggregate, relationships, tensions, evidence);
  const opening = { headline: openingResult.headline, summary: openingResult.summary };
  for (const qNumber of openingResult.usedQNumbers) usage.use(qNumber);

  const space = buildSingleAxisSection("space", "SPACE — 머무는 곳을 고르는 기준", aggregate, usage, SPACE_CLOSERS);
  const sensory = buildSingleAxisSection("sensory", "SENSORY — 먼저 반응하는 감각", aggregate, usage, SENSORY_CLOSERS);
  const rhythmRelation = buildDualAxisSection(
    "rhythm",
    "relation",
    "RHYTHM & RELATION — 시간을 쓰는 방식",
    aggregate,
    usage,
    RHYTHM_RELATION_BRIDGES,
    RHYTHM_RELATION_CLOSERS
  );
  const explorationExpression = buildDualAxisSection(
    "exploration",
    "expression",
    "EXPLORATION & EXPRESSION — 발견하고 드러내는 방식",
    aggregate,
    usage,
    EXPLORATION_EXPRESSION_BRIDGES,
    EXPLORATION_EXPRESSION_CLOSERS
  );

  const interestingPartResult = buildInterestingPart(aggregate, relationships, tensions, openingResult.source, usage);
  const interestingPart = { headline: interestingPartResult.headline, body: interestingPartResult.body };

  const ending = buildEnding(evidence, opening.headline, aggregate);

  const keywords = Array.from(new Set(evidence.slice(0, 6).map((e) => e.eyebrow)));

  const fullText = [
    opening.headline,
    opening.summary,
    space.headline,
    space.body,
    sensory.headline,
    sensory.body,
    rhythmRelation.headline,
    rhythmRelation.body,
    explorationExpression.headline,
    explorationExpression.body,
    interestingPart.headline,
    interestingPart.body,
    ending.body,
  ].join("");
  const charCount = fullText.replace(/\s/g, "").length;

  const axesRecord = Object.fromEntries(TASTE_V3_AXIS_KEYS.map((k) => [k, aggregate[k].score])) as Record<TasteV3AxisKey, number>;

  return {
    opening,
    space,
    sensory,
    rhythmRelation,
    explorationExpression,
    interestingPart,
    ending,
    keywords,
    pullQuote: ending.pullQuote,
    charCount,
    debug: {
      axes: axesRecord,
      relationshipMatches: relationships.map((r) => r.def.id),
      tensionMatches: tensions.map((t) => t.def.id),
      openingSource: openingResult.source,
      interestingPartSource: interestingPartResult.source,
    },
  };
}

// re-export for potential debug/QA use
export { RELATIONSHIP_DEFS_V3 };
export type { V3RelationshipDef };

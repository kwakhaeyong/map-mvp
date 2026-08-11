import { TAG_CATEGORIES } from "../engine/ideal-type-tags";
import { TOPICS } from "../engine/topics";
import { MapSession } from "../types";
import { Button, Card } from "./ui/primitives";
import { TOPIC_HOOK, TOPIC_META, VIRAL_TOPIC_IDS } from "./Landing";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 태그 문자열 -> 그 태그가 속한 카테고리 id. compatibility.ts의
// TAG_TO_CATEGORY와 정확히 같은 구성(TAG_CATEGORIES를 순회하며 태그
// 문자열을 키로 등록)이지만, 그 파일의 Map은 export되지 않고(두 사람
// 비교용으로만 쓰려고 일부러 모듈 비공개로 뒀다) 여기서 필요한 건
// "카테고리 자체"가 아니라 "카테고리 id 문자열"뿐이라 새로 만들었다 —
// compatibility.ts를 고치거나 태그 매핑 자체를 손대지 않는다.
const TAG_TO_CATEGORY_ID = new Map<string, string>();
for (const category of TAG_CATEGORIES) {
  for (const tag of Object.values(category.mapping)) {
    TAG_TO_CATEGORY_ID.set(tag, category.id);
  }
}

// compatibility.ts의 axisSentence()와 같은 패턴 — "축(카테고리)당 고정
// 문장 틀 하나 + 실제 태그 문자열만 끼워 넣기"다. 그 함수는 두 사람의
// 태그를 비교해 "같다/다르다"를 판정하지만, 여기서는 비교가 아니라
// 지금 결과 하나의 태그 중 하나를 예로 들어 "이건 한 상황에서 본
// 모습일 뿐"이라는 취지만 전달한다 — 그래서 축마다 "같음/다름" 두
// 갈래가 필요 없고, 축당 문장 틀이 하나씩만 있으면 된다. AI를 호출하지
// 않고 이 표에서 결정적으로 고른다.
const CONNECT_SENTENCE_TEMPLATES: Record<string, (tag: string) => string> = {
  relationshipWants: (tag) => `${tag} — 지금은 이 주제 하나에서 나온 모습이에요.`,
  lifestyle: (tag) => `${tag}인 것도, 지금은 이 주제 하나에서 본 모습이에요.`,
  conflictPattern: (tag) => `${tag}인 것도, 아직 이 장면 하나에서 나온 답이에요.`,
  relationshipRhythm: (tag) => `${tag} — 아직 이 장면 하나에서 본 모습이에요.`,
};

function buildConnectSentence(tags: string[] | undefined): string {
  const tag = tags?.[0];
  if (!tag) return "이건 아직 한 상황에서 본 모습이에요.";
  const categoryId = TAG_TO_CATEGORY_ID.get(tag);
  const template = categoryId ? CONNECT_SENTENCE_TEMPLATES[categoryId] : undefined;
  return template ? template(tag) : "이건 아직 한 상황에서 본 모습이에요.";
}

// 주제 id -> 그 주제를 완료했을 때 채워지는 세션 필드. session.ts의
// preserveCompletedResults()가 주제를 바꿀 때 이 필드들을 그대로
// 이어붙이므로(engine/session.ts 참고), 지금 보고 있는 주제뿐 아니라
// 예전에 완료해뒀던 다른 주제 결과도 여기서 그대로 읽힌다.
const RESULT_FIELD: Record<string, keyof MapSession> = {
  idealType: "idealTypeResult",
  selfIntro: "selfIntroResult",
  friendship: "friendshipResult",
  work: "workResult",
  taste: "tasteResult",
  travelStyle: "travelResult",
};

function isTopicCompleted(session: MapSession, topicId: string): boolean {
  const field = RESULT_FIELD[topicId];
  return field ? Boolean(session[field]) : false;
}

// 랜딩과 같은 순서(VIRAL_TOPIC_IDS)로 훑어서, 아직 완료하지 않은 첫
// 주제를 고른다. work는 프로필이 "학생"이면 건너뛴다(Landing.tsx의
// hideWorkTopic과 같은 판단 기준 — session.profile은 주제마다 새로
// 묻으므로 "지금 이 결과 세션에서 답한 프로필"만 본다). 남는 주제가
// 없으면(6개 다 완료했거나, 남은 게 work뿐인데 학생이라 추천할 수
// 없으면) undefined를 돌려주고, 호출부가 그 경우 "다음 주제 카드"
// 자체를 숨긴다.
function pickNextTopicId(session: MapSession): string | undefined {
  const isStudent = session.profile?.occupationStatus === "학생";
  for (const topicId of VIRAL_TOPIC_IDS) {
    if (isTopicCompleted(session, topicId)) continue;
    if (topicId === "work" && isStudent) continue;
    return topicId;
  }
  return undefined;
}

// 결과 화면 6곳(IdealTypeCard/SelfIntroCard/FriendshipCard/WorkCard/
// TasteCard/TravelCard) 전부가 "너도 만들어봐" 버튼 바로 아래, 정책
// 링크 바로 위에 이 컴포넌트를 그대로 붙여 쓴다 — 6개 화면에서 이
// 블록이 하는 일(연결 문장 + 다음 주제 추천 카드 + 발견 현황)이
// 완전히 동일해서 공용 컴포넌트로 뺐다(*ResultBlocks.tsx처럼 주제마다
// 내용 자체가 다른 경우와는 다르다 — 그런 파일들은 그대로 6개
// 복제 유지). 결과 타입(WorkResult 등)에는 새 필드를 추가하지
// 않는다 — 여기서 쓰는 값(session의 완료 여부, result.tags)은 전부
// 이미 있는 데이터를 화면에서만 조합한 것이라, 공유 페이로드
// (share-validation.ts가 검증하는 result 객체)에는 전혀 안 실린다.
export function NextMapPrompt({
  session,
  tags,
  onStartTopic,
}: {
  session: MapSession;
  tags: string[] | undefined;
  onStartTopic: (topicId: string) => void;
}) {
  const completedCount = VIRAL_TOPIC_IDS.filter((topicId) => isTopicCompleted(session, topicId)).length;
  const nextTopicId = pickNextTopicId(session);
  const nextTopicMeta = nextTopicId ? TOPIC_META[nextTopicId] : undefined;
  // 6개를 다 완료했을 때(또는 남은 게 학생에게 안 보여주는 work뿐일
  // 때)는 "지도가 완성됐다"고 말하지 않는다 — 사람은 계속 바뀌니까
  // 이 6개도 "완성본"이 아니라 "지금까지 본 모습"일 뿐이라는 취지로
  // 문구를 바꾼다. 완료 개수는 하드코딩한 "6개"가 아니라 실제
  // completedCount를 쓴다 — work가 학생이라 빠진 채로 5/6에서 멈춘
  // 경우에도 문장이 사실과 어긋나지 않게.
  const headline = nextTopicId ? buildConnectSentence(tags) : `지금까지 ${completedCount}개 주제에서 본 모습이에요. 사람은 계속 바뀌니까, 시간이 지나면 또 다르게 나올 수 있어요.`;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="break-keep text-center text-xs font-semibold leading-5 text-text-secondary">{headline}</p>

      {nextTopicId ? (
        <Card className="flex flex-col gap-2 p-4">
          <p className="text-[11px] font-black text-text-muted">다음으로 볼 수 있는 MAP</p>
          <p className="break-keep text-base font-black tracking-[-0.02em]">{TOPICS[nextTopicId].name}</p>
          <p className="break-keep text-xs font-semibold leading-5 text-text-secondary">{TOPIC_HOOK[nextTopicId]}</p>
          {nextTopicMeta ? (
            <p className="break-keep text-[11px] font-semibold text-text-muted">
              {nextTopicMeta.questions}문항 · 약 {nextTopicMeta.minutes}분
            </p>
          ) : null}
          <Button variant="primary" size="lg" onClick={() => onStartTopic(nextTopicId)}>
            시작하기
          </Button>
        </Card>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        {VIRAL_TOPIC_IDS.map((topicId) => (
          <span
            key={topicId}
            title={TOPICS[topicId].name}
            aria-hidden="true"
            className={cx("size-2.5 rounded-full", isTopicCompleted(session, topicId) ? "bg-primary" : "border border-border bg-transparent")}
          />
        ))}
        <span className="ml-1 text-[11px] font-semibold text-text-muted">
          {completedCount} / {VIRAL_TOPIC_IDS.length} 발견
        </span>
      </div>
    </div>
  );
}

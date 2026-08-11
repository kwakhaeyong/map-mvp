"use client";

import { useEffect, useState } from "react";
import { TOPICS, TopicConfig } from "../engine/topics";
import { Badge, Button, Toast } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="MAP Decision">
      <span className="grid size-10 place-items-center rounded-medium border border-primary bg-surface-elevated text-sm font-black text-primary shadow-floating">
        M
      </span>
      <span className="text-base font-black tracking-[-0.03em]">MAP Decision</span>
    </div>
  );
}

// 진로·이상형·나소개·친구·인간관계·일할 때의 나·취향·여행 스타일까지
// 실제로 연결돼 있다(engine/topics.ts의 implemented 참고). 새 주제가
// 완성되면 이 목록 구성을 바꿀 필요 없이 topics.ts의 implemented만
// true로 바꾸면 된다. "연애 스타일"은 이상형·
// 나소개와 내용이 겹쳐 만들지 않기로 확정해 목록·topics.ts 양쪽에서
// 제거했다. "궁합"은 독립 주제가 아니라 이상형 결과를 비교하는 기능(#107,
// engine/compatibility.ts)이라 랜딩 카드 목록에서 뺐다 — 이 카드가
// 그 기능과 이름만 같고 실제로는 무관한 별개의 빈 자리라 헷갈림의
// 원인이었다(docs/CURRENT_STATE.md 참고). "이직"·"큰 결정·소비/재무"는
// 별도 주제로 만들지 않고 career(진로)에 흡수하기로 확정해 목록·
// topics.ts 양쪽에서 제거했다 — career가 자유 대화형이라 이직·재무
// 고민을 얘기해도 이미 그에 맞는 결과가 나온다(프로덕션에서 이직 고민
// 완주로 실측 확인됨).
const DEPTH_TOPIC_IDS = ["career"];
// 순서 기준(2026-08-11 개편): 문항 수가 적어 완주율이 높은 주제를
// 앞에, 가장 긴 이상형(38문항)·work(30문항)를 뒤로 뺐다 — 이전엔
// idealType이 첫 자리였는데, 랜딩 첫 카드가 가장 긴 주제라 신규
// 유입에게 진입 장벽으로 작용한다는 지적이 있었다. work는 idealType과
// 나란히 맨 뒤에 두되, 아래 문항 수 순서(20·20·30·34·38·30)와는 정확히
// 일치하지 않는다 — friendship(30)이 selfIntro(34)보다 짧지만, 사람
// 관계를 자기소개보다 먼저 배치하는 편이 카드 묶음 전체의 화제
// 다양성(관계→나 자신→이상형→일)에도 맞다고 판단해 문항 수 하나만
// 보고 정렬하지 않았다.
// 결과 화면 하단 "다음 MAP 유도" 블록(NextMapPrompt.tsx)이 같은 순서·
// 같은 카피로 다음 주제를 추천해야 해서 export한다 — 이 배열을 이
// 파일에서 export하기 전에는 NextMapPrompt.tsx가 자기만의 사본을
// 만들 뻔했는데, 그러면 여기서 순서를 바꿀 때마다 두 곳을 같이
// 고쳐야 하는 문제가 생긴다.
export const VIRAL_TOPIC_IDS = ["taste", "travelStyle", "friendship", "selfIntro", "idealType", "work"];
const SAFETY_NET_TOPIC_ID = "freeform";

// topics.ts의 topic.oneLiner("~를 한 장으로 정리해요")를 그대로 쓰지 않고
// 이 파일 안에서만 덮어쓴다 — topics.ts는 문항·타입 정의 파일이라 이번
// 카피 개편 범위에서 건드리지 않기로 했다.
//
// 2026-08-11 개편: 기존 문구는 각 생성기 SYSTEM_PROMPT의 "재해석 축"을
// 그대로 옮긴 것이었는데("확신, 실제로 그럴까요?" 골격), 주제명이
// "친구·인간관계"·"일할 때의 나" 같은 범주명이라 훅과 나란히 있어도
// 궁금증을 만들지 못한다는 외부 지적을 받았다. 대신 각 카드가 던지는
// 질문 자체를 훅으로 올려 클릭 유인을 만드는 쪽으로 바꿨다 — 재해석
// 축과의 직접적인 1:1 대응은 더 이상 목표가 아니다(그 축은 결과
// 화면에서 여전히 그대로 쓰인다, 이 카피는 랜딩 진입용일 뿐).
// 과장된 단정이나 이모지 없이, 담담하게 궁금증만 거는 관찰형 질문
// 톤은 유지했다 — 6개 전부 "~까요?" 높임 어미로 통일해서 사이트
// 전반의 해요체와도 맞췄다.
//
// 2026-08-11 재수정(외부 검토): selfIntro·friendship·travelStyle 3개를
// 한 번 더 바꿨다. selfIntro의 옛 문구("나를 네 글자로 줄일 수
// 없다면?")는 MBTI(4글자 유형 코드)를 겨냥한 대구였는데, 바로 위
// 헤드라인("16개 유형에 넣지 않아요")과 화면에서 위아래로 나란히
// 보이며 같은 말을 반복하는 문제가 있었다 — MBTI 대구를 빼고 "나에
// 대한 다른 각도"(자기 인식 vs 타인이 보는 나)로 바꿨다. friendship의
// 옛 문구("요즘 왜 사람 만나는 게 피곤할까요?")는 관계가 피곤하지
// 않은 사람을 전제에서 배제해 자기 얘기로 못 느낄 위험이 있었다 —
// "피곤함"이라는 감정 대신 "관계에서 내가 어떤 자리에 있는지"로
// 방향을 바꿨다("자리"는 ideal-type-tags.ts의 FRIENDSHIP_STATUS_LABELS가
// 실제로 쓰는 표현과 같다 — 카드를 누르면 정말 이 단어로 된 결과가
// 나온다). travelStyle의 옛 문구("나는 여행에서 어떤 사람이
// 될까요?")는 추상적이라 두 번째 자리인데도 밋밋하다는 지적을 받아,
// 실제 문항("여행 중 계획이 틀어졌던 상황, 그때 나는 어떻게
// 했어?" — 아래 topics.ts travelStyle 축 참고)에 나오는 구체적
// 장면으로 바꿨다.
// 같은 이유(NextMapPrompt.tsx의 다음 주제 카드가 랜딩과 똑같은 훅
// 문구를 써야 한다)로 이 상수도 export한다.
export const TOPIC_HOOK: Record<string, string> = {
  idealType: "나는 왜 비슷한 사람에게 끌릴까요?",
  selfIntro: "내가 아는 나와 남이 보는 나는 같을까요?",
  friendship: "이 관계들 속에서 나는 어떤 자리에 있을까요?",
  work: "나는 일할 때 어떤 사람일까요?",
  taste: "나도 모르는 내 취향은?",
  travelStyle: "계획이 틀어지면 나는 어떻게 움직일까요?",
  // 이 항목이 없던 동안은 topic.oneLiner(topics.ts)가 그대로 노출돼
  // 위 6개 카드(전부 짧은 질문형)와 나란히 있을 때 혼자만 서술형 두
  // 줄로 튀었다 — "무엇을 결정해야 할지" 섹션 라벨과도 대구가 안
  // 맞았다. topics.ts의 oneLiner 자체는 다른 화면에서도 쓰일 수 있어
  // 손대지 않고, 이 맵에만 추가해 주제 선택 화면에서만 우선 적용되게
  // 한다(TopicCard의 TOPIC_HOOK[topic.id] ?? topic.oneLiner 폴백).
  career: "정하긴 해야 하는데, 뭘 기준으로 정할까요?",
};

// 문항 수는 topics.ts의 axes 배열 길이를 직접 세어 확인한 값이다(코드
// 값을 그대로 읽어오지 않고 상수로 고정한 이유는, 이 표시가 "지금
// 문항 구성 기준 대략 이 정도 걸린다"는 안내이지 매 렌더마다 재계산할
// 실시간 값이 아니기 때문이다 — topics.ts의 axes가 나중에 바뀌면 이
// 상수도 같이 갱신해야 한다). 소요 시간은 실측이 아니라 문항 수 기반
// 추정치다 — 문항당 대략 14~15초로 잡고 반올림했다(실측 계측은 아직
// 없다, docs/CURRENT_STATE.md·NASOGAE_DESIGN.md 조사 참고). career는
// 자유 대화형이라 문항 수 개념이 없어 이 맵에 넣지 않는다.
// 같은 이유로 export — NextMapPrompt.tsx의 다음 주제 카드도 문항 수·
// 예상 시간을 랜딩과 같은 값으로 보여준다.
export const TOPIC_META: Record<string, { questions: number; minutes: number }> = {
  idealType: { questions: 38, minutes: 9 },
  selfIntro: { questions: 34, minutes: 8 },
  friendship: { questions: 30, minutes: 7 },
  work: { questions: 30, minutes: 7 },
  taste: { questions: 20, minutes: 5 },
  travelStyle: { questions: 20, minutes: 5 },
};

// 아이콘 자리(이모지)를 없애고 제목·설명 타이포만 남긴다 — 시스템
// 이모지가 기기·브라우저마다 다르게 렌더링돼 브랜드 자산이 될 수
// 없다는 문제 때문이다(갤럭시·아이폰·카톡 인앱 브라우저에서 각각
// 다른 그림이 나온다). 대안으로 검토한 단색 선 아이콘은 프로젝트에
// 아이콘 라이브러리가 전혀 없어(package.json 확인) 주제마다 SVG를
// 새로 그려야 했는데, 렌더링 비교 결과 타이포만 남긴 쪽이 더
// 담백하고 일관돼 이 안으로 확정했다.
function TopicCard({
  topic,
  onStart,
  onLocked,
}: {
  topic: TopicConfig;
  onStart: (topicId: string) => void;
  onLocked: (topic: TopicConfig) => void;
}) {
  const disabled = !topic.implemented;
  const meta = TOPIC_META[topic.id];
  return (
    <button
      type="button"
      aria-disabled={disabled}
      onClick={() => (disabled ? onLocked(topic) : onStart(topic.id))}
      className={cx(
        "group relative flex min-h-[112px] flex-col items-start justify-center gap-2 rounded-large border border-border bg-surface p-4 text-left shadow-subtle transition duration-normal ease-emphasized",
        disabled ? "opacity-60" : "hover:-translate-y-1 hover:border-border-strong hover:shadow-floating",
      )}
    >
      {disabled ? (
        <span className="absolute right-3 top-3 rounded-pill border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-black text-text-muted">
          준비 중
        </span>
      ) : null}
      <span className="break-keep text-base font-black tracking-[-0.02em]">{topic.name}</span>
      <span className="break-keep text-xs font-semibold leading-5 text-text-secondary">{TOPIC_HOOK[topic.id] ?? topic.oneLiner}</span>
      {meta ? (
        <span className="break-keep text-[11px] font-semibold text-text-muted">
          {meta.questions}문항 · 약 {meta.minutes}분
        </span>
      ) : null}
    </button>
  );
}

function TopicSection({
  kicker,
  ids,
  onStart,
  onLocked,
  showCount = true,
}: {
  kicker: string;
  ids: string[];
  onStart: (topicId: string) => void;
  onLocked: (topic: TopicConfig) => void;
  showCount?: boolean;
}) {
  // 카드가 1개뿐이면(현재 "무엇을 결정해야 할지") 2~3열 그리드에 넣지
  // 않고 전폭 1열로 그린다 — 그리드 칸이 남아 오른쪽이 비어 보이는
  // 문제를 없앤다. 카드가 여러 개면 기존 2~3열 그대로다.
  const isSingle = ids.length === 1;
  return (
    <section className="map-container py-4">
      {/* 배지 숫자는 ids.length에서 계산한다 — VIRAL_TOPIC_IDS/DEPTH_TOPIC_IDS에
          주제가 추가·삭제돼도 따로 고칠 값이 늘지 않는다. showCount=false인
          섹션(현재 "무엇을 결정해야 할지")은 배지 자체를 렌더링하지 않는다 —
          "6개"와 "1개"가 나란히 있으면 후자가 미완성처럼 보이기 때문. */}
      <div className="mb-4 flex items-center gap-2 px-1">
        <p className="text-lg font-black tracking-[-0.02em] text-text-primary">{kicker}</p>
        {showCount ? <Badge>{ids.length}개</Badge> : null}
      </div>
      <div className={cx("grid gap-4", isSingle ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3")}>
        {ids.map((id) => (
          <TopicCard key={id} topic={TOPICS[id]} onStart={onStart} onLocked={onLocked} />
        ))}
      </div>
    </section>
  );
}

export function Landing({
  hasDraft,
  hasStaleResult,
  onStart,
  onResume,
  onViewResult,
  onDemo,
  saveState = "saved",
  hideWorkTopic = false,
}: {
  hasDraft: boolean;
  // 30분 넘게 방치돼 stage가 landing으로 강제 전환되기 직전, 원래
  // "result"였고 결과 데이터가 남아있던 세션인지 — true면 "이전 결과
  // 보기"를 보여준다. hasDraft(메시지·노드가 있으면 true)도 이 경우
  // 함께 true가 되지만("result"에 도달했다는 건 이미 대화·퀴즈 내용이
  // 있었다는 뜻이라 messages/nodes가 비어있을 수 없음), 완결된 결과가
  // 있는 세션에는 "이어서 하기"(대화로 되돌아가기)보다 "이전 결과
  // 보기"가 맞는 동작이라 hasStaleResult가 있으면 그쪽을 우선한다.
  hasStaleResult: boolean;
  onStart: (topicId?: string) => void;
  onResume: () => void;
  onViewResult: () => void;
  onDemo: () => void;
  saveState?: "loading" | "saved" | "saving";
  // session.profile.occupationStatus === "학생"일 때 true — work(일할
  // 때의 나) 카드를 이 화면에서 뺀다. "준비 중" 배지가 붙는 비활성
  // 처리 대신 완전히 숨기는 쪽을 택했다 — work는 이미 구현된 주제라
  // disabled=true로 처리하면 "준비 중"이라는, 사실과 다른 라벨을
  // 새로 만들어 붙여야 했다(MapDecisionProduct.tsx 참고: 프로필 입력이
  // 주제 선택"뒤"에 오므로, 이 값은 학생이 work를 처음 고르는 순간에는
  // 절대 true가 될 수 없고 그 이후 재방문에만 영향을 준다).
  hideWorkTopic?: boolean;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleLocked = (topic: TopicConfig) => setNotice(`${topic.name}은(는) 아직 준비 중이에요. 곧 만나요!`);
  const safetyNetTopic = TOPICS[SAFETY_NET_TOPIC_ID];
  const viralTopicIds = hideWorkTopic ? VIRAL_TOPIC_IDS.filter((id) => id !== "work") : VIRAL_TOPIC_IDS;

  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2">
          {/* 이 배지는 저장할 진행 상태(대화·퀴즈 답변이나 완료된 결과)가
              실제로 있을 때만 보여준다. 이전에는 조건 없이 항상 렌더링돼
              첫 방문자에게도 "자동 저장됨"이 떴다 — 원인은 saveState 자체가
              "자동저장 기능이 정상 동작 중"이라는 시스템 상태만 나타내고
              "저장할 내용이 있는지"는 반영하지 않기 때문이다(MapDecisionProduct.tsx의
              마운트 effect가 세션에 내용이 있든 없든 hydration만 끝나면
              saveState를 "saved"로 바꾼다). 그래서 배지 노출 여부는 그
              값을 그대로 따르지 않고, 이미 같은 목적으로 쓰이는
              hasDraft/hasStaleResult로 따로 게이트한다. */}
          {hasDraft || hasStaleResult ? (
            <Badge tone={saveState === "saving" ? "default" : "success"}>{saveState === "loading" ? "불러오는 중" : saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</Badge>
          ) : null}
          {hasStaleResult ? (
            <Button variant="secondary" onClick={onViewResult}>이전 결과 보기</Button>
          ) : hasDraft ? (
            <Button variant="secondary" onClick={onResume}>이어서 하기</Button>
          ) : null}
        </div>
      </header>

      {/* 헤드라인·서브카피 교체 배경: 기존 "말하면 정리되는 나의 MAP" +
          6개 카드 설명이 전부 "~정리해요"로 끝나 "정리"라는 단어가
          첫 화면에 반복됐는데, 실제로 이 결과가 주는 건 정리가 아니라
          재해석(답변 사이 간극을 짚어주는 발견)이라 약속과 실제가
          어긋나 있었다. 새 헤드라인은 MBTI 같은 기존 유형 분류를 정면
          배제하는 포지셔닝이다 — MAP은 태그 조합이 매번 달라 애초에
          "유형"이 존재하지 않으므로 사실에 근거한 주장이다. "로그인
          없이"는 6개 주제·진로 전부에 공통으로 해당하는 사실이라
          카드마다 반복하지 않고 이 자리에서 한 번만 말한다(로그인·
          회원가입·이메일 요구 지점이 코드 전체에 없다는 건 별도
          조사로 확인됨).

          이 위에 있던 "MAP Decision" kicker 텍스트(.kicker 클래스)는
          2026-08에 없앴다 — 바로 위 헤더 로고에 이미 같은 글자가 있어
          세로로 두 번 반복돼 보였다. 헤더는 모든 화면에 있는 고정
          요소라 그대로 두고, 히어로 쪽만 지웠다. .kicker 클래스 자체는
          진로 결과 화면(Result.tsx)과 마인드맵 캔버스(MapCanvas.tsx)가
          여전히 쓰고 있어 지우지 않았다. */}
      <section className="map-container pb-2 pt-8 text-center sm:pt-14">
        <h1 className="text-balance break-keep text-[1.9rem] font-black leading-[1.18] tracking-[-0.04em] sm:text-4xl">
          16개 유형에<br className="sm:hidden" /> 넣지 않아요
        </h1>
        <p className="mx-auto mt-3 max-w-md break-keep text-sm font-semibold leading-6 text-text-secondary sm:text-base">
          답한 나와 행동하는 나, 그 차이를 봅니다 · 로그인 없이
        </p>
      </section>

      {/* 홍보 유입의 주 목적지(완성된 이상형·나소개 등 6개)를 먼저
          보여준다 — "무엇을 결정해야 할지"(현재 career 1개뿐)는 아래로
          내렸다. 순서는 이 두 줄의 렌더링 순서로만 정해진다(공유
          배열이 아니라 각자 자기 ids 배열을 가진 별개의 TopicSection
          호출) — 섹션 내부 카드 순서(DEPTH_TOPIC_IDS/VIRAL_TOPIC_IDS)는
          그대로다.

          라벨 교체(2026-08): "가볍게, 빠르게"/"차근차근, 깊이 있게"는
          소요 방식(속도·깊이)만 말해서 두 그룹의 차이가 "빠른 것 vs
          느린 것"으로만 읽혔다("가볍게 빠르게가 무슨 말이에요?" 반응).
          "내가 어떤 사람인지"/"무엇을 결정해야 할지"는 각 그룹에서
          실제로 얻는 결과물(자기 이해 카드 vs 결정을 위한 정리)을
          말한다. */}
      <TopicSection kicker="내가 어떤 사람인지" ids={viralTopicIds} onStart={onStart} onLocked={handleLocked} />
      <TopicSection
        kicker="무엇을 결정해야 할지"
        ids={DEPTH_TOPIC_IDS}
        onStart={onStart}
        onLocked={handleLocked}
        showCount={false}
      />

      <section className="map-container py-3">
        <button
          type="button"
          onClick={() => handleLocked(safetyNetTopic)}
          className="flex w-full flex-col items-start gap-1 rounded-large border border-dashed border-border-strong bg-surface/60 p-4 text-left transition hover:border-primary-border-soft"
        >
          <span className="text-xs font-black text-text-muted">딱 맞는 게 없나요?</span>
          <span className="break-keep text-sm font-bold">
            자유롭게 이야기해도 괜찮아요 — {safetyNetTopic.name}
          </span>
          <Badge className="mt-1" tone="default">준비 중</Badge>
        </button>
      </section>

      {notice ? (
        <div className="map-container pb-2 pt-1">
          <Toast role="status">{notice}</Toast>
        </div>
      ) : null}

      <p className="map-container pb-10 pt-8 text-center text-xs font-semibold text-text-muted">
        <a href="/privacy" className="underline underline-offset-2 hover:text-text-primary">
          개인정보처리방침
        </a>
        <span className="mx-1.5">·</span>
        <a href="/terms" className="underline underline-offset-2 hover:text-text-primary">
          이용약관
        </a>
      </p>
    </main>
  );
}

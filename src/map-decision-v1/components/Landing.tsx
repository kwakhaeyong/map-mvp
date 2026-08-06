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
const VIRAL_TOPIC_IDS = ["idealType", "selfIntro", "friendship", "work", "taste", "travelStyle"];
const SAFETY_NET_TOPIC_ID = "freeform";

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
      <span className="break-keep text-xs font-semibold leading-5 text-text-secondary">{topic.oneLiner}</span>
    </button>
  );
}

function TopicSection({
  kicker,
  ids,
  onStart,
  onLocked,
}: {
  kicker: string;
  ids: string[];
  onStart: (topicId: string) => void;
  onLocked: (topic: TopicConfig) => void;
}) {
  // 카드가 1개뿐이면(현재 "차근차근, 깊이 있게") 2~3열 그리드에 넣지
  // 않고 전폭 1열로 그린다 — 그리드 칸이 남아 오른쪽이 비어 보이는
  // 문제를 없앤다. 카드가 여러 개면 기존 2~3열 그대로다.
  const isSingle = ids.length === 1;
  return (
    <section className="map-container py-4">
      <p className="mb-4 px-1 text-lg font-black tracking-[-0.02em] text-text-primary">{kicker}</p>
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
}) {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleLocked = (topic: TopicConfig) => setNotice(`${topic.name}은(는) 아직 준비 중이에요. 곧 만나요!`);
  const safetyNetTopic = TOPICS[SAFETY_NET_TOPIC_ID];

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

      <section className="map-container pb-2 pt-8 text-center sm:pt-14">
        <p className="kicker">MAP Decision</p>
        <h1 className="mt-3 text-balance break-keep text-[1.9rem] font-black leading-[1.18] tracking-[-0.04em] sm:text-4xl">
          말하면 정리되는 나의 MAP
        </h1>
        <p className="mx-auto mt-3 max-w-md break-keep text-sm font-semibold leading-6 text-text-secondary sm:text-base">
          지금 궁금한 나를 골라보세요. 대화 몇 마디면 충분해요.
        </p>
        <button
          type="button"
          onClick={onDemo}
          className="mt-4 text-xs font-black text-text-muted underline underline-offset-2 hover:text-text-primary"
        >
          30초 체험 먼저 볼까요? →
        </button>
      </section>

      {/* 홍보 유입의 주 목적지(완성된 이상형·나소개 등 6개)를 먼저
          보여준다 — "차근차근, 깊이 있게"(현재 career 1개뿐)는 아래로
          내렸다. 순서는 이 두 줄의 렌더링 순서로만 정해진다(공유
          배열이 아니라 각자 자기 ids 배열을 가진 별개의 TopicSection
          호출) — 섹션 내부 카드 순서(DEPTH_TOPIC_IDS/VIRAL_TOPIC_IDS)는
          그대로다. */}
      <TopicSection kicker="가볍게, 빠르게" ids={VIRAL_TOPIC_IDS} onStart={onStart} onLocked={handleLocked} />
      <TopicSection kicker="차근차근, 깊이 있게" ids={DEPTH_TOPIC_IDS} onStart={onStart} onLocked={handleLocked} />

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

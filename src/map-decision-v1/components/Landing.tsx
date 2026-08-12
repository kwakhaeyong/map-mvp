"use client";

import { ReactElement, useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { TOPICS, TopicAxis, TopicChoice, TopicConfig } from "../engine/topics";
import { useAutoAdvance } from "../hooks/use-auto-advance";
import { Badge, Button, Toast } from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// FIRST CLICK 대표 콘텐츠(2026-08) — 순수 장식용 등고선 SVG. Living Map의
// "아직 다 드러나지 않은 것을 탐색한다"는 정체성을 새 이미지 자산 없이
// 재현한다(app/globals.css·design-tokens.css에 기존 등고선 이미지·SVG
// 컴포넌트가 없어 새로 만들었다 — MapCanvas.tsx의 <svg>는 화살표 마커용
// 정의라 재사용 대상이 아니다). raw 색상값이 아니라 text-primary 토큰
// 색을 currentColor로 물려받고, 투명도는 Tailwind 슬래시 클래스가 아니라
// SVG 자체의 opacity 속성(디자인 시스템 검사 대상이 아닌 속성)으로만
// 준다. 텍스트 가독성을 해치지 않도록 헤더 텍스트보다 DOM에서 먼저
// 그려 아래 레이어에 깔리게 하고, 부모(Hero 섹션)에는 aria-hidden으로
// 스크린리더가 무시하게 한다.
//
// 2026-08-11 시각 행동 유도 보정(오너 검수 반려 사유: 선택지 4개는 흰
// 버튼처럼 보여 누르고 싶은 유인이 약한데, 반대로 등고선은 너무 크고
// 진해서 첫 시선을 이 배경이 가져가 버린다) — 등고선을 다시
// "브랜드 background texture"로 격하시켰다. 지난 시각 보정에서 올렸던
// 선 굵기·불투명도·점선 경로·지도 노드 점 3개를 전부 되돌리고, 얇고
// 아주 옅은(0.06~0.12) 원 4개만 남겼다 — 시선 순서가 반드시 "질문 →
// 선택지 4개"가 되어야 하고, 등고선 자체가 눈에 먼저 들어오면 실패이기
// 때문이다("색만 진하게 해서 해결했다고 판단하지 말 것"이라는 지시를
// 반대 방향으로 적용했다 — 이번엔 옅게 하는 것이 해결책이다). 색은
// 여전히 raw 값이 아니라 text-primary 토큰의 currentColor다.
function TasteHeroBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 size-full text-primary"
    >
      <circle cx="340" cy="20" r="170" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.07" />
      <circle cx="340" cy="20" r="120" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.1" />
      <circle cx="30" cy="310" r="150" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.06" />
      <circle cx="30" cy="310" r="100" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.09" />
    </svg>
  );
}

// 2026-08-11 시각 행동 유도 보정 — REAL Q1 선택지 4개를 "누르고 싶은
// 콘텐츠 타일"로 만들기 위한 작은 추상 아이콘 4개. Lucide 같은 범용
// 아이콘 세트를 붙이는 대신(지시: "일반적인 아이콘을 단순히 붙이는
// 방식은 피한다"), MAP Decision 안에서만 통하는 최소한의 기하학적
// 표식을 새로 그렸다 — 이미지·일러스트가 아니라 순수 SVG 선/도형이다.
// 각 문항 라벨이 은유하는 감각을 직역했다: 보는 편=화면/초점(프레임+원),
// 듣는 편=파형(굵기가 다른 세로선 4개), 읽는 편=페이지의 글줄(가로선
// 3개), 만드는 편=서로 이어붙이는 조각(대각선으로 연결된 점 4개 —
// Living Map의 "점을 잇는다"는 은유와도 맞닿는다). 색은 currentColor로
// 부모(아이콘을 감싸는 원형 배지)의 text 색을 그대로 물려받는다 —
// 아이콘 자체에 색을 고정하지 않아 선택 상태에 따라 부모가 색만
// 바꿔주면 된다.
function ViewIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <rect x="5" y="8" width="22" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="15.5" r="3.2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function ListenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <line x1="7" y1="13" x2="7" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="8" x2="13" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="19" y1="11" x2="19" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="25" y1="14" x2="25" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function ReadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <line x1="6" y1="11" x2="26" y2="11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="21" x2="24" y2="21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function MakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <line x1="9" y1="9" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="23" y1="9" x2="9" y2="23" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <circle cx="23" cy="9" r="3" fill="currentColor" />
      <circle cx="9" cy="23" r="3" fill="currentColor" />
      <circle cx="23" cy="23" r="3" fill="currentColor" />
    </svg>
  );
}

// 옵션 라벨(topics.ts 원문, 변경하지 않음) → 아이콘 + 배지 배경색.
// 배경색은 새 토큰이 아니라 design-tokens.css의 기존 MAP 노드 색
// 4개(fact/feeling/value/option, §8)를 그대로 쓴다 — TopicCard의 accent
// bar·결과 화면 매트릭스가 이미 쓰는 어휘라 새 의미를 만들지 않는다.
// 4개 타일이 서로 다른 배지색을 가져야 "서로 다른 시각적 성격"이
// 생긴다는 지시를 이 방식으로 만족한다. 옵션 라벨이 이 표에 없으면
// (topics.ts가 바뀌는 등 예상 밖 상황) 아이콘 없이 텍스트만 보여준다 —
// 방어적으로 화면이 깨지지 않게만 한다.
const HERO_OPTION_VISUAL: Record<string, { badge: string; Icon: (props: { className?: string }) => ReactElement }> = {
  "보는 편": { badge: "bg-fact", Icon: ViewIcon },
  "듣는 편": { badge: "bg-feeling", Icon: ListenIcon },
  "읽는 편": { badge: "bg-value", Icon: ReadIcon },
  "만드는 편": { badge: "bg-option", Icon: MakeIcon },
};

// FIRST ACTION MVP(2026-08) — 히어로 자체를 taste의 실제 Q1(tasteMode)
// 문항으로 만드는 2×2 선택 카드. TopicQuiz.tsx의 QuickTapStep과 같은
// 시각 언어(같은 카드 톤·같은 선택 강조 스타일)를 쓴다 — 여기서 고른
// 뒤 곧바로 이어지는 실제 Q2 화면(QuickTapStep)과 느낌이 달라지면
// "다른 화면으로 넘어갔다"는 인상을 줘 몰입이 끊긴다. 선택 즉시
// 자동으로 다음(=취향 세션 시작)으로 넘어가는 감각은 QuickTapStep과
// 같은 훅(hooks/use-auto-advance.ts)을 그대로 재사용해서 만든다 —
// 로직을 새로 만들지 않았다. 이 컴포넌트 자체는 화면(마크업)만 담당
// 하고, 답을 실제로 세션에 기록하는 일은 부모(MapDecisionProduct.tsx의
// startTasteFirstAnswer, engine/quiz-answer.ts의 applyQuizAnswer)가
// 전담한다 — TopicQuiz.tsx의 commitAnswer와 똑같은 함수를 호출하므로
// 이 화면에서 만드는 답변 데이터가 퀴즈 화면의 것과 어긋날 수 없다.
// 2026-08-11 시각 행동 유도 보정 — 선택지 4개를 "작은 흰 버튼"이 아니라
// "누르고 싶은 콘텐츠 타일"로 다시 만들었다. 바뀐 것: (1) 위에 배지형
// 아이콘을 얹어 타일마다 다른 시각적 성격을 준다(위 HERO_OPTION_VISUAL
// 참고), (2) 안쪽 여백·글자 크기를 키워 타일 자체의 무게감을 올린다,
// (3) 선택 순간 타일이 살짝 확대되고(scale) 아이콘 배지가 반전되고
// (색 반전 자체가 "반응"이다) 오른쪽 위에 작은 점 하나가 나타난다 —
// "눌렀다 → 오? → Q2"라는 짧은 피드백을 250ms 자동 전환 시간 안에서만
// 준다(새 지연을 추가하지 않는다). 선택·전환 로직(useAutoAdvance,
// 250ms) 자체는 그대로다 — 이번 보정은 순수 시각(className)만 바꿨다.
function HeroFirstQuestion({ axis, onAnswer }: { axis: TopicAxis; onAnswer: (choice: TopicChoice) => void }) {
  const { pending, pick } = useAutoAdvance(onAnswer, false);
  return (
    <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:gap-4 lg:max-w-none lg:grid-cols-4 lg:gap-5">
      {axis.options.map((option) => {
        const isSelected = pending?.label === option.label;
        const isLocked = pending !== null && !isSelected;
        const visual = HERO_OPTION_VISUAL[option.label];
        const Icon = visual?.Icon;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => pick(option)}
            disabled={isLocked}
            className={cx(
              "group relative flex flex-col items-center gap-2.5 rounded-large border px-4 py-7 text-center transition-all duration-normal ease-emphasized disabled:pointer-events-none sm:py-8",
              isSelected
                ? "scale-[1.03] border-primary bg-primary text-primary-foreground shadow-floating"
                : "border-border bg-surface text-text-primary shadow-subtle hover:-translate-y-1 hover:scale-[1.02] hover:border-border-strong hover:bg-primary hover:text-primary-foreground hover:shadow-floating",
              isLocked && "opacity-40",
            )}
          >
            {/* 선택 순간 나타나는 작은 점 — "MAP 점 하나가 나타난다"는 FIRST
                FUN 반응. 항상 DOM에 있고 opacity/scale만 바뀌므로 별도
                애니메이션 라이브러리 없이 기존 transition 유틸로 충분하다. */}
            <span
              aria-hidden="true"
              className={cx(
                "absolute right-3 top-3 size-2 rounded-full bg-primary-foreground transition-all duration-normal ease-emphasized",
                isSelected ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            />
            {Icon ? (
              <span
                className={cx(
                  "flex size-11 items-center justify-center rounded-medium transition-all duration-normal ease-emphasized sm:size-12",
                  isSelected ? "scale-110 bg-primary-foreground-wash" : visual.badge,
                  !isSelected && "group-hover:bg-primary-foreground-wash",
                )}
              >
                <Icon
                  className={cx(
                    "size-5 sm:size-6",
                    isSelected ? "text-primary-foreground" : "text-text-primary group-hover:text-primary-foreground",
                  )}
                />
              </span>
            ) : null}
            <span
              className={cx(
                "text-base font-extrabold tracking-[-0.01em] sm:text-lg",
                isSelected ? "text-primary-foreground" : "text-text-primary group-hover:text-primary-foreground",
              )}
            >
              {option.label}
            </span>
            <span
              className={cx(
                "text-xs font-medium transition-colors duration-normal ease-emphasized",
                isSelected ? "text-primary-foreground-soft" : "text-text-muted group-hover:text-primary-foreground-soft",
              )}
            >
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
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
// 2026-08-11 시각 보정(오너 검수 지시 5번): 5개 카드가 완전히 동일해
// "콘텐츠 플랫폼" 느낌이 약하다는 지적에 따라, 카드 구조는 그대로 두고
// 맨 위에 가는 색 띠 하나만 얹었다. 새 색이 아니라 design-tokens.css의
// 기존 MAP 노드 색 5개(fact/feeling/value/option/uncertainty, §8)를
// 그대로 재사용한다 — 결과 화면 매트릭스·태그가 이미 쓰는 색과 같은
// 어휘라 새 의미를 만들지 않는다. taste는 이 그리드에 없어(Hero로
// 이동) 목록에서 뺐다.
const TOPIC_ACCENT: Record<string, string> = {
  travelStyle: "bg-fact",
  friendship: "bg-feeling",
  selfIntro: "bg-value",
  idealType: "bg-option",
  work: "bg-uncertainty",
};

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
        // VISUAL DESIGN PASS v1(2026-08) — 상단 통짜 색 바 + 흰 배경 +
        // shadow-subtle 조합("카드마다 회색 테두리 + 흰 배경"의 전형적인
        // SaaS 기능 카드 패턴)을 지도 "범례 색인" 톤으로 낮춘다. 색 바를
        // 위쪽 전체 폭이 아니라 왼쪽에 짧게 세워 지도 범례의 색 표식처럼
        // 보이게 하고, 평상시 그림자를 없애 화면이 "카드가 여러 장 떠
        // 있다"가 아니라 "인쇄된 색인 목록"처럼 차분하게 가라앉게 한다.
        // 정보 구조·문구·클릭 동작은 전혀 바뀌지 않는다.
        "group relative flex min-h-[112px] flex-col items-start justify-center gap-2 overflow-hidden rounded-large border border-border bg-surface py-4 pl-5 pr-4 text-left transition duration-normal ease-emphasized",
        disabled ? "opacity-60" : "hover:-translate-y-0.5 hover:border-primary-border-soft hover:bg-ink-wash hover:shadow-subtle",
      )}
    >
      {TOPIC_ACCENT[topic.id] ? (
        <span aria-hidden="true" className={cx("absolute inset-y-4 left-0 w-1 rounded-pill", TOPIC_ACCENT[topic.id])} />
      ) : null}
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
  onStartTasteFirstAnswer,
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
  // FIRST ACTION MVP(2026-08) — taste 전용. 히어로의 REAL Q1(tasteMode)
  // 카드를 고른 순간 바로 호출된다(MapDecisionProduct.tsx의
  // startTasteFirstAnswer). onStart와 별도 함수인 이유: onStart는
  // "주제만 고르고 아직 아무 문항도 안 푼" 상태(ProfileStep으로 감)를
  // 만들지만, 이건 "Q1까지 이미 답한" 상태(TopicQuiz Q2로 감)를 만든다
  // — 서로 다른 세션 모양을 만드는 함수라 하나로 합치지 않았다.
  onStartTasteFirstAnswer: (choice: TopicChoice) => void;
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
  // FIRST CLICK 개편(2026-08): Hero가 taste를 대표 콘텐츠로 크게 보여주니
  // 아래 그리드에서는 중복 노출을 피하려고 taste를 뺀다. VIRAL_TOPIC_IDS
  // 배열 자체(순서·구성)는 건드리지 않는다 — 결과 화면 하단 "다음 MAP
  // 유도"(NextMapPrompt.tsx)가 이 배열을 그대로 재사용해 다음 주제를
  // 추천하는데, 여기서 원본 배열에서 taste를 지우면 그쪽 추천 로직도
  // taste를 영영 추천 못 하게 되는 사고로 이어진다. 이 필터링은 이
  // 컴포넌트의 "그리드에 무엇을 그릴지"에만 쓰는 화면 표시 선택이다.
  const gridTopicIds = VIRAL_TOPIC_IDS.filter((id) => id !== "taste" && (!hideWorkTopic || id !== "work"));
  // FIRST ACTION MVP(2026-08) — 히어로가 취향의 실제 Q1(tasteMode)을
  // topics.ts에서 직접 읽는다. 문항 원문·option label을 이 파일에
  // 따로 옮겨 적지 않는다 — 두 군데(topics.ts, Landing.tsx)에 같은
  // 문장이 따로 존재하면 나중에 한쪽만 고쳐 서로 어긋나는 사고로
  // 이어진다. tasteMode는 taste.axes[0]으로 항상 존재하므로(이번
  // PR에서 문항 순서를 바꾸지 않았다), heroAxis가 없는 경우는 방어
  // 코드일 뿐 실제로는 발생하지 않는다.
  const heroAxis = (TOPICS.taste.axes ?? []).find((axis) => axis.id === "tasteMode");

  const handleGridStart = (topicId: string) => {
    track("topic_select", { topicId, source: "grid" });
    onStart(topicId);
  };

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

      {/* FIRST ACTION MVP(2026-08, REAL Q1 LANDING) — 히어로 자체를
          "설명 → CTA → 테스트"가 아니라 "선택 → 진행"으로 바꿨다. 오너
          검수 지시: 처음 들어온 사람이 별도 설명이나 "테스트를 시작할지"
          결정하는 단계 없이, 실제 taste 첫 문항(tasteMode, "혼자 있는
          시간에 나는 주로 뭘 해?")에 곧바로 답하게 만드는 것이 이번
          작업의 성공 기준이다("랜딩이 더 예뻐졌다"가 아니다).

          이전 버전(FIRST CLICK MVP)의 "나도 모르는 내 취향은?" 헤드라인
          + teaser + "취향 확인해보기" CTA + microcopy + result-preview
          한 줄 구조를 전부 걷어내고, 그 자리에 실제 문항과 2×2 선택
          카드(HeroFirstQuestion)를 놓았다. 문항 원문·option label은
          topics.ts의 taste.axes[0](tasteMode)를 그대로 읽어온다 —
          이 파일 안에 별도로 옮겨 적지 않는다(위 heroAxis 참고).

          "16개 유형에 넣지 않아요" 포지셔닝 문구는 삭제하지 않고 선택
          카드 아래로 내렸다 — 첫 시선(선택 영역)보다 앞에 두지 않되,
          여전히 사실에 근거한 브랜드 문장이라 완전히 없애지는 않는다.

          선택 즉시 동작(카드 강조 → 약 250ms → 전환)은 HeroFirstQuestion이
          hooks/use-auto-advance.ts의 useAutoAdvance를 그대로 재사용해서
          만든다 — TopicQuiz.tsx의 QuickTapStep과 같은 훅이라 새 로직이
          아니다. 답을 실제 세션에 기록하는 일은 MapDecisionProduct.tsx의
          startTasteFirstAnswer(engine/quiz-answer.ts의 applyQuizAnswer
          호출)가 전담한다 — TopicQuiz.tsx의 commitAnswer와 완전히 같은
          함수라 이 화면에서 만드는 답변 데이터가 퀴즈 화면의 것과
          어긋날 수 없다.

          hero_choice 이벤트는 이 컴포넌트가 아니라 startTasteFirstAnswer
          안에서 찍는다(세션을 실제로 만드는 지점이 거기라서) — 이 화면은
          onStartTasteFirstAnswer(choice)를 그대로 호출만 한다. 기존
          topic_select는 이 히어로에서 더 이상 찍지 않는다 — hero_choice가
          taste의 FIRST ACTION이고, topic_select는 아래 그리드에서 다른
          주제를 고를 때만 남긴다(handleGridStart 참고).

          2026-08-11 시각 행동 유도 보정(오너 검수 반려 사유: 구조는
          맞지만 선택지 4개가 흰 폼처럼 보여 누르고 싶은 유인이 약하고,
          반대로 등고선이 너무 크고 진해 첫 시선을 가져간다) — 두 가지를
          바꿨다.
          1) 지난 시각 보정에서 데스크톱 전용으로 만든 lg 2컬럼 구도
             (텍스트 왼쪽 · 등고선이 걸리는 빈 오른쪽 컬럼)를 없앴다 —
             그 구도는 "빈 등고선 영역"을 만드는 것 자체가 이번 지시의
             문제였다. 대신 브랜드부터 eyebrow까지 하나의 중앙 정렬
             컬럼으로 통일하되, 데스크톱에서는 이 컬럼 자체의
             최대너비(max-w)를 넓혀(lg:max-w-3xl) 질문·선택지가 더 넓은
             폭을 차지하게 했다 — "단순히 max-width만 키우지 말라"는
             지시에 따라 그 안의 선택지 그리드도 lg부터 2×2에서 4열
             한 줄로 바꿔(아래 HeroFirstQuestion 참고) 선택지 자체가
             데스크톱에서도 Hero의 핵심 콘텐츠가 되게 했다.
          2) TasteHeroBackdrop을 "브랜드 background texture" 수준으로
             다시 낮췄다(그 컴포넌트 주석 참고) — 시선 순서가 항상
             "질문 → 선택지 4개"가 되어야 하고 등고선이 먼저 보이면
             실패이기 때문이다. 새 SVG는 추가하지 않았다(기존 컴포넌트
             내부 수치만 조정). */}
      <section className="map-container relative overflow-hidden rounded-large border border-border bg-surface shadow-floating">
        <TasteHeroBackdrop />
        <div className="relative mx-auto max-w-lg px-5 pb-8 pt-8 text-center sm:max-w-xl sm:px-8 sm:pb-10 sm:pt-12 lg:max-w-3xl lg:px-10 lg:py-16">
          <p className="mx-auto max-w-xs break-keep text-sm font-semibold leading-6 text-text-secondary sm:max-w-sm sm:text-base">
            생각하지 말고,<br />지금의 나와 가까운 쪽을 골라보세요.
          </p>
          {heroAxis ? (
            <>
              <h1 className="mx-auto mt-3 max-w-sm text-balance break-keep text-[1.9rem] font-black leading-[1.22] tracking-[-0.03em] sm:max-w-md sm:text-[2.3rem] lg:max-w-xl lg:text-[2.5rem]">
                {heroAxis.question}
              </h1>
              <HeroFirstQuestion axis={heroAxis} onAnswer={onStartTasteFirstAnswer} />
            </>
          ) : null}
          <p className="mx-auto mt-6 max-w-xs break-keep text-xs font-black tracking-[-0.01em] text-text-muted sm:max-w-sm">
            16개 유형에 넣지 않아요
          </p>
        </div>
      </section>

      {/* 홍보 유입의 주 목적지(완성된 이상형·나소개 등)를 먼저 보여준다 —
          "무엇을 결정해야 할지"(현재 career 1개뿐)는 아래로 내렸다.
          순서는 이 두 줄의 렌더링 순서로만 정해진다(공유 배열이 아니라
          각자 자기 ids 배열을 가진 별개의 TopicSection 호출) — 섹션
          내부 카드 순서(DEPTH_TOPIC_IDS/VIRAL_TOPIC_IDS)는 그대로다.

          라벨 교체(2026-08): "가볍게, 빠르게"/"차근차근, 깊이 있게"는
          소요 방식(속도·깊이)만 말해서 두 그룹의 차이가 "빠른 것 vs
          느린 것"으로만 읽혔다("가볍게 빠르게가 무슨 말이에요?" 반응).
          "내가 어떤 사람인지"/"무엇을 결정해야 할지"는 각 그룹에서
          실제로 얻는 결과물(자기 이해 카드 vs 결정을 위한 정리)을
          말했었다.

          라벨 재교체(2026-08, FIRST CLICK 개편): taste가 위 Hero로
          올라가면서 이 섹션엔 taste를 뺀 나머지만 남는다 — "내가 어떤
          사람인지"를 그대로 두면 taste가 빠진 게 아니라 처음부터 없던
          것처럼 읽힌다. "다른 MAP"으로 바꿔 이 카드들이 위 Hero(taste)
          말고도 더 있다는 걸 분명히 한다. */}
      <TopicSection kicker="다른 MAP" ids={gridTopicIds} onStart={handleGridStart} onLocked={handleLocked} />
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

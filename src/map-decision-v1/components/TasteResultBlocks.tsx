"use client";

import { useId, useState, type ReactNode } from "react";
import { TasteMap, TasteMatrix, TasteMatrixPoint, TasteResult, TasteRoadmap } from "../types";
import { Card } from "./ui/primitives";

// 취향 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트 모음.
// 라이브 결과 화면(TasteCard.tsx)과 공유 읽기 전용 화면
// (app/r/[id]/page.tsx) 둘 다에서 재사용한다.
//
// RESULT EXPERIENCE REBUILD(2026-08)로 예전의 단일 TasteResultBlocks
// export를 3개로 나눴다 — TasteResult 데이터·값은 하나도 새로 만들지
// 않고(AI 재호출 없음, 타입 변경 없음), "언제/어떤 순서로 보여줄지"만
// 바꿨다:
// - TasteResultHighlights: 항상 바로 보이는 부분(RESULT CARD → MAP이
//   발견한 3가지 → MY MAP). 라이브 화면과 공유 화면 둘 다 이 컴포넌트
//   하나를 그대로 써서, 두 화면이 여기서부터는 항상 같은 걸 보여준다.
// - TasteResultDetails: "더 깊게 보기"로 접어둔 상세 분석(중심·패턴·
//   방향·자기성찰) — 기존 6블록 중 매트릭스를 뺀 나머지 전부를 그대로
//   담고 있다. 데이터는 하나도 안 지웠고, 기본 노출 여부만 바꿨다.
// - TasteRoadmapDisclosure: 예전엔 화면 맨 아래 항상 펼쳐져 있던
//   RoadmapSection을 "행동으로 이어보기"로 접어서, 모든 사용자에게
//   30일 계획이 결과의 주인공처럼 보이지 않게 했다.
// 예전에 있던 ResultNav(섹션 점프 목록)는 없앴다 — 새 구조는 6개
// 섹션을 골라 이동하는 대시보드가 아니라 위에서 아래로 한 번에 읽는
// 흐름이라, 탭 형태 내비게이션이 오히려 "정형 리포트"처럼 보이게
// 만들었다(정지형 스크린 공간도 아깝고, 375px 첫 화면에서 타이틀·
// 한줄설명·태그·공유 CTA가 먼저 보여야 한다는 요구와도 맞지 않았다).

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// WorkResultBlocks.tsx의 SectionHeader와 같은 이유(PR #150)로 영문
// eyebrow 텍스트 대신 작은 색상 바를 쓴다.
// RESULT EXPERIENCE TARGET FIDELITY(2026-08) — TasteCard.tsx의 공유/다음
// 행동 블록도 같은 헤더 언어를 쓰도록 export한다. 새 컴포넌트를 또
// 만들지 않고 이미 있는 걸 재사용할 뿐이다.
export function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      {/* VISUAL DESIGN PASS v1(2026-08) — 단순 색 바를 "선 + 점" 두 조각으로
          나눴다. 위 CardSignature(카드 우상단 경로 서명)와 같은 언어(선을
          따라가다 점에 닿는다)를 아주 작게 반복해서, 섹션을 넘길 때마다
          이 카드가 "경로 위의 한 지점"이라는 인상이 옅게 쌓이게 한다 —
          새 색·새 의미는 아니고 기존 bg-primary 토큰 하나만 쓴다. */}
      <span aria-hidden="true" className="mb-2 flex items-center gap-1.5">
        <span className="h-1 w-6 rounded-pill bg-primary" />
        <span className="size-1 rounded-full bg-primary" />
      </span>
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// CollapsibleFriendResult.tsx와 똑같은 토글 버튼 스타일을 재사용한다 —
// "더 깊게 보기"/"행동으로 이어보기" 둘 다 이 컴포넌트로 만든다.
//
// BRAND IDENTITY PASS v2(2026-08) — 알약 모양 + shadow-subtle(둥실 뜬
// 흰 버튼) 조합을 "모든 걸 rounded card에 담는" 패턴에서 빼기 위해
// radius-small(12px)·그림자 없음·투명 배경의 얇은 테두리 행으로
// 낮췄다. 결과 CTA(친구에게 보여주기 등, 진짜 버튼)와 이 정보 토글이
// 한눈에 다른 위계로 읽히게 하는 목적도 겸한다. 펼치기/접기 동작,
// 문구, 클릭 대상은 전혀 바뀌지 않는다.
function Disclosure({ closedLabel, openLabel, children }: { closedLabel: string; openLabel: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-small border border-border bg-transparent px-4 py-3 text-sm font-extrabold text-text-primary transition-colors hover:border-border-strong hover:bg-ink-wash"
      >
        <span>{expanded ? openLabel : closedLabel}</span>
        <span aria-hidden="true">{expanded ? "▲" : "▾"}</span>
      </button>
      {expanded ? <div className="flex flex-col gap-3">{children}</div> : null}
    </div>
  );
}

// 다른 네 주제와 태그 축 일부를 공유하는 사전을 재사용하므로 시각적
// 표현도 WorkTagRow(WorkResultBlocks.tsx)와 동일하게 맞춘다 — 클래스는
// 그대로 복사했다(디자인 토큰만 참조하므로 다른 파일을 건드리지 않는다).
export function TasteTagRow({ tags, className }: { tags: string[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <div className={cx("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center rounded-pill bg-tag-fill px-2.5 py-1 text-xs font-extrabold text-text-primary">
          {tag}
        </span>
      ))}
    </div>
  );
}

// RESULT VISUAL EXPERIENCE REBUILD(2026-08) — 카드 우상단 5% 미만짜리
// 작은 아이콘(옛 CardSignature)을 없애고, 카드 전체를 덮는 큰 배경
// 워터마크로 대체한다. Target 설계안 §3의 요구("MAP Decision 로고를
// 가려도 개인 결과물처럼 보이는가")에 대한 답 — 이 사람의 MY MAP
// 지형(matrix.types)을 그대로 재사용해 크고 옅게 깐다. 카드 자체가
// "이 사람의 지도에서 잘라낸 한 조각"처럼 보이게 하는 게 목적이다.
// 좌표 계산은 MyMapSection이 쓰는 것과 완전히 같은 함수(아래
// spreadMatrixPoints/centroidOf/angleSortedOrder/closedSmoothPath, 모두
// 이 파일 안에서 그대로 재사용 — 새로 만들지 않음)라 값이 어긋날 일이
// 없다. 정보 전달용이 아니라 순수 배경이라 pointer-events-none +
// aria-hidden으로 상호작용/스크린리더에서 완전히 제외한다.
function CardTerritoryBackdrop({ matrix }: { matrix: TasteMatrix }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(matrix.types);
  const territoryOrder = angleSortedOrder(placed);
  const territoryPath = closedSmoothPath(territoryOrder);
  if (!territoryPath) return null;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 -z-10 size-full" aria-hidden="true">
      <defs>
        <filter id={`card-territory-blur-${filterId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path d={territoryPath} className="fill-primary" fillOpacity={0.16} filter={`url(#card-territory-blur-${filterId})`} />
      <path d={territoryPath} className="fill-none stroke-primary" strokeWidth="0.6" strokeOpacity={0.3} />
    </svg>
  );
}

// RESULT IDENTITY & CLARITY PASS(2026-08) — "결과가 기억에 남지 않는다"는
// 테스터 피드백(1명, 상대평가) 대응. 새 AI 필드를 만들지 않고, 이미
// 생성된 result.matrix.types(정확히는 그 배열 안의 label 필드 — AI가
// 이미 2~4단어로 지어둔 "취향 속 모습" 이름)에서만 값을 뽑는다. 네
// 지점 중 서로 가장 멀리 떨어진(=이 사람의 지형에서 가장 대비되는)
// 두 지점의 label을 "A → B"로 붙여, 브리핑에서 예시로 든 "탐험 →
// 회귀" 같은 짧고 기억 가능한 신호를 매 사용자마다 다르게, 결정적으로
// 만든다. 화살표 방향은 배열에 먼저 등장한 순서를 그대로 따른다 —
// x/y가 사용자마다 다른 임의의 두 축이라 "어느 쪽이 시작이고 어느
// 쪽이 도착인지"를 코드가 함부로 판단하면 사실과 다른 서사를 지어내는
// 셈이 되기 때문이다(예: 실제로는 안 그런데 "탐험에서 회귀로 향한다"고
// 단정하는 것). 점이 2개 미만이면(스키마상 가능성만 있음, capMatrixPoints
// 참고) null을 돌려주고 화면은 그 경우 이 줄 자체를 생략한다 — MY MAP
// 섹션(LivingMapChart)이 이미 3개 미만일 때 폐곡선을 안 그리는 것과
// 같은 방어 원칙이다.
function pickSignaturePair(points: TasteMatrixPoint[]): [TasteMatrixPoint, TasteMatrixPoint] | null {
  if (points.length < 2) return null;
  let best: [TasteMatrixPoint, TasteMatrixPoint] | null = null;
  let bestDistance = -1;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = [points[i], points[j]];
      }
    }
  }
  return best;
}

// VISUAL & VIRAL REFOUNDATION(2026-08) — 위 계산 결과를 보여주는 칩을
// HeroHeader 전용이 아니라 독립 컴포넌트로 뺐다. 이유: 라이브 결과
// 화면(showHero=true)뿐 아니라 /r/[id] 공유 화면(showHero=false, 카드
// 이미지가 이미 title을 담당해 HeroHeader 자체를 안 그리는 경로)에도
// 똑같은 발견을 보여줘야 "친구가 개인 MAP을 받았다"는 느낌이 생긴다는
// 지시 때문이다 — 이전 라운드(RESULT IDENTITY & CLARITY PASS)에서는
// 이 칩이 HeroHeader 안에만 있어서 공유 화면에는 안 보이는 공백이
// 있었다(그 라운드 완료 보고에 남은 약점으로 기록했다). export해서
// app/r/[id]/page.tsx의 taste 분기에서도 그대로 재사용한다.
// VIRAL HOOK & RESULT DELIGHT PASS(2026-08) — 라벨을 영문 "Pattern"
// (데이터 필드처럼 읽힘)에서 "나의 궤적"(사람이 실제로 말할 법한
// 한국어)으로 바꿨다. 테스터 피드백("'내가 확실히 끌리는 것'이라고
// 풀어 쓰는 것보다, 궁금증을 유발하면서 축약할 수 있는 단어가 어린
// 층에게 더 긍정적일 것 같다")에 대한 응답이다. 계산 로직·값은 전혀
// 안 바꿨다 — MBTI식 고정 유형명이나 랜덤 별명을 새로 만드는 게
// 아니라, 이미 있는 값(matrix.types에서 뽑은 두 지점)을 "사용자가
// 친구에게 그대로 말할 수 있는 문장"에 더 가깝게 소개하는 문구만
// 바꿨다. 크기도 한 단계 키워(lg→xl) title 다음으로 눈에 들어오는
// "공개 순간"이 되게 했다.
export function TasteSignatureChip({ result, className }: { result: TasteResult; className?: string }) {
  const signaturePair = pickSignaturePair(result.matrix.types);
  if (!signaturePair) return null;
  return (
    <div className={cx("inline-flex w-fit items-center gap-2 rounded-medium border border-primary-border-soft bg-ink-wash px-3 py-2", className)}>
      <span className="font-serif text-[10px] font-bold uppercase tracking-[0.1em] text-primary">나의 궤적</span>
      <span className="text-xl font-black tracking-[-0.01em] text-primary">
        {signaturePair[0].label} <span aria-hidden="true" className="text-text-muted">→</span> {signaturePair[1].label}
      </span>
    </div>
  );
}

// STEP 1 RESULT CARD. title/oneLiner/statusLabel/tags는 예전 HeroHeader와
// 동일하게 그대로 재사용한다 — 새로 추가한 건 (1) heroAction 슬롯(공유
// 버튼을 카드 "안"에 넣어, 카드 자체가 공유 가능한 완결된 단위처럼
// 보이게 한다 — 공유 로직 자체는 새로 만들지 않고 호출부(TasteCard.tsx)의
// useShareResult 결과를 그대로 받아 버튼만 그린다), (2) 카드 상단의
// 작은 브랜드 마크(이 카드 한 장만 캡처·공유돼도 "MAP Decision" 출처가
// 보이게), (3) 위 CardSignature뿐이다. 정보량 자체(필드 종류)는 늘리지
// 않았다.
function HeroHeader({ result, heroAction }: { result: TasteResult; heroAction?: ReactNode }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <CardTerritoryBackdrop matrix={result.matrix} />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {/* BRAND IDENTITY PASS v2(2026-08) — "M + irregular contour" 지시를
              반영해, 완벽한 원/정사각형 대신 손으로 찍은 봉인처럼 약간
              비정형인 윤곽(비대칭 border-radius)과 미세한 기울임을 준다.
              Living MY MAP의 "완벽한 도형이 아닌 유기적 윤곽" 언어를 이
              작은 배지 하나에도 그대로 반복한 것뿐 — 새 색·새 아이콘
              세트는 아니다. 밀랍 인장처럼 두껍게 만들지 않도록 테두리는
              1px, 크기는 기존과 거의 같게 유지했다. */}
          <span
            className="grid size-6 place-items-center border border-primary bg-surface-elevated text-[10px] font-black text-primary"
            style={{ borderRadius: "42% 58% 53% 47% / 48% 42% 58% 52%", transform: "rotate(-4deg)" }}
          >
            M
          </span>
          {/* "MAP Decision"은 라틴 문자뿐이라 시스템 세리프(font-serif,
              Tailwind 기본 스택 — 새 폰트 파일을 받지 않는다)를 입혀도
              추가 전송량이 0바이트다. 실제 결과 제목(한글, AI가 만든
              임의 문장)에는 세리프를 적용하지 않았다 — 이유는 이 파일의
              결과 보고에 별도로 남긴다(요약: 이 프로젝트가 이미 Pretendard를
              92개 유니코드 조각으로 나눠 쓰는 이유와 같은 이유로, 결과
              제목처럼 글자 구성을 예측할 수 없는 자리에 새 한글 세리프
              전체(웹 폰트 2.4MB급)를 무조건 올리는 건 이번 라운드의
              "가볍게" 원칙과 맞지 않는다). */}
          <span className="font-serif text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">MAP Decision</span>
        </div>
        <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
          나의 취향 MAP
        </span>
      </div>
      {/* masthead rule — "브랜드 표기"와 "제목"을 필드가 아니라 지면
          (masthead 아래 헤드라인)처럼 가르는 얇은 선 하나. 새 정보는
          아니고 순수 구분선이라 스크린리더에서 의미를 갖지 않는다. */}
      <div aria-hidden="true" className="my-3 h-px w-full bg-border" />
      {/* RESULT EXPERIENCE TARGET FIDELITY(2026-08) — "RESULT CARD →
          발견 3가지 → MY MAP → 더 깊게 보기 → 공유/다음 행동" 기준
          설계안(첨부 이미지)에서 RESULT CARD 단계의 주인공은 명시적으로
          title + oneLiner다("사용자가 첫 3초 안에 기억해야 할 것은
          결과 title + oneLiner다. PATTERN/나의 궤적이 주인공이
          아니다"). 이전 라운드(VIRAL HOOK & RESULT DELIGHT PASS)에서
          나의 궤적 칩을 title 바로 다음(첫 3초 자리)으로 올렸던 걸
          되돌린다 — title → oneLiner → statusLabel → tags까지가
          "결과 공개" 한 세트로 먼저 오고, 나의 궤적 칩은 그 부연
          설명들 다음(공유 버튼 바로 위)으로 내려 "덤으로 발견한
          한 줄 요약" 정도의 위계로 낮췄다. 문장·계산 값은 전혀
          안 바꿨고, 등장 순서만 되돌렸다. */}
      <h1 className="text-balance break-keep text-4xl font-black leading-10 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      {result.statusLabel ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{result.statusLabel}</p>
      ) : null}
      <TasteTagRow tags={result.tags ?? []} className="mt-3" />
      <TasteSignatureChip result={result} className="mt-3" />
      {heroAction ? <div className="mt-4">{heroAction}</div> : null}
      {/* Target 이미지의 RESULT CARD 화면엔 "다음 단계로: MAP이 발견한
          3가지를 볼까요?" 같은 스크롤 유도 한 줄이 있다 — 새 데이터가
          아니라 고정 UI 문구 하나(스크롤 안내)만 추가한다. */}
      <p className="mt-4 text-center text-[11px] font-semibold text-text-muted">다음 단계로 · MAP이 발견한 3가지를 볼까요? ↓</p>
    </Card>
  );
}

// RESULT VISUAL EXPERIENCE REBUILD(2026-08) — Target 설계안 §7: "공유용
// RESULT CARD preview가 화면 안에서 다시 등장하는 구조를 검토한다...
// 사용자는 버튼을 누르기 전에 '이걸 친구한테 보내면 재밌겠다'고
// 느껴야 한다." STEP 1 HeroHeader와 같은 데이터(title/tags)를 훨씬
// 작게 다시 보여줘, 공유 버튼을 누르기 전에 "무엇이 나가는지"를
// 미리 보여주는 축소 카드다. 새 데이터 없음 — title/tags 재사용뿐.
export function TasteShareCardPreview({ result }: { result: TasteResult }) {
  return (
    <div className="relative overflow-hidden rounded-large border border-border bg-surface-elevated p-4 shadow-subtle">
      <span
        aria-hidden="true"
        className="absolute right-3 top-3 rounded-pill bg-tag-fill px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.06em] text-text-muted"
      >
        미리보기
      </span>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span
          className="grid size-5 place-items-center border border-primary bg-surface-elevated text-[9px] font-black text-primary"
          style={{ borderRadius: "42% 58% 53% 47% / 48% 42% 58% 52%" }}
        >
          M
        </span>
        <span className="font-serif text-[9px] font-black uppercase tracking-[0.14em] text-text-muted">MAP Decision</span>
      </div>
      <p className="mt-2 text-lg font-black leading-6 tracking-[-0.02em] text-text-primary">{result.title}</p>
      <TasteTagRow tags={(result.tags ?? []).slice(0, 3)} className="mt-2" />
    </div>
  );
}

// STEP 2 "MAP이 발견한 3가지". 새 AI 필드나 새 계산 없이, 이미 생성된
// 텍스트 중 딱 3곳에서 첫 항목만 그대로 가져온다(deterministic,
// 문장을 고치거나 요약하지 않음). RESULT VIRAL EXPERIENCE(2026-08)로
// 세 카드가 "점점 깊어지는 경험"이 되도록 역할을 다시 잡았다 —
// 순서(awareness→patterns→blindSpots) 자체는 이전과 동일하고, 라벨과
// 시각적 무게만 바꿨다:
// ① "내가 아는 나"(selfReflection.awareness[0]) — "응, 나 원래 이런
//    편이지" 하고 동의하게 만드는, 가장 안전한 진입점.
// ② "반복되는 나"(patterns[0]) — 서로 다른 문항을 가로질러 반복된
//    결이라, "따로 답했는데 이렇게 연결되네?"로 이어진다.
// ③ "내가 놓친 나"(selfReflection.blindSpots[0]) — 본인은 잘 모를 수
//    있는 결이라 이 셋 중 가장 중요하다("어떻게 알았지?" 반응을
//    노린다) — 그래서 시각적으로도 가장 강하게(진한 테두리·굵은 글씨)
//    그린다.
// 세 배열이 서로 다른 필드라 항목이 겹칠 일이 없다. 혹시 어떤 배열이
// 비어 있으면(스키마상 가능성만 있음) 그 항목만 건너뛰고 남은 것만
// 보여준다 — 억지로 채우지 않는다.
type Discovery = { role: string; text: string };

const DISCOVERY_SOURCES: { role: string; pick: (result: TasteResult) => string | undefined }[] = [
  { role: "내가 아는 나", pick: (result) => result.selfReflection.awareness[0] },
  { role: "반복되는 나", pick: (result) => result.patterns[0] },
  { role: "내가 놓친 나", pick: (result) => result.selfReflection.blindSpots[0] },
];

function pickDiscoveries(result: TasteResult): Discovery[] {
  return DISCOVERY_SOURCES.map(({ role, pick }) => ({ role, text: pick(result) })).filter(
    (discovery): discovery is Discovery => Boolean(discovery.text),
  );
}

// "더 깊게 보기"에서 위 세 카드가 이미 쓴 문장을 다시 보여주지 않기
// 위한 유틸 — pickDiscoveries가 항상 각 소스 배열의 0번째만 쓰므로,
// 상세 영역은 그 배열들의 1번째부터만 보여주면 된다(별도로 "어떤
// 항목이 실제로 쓰였는지"를 들고 다닐 필요가 없다). 배열이 비어 있거나
// 항목이 1개뿐이면 그대로 빈 배열을 돌려준다 — 각 소스 섹션(patterns
// 2~4개, awareness/blindSpots는 항상 고정 개수)이 빈 배열을 이미
// 안전하게 처리한다.
function dropFirst<T>(items: T[]): T[] {
  return items.length > 0 ? items.slice(1) : items;
}

// RESULT VISUAL EXPERIENCE REBUILD(2026-08) — Target 설계안 §4: "세 장이
// 같은 rounded card로 반복되면 안 된다. 번호·타이포·레이아웃·아이콘·
// 강조·여백을 다르게 써서 세 발견의 '성격'을 다르게 만들어라." 이전
// 라운드는 카드 색 tier만 3단계로 나눴는데, 그건 여전히 "카드 3장"
// 반복이었다. 이번엔 세 카드를 아예 다른 컴포넌트(다른 layout·다른
// 모티프)로 만든다 — role/text 데이터·순서는 전혀 안 바꾼다.

// ① 내가 아는 나 — 가장 안전한 진입점. 조용히, 인용부호 하나로.
function DiscoveryQuietCard({ role, text }: Discovery) {
  return (
    <div className="flex gap-3 py-3">
      <span aria-hidden="true" className="shrink-0 font-serif text-3xl font-black leading-none text-border-strong">“</span>
      <div className="flex flex-col gap-1 pt-1">
        <p className="text-xs font-black tracking-[-0.01em] text-text-muted">{role}</p>
        <p className="text-sm font-semibold leading-6 text-text-secondary">{text}</p>
      </div>
    </div>
  );
}

// ② 반복되는 나 — 답변을 가로질러 반복된다는 뜻의 loop 아이콘.
function DiscoveryLoopCard({ role, text }: Discovery) {
  return (
    <div className="flex items-start gap-3 rounded-large border border-border bg-surface-elevated p-4 shadow-subtle">
      <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 fill-none stroke-primary" strokeWidth={1.8} aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" strokeLinecap="round" />
        <path d="M18 4v3h-3M6 20v-3h3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-black tracking-[-0.01em] text-text-primary">{role}</p>
        <p className="text-sm font-semibold leading-6 text-text-secondary">{text}</p>
      </div>
    </div>
  );
}

// ③ 내가 놓친 나 — climax. -mx-4로 화면 카드 밖까지 번지듯 full-bleed로
// 터뜨린다(아래 MY MAP 섹션의 full-bleed와 같은 장치를 재사용해 "장면이
// 전환된다"는 리듬을 만든다). 조리개가 열리는 듯한 확장 원 모티프.
function DiscoveryBreakoutCard({ role, text }: Discovery) {
  return (
    <div className="relative -mx-4 overflow-hidden bg-primary px-8 py-8 text-primary-foreground">
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute -right-6 -top-6 size-32 opacity-20" aria-hidden="true">
        <circle cx="50" cy="50" r="46" className="fill-none stroke-primary-foreground" strokeWidth="1" />
        <circle cx="50" cy="50" r="32" className="fill-none stroke-primary-foreground" strokeWidth="1" />
        <circle cx="50" cy="50" r="18" className="fill-none stroke-primary-foreground" strokeWidth="1" />
      </svg>
      <div className="relative flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-pill bg-primary-foreground text-xs font-black text-primary">
            3
          </span>
          <p className="text-sm font-black uppercase tracking-[0.08em] text-primary-foreground-soft">{role}</p>
        </div>
        <p className="text-2xl font-black leading-8 tracking-[-0.02em]">{text}</p>
        {/* VIRAL HOOK & RESULT DELIGHT PASS(2026-08)에서 만든 고정 UI
            라벨을 그대로 이어 쓴다 — AI 문장이 아니라 이 파일의 고정
            chrome이다. */}
        <span className="mt-1 inline-flex w-fit items-center rounded-pill bg-primary-foreground-wash px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-primary-foreground">
          예상 밖의 발견
        </span>
      </div>
    </div>
  );
}

function DiscoveriesSection({ result }: { result: TasteResult }) {
  const discoveries = pickDiscoveries(result);
  if (discoveries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="MAP이 발견한 3가지" description="따로 답한 문항들을 모아보니, 이런 게 보였어요." />
      <div className="flex flex-col divide-y divide-border">
        {discoveries[0] ? <DiscoveryQuietCard {...discoveries[0]} /> : null}
        {discoveries[1] ? (
          <div className="py-3">
            <DiscoveryLoopCard {...discoveries[1]} />
          </div>
        ) : null}
      </div>
      {discoveries[2] ? <DiscoveryBreakoutCard {...discoveries[2]} /> : null}
    </div>
  );
}

// DEEP DIVE EXPERIENCE(2026-08) — "더 깊게 보기"를 열면 한 번에 모든
// 분석이 쏟아지던 예전 4블록(취향의 중심·반복되는 패턴·방향·자기성찰)을
// 없애고, 그 아래 4개의 독립 토글 메뉴로 바꾼다. 아래 세 컴포넌트가
// 그 메뉴 하나하나를 만드는 공용 부품이다.

// 메뉴 행 하나 — 기본은 닫혀 있고, 눌러야 그 항목의 분석만 펼쳐진다.
// CollapsibleFriendResult.tsx·위 Disclosure와 같은 토글 발상이지만,
// "메뉴 목록" 느낌을 내려고 더 얇고 리스트에 가깝게 만들었다(더
// 깊게 보기 자체를 여는 Disclosure보다 한 단계 더 가벼운 톤).
// VISUAL DESIGN PASS v1(2026-08) — 예전엔 항목마다 각자 테두리·radius·
// shadow를 가진 독립된 흰 박스였다(4장이 세로로 쌓여 "폼 필드 리스트"에
// 가깝게 보였다). 이제 이 컴포넌트 자체는 자기 테두리를 갖지 않고,
// 아래 TasteResultDetails가 4개를 하나의 그룹 컨테이너(테두리 1개 +
// divide-y 구분선)로 감싼다 — "카드 4장"이 아니라 "메뉴 한 판" 인상을
// 준다. 펼치기·접기 로직, 각 항목이 독립적으로 열리는 동작, 문구는
// 전혀 바뀌지 않는다.
// RESULT EXPERIENCE TARGET FIDELITY(2026-08) — "FAQ/settings accordion처럼
// 보이지 않게 editorial menu 느낌으로"라는 요구에 맞춰, 항목 번호를
// serif 숫자로 왼쪽에 붙였다. 새 데이터가 아니라 항목 순서(1~4)를
// 그대로 숫자로 보여줄 뿐이다 — 이 카드시그니처·MAP DECISION 마크가
// 이미 쓰는 "font-serif = 브랜드 디테일" 어휘를 재사용했다.
// RESULT VISUAL EXPERIENCE REBUILD(2026-08) — Target 설계안 §6: "탐색
// 메뉴처럼, preview sentence를 활용해라." 닫힌 상태에서도 그 메뉴의
// 첫 문장(이미 TasteResultDetails가 각 메뉴에 넘겨주는 데이터의
// 0번째 항목 — 새 데이터 아님)을 한 줄 미리 보여준다. 열기/닫기
// 로직·본문 내용은 전혀 안 바뀐다, 닫힌 행에 미리보기 한 줄이 추가될
// 뿐이다.
function DeepDiveDisclosureItem({
  index,
  title,
  preview,
  children,
}: {
  index: number;
  title: string;
  preview?: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex min-w-0 flex-1 gap-2.5">
          <span aria-hidden="true" className="shrink-0 font-serif text-xs font-bold text-primary">
            {String(index).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-text-primary">{title}</span>
            {!expanded && preview ? <span className="mt-0.5 block truncate text-xs font-medium text-text-muted">{preview}</span> : null}
          </span>
        </span>
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-text-muted">
          {expanded ? "▲" : "▾"}
        </span>
      </button>
      {expanded ? <div className="flex flex-col gap-3 border-t border-border px-4 py-4">{children}</div> : null}
    </div>
  );
}

// 메뉴 안의 작은 소제목(예: "답변 사이에서 반복된 것") — 새 색 없이
// 기존 SelfReflectionSection이 쓰던 것과 같은 톤(작고 옅은 대문자
// eyebrow)을 재사용한다.
function SubLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-text-muted">{children}</p>;
}

// DEEP DIVE FINAL TRIM(2026-08) — "조금 더 보기" 2차 disclosure. 문장을
// 자르거나 요약하지 않고, 기본 노출에서 뺀 나머지를 그대로 여기에 담아
// 누르면 보여준다(line-clamp·말줄임표로 숨기는 게 아니라 진짜 접는다).
// DeepDiveDisclosureItem(1차, 테두리 있는 박스+큰 화살표)보다 훨씬
// 가벼운 인라인 텍스트 링크로 만들었다 — "아코디언 안에 또 아코디언"
// 처럼 무겁게 느껴지지 않게 하기 위해서다.
function MoreDisclosure({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="self-start text-xs font-extrabold text-primary underline underline-offset-2"
      >
        조금 더 보기
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {children}
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="self-start text-xs font-extrabold text-text-muted underline underline-offset-2"
      >
        접기
      </button>
    </div>
  );
}

// DEEP DIVE FINAL TRIM(2026-08) — 예전 HeroSecondaryList(대표 문장 1개 +
// 나머지 전부를 불릿으로)를 대체한다. 나머지를 전부 보여주던 것을
// "근거 최대 maxEvidence개까지만 먼저 보여주고, 그 이상은 위
// MoreDisclosure로 접는다"로 바꿨을 뿐 — 문장 자체는 배열 순서 그대로
// 하나도 자르거나 요약하지 않는다(데이터 변형 없음, 노출 개수만 조절).
// maxEvidence=0으로 부르면(패턴·자기성찰처럼 "1개만 먼저" 보여줘야 하는
// 곳) 대표 문장 하나만 남고 나머지 전부가 조금 더 보기로 들어간다 —
// 같은 부품을 재사용해 별도 컴포넌트를 새로 만들지 않았다.
//
// DEEP DIVE LAST DENSITY FIX(2026-08) — "조금 더 보기"를 펼쳐도 여전히
// 남은 문장이 전부(최대치 없이) 쏟아져 "다시 작은 리포트"처럼 보인다는
// 실제 Persona A 모바일 피드백. maxMore를 추가해 "조금 더 보기"가 펼치는
// 개수 자체를 제한한다 — undefined(기본값)면 예전과 완전히 동일하게
// 나머지 전부를 보여준다. ④ 내가 미처 몰랐던 나는 이번 라운드에서 건드리지
// 않기로 했으므로 그 두 호출부는 maxMore를 넘기지 않아 동작이 그대로다.
// data는 여전히 items 그대로 전부 받는다 — 잘라내는 건 렌더링 개수뿐이고
// 원본 배열/문장은 하나도 지우지 않는다.
function HeroEvidence({
  items,
  maxEvidence = 2,
  maxMore,
  heroClassName = "text-base font-bold leading-7 text-text-primary",
}: {
  items: string[];
  maxEvidence?: number;
  maxMore?: number;
  heroClassName?: string;
}) {
  if (items.length === 0) return null;
  const [hero, ...rest] = items;
  const evidence = rest.slice(0, maxEvidence);
  const more = maxMore === undefined ? rest.slice(maxEvidence) : rest.slice(maxEvidence, maxEvidence + maxMore);
  return (
    <div className="flex flex-col gap-2">
      <p className={heroClassName}>{hero}</p>
      {evidence.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {evidence.map((item, index) => (
            <li key={index} className="text-sm font-semibold leading-6 text-text-secondary">
              · {item}
            </li>
          ))}
        </ul>
      ) : null}
      {more.length > 0 ? (
        <MoreDisclosure>
          <ul className="flex flex-col gap-1.5">
            {more.map((item, index) => (
              <li key={index} className="text-sm font-semibold leading-6 text-text-secondary">
                · {item}
              </li>
            ))}
          </ul>
        </MoreDisclosure>
      ) : null}
    </div>
  );
}

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

// export하는 이유: MY MAP VISUAL LAB(app/dev/result-wow-review, Preview
// 전용 비교 실험)이 production과 "같은 좌표 배치"를 그대로 재사용하기
// 위해서다 — 이 좌표 계산 로직 자체는 이번 실험에서 절대 다시 구현하지
// 않는다(중복 구현 시 두 화면의 배치가 미묘하게 어긋날 위험이 있다).
// export를 추가한 것 자체는 동작을 하나도 바꾸지 않는다(순수 함수 노출).
export type PlottedMatrixPoint = TasteMatrixPoint & { plotX: number; plotY: number };

export function spreadMatrixPoints(points: TasteMatrixPoint[]): PlottedMatrixPoint[] {
  const minDistance = 14;
  const placed: PlottedMatrixPoint[] = points.map((point) => ({ ...point, plotX: point.x, plotY: 100 - point.y }));

  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dx = placed[j].plotX - placed[i].plotX;
        const dy = placed[j].plotY - placed[i].plotY;
        const distance = Math.hypot(dx, dy) || 0.001;
        if (distance < minDistance) {
          const push = (minDistance - distance) / 2;
          const unitX = dx / distance;
          const unitY = dy / distance;
          placed[i].plotX -= unitX * push;
          placed[i].plotY -= unitY * push;
          placed[j].plotX += unitX * push;
          placed[j].plotY += unitY * push;
        }
      }
    }
  }

  return placed.map((point) => ({ ...point, plotX: clampPercent(point.plotX), plotY: clampPercent(point.plotY) }));
}

function centroidOf(points: { plotX: number; plotY: number }[]): { x: number; y: number } {
  const x = points.reduce((sum, point) => sum + point.plotX, 0) / points.length;
  const y = points.reduce((sum, point) => sum + point.plotY, 0) / points.length;
  return { x, y };
}

function scaleAroundCentroid<T extends { plotX: number; plotY: number }>(points: T[], factor: number, centroid: { x: number; y: number }) {
  return points.map((point) => ({ plotX: centroid.x + (point.plotX - centroid.x) * factor, plotY: centroid.y + (point.plotY - centroid.y) * factor }));
}

// Catmull-Rom → 3차 베지어 변환으로 점들을 지나는 매끈한 폐곡선을
// 만든다. 자기교차 없는 도형이 나오려면 호출 전에 중심 기준 각도순으로
// 정렬해서 넘겨야 한다(아래 angleSortedOrder).
function closedSmoothPath(points: { plotX: number; plotY: number }[]): string {
  const n = points.length;
  if (n < 3) return "";
  let d = `M ${points[0].plotX} ${points[0].plotY} `;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1.plotX + (p2.plotX - p0.plotX) / 6;
    const c1y = p1.plotY + (p2.plotY - p0.plotY) / 6;
    const c2x = p2.plotX - (p3.plotX - p1.plotX) / 6;
    const c2y = p2.plotY - (p3.plotY - p1.plotY) / 6;
    d += `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.plotX} ${p2.plotY} `;
  }
  return `${d}Z`;
}

// matrix.types의 배열 순서(AI가 4가지 모습을 서술한 순서일 뿐 위치와는
// 무관하다)로 그대로 이으면 도형이 자기 자신과 교차하는 모양(나비넥타이)이
// 나올 수 있다 — 중심점 기준 각도로 정렬해 항상 교차 없는 매끈한 영역
// 하나가 나오게 한다. 좌표 자체는 하나도 바꾸지 않고 연결 순서만 바꾼다.
function angleSortedOrder<T extends { plotX: number; plotY: number }>(points: T[]): T[] {
  const centroid = centroidOf(points);
  return [...points].sort(
    (a, b) => Math.atan2(a.plotY - centroid.y, a.plotX - centroid.x) - Math.atan2(b.plotY - centroid.y, b.plotX - centroid.x),
  );
}

// RESULT VIRAL EXPERIENCE — MY MAP VISUAL LAB(2026-08) 비교 실험에서
// "A. Living Map"이 채택되어 production 시각화로 승격됐다. 예전
// MatrixChart(산점도 + 격자선)를 대체한다 — 데이터·좌표 계산
// (spreadMatrixPoints)은 완전히 동일하고, "어떻게 그리는지"만 바뀐다.
// 4개 지점을 지나는 매끈한 영역(폐곡선)을 채우고, 그 영역을 안팎으로
// 살짝 축소·확대한 두 겹을 등고선처럼 옅게 겹쳐서 "차트"가 아니라
// "지형"으로 읽히게 한다. 격자선·십자선은 그리지 않는다(그게 있으면
// 바로 "분석 도구"처럼 보인다는 게 Lab 비교의 결론이었다).
// RESULT VISUAL EXPERIENCE REBUILD(2026-08) — dark 모드 추가. 좌표
// 계산은 완전히 동일하고, 어두운 배경(bg-primary) 위에서 지형이
// "빛나는" 것처럼 보이도록 색만 반전한다(primary ↔ primary-foreground).
function LivingMapChart({ matrix, dark, size = "default" }: { matrix: TasteMatrix; dark?: boolean; size?: "default" | "hero" }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(matrix.types);
  const centroid = centroidOf(placed);
  const territoryOrder = angleSortedOrder(placed);
  const territoryPath = closedSmoothPath(territoryOrder);
  const outerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 1.22, centroid));
  const innerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 0.68, centroid));

  const labelClass = dark ? "text-primary-foreground-soft" : "text-text-muted";
  const territoryColor = dark ? "stroke-primary-foreground" : "stroke-primary";
  const fillColor = dark ? "fill-primary-foreground" : "fill-primary";
  const pointStroke = dark ? "stroke-primary" : "stroke-surface";
  const pointText = dark ? "fill-primary" : "fill-primary-foreground";

  return (
    <div className={cx("mx-auto w-full", size === "hero" ? "max-w-none" : "max-w-sm")}>
      <p className={cx("mb-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em]", labelClass)}>
        <span aria-hidden="true">▲</span> {matrix.yAxisLabel.high}
      </p>
      <div className="flex items-center gap-2">
        <p className={cx("w-12 shrink-0 text-right text-[11px] font-black leading-tight", labelClass)}>{matrix.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <defs>
              <filter id={`living-map-glow-${filterId}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation={size === "hero" ? "3.5" : "4.5"} />
              </filter>
            </defs>
            <path d={outerRingPath} className={cx("fill-none", territoryColor)} strokeWidth="0.6" strokeDasharray="1.5 2" strokeOpacity={dark ? 0.35 : 0.2} />
            <path d={territoryPath} className={fillColor} fillOpacity={dark ? 0.28 : 0.16} filter={`url(#living-map-glow-${filterId})`} />
            <path d={territoryPath} className={cx("fill-none", territoryColor)} strokeWidth={size === "hero" ? "0.7" : "1"} strokeOpacity={dark ? 0.85 : 0.6} />
            <path d={innerRingPath} className={cx("fill-none", territoryColor)} strokeWidth="0.5" strokeDasharray="1 1.6" strokeOpacity={dark ? 0.5 : 0.32} />
            <circle cx={centroid.x} cy={centroid.y} r="1" className={fillColor} fillOpacity={dark ? 0.8 : 0.5} />
            {placed.map((point, index) => (
              <g key={index}>
                <title>{point.label}</title>
                <circle cx={point.plotX} cy={point.plotY} r={size === "hero" ? "3.2" : "3.8"} className={cx(fillColor, pointStroke)} strokeWidth="0.8" />
                <text
                  x={point.plotX}
                  y={point.plotY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cx(pointText, "font-black")}
                  style={{ fontSize: "4px" }}
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className={cx("w-12 shrink-0 text-left text-[11px] font-black leading-tight", labelClass)}>{matrix.xAxisLabel.high}</p>
      </div>
      <p className={cx("mt-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em]", labelClass)}>
        <span aria-hidden="true">▼</span> {matrix.yAxisLabel.low}
      </p>
    </div>
  );
}

// STEP 3 MY MAP — RESULT VISUAL EXPERIENCE REBUILD(2026-08). Target
// 설계안 §5: "그래프가 아니라 HERO SCENE... 화면 한 장을 거의 MY MAP에
// 사용할 수 있는가?" white Card 안에 차트를 넣는 방식을 버리고,
// -mx-4로 화면 카드 밖까지 번지는 full-bleed 어두운(bg-primary) 구간
// 하나를 통째로 만든다 — 앞뒤 섹션(전부 크림 배경)과 톤이 완전히
// 갈려서 "장면이 바뀐다"는 게 스크롤만으로도 느껴진다. matrix 데이터·
// 좌표 계산(spreadMatrixPoints)은 한 줄도 안 건드렸다 — LivingMapChart의
// dark/size prop으로 "어떻게 그리는지"만 바꿨다. 설명 문구도 한 줄로
// 더 줄였다(Target §5 "설명문을 줄일 수 있는가").
function MyMapSection({ matrix }: { matrix: TasteMatrix }) {
  return (
    <div className="-mx-4 flex flex-col gap-6 bg-primary px-6 py-12 text-primary-foreground">
      <div className="text-center">
        <p className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground-soft">MY MAP</p>
        <p className="mt-1 text-sm font-bold text-primary-foreground">내 안의 여러 모습이 만든 지형이에요.</p>
      </div>
      <LivingMapChart matrix={matrix} dark size="hero" />
      <ul className="mx-auto flex w-full max-w-xs flex-col gap-2">
        {matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-xs font-semibold leading-6 text-primary-foreground-soft">
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-pill border border-primary-foreground-soft text-[10px] font-black text-primary-foreground"
            >
              {index + 1}
            </span>
            <span>
              <span className="font-black text-primary-foreground">{point.label}</span> — {point.description}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs font-semibold text-primary-foreground-soft">이 지형은 나만의 것이에요 — 친구는 완전히 다르게 나와요.</p>
    </div>
  );
}

// DEEP DIVE 항목 ③ "넓혀볼 것 / 굳이 안 맞출 것"의 본문. 예전
// TasteMapSection에서 Card·SectionHeader(바깥 틀)만 뺐다 — DeepDive
// DisclosureItem이 이미 그 틀을 대신 준다. expand/avoid 두 목록이
// success/error 색으로 이미 구분돼 있어(hero/secondary 위계를 굳이
// 더 얹지 않아도 두 묶음이 한눈에 갈린다), 여기서는 항목 순서를
// 그대로 둔다 — 데이터도 그대로다.
//
// DEEP DIVE FINAL TRIM(2026-08) — 예전엔 두 목록을 전부 보여줬다. 이제
// 각 방향 최대 2개까지만 먼저 이 카드 형태로 보여준다(기본 노출은 이번
// LAST DENSITY FIX에서도 그대로 유지 — 아래 ExpandAvoidGrid 참고).
function ExpandAvoidColumn({ label, items, tone }: { label: string; items: string[]; tone: "success" | "error" }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
      <p className={cx("flex items-center gap-1.5 text-xs font-black", tone === "success" ? "text-success" : "text-error")}>
        <span className={cx("size-2 rounded-full", tone === "success" ? "bg-success" : "bg-error")} aria-hidden="true" />
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-1.5 text-xs font-bold leading-5 text-text-primary">
            <span className={cx("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "success" ? "bg-success" : "bg-error")} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// DEEP DIVE LAST DENSITY FIX(2026-08) — "조금 더 보기"를 누르면 위
// ExpandAvoidColumn(테두리+배경 있는 카드)이 통째로 한 번 더 나와
// "카드 2세트"처럼 무거워 보인다는 실제 Persona A 모바일 피드백. 새
// 카드/박스를 만들지 않고, 기존 카드 색 점(success/error) 토큰만 재사용해
// 순수 텍스트 불릿으로 남은 항목을 보여준다 — 배경·테두리 없음.
function ExpandAvoidMoreColumn({ label, items, tone }: { label: string; items: string[]; tone: "success" | "error" }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className={cx("flex items-center gap-1.5 text-xs font-black", tone === "success" ? "text-success" : "text-error")}>
        <span className={cx("size-2 rounded-full", tone === "success" ? "bg-success" : "bg-error")} aria-hidden="true" />
        {label}
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-1.5 text-xs font-bold leading-5 text-text-primary">
            <span className={cx("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "success" ? "bg-success" : "bg-error")} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const EXPAND_AVOID_SHOWN_COUNT = 2;
const EXPAND_AVOID_MORE_COUNT = 2;

function ExpandAvoidGrid({ tasteMap }: { tasteMap: TasteMap }) {
  const expandShown = tasteMap.expand.slice(0, EXPAND_AVOID_SHOWN_COUNT);
  const expandMore = tasteMap.expand.slice(EXPAND_AVOID_SHOWN_COUNT, EXPAND_AVOID_SHOWN_COUNT + EXPAND_AVOID_MORE_COUNT);
  const avoidShown = tasteMap.avoid.slice(0, EXPAND_AVOID_SHOWN_COUNT);
  const avoidMore = tasteMap.avoid.slice(EXPAND_AVOID_SHOWN_COUNT, EXPAND_AVOID_SHOWN_COUNT + EXPAND_AVOID_MORE_COUNT);
  const hasMore = expandMore.length > 0 || avoidMore.length > 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <ExpandAvoidColumn label="넓혀볼 만한 방향" items={expandShown} tone="success" />
        <ExpandAvoidColumn label="안 맞을 방향" items={avoidShown} tone="error" />
      </div>
      {hasMore ? (
        <MoreDisclosure>
          <div className="grid grid-cols-2 gap-3">
            <ExpandAvoidMoreColumn label="넓혀볼 만한 방향" items={expandMore} tone="success" />
            <ExpandAvoidMoreColumn label="안 맞을 방향" items={avoidMore} tone="error" />
          </div>
        </MoreDisclosure>
      ) : null}
    </div>
  );
}

function RoadmapSection({ roadmap }: { roadmap: TasteRoadmap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="다음 행동" description="바로 시도해볼 것부터 30일 계획까지예요." />
      <div className="rounded-medium border border-primary bg-surface p-3">
        <p className="text-xs font-black text-primary">24시간 안에</p>
        <p className="mt-1 text-sm font-bold leading-6 text-text-primary">{roadmap.firstAction}</p>
      </div>
      <ol className="flex flex-col gap-4">
        {roadmap.phases.map((phase, index) => (
          <li key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-pill border border-primary bg-surface-elevated text-xs font-black text-primary">
                {index + 1}
              </span>
              {index < roadmap.phases.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="pb-1">
              <p className="text-sm font-black text-text-primary">{phase.label}</p>
              {/* 체크박스 모양(빈 사각형, 채우기 없음)은 순수 시각 표현이다 —
                  클릭 상태를 저장할 수단이 없어 실제로 체크되지는 않는다.
                  아이콘을 li 밖에 두고 텍스트를 span으로 감싸 flex로 배치한
                  것은, 항목이 두 줄로 넘어갈 때 둘째 줄이 아이콘 아래(왼쪽
                  끝)가 아니라 첫 줄 텍스트 시작 위치에 맞춰 정렬되게 하기
                  위해서다 — text-indent가 아니라 flex 자식 정렬이라야
                  줄바꿈된 텍스트가 자연스럽게 첫 줄과 같은 지점에서
                  시작한다. */}
              <ul className="mt-1 space-y-2">
                {phase.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start gap-1.5 text-xs font-semibold leading-5 text-text-secondary">
                    <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0" aria-hidden="true">
                      <rect x="1.5" y="1.5" width="13" height="13" rx="3" className="fill-none stroke-primary" strokeWidth="1.5" />
                    </svg>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// STEP 1~3. showHero=false로 부르면(공유 화면에서 카드 이미지가 이미
// 타이틀 역할을 하는 경우) RESULT CARD 자체는 빼고 발견 3가지·MY
// MAP만 보여준다 — 라이브 화면과 공유 화면이 "여기까지는 항상 같은
// 걸 보여준다"는 원칙을 지키기 위해 두 화면이 이 컴포넌트 하나를
// 그대로 같이 쓴다.
export function TasteResultHighlights({
  result,
  showHero = true,
  heroAction,
}: {
  result: TasteResult;
  showHero?: boolean;
  heroAction?: ReactNode;
}) {
  return (
    <>
      {showHero ? <HeroHeader result={result} heroAction={heroAction} /> : null}
      <DiscoveriesSection result={result} />
      <MyMapSection matrix={result.matrix} />
    </>
  );
}

// STEP 4 "더 깊게 보기" — DEEP DIVE EXPERIENCE(2026-08). 예전엔 열자마자
// 4블록(중심·패턴·방향·자기성찰)이 전부 한 번에 펼쳐져 "긴 AI 리포트"로
// 읽혔다. 지금은 열어도 4개의 닫힌 메뉴만 보이고, 사용자가 고른 것만
// 그 안의 분석이 펼쳐진다(Progressive Disclosure). 여러 개를 동시에
// 열 수 있다 — true accordion(하나 열면 나머지 자동으로 닫힘)으로
// 만들지 않았다: 방금 펼쳐 읽던 내용이 다른 메뉴를 눌렀다고 갑자기
// 사라지면 탐색 경험에서 오히려 불편하고, 각 메뉴 안 내용을 이미
// hero/secondary 위계로 짧게 다듬어놔서 여러 개를 동시에 열어도
// 화면이 감당 못 할 만큼 길어지지 않는다(기본은 4개 다 닫힘 —
// "가볍다"는 원칙은 그대로 지켜진다). 이 파일의 다른 Disclosure들
// (CollapsibleFriendResult 포함)도 전부 같은 독립 토글 방식이라
// 인터랙션 패턴도 일관된다.
//
// 데이터 매핑 (전부 기존 필드 재배치일 뿐, 새 필드·새 AI 호출 없음):
// ① 내가 확실히 끌리는 것 = tasteCore.certain + (아래 patterns 처리 참고)
// ② 상황에 따라 달라지는 나 = tasteCore.conditional + tasteCore.indifferent(보조)
// ③ 넓혀볼 것 / 굳이 안 맞출 것 = tasteMap.expand + tasteMap.avoid
// ④ 내가 미처 몰랐던 나 = selfReflection.awareness + selfReflection.blindSpots
//
// patterns 처리: patterns[0]은 STEP 2 "반복되는 나"에서 이미 썼다.
// 나머지(dropFirst)를 위해 5번째 메뉴를 새로 만들지 않았다 — patterns는
// "여러 답변에 걸쳐 반복되는, 이미 확실해 보이는 결"을 다루므로 의미상
// ①(확실히 끌리는 것)에 가장 가깝다고 판단해 ① 안의 작은 subsection
// ("답변 사이에서 반복된 것")으로 붙였다. 정보 손실 없이 4개 메뉴
// 안에서 자연스럽게 흡수되는 경우라 5번째 메뉴는 필요하지 않았다.
//
// awareness/blindSpots도 STEP 2에서 0번째를 이미 썼으므로 dropFirst로
// 건너뛴다 — awareness는 프롬프트상 정확히 2개, blindSpots는 정확히
// 3개라 dropFirst 뒤에도 항상 1개·2개가 남는다(빈 섹션이 되지 않는다).
//
// DEEP DIVE FINAL TRIM(2026-08) — 열었을 때도 여전히 "긴 리포트"처럼
// 읽히는 문제를 줄인다. 원인은 각 메뉴가 가진 데이터를 전부(하나도
// 안 빼고) 한 번에 보여주고 있었다는 것 — 문장 자체는 좋지만 양이
// 많았다. AI를 다시 부르지도, 문장을 자르거나 요약하지도 않는다 —
// 위 HeroEvidence/MoreDisclosure로 "기본 노출 개수"만 줄였다. 각
// 필드가 원래 가진 배열은 그대로 전달하고, 컴포넌트 내부에서
// "핵심 1 + 근거 최대 2, 나머지는 조금 더 보기"로 나눠 보여줄 뿐이다.
export function TasteResultDetails({ result }: { result: TasteResult }) {
  const patternsRest = dropFirst(result.patterns);
  const awarenessRest = dropFirst(result.selfReflection.awareness);
  const blindSpotsRest = dropFirst(result.selfReflection.blindSpots);

  return (
    <Disclosure closedLabel="더 깊게 보기" openLabel="접기">
      <div className="divide-y divide-border overflow-hidden rounded-large border border-border bg-surface-elevated">
        <DeepDiveDisclosureItem index={1} title="내가 확실히 끌리는 것" preview={result.tasteCore.certain[0]}>
          <HeroEvidence items={result.tasteCore.certain} maxEvidence={2} maxMore={2} />
          {patternsRest.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <SubLabel>답변 사이에서 반복된 것</SubLabel>
              {/* 패턴은 "핵심+근거"가 아니라 "가장 먼저 연결되는 결 1개만"이
                  기본이다 — maxEvidence=0이라 나머지는 조금 더 보기로(최대 2개). */}
              <HeroEvidence items={patternsRest} maxEvidence={0} maxMore={2} />
            </div>
          ) : null}
        </DeepDiveDisclosureItem>

        <DeepDiveDisclosureItem index={2} title="상황에 따라 달라지는 나" preview={result.tasteCore.conditional[0]}>
          <HeroEvidence items={result.tasteCore.conditional} maxEvidence={2} maxMore={2} />
          {result.tasteCore.indifferent.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <SubLabel>딱히 안 끌리는 것</SubLabel>
              <HeroEvidence
                items={result.tasteCore.indifferent}
                maxEvidence={0}
                maxMore={2}
                heroClassName="text-sm font-semibold leading-6 text-text-muted"
              />
            </div>
          ) : null}
        </DeepDiveDisclosureItem>

        <DeepDiveDisclosureItem index={3} title="넓혀볼 것 / 굳이 안 맞출 것" preview={result.tasteMap.expand[0]}>
          <ExpandAvoidGrid tasteMap={result.tasteMap} />
        </DeepDiveDisclosureItem>

        <DeepDiveDisclosureItem index={4} title="내가 미처 몰랐던 나" preview={awarenessRest[0]}>
          {awarenessRest.length > 0 ? (
            <div className="flex flex-col gap-2">
              <SubLabel>내가 알고 있던 나</SubLabel>
              <HeroEvidence items={awarenessRest} maxEvidence={0} />
            </div>
          ) : null}
          {blindSpotsRest.length > 0 ? (
            <div className={cx("flex flex-col gap-2", awarenessRest.length > 0 && "border-t border-border pt-3")}>
              <SubLabel>내가 놓치고 있던 나</SubLabel>
              {/* "마지막 한 방"으로 읽히도록 이 hero 문장만 STEP2의 climax
                  카드(③ 내가 놓친 나)와 같은 급의 무게(font-black)를 준다 —
                  새 색·새 크기 체계는 아니고 기존 DiscoveriesSection의
                  climax 등급과 같은 굵기 토큰을 재사용한다. */}
              <HeroEvidence items={blindSpotsRest} maxEvidence={0} heroClassName="text-lg font-black leading-7 text-text-primary" />
            </div>
          ) : null}
        </DeepDiveDisclosureItem>
      </div>
    </Disclosure>
  );
}

// Roadmap 재배치. 내용·생성 방식은 그대로고, 기본 접힘 + 낮은 우선순위
// 위치(공유·다음 MAP 다음)로만 옮겼다 — 30일 계획이 모든 사용자에게
// "결과의 주인공"처럼 보이지 않게 하기 위해서다.
export function TasteRoadmapDisclosure({ roadmap }: { roadmap: TasteRoadmap }) {
  return (
    <Disclosure closedLabel="행동으로 이어보기" openLabel="접기">
      <RoadmapSection roadmap={roadmap} />
    </Disclosure>
  );
}

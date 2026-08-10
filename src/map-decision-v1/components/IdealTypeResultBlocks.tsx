"use client";

import { useRef, type MutableRefObject, type ReactNode } from "react";
import { IdealTypeFlags, IdealTypeMatrix, IdealTypeMatrixPoint, IdealTypeResult, IdealTypeRoadmap, IdealTypeSelfReflection } from "../types";
import { CollapsibleItems } from "./CollapsibleItems";
import { Card } from "./ui/primitives";

// 이상형 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트 모음.
// 라이브 결과 화면(IdealTypeCard.tsx)과 공유 링크 읽기 전용 화면
// (app/r/[id]/page.tsx) 둘 다에서 그대로 재사용한다.
//
// 예전엔 useState/useEffect나 공유 버튼 같은 상호작용이 전혀 없어
// "use client"가 필요 없었는데, 아래 목차(ResultNav)가 useRef와
// onClick을 쓰게 되면서 이 파일도 클라이언트 컴포넌트가 됐다(2026-08).
// app/r/[id]/page.tsx는 서버 컴포넌트라, 이 파일을 가져다 쓰는
// 부분만 클라이언트 번들에 포함된다 — 같은 페이지의
// CollapsibleFriendResult.tsx·DeleteShareSection.tsx도 이미 같은
// 방식으로 "use client"를 쓰고 있다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 예전엔 이모지 아이콘 대신 "Criteria"·"Patterns" 같은 영문 eyebrow
// 라벨로 헤더 위계를 줬는데, 바로 아래에 이미 한글 제목("이상형 기준"
// 등)이 있어서 사용자에게는 정체 모를 영문 코드명이 겹쳐 보이는
// 문제였다. 텍스트 라벨 대신 작은 색상 바로 "새 섹션이 시작된다"는
// 신호만 남긴다 — 이모지를 안 쓰기로 한 원래 결정(기기마다 다르게
// 보임)도, 위계 구분 역할도 그대로 유지된다.
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// 아래 6개 라벨은 각 섹션의 실제 제목(SectionHeader의 title)을 요약한
// 것이다 — "다음 행동"은 RoadmapSection의 현재 제목과 그대로 맞췄고,
// "적합도"는 MatrixSection 제목("끌림 × 관계 적합도")에서 가져왔다.
const NAV_ITEMS: Array<{ key: string; label: string }> = [
  { key: "criteria", label: "기준" },
  { key: "patterns", label: "패턴" },
  { key: "matrix", label: "적합도" },
  { key: "flags", label: "신호등" },
  { key: "reflection", label: "성찰" },
  { key: "roadmap", label: "다음 행동" },
];

// 스크롤해도 화면에 붙어있게 만든다 — 테스터 지적("스크롤이 길다")에
// 대한 대응으로, 예전엔 <a href="#id"> 네이티브 해시 이동으로 만들었다가
// MapDecisionProduct.tsx의 popstate 핸들러가 그 이동을 "알 수 없는
// 화면 전환"으로 오판해 결과 화면 밖으로 튕겨나가는 문제가 있었다
// (2026-08, PR #194). 이번엔 URL/history를 전혀 건드리지 않도록
// <button type="button">과 ref 기반 scrollIntoView로 다시 만든다 —
// Conversation.tsx가 새 메시지마다 맨 아래로 스크롤하는 것과 같은
// 방식이다. id 속성도 쓰지 않는다(해시가 생길 여지 자체를 없앤다).
function ResultNav({ sectionRefs }: { sectionRefs: MutableRefObject<Record<string, HTMLDivElement | null>> }) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background py-2">
      <div className="flex gap-1.5 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => sectionRefs.current[item.key]?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-pill border border-border bg-surface-elevated px-1.5 text-xs font-bold text-text-secondary shadow-subtle transition-colors hover:text-text-primary"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// MBTI의 "ENFP"처럼 친구끼리 바로 비교할 수 있는 공용 태그 — 고유한
// title/oneLiner 바로 아래, 폰 화면 스크롤 없이 첫 화면에서 보이는
// 위치에 둔다. result.tags가 없는(이 기능 이전에 만들어진) 결과·공유
// 링크는 그냥 이 줄만 생략되고 나머지는 그대로 보인다.
//
// 대기 화면(GenerationProgress.tsx)에서도 같은 칩 디자인을 그대로
// 재사용한다 — 간격만 자리마다 다를 수 있어서 여백은 className으로
// 호출부가 정하게 한다(이 컴포넌트 자체엔 여백을 박아넣지 않는다).
export function TagRow({
  tags,
  className,
  activeIndex,
}: {
  tags: string[];
  className?: string;
  // 대기 화면(GenerationProgress.tsx)의 정지 구간에서만 쓴다. 태그 하나를
  // 순서대로 옅게 강조해 "화면이 살아있다"는 느낌을 주는 용도라, 넘기지
  // 않으면(결과 화면 등 기본 사용) 색이 전혀 바뀌지 않는다.
  activeIndex?: number;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={cx("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag, index) => (
        <span
          key={tag}
          className={cx(
            "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-extrabold text-text-primary transition-colors duration-700",
            // #116: bg-primary/10 등 슬래시 투명도 클래스가 이 커스텀 색엔
            // 생성되지 않는 버그라 tag-fill/ink-wash 토큰으로 대체한다 —
            // 기본 상태는 card.png 태그와 같은 처리(테두리 없이 flat 배경).
            index === activeIndex ? "border border-ink-wash-border bg-ink-wash" : "bg-tag-fill",
          )}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

// 초대장 컨셉(card.png·/r/{id})과 톤을 맞춘다 — 예전엔 연보라
// 그라데이션(from-value via-feeling to-action)이었는데, 카드 이미지와
// 공유 화면이 전부 크림 종이 톤으로 바뀐 뒤 이 화면만 남아 한 흐름
// 안에서 브랜드가 두 개로 보였다. Card 기본값(bg-surface-elevated,
// 흰색)을 그대로 쓰도록 배경 override만 지운다 — 다른 섹션(기준·패턴 등)
// 과 동일한 흰 카드가 되어 새 색을 만들지 않는다.
function HeroHeader({ result }: { result: IdealTypeResult }) {
  return (
    <Card className="p-5">
      {/* #116: bg-surface-elevated/80가 흰 카드 위에서 사실상 안 보였다 — 태그
          알약과 같은 tag-fill 톤으로 바꿔 카드 배경과 구분되게 한다. */}
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        이상형 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      {result.statusLabel ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{result.statusLabel}</p>
      ) : null}
      <TagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

type CriteriaTone = "strong" | "medium" | "light";
// 크림 종이 배경 위에서는 연보라 파스텔(value/feeling)이 이질적으로
// 뜬다는 피드백으로, 세 단계 위계를 잉크(primary) 농도 차이로 표현한다.
// #116: bg-primary/10, bg-primary/5는 이 커스텀 색엔 슬래시 투명도
// 클래스가 생성되지 않아 실제로는 항상 투명이었다(흰 박스만 나열되던
// 원인). 두 단계 모두 같은 ink-wash 톤을 쓰고, 위계는 원래도 정상
// 작동하던 테두리 색 차이(border-primary vs border-border-strong)로
// 표현한다.
const CRITERIA_TIER_CLASS: Record<CriteriaTone, string> = {
  strong: "border-primary bg-ink-wash",
  medium: "border-border-strong bg-ink-wash",
  light: "border-dashed border-border bg-surface",
};

function CriteriaTier({ label, items, tone }: { label: string; items: string[]; tone: CriteriaTone }) {
  return (
    <div className={cx("rounded-medium border p-3", CRITERIA_TIER_CLASS[tone])}>
      <p className="text-xs font-black text-text-primary">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-xs font-bold leading-5 text-text-primary">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// sm:grid-cols-3를 뺐다(2026-08) — 이 결과 화면 전체가 max-w-sm(384px)
// 고정폭 컨테이너 안에서만 그려지는데, Tailwind의 sm: 접두사는 컨테이너
// 폭이 아니라 뷰포트 폭(640px) 기준이라 데스크톱 브라우저에서는 이
// 좁은 카드 안에 3열이 강제로 눌려 칸마다 줄바꿈 수가 달라지고 박스
// 높이가 들쭉날쭉해 보였다(테스터 피드백, 실측 확인). 항상 1열로
// 세로 나열한다 — MAP_DESIGN_SYSTEM.md의 반응형 접두사 금지 규칙 참고.
function CriteriaSection({ criteria }: { criteria: IdealTypeResult["criteria"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="이상형 기준" description="답변에서 우선순위를 세 단계로 나눠봤어요." />
      <div className="grid gap-3">
        <CriteriaTier label="필수" items={criteria.mustHave} tone="strong" />
        <CriteriaTier label="선호" items={criteria.niceToHave} tone="medium" />
        <CriteriaTier label="타협 가능" items={criteria.canCompromise} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="끌림 패턴" description="답변을 가로질러 반복되는 경향이에요." />
      <CollapsibleItems
        items={items.map((item, index) => (
          <blockquote key={index} className="rounded-medium border border-border border-l-4 border-l-primary bg-surface-elevated p-3 text-sm font-bold leading-6 text-text-primary">
            {item}
          </blockquote>
        ))}
      />
    </Card>
  );
}

// 진로 결과 화면(FinalResultBlocks.tsx)의 2x2 매트릭스와 같은 방식 —
// 점끼리 너무 가까우면 숫자가 겹치니 살짝 밀어내는 단순 반발 알고리즘.
// (최대 4개뿐이라 O(n^2)이어도 비용 무시 가능한 수준.)
const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = IdealTypeMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: IdealTypeMatrixPoint[]): PlottedMatrixPoint[] {
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

// ★버그 원인: Tailwind가 이 커스텀 색(CSS 변수 기반)에는 fill-primary/70
// 같은 "슬래시 투명도" 유틸리티를 만들어주지 않는다(실제로 컴파일된
// CSS를 확인해보면 .fill-primary\/70 규칙 자체가 없다) — 그래서 그
// 클래스가 붙은 점들은 전부 SVG 기본값인 불투명 검정(#000)으로
// 그려지고 있었다. 1번 점(fill-primary, 슬래시 없음)만 유효한
// 클래스라 원래 의도한 잉크 네이비(#15213b)로 그려졌는데, 마침 숫자
// 색도 같은 색이라 숫자가 사라져 보인 것 — 2~4번은 "검정 배경에
// 짙은 네이비 숫자"라 우연히 읽혔을 뿐, 의도한 옅은 톤은 애초에
// 적용된 적이 없었다.
//
// 그래서 투명도는 Tailwind 클래스가 아니라 SVG 표준 속성인
// fillOpacity를 직접 준다(브라우저가 항상 지원하는 방식이라 이런
// 클래스 생성 문제 자체가 생기지 않는다) — 색 자체는 fill-primary
// 하나로 고정하고 투명도만 4단계로 바꿔 잉크 농도 위계를 표현한다.
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
// 점 안 순번 숫자 색 — 1번(불투명 100%)은 배경이 진한 잉크 그대로라
// 밝은 색(primary-foreground, 흰색)을 쓰고, 2~4번은 옅어진 배경이라
// 어두운 색(text-primary)이 그대로 대비된다.
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: IdealTypeMatrix }) {
  const placed = spreadMatrixPoints(matrix.types);
  const numberClasses = MATRIX_POINT_NUMBER_CLASS;
  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="mb-1 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.high}</p>
      <div className="flex items-center gap-2">
        <p className="w-12 shrink-0 text-right text-[11px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <rect x="1" y="1" width="98" height="98" rx="4" className="fill-none stroke-border" strokeWidth="1" />
            <line x1="50" y1="1" x2="50" y2="99" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1="1" y1="50" x2="99" y2="50" className="stroke-border" strokeWidth="0.6" strokeDasharray="2 2" />
            {placed.map((point, index) => (
              <g key={index}>
                <title>{point.label}</title>
                <circle
                  cx={point.plotX}
                  cy={point.plotY}
                  r="4.2"
                  className="fill-primary stroke-surface"
                  fillOpacity={MATRIX_POINT_OPACITY[index % MATRIX_POINT_OPACITY.length]}
                  strokeWidth="0.8"
                />
                <text
                  x={point.plotX}
                  y={point.plotY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cx(numberClasses[index % numberClasses.length], "font-black")}
                  style={{ fontSize: "4px" }}
                >
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="w-12 shrink-0 text-left text-[11px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.high}</p>
      </div>
      <p className="mt-1 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.low}</p>
    </div>
  );
}

function MatrixSection({ matrix }: { matrix: IdealTypeMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="끌림 × 관계 적합도" description="답변에서 나온 4가지 상대 유형을 놓고 봤어요." />
      <MatrixChart matrix={matrix} />
      <ul className="flex flex-col gap-2">
        {matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-sm font-semibold text-text-secondary">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border border-border bg-surface-elevated text-[11px] font-black text-text-primary">
              {index + 1}
            </span>
            <span>
              <span className="font-black text-text-primary">{point.label}</span> — {point.description}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FlagsSection({ flags }: { flags: IdealTypeFlags }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="신호등" description="실제로 만날 때 참고할 신호들이에요." />
      {/* 박스 배경은 option/risk 파스텔 대신 다른 블록과 같은 잉크
          중간 톤(border-border-strong bg-ink-wash, #116)으로 통일한다 —
          좋다/주의 구분은 라벨의 success/error 색과 점만으로 충분하다. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            좋은 신호
          </p>
          <ul className="mt-1.5 space-y-1">
            {flags.green.map((item, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs font-bold leading-5 text-text-primary">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-error">
            <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            주의 신호
          </p>
          <ul className="mt-1.5 space-y-1">
            {flags.red.map((item, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs font-bold leading-5 text-text-primary">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-error" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

// ★가장 강조하는 섹션★ — 이 제품의 유일한 차별점(교차 발견)이 여기 있다.
// 다른 6개 블록은 전부 흰 카드 + 이모지라 묻히므로, 이 블록만 배경을
// 반전(어두운 배경 + 밝은 글자)해서 캡처하고 싶어지는 지점으로 만든다.
// 이모지 대신 색상 바 + 크기·굵기 차이로 위계를 준다(MAP OS
// Bible: professional/premium/calm, 유치한 시각 언어 회피). "내가 줄 수
// 있는 것"은 채워진 패널, "내가 보완할 부분"은 테두리만 있는 패널로 —
// 색을 늘리지 않고 채움 유무만으로 두 그룹을 구분한다. 문장이 강하게
// 읽히도록 항목 사이 간격과 줄간격을 다른 블록보다 넉넉하게 둔다.
//
// 다른 섹션처럼 <Card>를 그대로 쓰지 않는다 — Card/Surface가 이미
// "bg-surface-elevated"(흰 배경)를 내부에서 고정으로 넣고 있어서,
// className으로 bg-primary를 얹어도 실제 생성되는 CSS 순서상
// bg-surface-elevated가 이겨서 카드가 계속 흰 배경으로 남는 문제가
// 있었다(Tailwind는 JSX의 클래스 순서가 아니라 컴파일된 스타일시트
// 순서로 우선순위가 정해진다). 그래서 이 섹션만 Card를 거치지 않고
// Surface/Card와 같은 시각 속성(테두리·둥근 모서리·그림자·패딩)을
// bg-primary가 유일한 배경색이 되도록 직접 조합한다.
//
// 항목(li)의 sm:text-lg sm:leading-8을 뺐다(2026-08) — 이유는 바로 위
// CriteriaSection 주석과 같다(뷰포트 640px 기준 접두사가 384px 고정폭
// 카드 안에서 켜지는 문제). 이 블록은 페이지 안에서 가장 큰 본문
// 글자였는데, 데스크톱에서 그 위에 sm:text-lg까지 얹히니 "결과 아래쪽
// 줄글 폰트가 너무 크다"는 테스터 피드백으로 이어졌다. 패딩(sm:p-5/
// sm:p-6)·제목 크기(sm:text-xl)는 384px 안에서도 줄바꿈이나 정렬
// 파손을 일으키지 않아(단순 여백·크기 차이일 뿐) 그대로 둔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: IdealTypeSelfReflection }) {
  return (
    <div
      className="flex flex-col gap-7 rounded-large border-2 border-primary bg-surface-elevated p-5 text-text-primary shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-text-primary sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">이상형 답변을 뒤집어서 본 나의 모습이에요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">내가 줄 수 있는 것</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-border-strong bg-ink-wash p-4 sm:p-5">
          {selfReflection.whatYouOffer.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">내가 보완할 부분</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-border-strong p-4 sm:p-5">
          {selfReflection.whatToImprove.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoadmapSection({ roadmap }: { roadmap: IdealTypeRoadmap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="다음 행동" description="바로 시작할 수 있는 것부터 30일 계획까지예요." />
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

// 라이브 결과 화면과 공유 읽기 전용 화면이 공통으로 쓰는 전체 블록
// 묶음. 공유하기/다시 만들기 같은 버튼은 호출부가 각자 다르게 붙인다.
//
// afterHero: 이상형 카드(HeroHeader) 바로 아래에 끼워 넣을 요소 —
// 지금은 라이브 결과 화면(IdealTypeCard.tsx)의 궁합 배너만 이 자리를
// 쓴다. 친구 링크로 들어온 사람에게는 궁합 확인이 방문 목적이라,
// 6블록을 다 지나야 나오던 예전 위치보다 여기가 맞다.
//
// 목차 칩(ResultNav)을 <a href="#id"> 방식으로 만들었다가(2026-08
// 이전) 앵커 클릭이 결과 화면을 이탈시켜 다른 화면(퀴즈)으로
// 돌려보내는 문제로 한 번 없앴었다(원인은 MapDecisionProduct.tsx의
// popstate 핸들러 참고). 이후 테스터가 "스크롤이 길다"고 다시 지적해,
// URL/history를 전혀 건드리지 않는 버튼+ref 방식(위 ResultNav 참고)으로
// 되살렸다(2026-08).
//
// afterReflection: 자기성찰 블록(가장 감정적으로 몰입되는 지점) 바로
// 다음에 끼워 넣을 요소 — 지금은 공유 읽기 전용 화면(app/r/[id]/
// page.tsx)의 중간 CTA만 이 자리를 쓴다.
//
// showHero: /r/{id}의 "친구 결과 전체 보기" 접힌 영역에서는 타이틀·
// 태그·한줄설명이 바로 위 card.png와 완전히 겹쳐서 false로 끈다.
// 기본값 true라 다른 호출부는 그대로다.
export function IdealTypeResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: IdealTypeResult;
  afterHero?: ReactNode;
  afterReflection?: ReactNode;
  showHero?: boolean;
}) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  return (
    <>
      {showHero ? <HeroHeader result={result} /> : null}
      {afterHero}
      <ResultNav sectionRefs={sectionRefs} />
      <div ref={(el) => { sectionRefs.current.criteria = el; }} className="scroll-mt-16">
        <CriteriaSection criteria={result.criteria} />
      </div>
      <div ref={(el) => { sectionRefs.current.patterns = el; }} className="scroll-mt-16">
        <PatternsSection items={result.attractionPatterns} />
      </div>
      <div ref={(el) => { sectionRefs.current.matrix = el; }} className="scroll-mt-16">
        <MatrixSection matrix={result.matrix} />
      </div>
      <div ref={(el) => { sectionRefs.current.flags = el; }} className="scroll-mt-16">
        <FlagsSection flags={result.flags} />
      </div>
      <div ref={(el) => { sectionRefs.current.reflection = el; }} className="scroll-mt-16">
        <SelfReflectionSection selfReflection={result.selfReflection} />
      </div>
      {afterReflection}
      <div ref={(el) => { sectionRefs.current.roadmap = el; }} className="scroll-mt-16">
        <RoadmapSection roadmap={result.roadmap} />
      </div>
    </>
  );
}

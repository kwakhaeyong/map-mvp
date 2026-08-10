"use client";

import { useRef, type MutableRefObject, type ReactNode } from "react";
import { FriendshipMatrix, FriendshipMatrixPoint, FriendshipResult, FriendshipRoadmap, FriendshipTypes, IdealTypeSelfReflection } from "../types";
import { CollapsibleItems } from "./CollapsibleItems";
import { Card } from "./ui/primitives";

// 친구·인간관계 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트
// 모음. SelfIntroResultBlocks.tsx와 같은 원리이지만, 이상형·나 소개
// 코드를 건드리지 않기 위해 별도 파일로 새로 작성했다 — 라이브 결과
// 화면(FriendshipCard.tsx)과 공유 읽기 전용 화면(app/r/[id]/page.tsx)
// 둘 다에서 재사용한다.
//
// 예전엔 "use client"가 필요 없었는데, 아래 목차(ResultNav)가 useRef와
// onClick을 쓰게 되면서 이 파일도 클라이언트 컴포넌트가 됐다(2026-08,
// 이유는 IdealTypeResultBlocks.tsx의 같은 주석 참고).

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// SelfIntroResultBlocks.tsx의 SectionHeader와 같은 이유(PR #150)로
// 영문 eyebrow 텍스트 대신 작은 색상 바를 쓴다 — 바로 아래의 한글
// 제목과 겹쳐 정체 모를 영문 코드명으로 보이던 문제를 없애면서, 위계
// 구분 역할은 그대로 유지한다.
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// 이유·구현 방식은 IdealTypeResultBlocks.tsx의 같은 이름 컴포넌트와
// 동일하다 — 주석은 그쪽에 적었다. 라벨은 이 주제의 실제 섹션 제목에
// 맞췄다: "모습"은 MatrixSection 제목("나의 여러 모습")에서, "매칭"은
// FriendTypesSection 제목("어울리는 사람")에서, "다음 행동"은
// RoadmapSection의 현재 제목과 그대로 맞췄다.
const NAV_ITEMS: Array<{ key: string; label: string }> = [
  { key: "criteria", label: "기준" },
  { key: "patterns", label: "패턴" },
  { key: "matrix", label: "모습" },
  { key: "types", label: "매칭" },
  { key: "reflection", label: "성찰" },
  { key: "roadmap", label: "다음 행동" },
];

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


// 이상형·나 소개와 태그 축 일부를 공유하는 사전을 재사용하므로 시각적
// 표현도 TagRow(IdealTypeResultBlocks.tsx)와 동일하게 맞춘다 — 다만 그
// 컴포넌트는 export 돼 있지 않아(파일 내부용) 여기서 새로 작성했다.
// 클래스는 그대로 복사했다(디자인 토큰만 참조하므로 다른 파일을
// 건드리지 않는다).
export function FriendshipTagRow({ tags, className }: { tags: string[]; className?: string }) {
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

function HeroHeader({ result }: { result: FriendshipResult }) {
  return (
    <Card className="p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        친구·인간관계 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      {result.statusLabel ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{result.statusLabel}</p>
      ) : null}
      <FriendshipTagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

type CriteriaTone = "strong" | "medium" | "light";
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
function FriendCriteriaSection({ friendCriteria }: { friendCriteria: FriendshipResult["friendCriteria"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="친구를 고르는 기준" description="답변에서 추론한 우선순위를 세 단계로 나눠봤어요." />
      <div className="grid gap-3">
        <CriteriaTier label="꼭 있어야 하는 것" items={friendCriteria.essential} tone="strong" />
        <CriteriaTier label="있으면 좋은 것" items={friendCriteria.bonus} tone="medium" />
        <CriteriaTier label="없어도 괜찮은 것" items={friendCriteria.flexible} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="반복되는 패턴" description="답변을 가로질러 반복되는 행동이에요." />
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

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = FriendshipMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: FriendshipMatrixPoint[]): PlottedMatrixPoint[] {
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

// 이상형·나 소개의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다
// (design-check #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지
// 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: FriendshipMatrix }) {
  const placed = spreadMatrixPoints(matrix.types);
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
                  className={cx(MATRIX_POINT_NUMBER_CLASS[index % MATRIX_POINT_NUMBER_CLASS.length], "font-black")}
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

function MatrixSection({ matrix }: { matrix: FriendshipMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="나의 여러 모습" description="답변에서 나온 4가지 내 모습을 놓고 봤어요." />
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

function FriendTypesSection({ friendTypes }: { friendTypes: FriendshipTypes }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="어울리는 사람" description="답변 패턴을 근거로 짚어본 궁합이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            나와 잘 맞는 사람
          </p>
          <ul className="mt-1.5 space-y-1">
            {friendTypes.wellMatched.map((item, index) => (
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
            부딪히기 쉬운 사람
          </p>
          <ul className="mt-1.5 space-y-1">
            {friendTypes.friction.map((item, index) => (
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

// 이상형·나 소개의 SelfReflectionSection과 완전히 같은 발상(반전 배경으로
// 강조)이라 시각 스타일도 그대로 가져왔다.
// 항목(li)의 sm:text-lg sm:leading-8을 뺐다(2026-08) — 이유는 바로 위
// FriendCriteriaSection 주석과 같다(뷰포트 640px 기준 접두사가 384px
// 고정폭 카드 안에서 켜지는 문제). 이 블록은 페이지 안에서 가장 큰
// 본문 글자였는데, 데스크톱에서 그 위에 sm:text-lg까지 얹히니 "결과
// 아래쪽 줄글 폰트가 너무 크다"는 테스터 피드백으로 이어졌다.
// 패딩(sm:p-5/sm:p-6)·제목 크기(sm:text-xl)는 384px 안에서도 줄바꿈이나
// 정렬 파손을 일으키지 않아(단순 여백·크기 차이일 뿐) 그대로 둔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: IdealTypeSelfReflection }) {
  return (
    <div
      className="flex flex-col gap-7 rounded-large border-2 border-primary bg-surface-elevated p-5 text-text-primary shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-text-primary sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">행동 답변을 모아서 본 나의 모습이에요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">내가 주고 있는 것</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-border-strong bg-ink-wash p-4 sm:p-5">
          {selfReflection.whatYouOffer.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">보완할 부분</p>
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

function RoadmapSection({ roadmap }: { roadmap: FriendshipRoadmap }) {
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

export function FriendshipResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: FriendshipResult;
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
        <FriendCriteriaSection friendCriteria={result.friendCriteria} />
      </div>
      <div ref={(el) => { sectionRefs.current.patterns = el; }} className="scroll-mt-16">
        <PatternsSection items={result.patterns} />
      </div>
      <div ref={(el) => { sectionRefs.current.matrix = el; }} className="scroll-mt-16">
        <MatrixSection matrix={result.matrix} />
      </div>
      <div ref={(el) => { sectionRefs.current.types = el; }} className="scroll-mt-16">
        <FriendTypesSection friendTypes={result.friendTypes} />
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

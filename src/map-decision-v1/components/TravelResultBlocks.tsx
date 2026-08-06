import type { ReactNode } from "react";
import { TravelFit, TravelMatrix, TravelMatrixPoint, TravelResult, TravelRoadmap } from "../types";
import { Card } from "./ui/primitives";

// 6블록(travelCriteria/patterns/matrix/travelFit/selfReflection/roadmap)에서
// 4블록(discovery/matrix/fit/roadmap)으로 재설계된 타입에 맞춰 컴파일만
// 되도록 최소한으로 맞췄다 — 이 파일의 레이아웃 재설계는 다음 작업이다
// (engine/travel-generator.ts 상단 주석 참고). TravelCriteriaSection과
// SelfReflectionSection은 대응하는 필드가 사라져 제거했고, PatternsSection은
// 그대로 재사용하되 이제 result.discovery를 받는다.

// 여행 스타일 결과를 "보여주기만" 하는 순수 프레젠테이션 컴포넌트
// 모음. TasteResultBlocks.tsx와 같은 원리(생성 상태·공유 버튼 없는
// "use client" 불필요 파일)이지만, 다른 여섯 주제 코드를 건드리지
// 않기 위해 별도 파일로 새로 작성했다 — 라이브 결과 화면
// (TravelCard.tsx)과 공유 읽기 전용 화면(app/r/[id]/page.tsx, 다음
// 작업) 둘 다에서 재사용할 예정이다.

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// TasteResultBlocks.tsx의 SectionHeader와 같은 이유(PR #150)로 영문
// eyebrow 텍스트 대신 작은 색상 바를 쓴다.
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// 목차 칩(SectionNav)을 없앴다 — 6블록일 때는 "탐색해야 할 문서"라는
// 신호로 필요했지만, 4블록으로 줄면서 한 화면에서 스크롤 몇 번이면
// 끝까지 보이는 분량이 됐다. 목차가 오히려 "더 많은 내용이 있다"는
// 잘못된 기대를 준다. 진로(career) 결과 화면은 저장 후 재열람 용도라
// 목차가 계속 맞는 선택이라 FinalResultBlocks.tsx는 그대로 뒀다.

// 다른 다섯 주제와 태그 축 일부를 공유하는 사전을 재사용하므로 시각적
// 표현도 TasteTagRow(TasteResultBlocks.tsx)와 동일하게 맞춘다 — 클래스는
// 그대로 복사했다(디자인 토큰만 참조하므로 다른 파일을 건드리지 않는다).
export function TravelTagRow({ tags, className }: { tags: string[]; className?: string }) {
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

function HeroHeader({ result }: { result: TravelResult }) {
  return (
    <Card className="p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        여행 스타일 카드
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      <TravelTagRow tags={result.tags ?? []} className="mt-3" />
    </Card>
  );
}

// discovery의 첫 항목은 생성기가 "가장 강한 발견"을 의도적으로 앞에
// 두고, 그 문장이 그대로 공유되는 한 줄이 된다(travel-generator.ts의
// SYSTEM_PROMPT 참고). 처음엔 이 항목을 primary 배경으로 꽉 채워
// 분리했는데, 그 조합(border-primary bg-primary text-primary-foreground)이
// 하단 "너도 만들어봐" 버튼과 완전히 같아 "읽을 문장"이 아니라
// "누를 것"처럼 보이는 문제가 있었다(공유 뷰에서는 바로 아래
// MidResultCta와 같은 층으로 읽혀 더 심했다). 색 채우기는 버튼의
// 몫으로 남기고, 대신 다른 다섯 주제의 발견 인용구가 이미 쓰는
// border-l-4 border-l-primary 좌측 색선만 가져와 배경 없이 글씨
// 크기만 키운다. 나머지 3개는 재설계 이전에 쓰던 카드 형태(테두리+
// bg-surface-elevated)를 복원해 "서로 다른 발견 여러 개"라는 구조를
// 되살리고, 글자 크기를 첫 항목보다 작게 둬 위계만 유지한다.
function PatternsSection({ items }: { items: string[] }) {
  const [headline, ...rest] = items;
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="여행에서 발견한 것" description="자기인식과 실제 행동 사이 간극이에요." />
      {headline ? (
        <blockquote className="border-l-4 border-primary pl-4 text-base font-black leading-7 text-text-primary sm:text-lg sm:leading-8">
          {headline}
        </blockquote>
      ) : null}
      {rest.length > 0 ? (
        <div className="flex flex-col gap-2">
          {rest.map((item, index) => (
            <blockquote key={index} className="rounded-medium border border-border border-l-4 border-l-primary bg-surface-elevated p-3 text-sm font-bold leading-6 text-text-primary">
              {item}
            </blockquote>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

const clampPercent = (value: number) => Math.min(96, Math.max(4, value));

type PlottedMatrixPoint = TravelMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: TravelMatrixPoint[]): PlottedMatrixPoint[] {
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

// 다른 다섯 주제의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다
// (design-check #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지
// 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

// x축 저/고 라벨을 그림 좌우가 아니라 아래에 한 줄로 배치한다 —
// 좌우에 고정 폭 라벨 칸을 두면 그만큼 정사각형 그림 자체가 좁아져
// (모바일 폭 기준 실측 176px대) 점 위치가 잘 안 읽힌다는 문제가
// 있었다. 라벨을 그림 아래로 내리면 그림이 카드 안쪽 너비를 거의
// 그대로 쓸 수 있어(실측 280px대) 점과 번호가 뚜렷해진다.
function MatrixChart({ matrix }: { matrix: TravelMatrix }) {
  const placed = spreadMatrixPoints(matrix.types);
  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-1 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.high}</p>
      <div className="relative aspect-square w-full">
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
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-black text-text-muted">
        <span>{matrix.xAxisLabel.low}</span>
        <span>{matrix.xAxisLabel.high}</span>
      </div>
      <p className="mt-1.5 text-center text-[11px] font-black text-text-muted">{matrix.yAxisLabel.low}</p>
    </div>
  );
}

// 설명이 15~25자로 짧아져서(기존엔 2~3문장) 그림 아래에 세로로 길게
// 나열할 이유가 없어졌다 — 2열 그리드로 바꿔 그림과 한눈에 짝지어
// 보이게 한다. 라벨과 설명도 한 줄로 붙이지 않고 줄을 나눠서, 짧은
// 설명이 라벨 옆에 어색하게 매달리지 않게 한다.
function MatrixSection({ matrix }: { matrix: TravelMatrix }) {
  return (
    <Card className="flex flex-col gap-5">
      <SectionHeader title="나의 여러 모습" description="답변에서 나온 4가지 여행 모습을 놓고 봤어요." />
      <MatrixChart matrix={matrix} />
      <ul className="grid grid-cols-2 gap-3">
        {matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border border-border bg-surface-elevated text-[11px] font-black text-text-primary">
              {index + 1}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-black leading-5 text-text-primary">{point.label}</span>
              <span className="text-xs font-semibold leading-5 text-text-secondary">{point.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TravelFitSection({ fit }: { fit: TravelFit }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="잘 맞는 방식, 안 맞는 방식" description="답변 패턴을 근거로 짚어본 여행 방식이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            잘 맞는 방식
          </p>
          <ul className="mt-1.5 space-y-1">
            {fit.goodFit.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-error">
            <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            안 맞는 방식
          </p>
          <ul className="mt-1.5 space-y-1">
            {fit.poorFit.map((item, index) => (
              <li key={index} className="text-xs font-bold leading-5 text-text-primary">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function RoadmapSection({ roadmap }: { roadmap: TravelRoadmap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="로드맵" description="바로 시도해볼 것부터 30일 계획까지예요." />
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
              <ul className="mt-1 space-y-1">
                {phase.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="text-xs font-semibold leading-5 text-text-secondary">
                    · {action}
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

export function TravelResultBlocks({
  result,
  afterHero,
  afterReflection,
  showHero = true,
}: {
  result: TravelResult;
  afterHero?: ReactNode;
  afterReflection?: ReactNode;
  showHero?: boolean;
}) {
  // 6블록 시절엔 TravelCard.tsx의 gap-3만으로도 블록이 촘촘히 붙어 보였다
  // — 항목 수가 많아 한 화면에 밀도가 필요했기 때문이다. 4블록으로
  // 줄면서 각 블록이 다루는 내용이 더 뚜렷해져, 블록 사이를 gap-3보다
  // 넉넉한 gap-5로 띄워 "따로 읽는 네 덩어리"라는 인상을 준다. 이
  // 간격은 이 컴포넌트 내부(블록 간)에만 적용되고, TravelCard.tsx가
  // 감싼 바깥쪽 gap-3(이 컴포넌트 전체와 공유 버튼 영역 사이 간격)는
  // 그대로라 하단 공유 버튼 위치는 바뀌지 않는다.
  return (
    <div className="flex flex-col gap-5">
      {showHero ? <HeroHeader result={result} /> : null}
      {afterHero}
      <PatternsSection items={result.discovery} />
      <MatrixSection matrix={result.matrix} />
      {afterReflection}
      <TravelFitSection fit={result.fit} />
      <RoadmapSection roadmap={result.roadmap} />
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { TasteMap, TasteMatrix, TasteMatrixPoint, TasteResult, TasteRoadmap, TasteSelfReflection } from "../types";
import { CollapsibleItems } from "./CollapsibleItems";
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
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
      <h2 className="text-base font-black tracking-[-0.02em] text-text-primary">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-text-secondary">{description}</p>
    </div>
  );
}

// CollapsibleFriendResult.tsx와 똑같은 토글 버튼 스타일을 재사용한다 —
// "더 깊게 보기"/"행동으로 이어보기" 둘 다 이 컴포넌트로 만든다.
function Disclosure({ closedLabel, openLabel, children }: { closedLabel: string; openLabel: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-pill border border-border bg-surface-elevated px-4 py-3 text-sm font-extrabold text-text-primary shadow-subtle transition-colors hover:border-border-strong"
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

// STEP 1 RESULT CARD. title/oneLiner/statusLabel/tags는 전부 예전
// HeroHeader와 동일하게 그대로 재사용한다 — 새로 추가한 건 heroAction
// 슬롯 하나뿐이다(공유 버튼을 카드 "안"에 넣어, 카드 자체가 공유
// 가능한 완결된 단위처럼 보이게 한다). 공유 로직 자체는 여기서
// 새로 만들지 않고 호출부(TasteCard.tsx)의 useShareResult 결과를
// 그대로 받아 버튼만 그린다.
function HeroHeader({ result, heroAction }: { result: TasteResult; heroAction?: ReactNode }) {
  return (
    <Card className="p-5">
      <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
        나의 취향 MAP
      </span>
      <h1 className="mt-3 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
      <p className="mt-2 text-sm font-bold leading-6 text-text-primary">{result.oneLiner}</p>
      {result.statusLabel ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-text-secondary">{result.statusLabel}</p>
      ) : null}
      <TasteTagRow tags={result.tags ?? []} className="mt-3" />
      {heroAction ? <div className="mt-4">{heroAction}</div> : null}
    </Card>
  );
}

// STEP 2 "MAP이 발견한 3가지". 새 AI 필드나 새 계산 없이, 이미 생성된
// 텍스트 중 딱 3곳에서 첫 항목만 그대로 가져온다(deterministic,
// 문장을 고치거나 요약하지 않음):
// ① selfReflection.awareness[0] — "나도 이미 알고 있던 것"
// ② patterns[0] — 답변을 가로질러 반복된 것
// ③ selfReflection.blindSpots[0] — "잘 안 보이던 것"
// 세 배열이 서로 다른 필드라 항목이 겹칠 일이 없다. 혹시 어떤 배열이
// 비어 있으면(스키마상 가능성만 있음) 그 항목만 건너뛰고 남은 것만
// 보여준다 — 억지로 채우지 않는다.
type Discovery = { role: string; text: string };

const DISCOVERY_SOURCES: { role: string; pick: (result: TasteResult) => string | undefined }[] = [
  { role: "내가 이미 알아채고 있던 것", pick: (result) => result.selfReflection.awareness[0] },
  { role: "반복되는 패턴", pick: (result) => result.patterns[0] },
  { role: "잘 안 보이던 부분", pick: (result) => result.selfReflection.blindSpots[0] },
];

function pickDiscoveries(result: TasteResult): Discovery[] {
  return DISCOVERY_SOURCES.map(({ role, pick }) => ({ role, text: pick(result) })).filter(
    (discovery): discovery is Discovery => Boolean(discovery.text),
  );
}

function DiscoveriesSection({ result }: { result: TasteResult }) {
  const discoveries = pickDiscoveries(result);
  if (discoveries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="MAP이 발견한 3가지" description="따로 답한 문항들을 모아보니, 이런 게 보였어요." />
      <div className="flex flex-col gap-2">
        {discoveries.map((discovery, index) => (
          <Card key={discovery.role} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-primary text-xs font-black text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-text-muted">{discovery.role}</p>
            </div>
            <p className="text-base font-bold leading-7 text-text-primary">{discovery.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

type CoreTone = "strong" | "medium" | "light";
const CORE_TIER_CLASS: Record<CoreTone, string> = {
  strong: "border-primary bg-ink-wash",
  medium: "border-border-strong bg-ink-wash",
  light: "border-dashed border-border bg-surface",
};

function CoreTier({ label, items, tone }: { label: string; items: string[]; tone: CoreTone }) {
  return (
    <div className={cx("rounded-medium border p-3", CORE_TIER_CLASS[tone])}>
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
function TasteCoreSection({ tasteCore }: { tasteCore: TasteResult["tasteCore"] }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="내 취향의 중심" description="답변에서 드러난 확실함의 정도를 세 단계로 나눠봤어요." />
      <div className="grid gap-3">
        <CoreTier label="확실한 것" items={tasteCore.certain} tone="strong" />
        <CoreTier label="상황 따라 다른 것" items={tasteCore.conditional} tone="medium" />
        <CoreTier label="안 끌리는 것" items={tasteCore.indifferent} tone="light" />
      </div>
    </Card>
  );
}

function PatternsSection({ items }: { items: string[] }) {
  return (
    <Card className="flex flex-col gap-3">
      <SectionHeader title="반복되는 취향 패턴" description="답변을 가로질러 반복되는 결이에요." />
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

type PlottedMatrixPoint = TasteMatrixPoint & { plotX: number; plotY: number };

function spreadMatrixPoints(points: TasteMatrixPoint[]): PlottedMatrixPoint[] {
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

// 다른 네 주제의 MatrixChart와 동일한 이유로 fillOpacity를 쓴다
// (design-check #116 — 커스텀 색엔 슬래시 투명도 클래스가 생성되지
// 않는다).
const MATRIX_POINT_OPACITY = [1, 0.7, 0.45, 0.25];
const MATRIX_POINT_NUMBER_CLASS = ["fill-primary-foreground", "fill-text-primary", "fill-text-primary", "fill-text-primary"];

function MatrixChart({ matrix }: { matrix: TasteMatrix }) {
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

// STEP 3 MY MAP. 예전 MatrixSection과 데이터·차트(MatrixChart)는
// 완전히 동일하다 — x/y 좌표를 다시 계산하거나 새 시각화 라이브러리를
// 쓰지 않는다. 바뀐 건 제목과 설명뿐이다: "나의 여러 모습"(통계
// 차트처럼 읽히기 쉬운 이름) 대신 "MY MAP"을 메인 타이틀로 쓴다 —
// STEP 2 "MAP이 발견한 3가지"부터 이어지는 "MAP" 어휘를 그대로
// 가져가고, 이 서비스 이름 자체(MAP OS)와 맞춰 "이것도 하나의
// 지도"라는 감각을 준다. 부제("내 안의 여러 모습이 이렇게 연결돼
// 있어요")로 원래 있던 "나의 여러 모습"이라는 표현을 자연스럽게
// 이어 쓴다.
function MyMapSection({ matrix }: { matrix: TasteMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="MY MAP" description="내 안의 여러 모습이 이렇게 연결돼 있어요." />
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

function TasteMapSection({ tasteMap }: { tasteMap: TasteMap }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="넓혀볼 방향, 안 맞을 방향" description="답변 패턴을 근거로 짚어본 방향이에요." />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-medium border border-border-strong bg-ink-wash p-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-success">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            넓혀볼 만한 방향
          </p>
          <ul className="mt-1.5 space-y-1">
            {tasteMap.expand.map((item, index) => (
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
            안 맞을 방향
          </p>
          <ul className="mt-1.5 space-y-1">
            {tasteMap.avoid.map((item, index) => (
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

// 다른 네 주제의 SelfReflectionSection과 완전히 같은 발상(반전 배경으로
// 강조)이라 시각 스타일도 그대로 가져왔다.
// 항목(li)의 sm:text-lg sm:leading-8을 뺐다(2026-08) — 이유는 바로 위
// TasteCoreSection 주석과 같다(뷰포트 640px 기준 접두사가 384px 고정폭
// 카드 안에서 켜지는 문제). 이 블록은 페이지 안에서 가장 큰 본문
// 글자였는데, 데스크톱에서 그 위에 sm:text-lg까지 얹히니 "결과 아래쪽
// 줄글 폰트가 너무 크다"는 테스터 피드백으로 이어졌다. 패딩(sm:p-5/
// sm:p-6)·제목 크기(sm:text-xl)는 384px 안에서도 줄바꿈이나 정렬
// 파손을 일으키지 않아(단순 여백·크기 차이일 뿐) 그대로 둔다.
function SelfReflectionSection({ selfReflection }: { selfReflection: TasteSelfReflection }) {
  return (
    <div
      className="flex flex-col gap-7 rounded-large border-2 border-primary bg-surface-elevated p-5 text-text-primary shadow-floating backdrop-blur-xl transition-shadow duration-normal ease-standard sm:p-6"
    >
      <div>
        <span aria-hidden="true" className="mb-2 block h-1 w-8 rounded-pill bg-primary" />
        <h2 className="text-lg font-black tracking-[-0.02em] text-text-primary sm:text-xl">자기 성찰</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-secondary">답변을 모아서 본 나의 취향이에요.</p>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">내가 알아채고 있는 것</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-border-strong bg-ink-wash p-4 sm:p-5">
          {selfReflection.awareness.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-text-secondary">잘 안 보이는 부분</p>
        <ul className="flex flex-col gap-4 rounded-medium border border-border-strong p-4 sm:p-5">
          {selfReflection.blindSpots.map((item, index) => (
            <li key={index} className="text-base font-semibold leading-7 text-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </div>
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

// STEP 4 "더 깊게 보기". 기존 4블록(중심·패턴·방향·자기성찰)을 하나도
// 지우지 않고 그대로 담되, 기본은 접어둔다 — 펼치면 예전과 똑같은
// 깊이가 그대로 나온다.
export function TasteResultDetails({ result }: { result: TasteResult }) {
  return (
    <Disclosure closedLabel="더 깊게 보기" openLabel="접기">
      <TasteCoreSection tasteCore={result.tasteCore} />
      <PatternsSection items={result.patterns} />
      <TasteMapSection tasteMap={result.tasteMap} />
      <SelfReflectionSection selfReflection={result.selfReflection} />
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

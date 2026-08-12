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

// RESULT VIRAL EXPERIENCE(2026-08) — 카드 우상단에 얹는 작은 "경로"
// 모티프. MY MAP(매트릭스 차트)이 이미 쓰는 점·선 언어를 재사용하되,
// 새 시각화 엔진이나 일러스트 세트 없이 SVG 도형 3개(원 3개 + 곡선
// 1개)만으로 "이것도 하나의 지도"라는 인상만 옅게(opacity-20) 남긴다 —
// 정보 전달용이 아니라 순수 브랜드 시그니처다. 정보(제목·한줄설명)
// 뒤에 깔리는 배경 요소라 pointer-events-none + aria-hidden으로
// 상호작용/스크린리더에서 완전히 제외한다.
function CardSignature() {
  return (
    <svg viewBox="0 0 64 64" className="pointer-events-none absolute right-4 top-4 size-14 opacity-20" aria-hidden="true">
      <path
        d="M8 44 C20 40, 26 20, 40 18 S 54 10, 56 8"
        className="fill-none stroke-primary"
        strokeWidth="2"
        strokeDasharray="1 5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="44" r="3" className="fill-primary" />
      <circle cx="40" cy="18" r="2.4" className="fill-primary" />
      <circle cx="56" cy="8" r="3" className="fill-primary" />
    </svg>
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
      <CardSignature />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="grid size-5 place-items-center rounded-medium border border-primary bg-surface-elevated text-[10px] font-black text-primary">
            M
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-text-muted">MAP Decision</span>
        </div>
        <span className="inline-flex items-center rounded-pill bg-tag-fill px-3 py-1 text-xs font-extrabold text-text-primary">
          나의 취향 MAP
        </span>
      </div>
      <h1 className="mt-4 text-balance break-keep text-3xl font-black leading-9 tracking-[-0.03em] text-text-primary">{result.title}</h1>
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

// 1→2→3으로 갈수록 카드 무게(테두리·배경·글자 굵기)가 짙어지게 해서
// 3번째("내가 놓친 나")가 자연스럽게 climax가 되게 한다 — 새 색을
// 추가하지 않고 기존 토큰(border/border-strong/primary, surface-elevated/
// ink-wash)만으로 3단계를 만든다.
const DISCOVERY_TIER_CLASS = [
  "border border-border bg-surface-elevated shadow-subtle",
  "border border-border-strong bg-ink-wash shadow-subtle",
  "border-2 border-primary bg-ink-wash shadow-floating",
];
const DISCOVERY_TEXT_CLASS = [
  "text-base font-bold leading-7 text-text-primary",
  "text-base font-bold leading-7 text-text-primary",
  "text-lg font-black leading-7 text-text-primary",
];

function DiscoveriesSection({ result }: { result: TasteResult }) {
  const discoveries = pickDiscoveries(result);
  if (discoveries.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <SectionHeader title="MAP이 발견한 3가지" description="따로 답한 문항들을 모아보니, 이런 게 보였어요." />
      <div className="flex flex-col gap-2">
        {discoveries.map((discovery, index) => (
          <div key={discovery.role} className={cx("flex flex-col gap-1.5 rounded-large p-4", DISCOVERY_TIER_CLASS[index % DISCOVERY_TIER_CLASS.length])}>
            <div className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-pill bg-primary text-xs font-black text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-text-muted">{discovery.role}</p>
            </div>
            <p className={DISCOVERY_TEXT_CLASS[index % DISCOVERY_TEXT_CLASS.length]}>{discovery.text}</p>
          </div>
        ))}
      </div>
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
function DeepDiveDisclosureItem({ title, children }: { title: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="overflow-hidden rounded-large border border-border bg-surface-elevated shadow-subtle">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-extrabold text-text-primary"
      >
        <span>{title}</span>
        <span aria-hidden="true" className="shrink-0 text-text-muted">
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
function LivingMapChart({ matrix }: { matrix: TasteMatrix }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(matrix.types);
  const centroid = centroidOf(placed);
  const territoryOrder = angleSortedOrder(placed);
  const territoryPath = closedSmoothPath(territoryOrder);
  const outerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 1.22, centroid));
  const innerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 0.68, centroid));

  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="mb-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em] text-text-muted">
        <span aria-hidden="true">▲</span> {matrix.yAxisLabel.high}
      </p>
      <div className="flex items-center gap-2">
        <p className="w-12 shrink-0 text-right text-[11px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <defs>
              <filter id={`living-map-glow-${filterId}`} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4.5" />
              </filter>
            </defs>
            <path d={outerRingPath} className="fill-none stroke-primary" strokeWidth="0.6" strokeDasharray="1.5 2" strokeOpacity={0.2} />
            <path d={territoryPath} className="fill-primary" fillOpacity={0.16} filter={`url(#living-map-glow-${filterId})`} />
            <path d={territoryPath} className="fill-none stroke-primary" strokeWidth="1" strokeOpacity={0.6} />
            <path d={innerRingPath} className="fill-none stroke-primary" strokeWidth="0.5" strokeDasharray="1 1.6" strokeOpacity={0.32} />
            <circle cx={centroid.x} cy={centroid.y} r="1" className="fill-primary" fillOpacity={0.5} />
            {placed.map((point, index) => (
              <g key={index}>
                <title>{point.label}</title>
                <circle cx={point.plotX} cy={point.plotY} r="3.8" className="fill-primary stroke-surface" strokeWidth="0.8" />
                <text
                  x={point.plotX}
                  y={point.plotY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-primary-foreground font-black"
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
      <p className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] font-black uppercase tracking-[0.06em] text-text-muted">
        <span aria-hidden="true">▼</span> {matrix.yAxisLabel.low}
      </p>
    </div>
  );
}

// STEP 3 MY MAP. matrix 데이터·좌표 계산(spreadMatrixPoints)은 그대로다
// — 위 LivingMapChart로 그리는 방식만 바뀌었다. 설명 문구도 "지형"
// 프레이밍에 맞춰 다시 썼다("내 안의 여러 모습이 이렇게 연결돼
// 있어요" → "내 안의 여러 모습이 이런 지형을 만들어요") — MY MAP
// VISUAL LAB(2026-08) 비교 실험에서 오너가 A안(Living Map)을 최종
// 선택했다.
function MyMapSection({ matrix }: { matrix: TasteMatrix }) {
  return (
    <Card className="flex flex-col gap-4">
      <SectionHeader title="MY MAP" description="내 안의 여러 모습이 이런 지형을 만들어요." />
      <LivingMapChart matrix={matrix} />
      <ul className="flex flex-col gap-2.5">
        {matrix.types.map((point, index) => (
          <li key={index} className="flex items-start gap-2 text-sm font-semibold leading-6 text-text-secondary">
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
      <div className="flex flex-col gap-2.5">
        <DeepDiveDisclosureItem title="내가 확실히 끌리는 것">
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

        <DeepDiveDisclosureItem title="상황에 따라 달라지는 나">
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

        <DeepDiveDisclosureItem title="넓혀볼 것 / 굳이 안 맞출 것">
          <ExpandAvoidGrid tasteMap={result.tasteMap} />
        </DeepDiveDisclosureItem>

        <DeepDiveDisclosureItem title="내가 미처 몰랐던 나">
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

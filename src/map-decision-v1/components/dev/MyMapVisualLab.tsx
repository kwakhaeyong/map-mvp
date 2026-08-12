"use client";

import { useId, type ReactNode } from "react";
import { TasteMatrix } from "../../types";
import { PlottedMatrixPoint, spreadMatrixPoints } from "../TasteResultBlocks";

// MY MAP VISUAL LAB — Preview 전용 비교 실험(2026-08). production의 MY
// MAP(TasteResultBlocks.tsx의 MatrixSection)은 이 파일에서 절대 건드리지
// 않는다 — 여기 있는 세 시각안(A/B/C)은 app/dev/result-wow-review에서만
// 렌더링되고, 좌표 계산은 production과 완전히 같은 spreadMatrixPoints를
// 그대로 가져다 쓴다(중복 구현 없음, matrix 데이터·좌표 관계 불변).
// 화면에 x=82/y=28 같은 숫자는 어디에도 노출하지 않는다 — 전부 위치로만
// 표현한다.

function centroidOf(points: { plotX: number; plotY: number }[]): { x: number; y: number } {
  const x = points.reduce((sum, p) => sum + p.plotX, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.plotY, 0) / points.length;
  return { x, y };
}

function scaleAroundCentroid<T extends { plotX: number; plotY: number }>(points: T[], factor: number, centroid: { x: number; y: number }) {
  return points.map((p) => ({ plotX: centroid.x + (p.plotX - centroid.x) * factor, plotY: centroid.y + (p.plotY - centroid.y) * factor }));
}

// Catmull-Rom → 3차 베지어 변환으로 주어진 점들을 지나는 부드러운 닫힌
// 곡선을 만든다. 점 순서에 따라 결과가 달라진다(자기교차 없는 매끈한
// 도형을 원하면 호출 전에 각 용도에 맞는 순서로 점을 정렬해야 한다) —
// LIVING MAP은 각도순(angleSortedOrder), JOURNEY는 최근접 이웃순
// (nearestNeighborOrder)으로 정렬한 뒤 이 함수에 넘긴다.
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

// LIVING MAP 전용 — matrix.types의 배열 순서(AI가 각 사분면 모습을
// 서술한 순서일 뿐, 위치와 무관하다)로 그대로 이으면 도형이 스스로
// 교차하는 "나비넥타이" 모양이 나올 수 있다(중심 기준 각도 순서가
// 아니면 폐곡선이 자기 자신과 겹친다). 중심점 기준 각도로 정렬해
// 항상 교차 없는 매끈한 "영역" 하나가 나오게 한다 — 좌표 자체는
// 하나도 바꾸지 않고 연결 순서만 바꾼다.
function angleSortedOrder<T extends { plotX: number; plotY: number }>(points: T[]): T[] {
  const centroid = centroidOf(points);
  return [...points].sort(
    (a, b) => Math.atan2(a.plotY - centroid.y, a.plotX - centroid.x) - Math.atan2(b.plotY - centroid.y, b.plotX - centroid.x),
  );
}

// JOURNEY 전용 — 배열 순서(matrix.types가 생성된 순서)가 아니라 실제
// 좌표 거리 기준으로 가장 가까운 점부터 이어 붙인다. "1→2→3→4 순서대로
// 진행하는 단계"가 아니라 "가까운 곳부터 자연스럽게 돌아다니는 경로"로
// 보이게 하기 위해서다 — 이 순서 자체가 실제 좌표(데이터)에서 나온다.
function nearestNeighborOrder(points: PlottedMatrixPoint[]): PlottedMatrixPoint[] {
  if (points.length <= 2) return points;
  const remaining = [...points];
  const ordered = [remaining.shift() as PlottedMatrixPoint];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDist = Infinity;
    remaining.forEach((point, index) => {
      const dist = Math.hypot(point.plotX - last.plotX, point.plotY - last.plotY);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = index;
      }
    });
    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }
  return ordered;
}

// 4개 꼭짓점 별 모양(sparkle) — 별자리 기호·황도12궁 아이콘이 아니라
// 순수 기하 도형이다.
function starPath(cx: number, cy: number, outerR: number, innerR: number, points = 4): string {
  const total = points * 2;
  let d = "";
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

// production MatrixChart와 같은 바깥 레이아웃(위/아래 중앙, 좌우
// square 옆)을 그대로 재사용하되, 캡션에 작은 방향 표시(▲▼)를 더해
// "분석 차트 눈금"보다 "지도 방위"에 가깝게 읽히게 한다. 이 레이아웃은
// 이미 production에서 375px 검증을 거친 구조라 그대로 가져왔다.
function CompassFrame({ matrix, children }: { matrix: TasteMatrix; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[240px]">
      <p className="mb-1 flex items-center justify-center gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-text-muted">
        <span aria-hidden="true">▲</span> {matrix.yAxisLabel.high}
      </p>
      <div className="flex items-center gap-2">
        <p className="w-12 shrink-0 text-right text-[10px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.low}</p>
        <div className="relative aspect-square flex-1">{children}</div>
        <p className="w-12 shrink-0 text-left text-[10px] font-black leading-tight text-text-muted">{matrix.xAxisLabel.high}</p>
      </div>
      <p className="mt-1 flex items-center justify-center gap-1 text-center text-[10px] font-black uppercase tracking-[0.08em] text-text-muted">
        <span aria-hidden="true">▼</span> {matrix.yAxisLabel.low}
      </p>
    </div>
  );
}

function MatrixLegend({ matrix }: { matrix: TasteMatrix }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {matrix.types.map((point, index) => (
        <li key={index} className="flex items-start gap-2 text-xs font-semibold text-text-secondary">
          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-pill border border-border bg-surface-elevated text-[10px] font-black text-text-primary">
            {index + 1}
          </span>
          <span>
            <span className="font-black text-text-primary">{point.label}</span> — {point.description}
          </span>
        </li>
      ))}
    </ul>
  );
}

// A. LIVING MAP — 4개 점을 지나는 매끈한 폐곡선을 "내 취향의 영역"으로
// 채우고, 그 폐곡선을 안팎으로 살짝 축소/확대한 두 겹을 등고선처럼
// 옅게 겹친다. 등고선 자체가 실제 좌표에서 계산된 값이라(장식이 아니라
// 데이터에서 파생) 요건 14를 만족한다.
function LivingMapVisual({ matrix }: { matrix: TasteMatrix }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(matrix.types);
  const centroid = centroidOf(placed);
  // 영역 윤곽선은 각도순으로 정렬한 점으로 그린다(위 angleSortedOrder
  // 주석 참고) — 마커·번호는 아래에서 원래 순서(placed)를 그대로 쓴다.
  const territoryOrder = angleSortedOrder(placed);
  const territoryPath = closedSmoothPath(territoryOrder);
  const outerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 1.22, centroid));
  const innerRingPath = closedSmoothPath(scaleAroundCentroid(territoryOrder, 0.68, centroid));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-text-muted">A. Living Map</p>
      <CompassFrame matrix={matrix}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <filter id={`livingmap-glow-${filterId}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
          </defs>
          <path d={outerRingPath} className="fill-none stroke-primary" strokeWidth="0.6" strokeDasharray="1.5 2" strokeOpacity={0.22} />
          <path d={territoryPath} className="fill-primary" fillOpacity={0.16} filter={`url(#livingmap-glow-${filterId})`} />
          <path d={territoryPath} className="fill-none stroke-primary" strokeWidth="1" strokeOpacity={0.6} />
          <path d={innerRingPath} className="fill-none stroke-primary" strokeWidth="0.5" strokeDasharray="1 1.6" strokeOpacity={0.35} />
          {placed.map((point, index) => (
            <g key={index}>
              <title>{point.label}</title>
              <circle cx={point.plotX} cy={point.plotY} r="3.6" className="fill-primary stroke-surface" strokeWidth="0.8" />
              <text
                x={point.plotX}
                y={point.plotY}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-primary-foreground font-black"
                style={{ fontSize: "3.8px" }}
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </CompassFrame>
      <MatrixLegend matrix={matrix} />
    </div>
  );
}

// B. CONSTELLATION — 4개 점을 순서대로 이어 하나의 도형(별자리)으로
// 만든다. 중심에서 먼 점일수록(더 극단적인 답변 조합일수록) 별을 살짝
// 더 크고 밝게 그려서, 별 크기 자체도 실제 좌표에서 나온 값이 되게
// 했다. 좌표 격자·눈금선은 아예 그리지 않아 "차트" 느낌을 없앤다.
function ConstellationVisual({ matrix }: { matrix: TasteMatrix }) {
  const filterId = useId();
  const placed = spreadMatrixPoints(matrix.types);
  const centroid = centroidOf(placed);
  const loop = [...placed, placed[0]];
  const linePath = loop.map((point, index) => `${index === 0 ? "M" : "L"} ${point.plotX} ${point.plotY}`).join(" ");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-text-muted">B. Constellation</p>
      <CompassFrame matrix={matrix}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <filter id={`constellation-glow-${filterId}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>
          <path d={linePath} className="fill-none stroke-primary" strokeWidth="1.6" strokeOpacity={0.16} filter={`url(#constellation-glow-${filterId})`} />
          <path d={linePath} className="fill-none stroke-primary" strokeWidth="0.4" strokeOpacity={0.6} strokeDasharray="0.2 2.6" strokeLinecap="round" />
          {placed.map((point, index) => {
            const distance = Math.hypot(point.plotX - centroid.x, point.plotY - centroid.y);
            const size = 3.2 + Math.min(distance / 18, 2.2);
            return (
              <g key={index}>
                <title>{point.label}</title>
                <circle cx={point.plotX} cy={point.plotY} r={size + 2.5} className="fill-primary" fillOpacity={0.16} filter={`url(#constellation-glow-${filterId})`} />
                <path d={starPath(point.plotX, point.plotY, size, size * 0.42)} className="fill-primary stroke-surface" strokeWidth="0.4" />
                <text
                  x={point.plotX}
                  y={point.plotY + size + 5}
                  textAnchor="middle"
                  className="fill-text-muted font-black"
                  style={{ fontSize: "3px" }}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </CompassFrame>
      <MatrixLegend matrix={matrix} />
    </div>
  );
}

// C. JOURNEY — 배열 순서가 아니라 실제 좌표상 가장 가까운 점부터 잇는
// 순환 경로(closedSmoothPath)를 그린다. 4→1로 다시 돌아오는 폐곡선이라
// "시작→끝"이 아니라 "여러 모습 사이를 오가는 순환"으로 읽힌다. 경로
// 중간중간의 작은 삼각형은 이동 방향만 암시할 뿐, 단계 번호가 아니다
// (번호는 지점 마커에만, 그것도 범례와 같은 원래 순서로 붙인다).
function JourneyVisual({ matrix }: { matrix: TasteMatrix }) {
  const placed = spreadMatrixPoints(matrix.types);
  const ordered = nearestNeighborOrder(placed);
  const trailPath = closedSmoothPath(ordered);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-text-muted">C. Journey</p>
      <CompassFrame matrix={matrix}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <path d={trailPath} className="fill-none stroke-primary" strokeWidth="1" strokeOpacity={0.5} strokeDasharray="2.4 2" strokeLinecap="round" />
          {ordered.map((point, index) => {
            const next = ordered[(index + 1) % ordered.length];
            const midX = (point.plotX + next.plotX) / 2;
            const midY = (point.plotY + next.plotY) / 2;
            const angle = (Math.atan2(next.plotY - point.plotY, next.plotX - point.plotX) * 180) / Math.PI;
            return (
              <path
                key={`arrow-${index}`}
                d="M -1.6 -1.2 L 1.6 0 L -1.6 1.2 Z"
                transform={`translate(${midX} ${midY}) rotate(${angle})`}
                className="fill-primary"
                fillOpacity={0.5}
              />
            );
          })}
          {placed.map((point, index) => (
            <g key={index}>
              <title>{point.label}</title>
              <path
                d={`M ${point.plotX} ${point.plotY - 2.4} c -3.2 0 -5.6 2.4 -5.6 5.4 c 0 3.6 5.6 8.6 5.6 8.6 s 5.6 -5 5.6 -8.6 c 0 -3 -2.4 -5.4 -5.6 -5.4 Z`}
                className="fill-primary stroke-surface"
                strokeWidth="0.6"
              />
              <circle cx={point.plotX} cy={point.plotY + 3} r="1.8" className="fill-primary-foreground" />
              <text x={point.plotX} y={point.plotY + 3.7} textAnchor="middle" className="fill-primary font-black" style={{ fontSize: "2.6px" }}>
                {index + 1}
              </text>
            </g>
          ))}
        </svg>
      </CompassFrame>
      <MatrixLegend matrix={matrix} />
    </div>
  );
}

export function MyMapVisualLab({ matrix }: { matrix: TasteMatrix }) {
  return (
    <div className="flex flex-col gap-4 rounded-large border-2 border-dashed border-border-strong bg-surface p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-primary">MY MAP VISUAL LAB</p>
        <p className="mt-0.5 text-[11px] font-semibold text-text-muted">비교용 실험 — 아직 결과 화면에는 적용되지 않았어요.</p>
      </div>
      <LivingMapVisual matrix={matrix} />
      <div className="h-px w-full bg-border" />
      <ConstellationVisual matrix={matrix} />
      <div className="h-px w-full bg-border" />
      <JourneyVisual matrix={matrix} />
    </div>
  );
}

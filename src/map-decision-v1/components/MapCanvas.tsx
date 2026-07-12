import { useMemo, useState } from "react";
import { MapNode, MapRelation, MapSession, NodeKind } from "../types";
import {
  Badge,
  Button,
  Card,
  MapLegend,
  MapNode as MapNodePrimitive,
} from "./ui/primitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function shorten(text: string, length = 44) {
  return text.trim().length > length
    ? `${text.trim().slice(0, length)}…`
    : text.trim();
}

const nodeType: Partial<
  Record<
    NodeKind,
    | "topic"
    | "fact"
    | "feeling"
    | "value"
    | "option"
    | "uncertainty"
    | "risk"
    | "action"
  >
> = {
  topic: "topic",
  trigger: "uncertainty",
  fact: "fact",
  emotion: "feeling",
  person: "feeling",
  value: "value",
  reason: "fact",
  constraint: "uncertainty",
  option: "option",
  benefit: "option",
  risk: "risk",
  missing: "uncertainty",
  direction: "action",
  action: "action",
  correction: "value",
};

const sampleNodes: MapNode[] = [
  {
    id: "sample-topic",
    kind: "topic",
    label: "핵심 주제",
    text: "이직할까?",
    confidence: "user",
    createdAt: "",
  },
  {
    id: "sample-fact",
    kind: "fact",
    label: "내가 말한 상황",
    text: "성장감이 줄어든 일",
    confidence: "user",
    createdAt: "",
  },
  {
    id: "sample-value",
    kind: "value",
    label: "중요한 기준",
    text: "안정과 성장 사이",
    confidence: "ai",
    createdAt: "",
  },
  {
    id: "sample-option",
    kind: "option",
    label: "가능한 방향",
    text: "바로 옮기기보다 확인하기",
    confidence: "ai",
    createdAt: "",
  },
  {
    id: "sample-missing",
    kind: "missing",
    label: "확인할 내용",
    text: "다른 팀 기회와 생활비",
    confidence: "ai",
    createdAt: "",
  },
];

type ExampleKind = "thinking" | "decision";
type Point = { x: number; y: number };
type PlacedNode = {
  node: MapNode;
  point: Point;
  relation?: MapRelation;
  delay: string;
};
type ExampleMap = {
  kind: ExampleKind;
  title: string;
  subtitle: string;
  nodes: MapNode[];
  relations: MapRelation[];
  layout: Record<string, Point>;
};

const exampleMaps: Record<ExampleKind, ExampleMap> = {
  thinking: {
    kind: "thinking",
    title: "내 이상형은 어떤 사람일까?",
    subtitle:
      "감정 패턴, 가치, 관계 선호, 발견과 열린 질문을 흐름으로 보여줘요.",
    nodes: [
      {
        id: "thinking-topic",
        kind: "topic",
        label: "탐색 주제",
        text: "내 이상형은 어떤 사람일까?",
        confidence: "confirmed",
        createdAt: "",
      },
      {
        id: "thinking-emotion",
        kind: "emotion",
        label: "반복 감정",
        text: "편안함을 느낄 때 마음이 열림",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "thinking-value",
        kind: "value",
        label: "중요한 가치",
        text: "존중받는 대화와 생활 리듬",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "thinking-person",
        kind: "person",
        label: "관계 선호",
        text: "말을 재촉하지 않는 사람",
        confidence: "user",
        createdAt: "",
      },
      {
        id: "thinking-discovery",
        kind: "reason",
        label: "새로 보인 발견",
        text: "설렘보다 안정감을 더 오래 기억함",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "thinking-question",
        kind: "missing",
        label: "열린 질문",
        text: "편안함과 익숙함은 어떻게 다를까?",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "thinking-correction",
        kind: "correction",
        label: "내가 고칠 수 있음",
        text: "이상형은 정답이 아니라 계속 수정되는 기준",
        confidence: "confirmed",
        createdAt: "",
      },
    ],
    relations: [
      {
        id: "thinking-edge-1",
        from: "thinking-topic",
        to: "thinking-emotion",
        kind: "영향",
        strength: "accent",
      },
      {
        id: "thinking-edge-2",
        from: "thinking-emotion",
        to: "thinking-value",
        kind: "원인",
        strength: "solid",
      },
      {
        id: "thinking-edge-3",
        from: "thinking-value",
        to: "thinking-person",
        kind: "영향",
        strength: "solid",
      },
      {
        id: "thinking-edge-4",
        from: "thinking-emotion",
        to: "thinking-discovery",
        kind: "영향",
        strength: "dotted",
      },
      {
        id: "thinking-edge-5",
        from: "thinking-discovery",
        to: "thinking-question",
        kind: "확인 필요",
        strength: "dotted",
      },
      {
        id: "thinking-edge-6",
        from: "thinking-question",
        to: "thinking-correction",
        kind: "다음 행동",
        strength: "accent",
      },
    ],
    layout: {
      "thinking-topic": { x: 18, y: 24 },
      "thinking-emotion": { x: 42, y: 20 },
      "thinking-value": { x: 63, y: 34 },
      "thinking-person": { x: 78, y: 58 },
      "thinking-discovery": { x: 42, y: 58 },
      "thinking-question": { x: 56, y: 80 },
      "thinking-correction": { x: 24, y: 76 },
    },
  },
  decision: {
    kind: "decision",
    title: "회사를 계속 다닐까, 이직할까?",
    subtitle:
      "상황, 통제 가능성, 선택지, 영향, 리스크와 24시간 행동을 구조화해요.",
    nodes: [
      {
        id: "decision-topic",
        kind: "topic",
        label: "결정 주제",
        text: "회사를 계속 다닐까, 이직할까?",
        confidence: "confirmed",
        createdAt: "",
      },
      {
        id: "decision-current",
        kind: "fact",
        label: "현재 상황",
        text: "성장감은 낮고 생활 안정성은 있음",
        confidence: "user",
        createdAt: "",
      },
      {
        id: "decision-control",
        kind: "value",
        label: "통제 가능",
        text: "면담 요청, 시장 조사, 지출 점검",
        confidence: "confirmed",
        createdAt: "",
      },
      {
        id: "decision-uncontrol",
        kind: "constraint",
        label: "통제 어려움",
        text: "채용 시장, 팀 개편 시점",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "decision-stay",
        kind: "option",
        label: "선택지 A",
        text: "남아서 역할 조정 요청",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "decision-move",
        kind: "option",
        label: "선택지 B",
        text: "이직 준비를 병행",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "decision-benefit",
        kind: "benefit",
        label: "영향 매트릭스",
        text: "성장 가능성은 높이고 생활 충격은 낮추기",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "decision-risk",
        kind: "risk",
        label: "리스크",
        text: "준비 없이 떠나면 생활비 공백",
        confidence: "ai",
        createdAt: "",
      },
      {
        id: "decision-direction",
        kind: "direction",
        label: "현재 방향",
        text: "바로 퇴사보다 확인 후 이동",
        confidence: "confirmed",
        createdAt: "",
      },
      {
        id: "decision-action",
        kind: "action",
        label: "24시간 행동",
        text: "내일 면담 요청과 채용공고 3개 확인",
        confidence: "confirmed",
        createdAt: "",
      },
    ],
    relations: [
      {
        id: "decision-edge-1",
        from: "decision-topic",
        to: "decision-current",
        kind: "원인",
        strength: "solid",
      },
      {
        id: "decision-edge-2",
        from: "decision-current",
        to: "decision-control",
        kind: "영향",
        strength: "solid",
      },
      {
        id: "decision-edge-3",
        from: "decision-current",
        to: "decision-uncontrol",
        kind: "확인 필요",
        strength: "dotted",
      },
      {
        id: "decision-edge-4",
        from: "decision-control",
        to: "decision-stay",
        kind: "대안",
        strength: "solid",
      },
      {
        id: "decision-edge-5",
        from: "decision-control",
        to: "decision-move",
        kind: "대안",
        strength: "solid",
      },
      {
        id: "decision-edge-6",
        from: "decision-stay",
        to: "decision-benefit",
        kind: "장점",
        strength: "solid",
      },
      {
        id: "decision-edge-7",
        from: "decision-move",
        to: "decision-risk",
        kind: "리스크",
        strength: "dotted",
      },
      {
        id: "decision-edge-8",
        from: "decision-benefit",
        to: "decision-direction",
        kind: "영향",
        strength: "accent",
      },
      {
        id: "decision-edge-9",
        from: "decision-risk",
        to: "decision-direction",
        kind: "영향",
        strength: "dotted",
      },
      {
        id: "decision-edge-10",
        from: "decision-direction",
        to: "decision-action",
        kind: "다음 행동",
        strength: "accent",
      },
    ],
    layout: {
      "decision-topic": { x: 50, y: 10 },
      "decision-current": { x: 50, y: 25 },
      "decision-control": { x: 31, y: 40 },
      "decision-uncontrol": { x: 69, y: 40 },
      "decision-stay": { x: 24, y: 58 },
      "decision-move": { x: 45, y: 58 },
      "decision-benefit": { x: 24, y: 76 },
      "decision-risk": { x: 69, y: 62 },
      "decision-direction": { x: 55, y: 78 },
      "decision-action": { x: 55, y: 93 },
    },
  },
};

const layoutRings = {
  desktop: [
    { x: 50, y: 18 },
    { x: 76, y: 30 },
    { x: 80, y: 56 },
    { x: 64, y: 78 },
    { x: 36, y: 78 },
    { x: 20, y: 56 },
    { x: 24, y: 30 },
    { x: 50, y: 86 },
    { x: 88, y: 43 },
    { x: 12, y: 43 },
  ],
  mobile: [
    { x: 50, y: 16 },
    { x: 78, y: 34 },
    { x: 72, y: 66 },
    { x: 50, y: 84 },
    { x: 28, y: 66 },
    { x: 22, y: 34 },
  ],
};

function relationClass(node: MapNode, relation?: MapRelation) {
  if (
    relation?.strength === "accent" ||
    node.kind === "action" ||
    node.kind === "direction"
  )
    return "stroke-primary stroke-[2.6]";
  if (
    relation?.strength === "dotted" ||
    node.kind === "missing" ||
    node.kind === "risk"
  )
    return "stroke-uncertainty stroke-[2] [stroke-dasharray:2_3]";
  if (node.confidence === "ai")
    return "stroke-border-strong stroke-[1.8] [stroke-dasharray:6_4] opacity-80";
  return "stroke-border-strong stroke-[1.9]";
}

function edgePath(from: Point, to: Point, index: number) {
  const curve = index % 2 === 0 ? 6 : -6;
  const control: Point = {
    x: (from.x + to.x) / 2 + curve,
    y: (from.y + to.y) / 2 - curve,
  };
  return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
}

function getViewport(zoom: number, compact: boolean, result: boolean) {
  if (zoom === 0) return "0 0 100 100";
  const size = result ? 86 : compact ? 90 : 82;
  const half = size / 2;
  return `${50 - half} ${50 - half} ${size} ${size}`;
}

export function MapCanvas({
  session,
  sample = false,
  className,
  compact = false,
  result = false,
  onStartExample,
}: {
  session: MapSession;
  sample?: boolean;
  className?: string;
  compact?: boolean;
  result?: boolean;
  onStartExample?: () => void;
}) {
  const [zoom, setZoom] = useState(0);
  const [exampleKind, setExampleKind] = useState<ExampleKind>(
    session.preferredMapType === "decision" ? "decision" : "thinking",
  );
  const hasRealNodes = session.nodes.length > 0;
  const showExample = !sample && !hasRealNodes;
  const activeExample = exampleMaps[exampleKind];
  const realNodes = hasRealNodes ? session.nodes : [];
  const nodes = showExample
    ? activeExample.nodes
    : sample
      ? realNodes.length
        ? realNodes
        : sampleNodes
      : realNodes;
  const relations = showExample ? activeExample.relations : session.relations;
  const center = nodes.find((node) => node.kind === "topic") || nodes[0];
  const outerLimit = result ? 10 : compact ? 5 : 8;
  const outer = nodes
    .filter((node) => node.id !== center?.id)
    .slice(0, outerLimit);
  const h = result
    ? "h-[30rem] max-h-[72dvh] sm:h-[38rem]"
    : compact
      ? "h-[15rem] max-h-[42dvh] sm:h-[20rem]"
      : "h-[28rem] max-h-[68dvh] sm:h-[30rem]";
  const centerPoint = { x: 50, y: compact ? 52 : 50 };
  const viewport = getViewport(zoom, compact, result);
  const visibleLabel = showExample
    ? "예시 MAP"
    : outer.length
      ? `${outer.length + 1}개 조각`
      : "비어 있음";

  const placedNodes = useMemo<PlacedNode[]>(
    () =>
      showExample
        ? activeExample.nodes.map((node, index) => ({
            node,
            point: activeExample.layout[node.id] || centerPoint,
            relation: relations.find((rel) => rel.to === node.id),
            delay: `${Math.min(index * 60, 360)}ms`,
          }))
        : outer.map((node, index) => ({
            node,
            point: (compact ? layoutRings.mobile : layoutRings.desktop)[
              index %
                (compact
                  ? layoutRings.mobile.length
                  : layoutRings.desktop.length)
            ],
            relation: relations.find(
              (rel) =>
                rel.to === node.id ||
                (rel.from === node.id && rel.to === center?.id),
            ),
            delay: `${Math.min(index * 60, 360)}ms`,
          })),
    [
      activeExample.layout,
      activeExample.nodes,
      center?.id,
      centerPoint,
      compact,
      outer,
      relations,
      showExample,
    ],
  );

  const pointById = useMemo(
    () =>
      placedNodes.reduce<Record<string, Point>>((points, placed) => {
        points[placed.node.id] = placed.point;
        return points;
      }, {}),
    [placedNodes],
  );

  return (
    <Card
      className={cx("thinking-map overflow-hidden p-4 sm:p-6", className)}
      aria-label={showExample ? "예시 MAP" : "실시간 생각 MAP"}
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="kicker">{showExample ? "예시 MAP" : "보이는 흐름"}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl">
            {showExample ? activeExample.title : "말하면 생각이 보입니다."}
          </h2>
          {showExample ? (
            <p className="mt-2 max-w-2xl break-keep text-sm font-bold leading-6 text-text-secondary">
              {activeExample.subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {showExample ? <Badge tone="default">예시 MAP</Badge> : null}
          {!compact ? (
            <Badge tone={outer.length || showExample ? "success" : "default"}>
              {showExample
                ? activeExample.kind === "decision"
                  ? "Decision MAP"
                  : "Thinking MAP"
                : outer.length
                  ? "흐름 정리 중"
                  : visibleLabel}
            </Badge>
          ) : null}
          {showExample ? (
            <div className="flex flex-wrap gap-2" aria-label="예시 MAP 선택">
              <Button
                size="sm"
                variant={exampleKind === "thinking" ? "primary" : "secondary"}
                onClick={() => setExampleKind("thinking")}
              >
                Thinking MAP
              </Button>
              <Button
                size="sm"
                variant={exampleKind === "decision" ? "primary" : "secondary"}
                onClick={() => setExampleKind("decision")}
              >
                Decision MAP
              </Button>
              <Button size="sm" variant="secondary" onClick={onStartExample}>
                나도 시작하기
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setExampleKind((current) =>
                    current === "thinking" ? "decision" : "thinking",
                  )
                }
              >
                다른 예시 보기
              </Button>
            </div>
          ) : null}
          {!compact && center && !showExample ? (
            <div className="flex gap-2" aria-label="MAP 보기 조절">
              <Button
                size="sm"
                variant={zoom ? "secondary" : "primary"}
                onClick={() => setZoom(0)}
              >
                Fit View
              </Button>
              <Button
                size="sm"
                variant={zoom ? "primary" : "secondary"}
                onClick={() => setZoom((value) => (value ? 0 : 1))}
              >
                Zoom
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div
        className={cx(
          "relative touch-pan-y overflow-hidden rounded-large border border-border bg-surface shadow-subtle",
          h,
        )}
      >
        <svg
          className="absolute inset-0 h-full w-full transition-all duration-slow ease-emphasized motion-reduce:transition-none"
          viewBox={viewport}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {showExample
            ? relations.map((relation, index) => {
                const from = pointById[relation.from];
                const to = pointById[relation.to];
                const node = nodes.find((item) => item.id === relation.to);
                if (!from || !to || !node) return null;
                return (
                  <path
                    key={relation.id}
                    d={edgePath(from, to, index)}
                    className={cx(
                      "map-edge fill-none",
                      relationClass(node, relation),
                    )}
                    strokeLinecap="round"
                    style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
                  />
                );
              })
            : placedNodes.map(({ node, point, relation, delay }, index) => (
                <path
                  key={node.id}
                  d={edgePath(centerPoint, point, index)}
                  className={cx(
                    "map-edge fill-none",
                    relationClass(node, relation),
                  )}
                  strokeLinecap="round"
                  style={{ animationDelay: delay }}
                />
              ))}
        </svg>
        {showExample ? (
          placedNodes.map(({ node, point, delay }) => (
            <MapNodeView
              key={node.id}
              node={node}
              x={point.x}
              y={point.y}
              center={node.kind === "topic" || node.kind === "direction"}
              compact={compact}
              delay={delay}
            />
          ))
        ) : center ? (
          <>
            <MapNodeView
              node={center}
              x={centerPoint.x}
              y={centerPoint.y}
              center
              compact={compact}
              delay="0ms"
            />
            {placedNodes.map(({ node, point, delay }) => (
              <MapNodeView
                key={node.id}
                node={node}
                x={point.x}
                y={point.y}
                compact={compact}
                delay={delay}
              />
            ))}
          </>
        ) : null}
      </div>
      {!compact ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <MapLegend
            items={[
              "fact",
              "feeling",
              "option",
              "uncertainty",
              "risk",
              "action",
            ]}
          />
          <p className="text-xs font-bold text-text-muted">
            {showExample
              ? "예시는 저장되지 않으며, 실제 이야기를 시작하면 내 MAP으로 바로 바뀌어요."
              : "확정 관계는 실선, 추정·확인 필요 관계는 점선으로 표시돼요."}
          </p>
        </div>
      ) : null}
    </Card>
  );
}

function MapNodeView({
  node,
  x,
  y,
  center = false,
  compact = false,
  delay = "0ms",
}: {
  node: MapNode;
  x: number;
  y: number;
  center?: boolean;
  compact?: boolean;
  delay?: string;
}) {
  const w = center
    ? compact
      ? "w-40 sm:w-52"
      : "w-48 sm:w-64"
    : compact
      ? "w-28 sm:w-36"
      : "w-32 sm:w-48";
  return (
    <MapNodePrimitive
      type={nodeType[node.kind] || "fact"}
      className={cx(
        "map-node-enter absolute -translate-x-1/2 -translate-y-1/2 text-center",
        w,
        center && "border-2",
        node.confidence === "ai" && "border-dashed",
      )}
      style={{ left: `${x}%`, top: `${y}%`, animationDelay: delay }}
    >
      <p className="text-[11px] font-black uppercase tracking-[-0.01em] text-text-secondary">
        {node.label}
      </p>
      <p
        className={cx(
          "mt-1 whitespace-normal break-keep font-extrabold leading-snug",
          center ? "text-sm sm:text-lg" : "text-[11px] sm:text-sm",
        )}
      >
        {shorten(node.text, center ? 64 : compact ? 28 : 36)}
      </p>
    </MapNodePrimitive>
  );
}

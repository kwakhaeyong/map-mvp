import { createSession } from "../engine/session";
import type { MapSession } from "../types";
import {
  Badge,
  Button,
  Card,
  ResponseChip,
  VoiceButton,
} from "./ui/primitives";
import { MapCanvas } from "./MapCanvas";

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="MAP Decision">
      <span className="grid size-10 place-items-center rounded-medium border border-primary bg-surface-elevated text-sm font-black text-primary shadow-floating">
        M
      </span>
      <span className="text-base font-black tracking-[-0.03em]">
        MAP Decision
      </span>
    </div>
  );
}

const topics = ["이직할까?", "먼저 연락할까?", "휴학할까?"];

const thinkingExample: MapSession = {
  ...createSession("이직할까?"),
  nodes: [
    {
      id: "thinking-topic",
      kind: "topic",
      label: "핵심 주제",
      text: "이직할까?",
      confidence: "user",
      createdAt: "",
    },
    {
      id: "thinking-fact",
      kind: "fact",
      label: "내가 말한 상황",
      text: "성장감이 줄어든 일",
      confidence: "user",
      createdAt: "",
    },
    {
      id: "thinking-value",
      kind: "value",
      label: "중요한 기준",
      text: "안정과 성장 사이",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "thinking-missing",
      kind: "missing",
      label: "확인할 내용",
      text: "다른 팀 기회와 생활비",
      confidence: "ai",
      createdAt: "",
    },
  ],
  relations: [
    {
      id: "thinking-rel-1",
      from: "thinking-topic",
      to: "thinking-fact",
      kind: "영향",
      strength: "solid",
    },
    {
      id: "thinking-rel-2",
      from: "thinking-topic",
      to: "thinking-value",
      kind: "충돌",
      strength: "dotted",
    },
    {
      id: "thinking-rel-3",
      from: "thinking-topic",
      to: "thinking-missing",
      kind: "확인 필요",
      strength: "dotted",
    },
  ],
};

const decisionExample: MapSession = {
  ...createSession("팀 이동을 먼저 확인하기"),
  preferredMapType: "decision",
  nodes: [
    {
      id: "decision-topic",
      kind: "topic",
      label: "결정 방향",
      text: "팀 이동을 먼저 확인하기",
      confidence: "confirmed",
      createdAt: "",
    },
    {
      id: "decision-option",
      kind: "option",
      label: "가능한 선택",
      text: "바로 퇴사보다 내부 기회 확인",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-risk",
      kind: "risk",
      label: "리스크",
      text: "확인 없이 옮기면 불안정",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-action",
      kind: "action",
      label: "24시간 행동",
      text: "내일 리더에게 면담 요청하기",
      confidence: "confirmed",
      createdAt: "",
    },
  ],
  relations: [
    {
      id: "decision-rel-1",
      from: "decision-topic",
      to: "decision-option",
      kind: "대안",
      strength: "solid",
    },
    {
      id: "decision-rel-2",
      from: "decision-topic",
      to: "decision-risk",
      kind: "리스크",
      strength: "dotted",
    },
    {
      id: "decision-rel-3",
      from: "decision-topic",
      to: "decision-action",
      kind: "다음 행동",
      strength: "accent",
    },
  ],
};

function ExampleShowcase() {
  return (
    <div className="grid gap-4" aria-label="MAP 예시">
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="kicker">Thinking MAP</p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em]">
              흩어진 생각을 먼저 보이게
            </h2>
          </div>
          <Badge tone="value">정리 중</Badge>
        </div>
        <MapCanvas session={thinkingExample} sample compact />
      </Card>
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="kicker">Decision MAP</p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em]">
              첫 행동까지 이어지게
            </h2>
          </div>
          <Badge tone="action">24시간 행동</Badge>
        </div>
        <MapCanvas session={decisionExample} sample compact />
      </Card>
    </div>
  );
}

export function Landing({
  hasDraft,
  onStart,
  onResume,
  onDemo,
  saveState = "saved",
}: {
  hasDraft: boolean;
  onStart: (topic?: string) => void;
  onResume: () => void;
  onDemo: () => void;
  saveState?: "loading" | "saved" | "saving";
}) {
  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge tone={saveState === "saving" ? "default" : "success"}>
            {saveState === "loading"
              ? "불러오는 중"
              : saveState === "saving"
                ? "자동 저장 중"
                : "자동 저장됨"}
          </Badge>
          {hasDraft ? (
            <Button variant="secondary" onClick={onResume}>
              이어서 하기
            </Button>
          ) : null}
        </div>
      </header>

      <section className="map-container grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,.95fr)_minmax(26rem,1.05fr)] lg:gap-16 lg:py-16">
        <div className="max-w-2xl">
          <p className="kicker">말하면, 생각이 보입니다.</p>
          <h1 className="mt-4 text-balance break-keep text-[2.125rem] font-black leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem]">
            지금 가장 마음에 걸리는 건 뭐예요?
          </h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-lg font-medium leading-8 text-text-secondary">
            말하거나 하나만 골라보세요.{`\n`}생각의 흐름을 바로 보여드릴게요.
          </p>

          <Card className="mt-8 p-3 sm:p-4">
            <VoiceButton
              className="min-h-24 w-full justify-start px-6 text-left text-lg"
              onClick={() => onStart()}
            >
              <span className="text-2xl">🎙</span>
              <span>
                <span className="block">말로 시작하기</span>
                <span className="block text-sm font-semibold text-primary-foreground/80">
                  마이크 권한이 없어도 입력으로 이어갈 수 있어요.
                </span>
              </span>
            </VoiceButton>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" onClick={() => onStart()}>
                직접 입력하기
              </Button>
              <Button variant="default" size="lg" onClick={onDemo}>
                30초 체험해보기
              </Button>
            </div>
            {hasDraft ? (
              <Button
                className="mt-3 w-full"
                variant="default"
                onClick={onResume}
              >
                저장된 이야기 이어서 하기
              </Button>
            ) : null}
          </Card>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="빠른 시작">
            {topics.map((topic) => (
              <ResponseChip key={topic} onClick={() => onStart(topic)}>
                {topic}
              </ResponseChip>
            ))}
          </div>
          <div className="mt-5 grid gap-2 text-center text-xs font-bold text-text-muted sm:grid-cols-4">
            {[
              "로그인 없이 시작",
              "자동 저장",
              "언제든 이어서 수정",
              "첫 변화는 30초 안에",
            ].map((item) => (
              <span
                key={item}
                className="rounded-pill border border-border bg-surface px-3 py-2 shadow-subtle"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <ExampleShowcase />
      </section>
    </main>
  );
}

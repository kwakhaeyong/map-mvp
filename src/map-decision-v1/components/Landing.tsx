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
  ...createSession("내 이상형은 어떤 사람일까?"),
  preferredMapType: "thinking",
  stage: "result",
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
};

const decisionExample: MapSession = {
  ...createSession("커리어 방향을 어떻게 정할까?"),
  preferredMapType: "decision",
  stage: "result",
  nodes: [
    {
      id: "decision-topic",
      kind: "topic",
      label: "결정 주제",
      text: "커리어 방향을 어떻게 정할까?",
      confidence: "confirmed",
      createdAt: "",
    },
    {
      id: "decision-current",
      kind: "fact",
      label: "현재 상황",
      text: "익숙한 업무는 안정적이지만 성장감이 낮음",
      confidence: "user",
      createdAt: "",
    },
    {
      id: "decision-value",
      kind: "value",
      label: "중요한 기준",
      text: "생활 안정과 배우는 속도를 함께 보고 싶음",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-constraint",
      kind: "constraint",
      label: "확인할 제약",
      text: "저축 여유, 채용 시장, 팀 이동 가능성",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-stay",
      kind: "option",
      label: "선택지 A",
      text: "현재 회사에서 역할 조정 요청",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-move",
      kind: "option",
      label: "선택지 B",
      text: "이직 준비를 조용히 병행",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-benefit",
      kind: "benefit",
      label: "기대 효과",
      text: "성장 가능성은 높이고 생활 충격은 낮추기",
      confidence: "ai",
      createdAt: "",
    },
    {
      id: "decision-risk",
      kind: "risk",
      label: "리스크",
      text: "준비 없이 떠나면 생활비 공백이 커짐",
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
      to: "decision-value",
      kind: "영향",
      strength: "solid",
    },
    {
      id: "decision-edge-3",
      from: "decision-current",
      to: "decision-constraint",
      kind: "확인 필요",
      strength: "dotted",
    },
    {
      id: "decision-edge-4",
      from: "decision-value",
      to: "decision-stay",
      kind: "대안",
      strength: "solid",
    },
    {
      id: "decision-edge-5",
      from: "decision-value",
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
};

function ExampleShowcase() {
  return (
    <div className="grid gap-4" aria-label="MAP 예시">
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="kicker">Thinking MAP</p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em]">
              이상형 탐색을 결과처럼 보이게
            </h2>
          </div>
          <Badge tone="value">정리 중</Badge>
        </div>
        <MapCanvas session={thinkingExample} sample result />
      </Card>
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="kicker">Decision MAP</p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em]">
              커리어 결정이 첫 행동까지 이어지게
            </h2>
          </div>
          <Badge tone="action">24시간 행동</Badge>
        </div>
        <MapCanvas session={decisionExample} sample result />
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

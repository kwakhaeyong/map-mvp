"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, MapNode } from "./ui/primitives";

type ExampleKind = "thinking" | "decision";

type ExampleShowcaseProps = {
  onStart: (topic?: string) => void;
};

const examples = {
  thinking: {
    label: "Thinking MAP",
    subtitle: "생각이 어떻게 자라는지",
    topic: "내 이상형은 어떤 사람일까?",
    description: "결론을 내리기보다 경험과 감정에서 취향, 가치, 관계의 패턴을 발견하는 예시입니다.",
  },
  decision: {
    label: "Decision MAP",
    subtitle: "결정이 어떻게 정리되는지",
    topic: "회사를 계속 다닐까, 이직할까?",
    description: "상황, 선택지, 리스크, 통제 가능성, 실행 계획을 한 장에서 비교하는 예시입니다.",
  },
} as const;

const thinkingFlow = [
  { title: "경험", body: ["첫인상: 편안함", "대화의 리듬", "자연스러운 유머"], type: "feeling" as const },
  { title: "감정", body: ["설렘만으로는 부족함", "일방적 관계는 오래가지 않음"], type: "fact" as const },
  { title: "가치", body: ["배려", "솔직함", "자기 삶의 방향", "안정감"], type: "value" as const },
  { title: "패턴", body: ["말이 잘 통함", "함께 성장함", "각자의 시간 존중", "갈등 후 회복 가능"], type: "option" as const },
  { title: "의미", body: ["생활 방식", "돈에 대한 태도", "가족관", "장기 계획"], type: "uncertainty" as const },
  { title: "나의 변화", body: ["기준 3개 명확히 하기", "좋은 관계를 위해 나도 준비하기"], type: "action" as const },
];

const decisionOptions = [
  { title: "선택지 A · 현 회사에 남기", good: "수입과 리듬이 안정적", risk: "성장감 저하가 반복될 수 있음", check: "역할 조정 가능성" },
  { title: "선택지 B · 외부 이직 준비", good: "새로운 성장 기회를 탐색", risk: "준비 기간과 생활비 부담", check: "채용 시장과 포트폴리오 수준" },
  { title: "선택지 C · 일정 기간 준비 후 판단", good: "충동 결정을 줄임", risk: "미루는 상태가 길어질 수 있음", check: "30일 뒤 판단 기준" },
];

export function ExampleShowcase({ onStart }: ExampleShowcaseProps) {
  const [active, setActive] = useState<ExampleKind>("thinking");
  const [detail, setDetail] = useState<ExampleKind | null>(null);
  const current = detail ?? active;
  const currentExample = examples[current];

  useEffect(() => {
    const onPopState = () => setDetail(null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const openDetail = (kind: ExampleKind) => {
    setActive(kind);
    setDetail(kind);
    window.history.pushState({ example: kind }, "", window.location.pathname);
  };

  const goHome = () => setDetail(null);

  return (
    <section className="map-container pb-12" aria-labelledby="example-showcase-title">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">빈 MAP 대신 바로 보는 대표 예시</p>
          <h2 id="example-showcase-title" className="mt-2 text-2xl font-black tracking-[-0.03em] text-text-primary sm:text-3xl">처음부터 제품 가치가 보이도록 준비했어요.</h2>
        </div>
        <Badge tone="uncertainty">예시 MAP · 실제 데이터 아님</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2" role="tablist" aria-label="예시 MAP 전환">
        {(Object.keys(examples) as ExampleKind[]).map((kind) => (
          <Card key={kind} className={active === kind ? "border-primary" : ""}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-primary">{examples[kind].label}</p>
                <h3 className="mt-1 text-xl font-black text-text-primary">{examples[kind].subtitle}</h3>
              </div>
              <Badge tone={kind === "thinking" ? "feeling" : "fact"}>예시 MAP</Badge>
            </div>
            <p className="mt-3 break-keep text-sm font-semibold leading-6 text-text-secondary">{examples[kind].description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant={active === kind ? "primary" : "secondary"} onClick={() => setActive(kind)} role="tab" aria-selected={active === kind}>전환하기</Button>
              <Button variant="default" onClick={() => openDetail(kind)}>예시 보기</Button>
              <Button variant="ghost" onClick={() => onStart(examples[kind].topic)}>나도 시작하기</Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        {current === "thinking" ? <ThinkingExample detailed={detail === "thinking"} /> : <DecisionExample detailed={detail === "decision"} />}
      </div>

      {detail ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" onClick={() => onStart(currentExample.topic)}>나도 시작하기</Button>
          <Button variant="secondary" size="lg" onClick={() => openDetail(current === "thinking" ? "decision" : "thinking")}>다른 예시 보기</Button>
          <Button variant="ghost" size="lg" onClick={goHome}>처음으로</Button>
        </div>
      ) : null}
    </section>
  );
}

function ThinkingExample({ detailed }: { detailed: boolean }) {
  return (
    <Card className="overflow-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="feeling">Thinking MAP · 예시</Badge>
          <h3 className="mt-3 max-w-2xl break-keep text-2xl font-black tracking-[-0.03em] text-text-primary">내 이상형은 어떤 사람일까?</h3>
          <p className="mt-2 max-w-3xl break-keep text-sm font-semibold leading-6 text-text-secondary">경험 → 감정 → 가치 → 패턴 → 의미 → 나의 변화로 이어지는 서사형 흐름입니다.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <MapNode type="topic" className="lg:col-span-3">중심 · 내 이상형은 어떤 사람일까?</MapNode>
        {thinkingFlow.map((item, index) => (
          <div key={item.title} className="rounded-large border border-border bg-surface p-4 shadow-subtle">
            <div className="mb-3 flex items-center gap-2"><Badge tone={item.type}>{index + 1}</Badge><p className="font-black text-text-primary">{item.title}</p></div>
            <div className="space-y-2">
              {item.body.slice(0, detailed ? item.body.length : 3).map((text) => <MapNode key={text} type={item.type} className="break-keep text-sm">{text}</MapNode>)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DecisionExample({ detailed }: { detailed: boolean }) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="fact">Decision MAP · 예시</Badge>
          <h3 className="mt-3 max-w-2xl break-keep text-2xl font-black tracking-[-0.03em] text-text-primary">회사를 계속 다닐까, 이직할까?</h3>
          <p className="mt-2 max-w-3xl break-keep text-sm font-semibold leading-6 text-text-secondary">상황 분석, 선택지 비교, 영향력×통제력, 실행 계획을 대시보드처럼 정리합니다.</p>
        </div>
        <Badge tone="uncertainty">예시 MAP</Badge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.25fr_1fr]">
        <section className="space-y-4">
          <Panel title="현재 상황과 스트레스 요인" tone="risk" items={["성장감이 줄어듦", "업무는 익숙하지만 에너지가 낮음", "생활비 공백은 부담"]} />
          <Panel title="통제 가능한 것" tone="action" items={["포트폴리오 업데이트", "내부 이동 문의", "채용공고 조사"]} />
          <Panel title="통제하기 어려운 것" tone="uncertainty" items={["채용 시장 속도", "팀의 역할 조정 범위", "면접 결과"]} />
        </section>

        <section className="grid gap-4">
          {decisionOptions.map((option) => (
            <div key={option.title} className="rounded-large border border-border bg-surface p-4 shadow-subtle">
              <h4 className="break-keep font-black text-text-primary">{option.title}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MapNode type="option">장점 · {option.good}</MapNode>
                <MapNode type="risk">위험 · {option.risk}</MapNode>
                <MapNode type="uncertainty">확인 · {option.check}</MapNode>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="rounded-large border border-border bg-surface p-4 shadow-subtle">
            <h4 className="font-black text-text-primary">영향력 × 통제력 매트릭스</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-bold">
              <MapNode type="action">높음×높음<br />30일 준비 루틴</MapNode>
              <MapNode type="uncertainty">높음×낮음<br />시장 상황</MapNode>
              <MapNode type="fact">낮음×높음<br />이력서 정리</MapNode>
              <MapNode type="risk">낮음×낮음<br />막연한 불안</MapNode>
            </div>
          </div>
          <Panel title="현재 가까운 방향" tone="option" items={["일정 기간 준비 후 판단"]} />
          <Panel title="24시간 안에 할 첫 행동" tone="action" items={["관심 공고 5개 저장", "이력서 한 문단 갱신"]} />
          {detailed ? <Panel title="30일 실행 계획과 다시 판단할 조건" tone="value" items={["1주차: 내부 이동 가능성 확인", "2주차: 포트폴리오 보완", "3주차: 지원 3곳", "30일 뒤 성장감·기회·생활비 기준으로 재판단"]} /> : null}
        </section>
      </div>
    </Card>
  );
}

function Panel({ title, items, tone }: { title: string; items: string[]; tone: "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action" }) {
  return (
    <div className="rounded-large border border-border bg-surface p-4 shadow-subtle">
      <h4 className="break-keep font-black text-text-primary">{title}</h4>
      <div className="mt-3 space-y-2">
        {items.map((item) => <MapNode key={item} type={tone} className="break-keep text-sm">{item}</MapNode>)}
      </div>
    </div>
  );
}

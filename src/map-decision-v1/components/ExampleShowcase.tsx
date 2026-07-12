"use client";

import { useState } from "react";
import { Badge, Button, Card, MapNode } from "./ui/primitives";

type ExampleKind = "thinking" | "decision";
type Tone = "fact" | "feeling" | "value" | "option" | "uncertainty" | "risk" | "action";

type ExampleShowcaseProps = {
  onStart: (topic?: string) => void;
};

const examples = {
  thinking: {
    label: "Thinking MAP",
    topic: "내가 끌리는 이상형은 어떤 사람일까?",
    summary: "취향·감정·관계 경험을 펼쳐 반복 패턴과 다음 확인 질문까지 발견하는 편집형 인포그래픽입니다.",
  },
  decision: {
    label: "Decision MAP",
    topic: "회사를 계속 다닐까, 이직할까?",
    summary: "상황·선택지·리스크·통제 가능성·실행 계획을 한 장에서 비교하는 완성형 전략 보드입니다.",
  },
} as const;

const thinkingSections: Array<{ title: string; tone: Tone; items: string[] }> = [
  { title: "첫인상에서 끌리는 요소", tone: "feeling", items: ["말을 편하게 걸 수 있는 분위기", "과하게 꾸미기보다 자연스러운 태도", "처음부터 나를 평가하지 않는 안정감"] },
  { title: "외모 취향", tone: "fact", items: ["깔끔하고 단정한 인상", "표정이 부드럽고 눈을 잘 맞춤", "스타일보다 자기 관리가 느껴지는 사람"] },
  { title: "대화 방식", tone: "option", items: ["질문과 경청이 오가는 대화", "농담 뒤에도 진심을 놓치지 않음", "불편한 주제도 피하지 않고 조율"] },
  { title: "배려와 감정 표현", tone: "value", items: ["작은 약속을 기억함", "미안함과 고마움을 말로 표현", "내 감정을 해결하려 하기보다 먼저 이해"] },
  { title: "가치관", tone: "value", items: ["일과 관계의 균형", "돈과 시간에 대한 책임감", "성장하되 비교에 끌려가지 않음"] },
  { title: "생활 리듬", tone: "fact", items: ["서로의 혼자 있는 시간을 존중", "연락 빈도보다 예측 가능성이 중요", "주말 사용 방식이 크게 충돌하지 않음"] },
  { title: "연애 패턴", tone: "risk", items: ["초반 설렘이 강하면 기준을 낮춤", "상대의 가능성을 내가 대신 증명하려 함", "불안할수록 더 많이 맞추려는 경향"] },
  { title: "장기 관계에서 중요한 기준", tone: "action", items: ["갈등 후 회복 대화가 가능한가", "서로의 커리어와 생활을 지지하는가", "미래 계획을 부담 없이 말할 수 있는가"] },
  { title: "절대 양보하기 어려운 요소", tone: "risk", items: ["무시하거나 비꼬는 말투", "감정 표현을 일방적으로 회피", "약속과 책임을 반복해서 가볍게 여김"] },
  { title: "내가 반복해서 끌리는 패턴", tone: "feeling", items: ["차분하지만 자기 세계가 있는 사람", "대화가 길어질수록 더 궁금해지는 사람", "나를 긴장시키기보다 넓어지게 하는 사람"] },
  { title: "아직 확인할 질문", tone: "uncertainty", items: ["갈등이 생기면 어떻게 회복하는가", "연락·만남 빈도의 기대가 맞는가", "내가 불안을 느낄 때 필요한 표현은 무엇인가"] },
  { title: "내가 먼저 바꿔야 할 부분", tone: "action", items: ["초반 호감과 장기 기준을 분리해서 보기", "상대의 감정보다 내 경계를 먼저 확인", "좋은 사람인지보다 좋은 관계가 되는지 관찰"] },
];

const decisionSections: Array<{ title: string; tone: Tone; items: string[] }> = [
  { title: "현재 상황과 스트레스 요인", tone: "risk", items: ["업무는 익숙하지만 성장감이 낮음", "팀 문화가 에너지를 지속적으로 소모", "생활비 공백 때문에 즉시 퇴사는 부담"] },
  { title: "내가 통제 가능한 요인", tone: "action", items: ["포트폴리오와 이력서 갱신", "내부 이동·역할 조정 문의", "지원 일정과 생활비 버퍼 설계"] },
  { title: "내가 통제하기 어려운 요인", tone: "uncertainty", items: ["채용 시장의 타이밍", "상사의 역할 조정 의지", "면접 결과와 연봉 협상 범위"] },
  { title: "선택지 A: 현재 회사에 남기", tone: "option", items: ["장점: 수입과 생활 리듬 안정", "리스크: 같은 스트레스가 반복될 수 있음", "조건: 역할 조정이 30일 안에 실제로 열리는가"] },
  { title: "선택지 B: 외부 이직", tone: "option", items: ["장점: 성장 환경을 새로 선택", "리스크: 준비 기간·면접 탈락·연봉 변동", "조건: 지원 가능한 공고와 포트폴리오 수준 확인"] },
  { title: "선택지 C: 1년 내 이직 실패 대비", tone: "uncertainty", items: ["장점: 최악의 경우를 미리 낮춤", "리스크: 대비만 하다가 결정이 늦어짐", "조건: 저축·부업·스킬 보완 플랜 확보"] },
  { title: "핵심 메시지", tone: "value", items: ["지금 필요한 건 즉시 퇴사가 아니라 검증 가능한 준비", "남는 선택도 조건이 있어야 의미가 있음", "30일 동안 정보와 선택권을 동시에 늘리기"] },
  { title: "시나리오별 결론과 방향", tone: "fact", items: ["내부 조정 가능: 남되 역할 기준을 문서화", "외부 기회 확인: 지원을 시작하고 제안 비교", "둘 다 낮음: 1년 대비 플랜을 먼저 강화"] },
  { title: "1년 로드맵", tone: "action", items: ["1~3개월: 지원 재료 완성", "4~6개월: 면접·내부 조정 병행", "7~12개월: 제안 비교 또는 현재 회사 조건 재협상"] },
  { title: "24시간 안에 할 첫 행동", tone: "action", items: ["관심 공고 5개 저장", "최근 성과 3개를 이력서 문장으로 바꾸기", "내부 이동 가능성을 물어볼 사람 1명 정하기"] },
  { title: "30일 실행 계획", tone: "action", items: ["1주차: 이력서·포트폴리오 초안", "2주차: 내부 조정 가능성 확인", "3주차: 지원 3곳", "4주차: 남기·이직·대비 기준으로 재판단"] },
  { title: "최종 선택 기준", tone: "value", items: ["성장 가능성", "심리적 회복 가능성", "생활비 안전성", "6개월 뒤 후회가 적은 방향"] },
];

const matrix = [
  { title: "높은 영향 × 높은 통제", body: "지원 재료·네트워킹·내부 조정 요청", tone: "action" as const },
  { title: "높은 영향 × 낮은 통제", body: "채용 시장·팀장 반응·연봉 범위", tone: "uncertainty" as const },
  { title: "낮은 영향 × 높은 통제", body: "자료 정리·일정표·면접 질문 연습", tone: "fact" as const },
  { title: "낮은 영향 × 낮은 통제", body: "막연한 소문·비교 불안·타인의 속도", tone: "risk" as const },
];

export function ExampleShowcase({ onStart }: ExampleShowcaseProps) {
  const [active, setActive] = useState<ExampleKind>("decision");
  const current = examples[active];

  return (
    <section className="w-full" aria-labelledby="example-showcase-title">
      <Card className="overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <Badge tone="uncertainty">예시 결과물</Badge>
            <h2 id="example-showcase-title" className="mt-3 break-keep text-2xl font-black tracking-[-0.03em] text-text-primary sm:text-3xl">완성된 MAP은 이렇게 보입니다.</h2>
            <p className="mt-2 break-keep text-sm font-bold leading-6 text-text-secondary">이런 결과를 약 5분 안에 만듭니다. 예시는 실제 세션/localStorage와 분리되어 있으며, 시작하면 사용자 MAP으로 교체됩니다.</p>
          </div>
          <Button variant="primary" size="lg" onClick={() => onStart(current.topic)}>나도 시작하기</Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="tablist" aria-label="예시 결과물 전환">
          {(Object.keys(examples) as ExampleKind[]).map((kind) => (
            <Button
              key={kind}
              type="button"
              role="tab"
              aria-selected={active === kind}
              variant={active === kind ? "default" : "secondary"}
              onClick={() => setActive(kind)}
              className={`h-auto min-h-0 flex-col items-start rounded-large p-4 text-left ${active === kind ? "border-primary bg-surface-elevated" : ""}`}
            >
              <span className="text-sm font-black text-primary">{examples[kind].label}</span>
              <span className="mt-1 block break-keep text-lg font-black text-text-primary">{examples[kind].topic}</span>
              <span className="mt-2 block break-keep text-sm font-semibold leading-6 text-text-secondary">{examples[kind].summary}</span>
            </Button>
          ))}
        </div>

        <div className="mt-5" role="tabpanel">
          {active === "thinking" ? <ThinkingExample /> : <DecisionExample />}
        </div>
      </Card>
    </section>
  );
}

function ThinkingExample() {
  return (
    <div className="rounded-large border border-border bg-background-subtle p-3 sm:p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-large border border-border bg-surface p-4 shadow-subtle">
          <Badge tone="feeling">Thinking MAP · 편집형 인포그래픽</Badge>
          <h3 className="mt-3 break-keep text-2xl font-black tracking-[-0.03em] text-text-primary">내가 끌리는 이상형은 어떤 사람일까?</h3>
          <p className="mt-2 break-keep text-sm font-semibold leading-6 text-text-secondary">단순 방사형 노드가 아니라, 취향의 단서가 관계 기준과 자기 변화 과제로 이어지는 흐름을 보여줍니다.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {thinkingSections.map((section) => <InsightPanel key={section.title} {...section} compact />)}
          </div>
        </div>
        <aside className="grid gap-4">
          <div className="rounded-large border border-primary bg-surface-elevated p-4 shadow-floating">
            <Badge tone="value">최종 핵심 인사이트</Badge>
            <p className="mt-3 break-keep text-xl font-black leading-8 text-text-primary">나는 ‘강한 설렘’보다 편안하게 말할 수 있고, 갈등 후 회복 대화를 할 수 있는 사람에게 오래 끌립니다.</p>
            <div className="mt-4 grid gap-2">
              <MapNode type="feeling">반복 패턴: 차분함 + 자기 세계</MapNode>
              <MapNode type="risk">주의: 가능성을 대신 증명하려는 습관</MapNode>
              <MapNode type="action">다음 행동: 초반 호감과 장기 기준을 분리해 기록</MapNode>
            </div>
          </div>
          <div className="rounded-large border border-border bg-surface p-4 shadow-subtle">
            <h4 className="font-black text-text-primary">확장 흐름</h4>
            <div className="mt-3 grid gap-2 text-sm font-bold text-text-secondary">
              <span>첫인상 → 대화 방식 → 배려 표현</span>
              <span>외모 취향 → 생활 리듬 → 장기 기준</span>
              <span>연애 패턴 → 양보 불가 요소 → 내가 바꿀 부분</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DecisionExample() {
  return (
    <div className="rounded-large border border-border bg-background-subtle p-3 sm:p-4">
      <div className="rounded-large border border-border bg-surface p-4 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge tone="fact">Decision MAP · 전략 보드</Badge>
            <h3 className="mt-3 break-keep text-2xl font-black tracking-[-0.03em] text-text-primary">회사를 계속 다닐까, 이직할까?</h3>
            <p className="mt-2 max-w-3xl break-keep text-sm font-semibold leading-6 text-text-secondary">노드 몇 개가 아니라, 현재 상황부터 24시간 첫 행동까지 이어지는 A3 수준의 완성형 분석 보드입니다.</p>
          </div>
          <Badge tone="action">기본 노출 예시</Badge>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <section className="grid gap-3">
            {decisionSections.slice(0, 3).map((section) => <InsightPanel key={section.title} {...section} />)}
            <div className="rounded-large border border-border bg-surface-elevated p-4 shadow-subtle">
              <h4 className="font-black text-text-primary">영향력 × 통제력 매트릭스</h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {matrix.map((item) => <MapNode key={item.title} type={item.tone} className="break-keep text-xs"><strong>{item.title}</strong><br />{item.body}</MapNode>)}
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            {decisionSections.slice(3, 8).map((section) => <InsightPanel key={section.title} {...section} />)}
          </section>

          <section className="grid gap-3">
            {decisionSections.slice(8).map((section) => <InsightPanel key={section.title} {...section} />)}
            <div className="rounded-large border border-primary bg-surface-elevated p-4 shadow-floating">
              <Badge tone="value">마지막 한 문장</Badge>
              <p className="mt-3 break-keep text-lg font-black leading-7 text-text-primary">지금은 퇴사를 확정할 때가 아니라, 30일 안에 남을 조건과 떠날 근거를 동시에 만드는 때입니다.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InsightPanel({ title, tone, items, compact = false }: { title: string; tone: Tone; items: string[]; compact?: boolean }) {
  return (
    <div className="rounded-large border border-border bg-surface-elevated p-4 shadow-subtle">
      <h4 className="break-keep font-black text-text-primary">{title}</h4>
      <div className={`mt-3 grid gap-2 ${compact ? "" : "sm:grid-cols-1"}`}>
        {items.map((item) => <MapNode key={item} type={tone} className="break-keep text-xs sm:text-sm">{item}</MapNode>)}
      </div>
    </div>
  );
}

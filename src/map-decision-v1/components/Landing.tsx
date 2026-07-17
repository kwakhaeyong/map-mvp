import {
  Badge,
  Button,
  Card,
  ResponseChip,
  VoiceButton,
} from "./ui/primitives";

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="MAP Decision">
      <span className="grid size-10 place-items-center rounded-medium border border-primary bg-surface-elevated text-sm font-black text-primary shadow-floating">
        M
      </span>
      <span className="text-base font-black tracking-[-0.03em]">MAP Decision</span>
    </div>
  );
}

const topics = ["내 이상형은?", "진로를 정하고 싶어", "요즘 내가 지쳐", "부업을 시작할까?"];

const thinkingTopics = [
  { title: "이상형 & 관계", subtitle: "끌림과 안정감을 함께 주는 사람", icon: "♡", tone: "from-pink-100 to-rose-50", topic: "내가 원하는 남성 이상형은 어떤 사람일까?" },
  { title: "커리어 & 진로", subtitle: "좋아하고 잘하는 일을 찾는 길", icon: "↗", tone: "from-sky-100 to-blue-50", topic: "내 진로와 커리어 방향을 정리하고 싶어" },
  { title: "자기개발 & 성장", subtitle: "매일 1%씩 더 나은 나", icon: "✦", tone: "from-violet-100 to-purple-50", topic: "내 성장 계획을 만들고 싶어" },
  { title: "건강 & 운동", subtitle: "몸과 마음의 지속 가능한 루틴", icon: "+", tone: "from-cyan-100 to-teal-50", topic: "건강과 운동 루틴을 만들고 싶어" },
  { title: "여행 & 경험", subtitle: "새로운 곳에서 나를 발견하기", icon: "✈", tone: "from-indigo-100 to-sky-50", topic: "나에게 맞는 여행과 경험을 정리하고 싶어" },
  { title: "취미 & 즐거움", subtitle: "일상에 기쁨을 더하는 시간", icon: "☕", tone: "from-rose-100 to-orange-50", topic: "나에게 맞는 취미를 찾고 싶어" },
  { title: "인간관계 & 소통", subtitle: "더 깊고 편안한 관계 만들기", icon: "◎", tone: "from-emerald-100 to-green-50", topic: "인간관계와 소통을 정리하고 싶어" },
  { title: "학업 & 자격증", subtitle: "배움을 성취로 연결하는 계획", icon: "□", tone: "from-fuchsia-100 to-pink-50", topic: "학업과 자격증 계획을 세우고 싶어" },
  { title: "창업 & 부업", subtitle: "작게 실험하고 크게 키우는 길", icon: "△", tone: "from-orange-100 to-amber-50", topic: "창업이나 부업 아이디어를 정리하고 싶어" },
];

type ShowcaseCardProps = {
  kicker: string;
  title: string;
  description: string;
  badge: string;
  badgeTone: "action" | "value";
  imageSrc: string;
  imageAlt: string;
  imageLabel: string;
  startTopic: string;
  onStart: (topic?: string) => void;
};

function ShowcaseCard({ kicker, title, description, badge, badgeTone, imageSrc, imageAlt, imageLabel, startTopic, onStart }: ShowcaseCardProps) {
  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="kicker">{kicker}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl">{title}</h2>
          <p className="mt-2 break-keep text-sm font-semibold leading-6 text-text-secondary">{description}</p>
        </div>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>
      <a href={imageSrc} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-large border border-border bg-surface-elevated shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20" aria-label={imageLabel}>
        <img src={imageSrc} alt={imageAlt} className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]" loading="eager" />
      </a>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="default" size="lg" onClick={() => onStart(startTopic)}>나도 이런 MAP 만들기</Button>
        <a href={imageSrc} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-pill border border-border bg-surface px-5 text-sm font-black shadow-subtle transition hover:-translate-y-0.5 hover:shadow-floating">원본 크게 보기</a>
      </div>
    </Card>
  );
}

function TopicGallery({ onStart }: { onStart: (topic?: string) => void }) {
  return (
    <section className="map-container py-16 sm:py-20" aria-labelledby="thinking-gallery-title">
      <div className="mx-auto max-w-3xl text-center">
        <p className="kicker">Thinking MAP 둘러보기</p>
        <h2 id="thinking-gallery-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">지금의 나를 이해하는 9가지 지도</h2>
        <p className="mt-4 break-keep text-base font-semibold leading-7 text-text-secondary">가벼운 관심사부터 오래 고민한 문제까지, 대화를 시작하면 나만의 완성형 MAP으로 이어집니다.</p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {thinkingTopics.map((item) => (
          <button key={item.title} type="button" onClick={() => onStart(item.topic)} className={`group min-h-56 rounded-large border border-border bg-gradient-to-br ${item.tone} p-5 text-left shadow-subtle transition duration-300 hover:-translate-y-1 hover:shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20`}>
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-12 place-items-center rounded-full border border-white/70 bg-white/75 text-xl font-black shadow-subtle">{item.icon}</span>
              <span className="rounded-pill border border-white/70 bg-white/70 px-3 py-1 text-xs font-black text-text-muted">Thinking MAP</span>
            </div>
            <h3 className="mt-8 text-xl font-black tracking-[-0.03em]">{item.title}</h3>
            <p className="mt-2 break-keep text-sm font-semibold leading-6 text-text-secondary">{item.subtitle}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-black">이 MAP 시작하기 <span className="transition group-hover:translate-x-1">→</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function Landing({ hasDraft, onStart, onResume, onDemo, saveState = "saved" }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void; onDemo: () => void; saveState?: "loading" | "saved" | "saving"; }) {
  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2">
          <Badge tone={saveState === "saving" ? "default" : "success"}>{saveState === "loading" ? "불러오는 중" : saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</Badge>
          {hasDraft ? <Button variant="secondary" onClick={onResume}>이어서 하기</Button> : null}
        </div>
      </header>

      <section className="map-container grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,.74fr)_minmax(34rem,1.26fr)] lg:gap-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="kicker">말하면, 생각이 보입니다.</p>
          <h1 className="mt-4 text-balance break-keep text-[2.25rem] font-black leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-[3.5rem]">복잡한 생각을,<br />한 장의 나로.</h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-lg font-medium leading-8 text-text-secondary">말하거나 하나만 골라보세요.{`\n`}5분 후, 생각과 선택지를 완성된 MAP으로 받아볼 수 있어요.</p>
          <Card className="mt-8 p-3 sm:p-4">
            <VoiceButton className="min-h-24 w-full justify-start px-6 text-left text-lg" onClick={() => onStart()}>
              <span className="text-2xl">🎙</span>
              <span><span className="block">말로 시작하기</span><span className="block text-sm font-semibold text-primary-foreground/80">마이크 권한이 없어도 입력으로 이어갈 수 있어요.</span></span>
            </VoiceButton>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" onClick={() => onStart()}>직접 입력하기</Button>
              <Button variant="default" size="lg" onClick={onDemo}>30초 체험해보기</Button>
            </div>
            {hasDraft ? <Button className="mt-3 w-full" variant="default" onClick={onResume}>저장된 이야기 이어서 하기</Button> : null}
          </Card>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="빠른 시작">{topics.map((topic) => <ResponseChip key={topic} onClick={() => onStart(topic)}>{topic}</ResponseChip>)}</div>
          <div className="mt-5 grid gap-2 text-center text-xs font-bold text-text-muted sm:grid-cols-4">{["로그인 없이 시작", "자동 저장", "언제든 이어서 수정", "첫 변화는 30초 안에"].map((item) => <span key={item} className="rounded-pill border border-border bg-surface px-3 py-2 shadow-subtle">{item}</span>)}</div>
        </div>

        <ShowcaseCard kicker="대표 Thinking MAP · 여성 타깃" title="나에게 맞는 이상형을 결과처럼 보기" description="끌리는 순간부터 장기 관계 적합도, 필수·선호 기준, 그린·레드 플래그와 30일 탐색 로드맵까지 한 장에 정리합니다." badge="대표 결과물" badgeTone="value" imageSrc="/showcases/ideal-partner-thinking-map.png" imageAlt="여성의 남성 이상형 Thinking MAP 완성 결과물" imageLabel="여성의 남성 이상형 Thinking MAP 원본 크게 보기" startTopic="내가 원하는 남성 이상형은 어떤 사람일까?" onStart={onStart} />
      </section>

      <TopicGallery onStart={onStart} />

      <section className="map-container py-16 sm:py-20" aria-labelledby="decision-title">
        <div className="mb-8 max-w-3xl">
          <p className="kicker">Decision MAP</p>
          <h2 id="decision-title" className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">생각을 정리한 뒤, 선택까지 이어집니다.</h2>
          <p className="mt-4 break-keep text-base font-semibold leading-7 text-text-secondary">선택지, 리스크, 통제 가능 영역, 시나리오와 첫 행동을 한눈에 볼 수 있습니다.</p>
        </div>
        <ShowcaseCard kicker="Decision MAP 예시 · 완성 결과물" title="이직 고민 정리 MAP & 행동 계획" description="현재 상황, 선택지, 영향력 매트릭스, 1년 로드맵과 첫 행동까지 한 장에 정리합니다." badge="대표 Decision MAP" badgeTone="action" imageSrc="/showcases/career-decision-map.png.png" imageAlt="이직 고민을 선택지와 실행 계획으로 정리한 완성형 Decision MAP" imageLabel="이직 Decision MAP 원본 크게 보기" startTopic="이직할까?" onStart={onStart} />
      </section>

      <section className="map-container pb-20">
        <div className="rounded-large border border-border bg-primary px-6 py-10 text-center text-primary-foreground shadow-floating sm:px-10 sm:py-14">
          <p className="text-sm font-black text-primary-foreground/75">지금 떠오르는 생각 하나면 충분해요.</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">당신의 첫 MAP을 시작해보세요.</h2>
          <div className="mx-auto mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
            <Button variant="secondary" size="lg" onClick={() => onStart()}>직접 입력하기</Button>
            <Button variant="secondary" size="lg" onClick={onDemo}>30초 체험하기</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

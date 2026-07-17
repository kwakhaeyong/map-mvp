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

const topics = ["내 이상형은?", "이직할까?", "먼저 연락할까?", "휴학할까?"];

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

function ShowcaseCard({
  kicker,
  title,
  description,
  badge,
  badgeTone,
  imageSrc,
  imageAlt,
  imageLabel,
  startTopic,
  onStart,
}: ShowcaseCardProps) {
  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="kicker">{kicker}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 break-keep text-sm font-semibold leading-6 text-text-secondary">
            {description}
          </p>
        </div>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>

      <a
        href={imageSrc}
        target="_blank"
        rel="noreferrer"
        className="group block overflow-hidden rounded-large border border-border bg-surface-elevated shadow-floating focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={imageLabel}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          loading="eager"
        />
      </a>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="default" size="lg" onClick={() => onStart(startTopic)}>
          나도 이런 MAP 만들기
        </Button>
        <a
          href={imageSrc}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-pill border border-border bg-surface px-5 text-sm font-black shadow-subtle transition hover:-translate-y-0.5 hover:shadow-floating"
        >
          원본 크게 보기
        </a>
      </div>
    </Card>
  );
}

function MapShowcaseGallery({ onStart }: { onStart: (topic?: string) => void }) {
  return (
    <div className="grid gap-5" aria-label="완성형 MAP 결과물 예시">
      <ShowcaseCard
        kicker="Thinking MAP 예시 · 여성 타깃"
        title="여성의 남성 이상형 Thinking MAP"
        description="끌리는 순간부터 장기 관계 적합도, 필수·선호·타협 기준, 그린·레드 플래그, 30일 탐색 로드맵과 첫 행동까지 한 장에 정리합니다."
        badge="대표 Thinking MAP"
        badgeTone="value"
        imageSrc="/showcases/ideal-partner-thinking-map.png"
        imageAlt="여성이 자신과 잘 맞는 남성 이상형을 끌림, 관계 적합도, 필수 조건, 선호 조건, 타협 가능 조건, 반복 패턴, 그린 플래그, 주의 신호, 30일 관계 탐색 로드맵과 24시간 첫 행동으로 정리한 Thinking MAP"
        imageLabel="여성의 남성 이상형 Thinking MAP 원본 크게 보기"
        startTopic="내가 원하는 남성 이상형은 어떤 사람일까?"
        onStart={onStart}
      />

      <ShowcaseCard
        kicker="Decision MAP 예시 · 완성 결과물"
        title="이직 고민 정리 MAP & 행동 계획"
        description="현재 상황, 선택지, 영향력 매트릭스, 1년 로드맵과 첫 행동까지 한 장에 정리합니다."
        badge="대표 Decision MAP"
        badgeTone="action"
        imageSrc="/showcases/career-decision-map.png.png"
        imageAlt="이직 고민을 스트레스 요인, 통제 가능 영역, 선택지, 영향력 매트릭스, 시나리오, 1년 로드맵과 행동 계획으로 정리한 완성형 Decision MAP"
        imageLabel="이직 Decision MAP 원본 크게 보기"
        startTopic="이직할까?"
        onStart={onStart}
      />
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
            <Button variant="secondary" onClick={onResume}>이어서 하기</Button>
          ) : null}
        </div>
      </header>

      <section className="map-container grid items-start gap-10 py-10 lg:grid-cols-[minmax(0,.72fr)_minmax(36rem,1.28fr)] lg:gap-14 lg:py-16">
        <div className="max-w-2xl lg:sticky lg:top-8">
          <p className="kicker">말하면, 생각이 보입니다.</p>
          <h1 className="mt-4 text-balance break-keep text-[2.125rem] font-black leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem]">
            지금 가장 마음에 걸리는 건 뭐예요?
          </h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-lg font-medium leading-8 text-text-secondary">
            말하거나 하나만 골라보세요.{`\n`}5분 후, 생각과 선택지를 완성된 한 장의 MAP으로 받아볼 수 있어요.
          </p>

          <Card className="mt-8 p-3 sm:p-4">
            <VoiceButton className="min-h-24 w-full justify-start px-6 text-left text-lg" onClick={() => onStart()}>
              <span className="text-2xl">🎙</span>
              <span>
                <span className="block">말로 시작하기</span>
                <span className="block text-sm font-semibold text-primary-foreground/80">마이크 권한이 없어도 입력으로 이어갈 수 있어요.</span>
              </span>
            </VoiceButton>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" onClick={() => onStart()}>직접 입력하기</Button>
              <Button variant="default" size="lg" onClick={onDemo}>30초 체험해보기</Button>
            </div>
            {hasDraft ? (
              <Button className="mt-3 w-full" variant="default" onClick={onResume}>저장된 이야기 이어서 하기</Button>
            ) : null}
          </Card>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="빠른 시작">
            {topics.map((topic) => (
              <ResponseChip key={topic} onClick={() => onStart(topic)}>{topic}</ResponseChip>
            ))}
          </div>
          <div className="mt-5 grid gap-2 text-center text-xs font-bold text-text-muted sm:grid-cols-4">
            {["로그인 없이 시작", "자동 저장", "언제든 이어서 수정", "첫 변화는 30초 안에"].map((item) => (
              <span key={item} className="rounded-pill border border-border bg-surface px-3 py-2 shadow-subtle">{item}</span>
            ))}
          </div>
        </div>

        <MapShowcaseGallery onStart={onStart} />
      </section>
    </main>
  );
}

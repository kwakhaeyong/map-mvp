import { createSession } from "../engine/session";
import { Badge, Button, Card, ResponseChip, VoiceButton } from "./ui/primitives";
import { MapCanvas } from "./MapCanvas";

export function Brand() {
  return <div className="flex items-center gap-3" aria-label="MAP Decision"><span className="grid size-10 place-items-center rounded-medium border border-primary bg-surface-elevated text-sm font-black text-primary shadow-floating">M</span><span className="text-base font-black tracking-[-0.03em]">MAP Decision</span></div>;
}

const topics = ["이직할까?", "먼저 연락할까?", "휴학할까?"];

export function Landing({ hasDraft, onStart, onResume, onDemo, saveState = "saved" }: { hasDraft: boolean; onStart: (topic?: string) => void; onResume: () => void; onDemo: () => void; saveState?: "loading" | "saved" | "saving" }) {
  return (
    <main className="min-h-screen px-4 py-4 text-text-primary sm:px-6 lg:px-8">
      <header className="map-container flex items-center justify-between rounded-pill border border-border bg-surface px-4 py-3 shadow-floating backdrop-blur-xl">
        <Brand />
        <div className="flex items-center gap-2"><Badge tone={saveState === "saving" ? "default" : "success"}>{saveState === "loading" ? "불러오는 중" : saveState === "saving" ? "자동 저장 중" : "자동 저장됨"}</Badge>{hasDraft ? <Button variant="secondary" onClick={onResume}>이어서 하기</Button> : null}</div>
      </header>

      <section className="map-container grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,.95fr)_minmax(26rem,1.05fr)] lg:gap-16 lg:py-16">
        <div className="max-w-2xl">
          <p className="kicker">말하면, 생각이 보입니다.</p>
          <h1 className="mt-4 text-balance break-keep text-[2.125rem] font-black leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[3.25rem]">지금 가장 마음에 걸리는 건 뭐예요?</h1>
          <p className="mt-5 max-w-xl whitespace-pre-line break-keep text-lg font-medium leading-8 text-text-secondary">말하거나 하나만 골라보세요.{`\n`}생각의 흐름을 바로 보여드릴게요.</p>

          <Card className="mt-8 p-3 sm:p-4">
            <VoiceButton className="min-h-24 w-full justify-start px-6 text-left text-lg" onClick={() => onStart()}><span className="text-2xl">🎙</span><span><span className="block">말로 시작하기</span><span className="block text-sm font-semibold text-primary-foreground/80">마이크 권한이 없어도 입력으로 이어갈 수 있어요.</span></span></VoiceButton>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" size="lg" onClick={() => onStart()}>직접 입력하기</Button>
              <Button variant="default" size="lg" onClick={onDemo}>30초 체험해보기</Button>
            </div>
            {hasDraft ? <Button className="mt-3 w-full" variant="default" onClick={onResume}>저장된 이야기 이어서 하기</Button> : null}
          </Card>

          <div className="mt-5 flex flex-wrap gap-2" aria-label="빠른 시작">
            {topics.map((topic) => <ResponseChip key={topic} onClick={() => onStart(topic)}>{topic}</ResponseChip>)}
          </div>
          <div className="mt-5 grid gap-2 text-center text-xs font-bold text-text-muted sm:grid-cols-4">
            {["로그인 없이 시작", "자동 저장", "언제든 이어서 수정", "첫 변화는 30초 안에"].map((item) => <span key={item} className="rounded-pill border border-border bg-surface px-3 py-2 shadow-subtle">{item}</span>)}
          </div>
        </div>
        <MapCanvas session={createSession("이직할까?")} sample compact className="mx-auto w-full" />
      </section>
    </main>
  );
}

"use client";

import { MapOutputType, MapSession, NodeKind } from "../types";
import { MapCanvas } from "./MapCanvas";
import { demoPaymentProvider, localAuthProvider, plannedPaymentProviders, plannedSocialAuthProviders } from "../engine/integration-providers";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 90) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

export function Result({ session, onContinue, onReset, onSelectType }: { session: MapSession; onContinue: () => void; onReset: () => void; onSelectType: (type: MapOutputType) => void }) {
  const byKind = (kind: NodeKind) => session.nodes.filter((node) => node.kind === kind).map((node) => node.text).join("\n") || "아직 더 이야기하면 선명해져요.";
  const direction = byKind("direction") !== "아직 더 이야기하면 선명해져요." ? byKind("direction") : "결론을 서두르기보다 확인할 내용을 채우며 움직이는 방향";
  const recommended = session.nodes.some((node) => ["option", "risk", "missing", "direction"].includes(node.kind)) ? "decision" : "thinking";
  const safeReset = () => { if (window.confirm("새 MAP을 만들까요? 취소하면 지금 결과로 돌아옵니다.")) onReset(); };

  return (
    <main className="min-h-screen px-4 py-6 text-[var(--map-navy)] print:bg-white">
      <section className="map-container">
        <header className="map-card p-6 sm:p-8 print:shadow-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl"><p className="kicker">이야기해주신 내용을 한 장으로 정리했어요.</p><h1 className="mt-2 text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl">{session.preferredMapType === "decision" ? "의사결정 MAP" : "생각정리 MAP"}</h1><p className="mt-4 break-keep text-lg font-medium leading-8 text-[var(--map-muted)]">현재 마음은 <strong className="font-extrabold text-[var(--map-navy)]">{shorten(direction, 62)}</strong> 쪽에 가까워 보여요. 정답을 대신 고르기보다, 말한 내용과 확인할 부분을 구분해두었어요.</p></div>
            <div className="flex flex-wrap gap-2 print:hidden"><button className="btn btn-primary" onClick={onContinue}>더 이야기하기</button><button className="btn btn-secondary" onClick={() => window.print()}>인쇄 / PDF</button><button className="btn btn-ghost" onClick={safeReset}>새 MAP</button></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2 print:hidden"><button className={cx("btn", session.preferredMapType !== "decision" ? "btn-primary" : "btn-secondary")} onClick={() => onSelectType("thinking")}>생각정리 MAP</button><button className={cx("btn", session.preferredMapType === "decision" ? "btn-primary" : "btn-secondary")} onClick={() => onSelectType("decision")}>의사결정 MAP</button><span className="rounded-full bg-white/70 px-4 py-3 text-sm font-bold text-[var(--map-muted)]">추천: {recommended === "decision" ? "의사결정 MAP" : "생각정리 MAP"}</span></div>
        </header>

        <div className="mt-6"><MapCanvas session={session} /></div>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <ResultCard title="내가 직접 말한 내용" body={session.nodes.filter((node) => node.confidence !== "ai").slice(0, 7).map((node) => `• ${node.label}: ${node.text}`).join("\n") || "아직 직접 말한 조각이 적어요."} />
          <ResultCard title="대화 속에서 정리된 내용" body={`지금 보이는 흐름은 ${session.preferredMapType === "decision" ? "선택지와 걸리는 부분" : "핵심과 마음의 기준"}을 중심으로 정리되어 있어요.\n\n현재 가까운 방향: ${shorten(direction)}`} />
          <ResultCard title="아직 확인할 내용" body={byKind("missing")} />
          <ResultCard title="선택지와 가능성" body={`${byKind("option")}\n\n${byKind("benefit")}`} />
          <ResultCard title="걸리는 부분" body={byKind("risk")} />
          <ResultCard dark title="24시간 안에 할 첫 행동" body={byKind("action") !== "아직 더 이야기하면 선명해져요." ? byKind("action") : "오늘 안에 확인할 정보 하나를 적고, 믿을 만한 사람 한 명에게 지금 고민을 10분만 설명해보세요."} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2 print:hidden">
          <article className="map-card p-5"><h2 className="text-xl font-extrabold">이 MAP을 다른 기기에서도 다시 보고 싶나요?</h2><p className="mt-2 font-medium leading-7 text-[var(--map-muted)]">지금은 로그인 없이 이 브라우저에 저장돼요. 실제 소셜 저장은 인증 백엔드 연결 후에만 켭니다.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{plannedSocialAuthProviders.map((provider) => <button key={provider.id} className="btn btn-ghost justify-center opacity-70" disabled>{provider.label} · 준비 중</button>)}<button className="btn btn-primary sm:col-span-2" onClick={() => localAuthProvider.saveCurrentDevice(session).then((result) => window.alert(result.message))}>지금은 이 기기에만 저장</button></div></article>
          <article className="map-card p-5"><h2 className="text-xl font-extrabold">프리미엄 내보내기는 나중에</h2><p className="mt-2 font-medium leading-7 text-[var(--map-muted)]">첫 MAP, 기본 시각 결과, 인쇄/PDF는 무료입니다. 결제 버튼은 실제 연동 전 성공처럼 보이지 않게 막아두었습니다.</p><div className="mt-4 flex flex-wrap gap-2">{plannedPaymentProviders.map((provider) => <span key={provider.id} className="rounded-full border border-[var(--map-line)] bg-white/60 px-3 py-2 text-sm font-bold text-[var(--map-muted)]">{provider.label} 준비 중</span>)}</div><button className="btn btn-secondary mt-4" onClick={() => demoPaymentProvider.requestUpgrade("프리미엄 내보내기").then((result) => window.alert(result.message))}>연동 요구사항 보기</button></article>
        </section>
      </section>
    </main>
  );
}

function ResultCard({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  return <article className={cx("rounded-[26px] border p-6 shadow-[var(--map-shadow-sm)]", dark ? "border-[var(--map-navy)] bg-[var(--map-navy)] text-white" : "border-white/80 bg-white/78 text-[var(--map-navy)]")}><h2 className="text-lg font-extrabold">{title}</h2><p className={cx("mt-3 whitespace-pre-line break-keep leading-7", dark ? "font-semibold text-white/88" : "font-medium text-[var(--map-muted)]")}>{body}</p></article>;
}

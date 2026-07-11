"use client";

import { MapOutputType, MapSession, NodeKind } from "../types";
import { MapCanvas } from "./MapCanvas";
import { demoPaymentProvider, localAuthProvider } from "../engine/integration-providers";

function cx(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function shorten(text: string, length = 80) { return text.trim().length > length ? `${text.trim().slice(0, length)}…` : text.trim(); }

export function Result({ session, onContinue, onReset, onSelectType }: { session: MapSession; onContinue: () => void; onReset: () => void; onSelectType: (type: MapOutputType) => void }) {
  const byKind = (kind: NodeKind) => session.nodes.filter((node) => node.kind === kind).map((node) => node.text).join("\n") || "아직 더 이야기하면 선명해져요.";
  const missing = byKind("missing");
  const action = byKind("action");
  const direction = byKind("direction") !== "아직 더 이야기하면 선명해져요." ? byKind("direction") : "즉시 결론보다 조건을 확인하면서 가능성을 검증하는 방향";
  const recommended = session.nodes.some((node) => ["option", "risk", "missing", "direction"].includes(node.kind)) ? "decision" : "thinking";

  return (
    <main className="min-h-screen bg-[#fbf7ef] px-4 py-6 text-slate-950 print:bg-white">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-white/90 p-6 shadow-xl print:shadow-none">
          <p className="font-black text-blue-700">이야기해주신 내용을 한 장으로 정리했어요.</p>
          <h1 className="mt-2 text-4xl font-black sm:text-6xl">{session.preferredMapType === "decision" ? "의사결정 MAP" : "생각정리 MAP"}</h1>
          <p className="mt-3 font-bold text-slate-500">사용자가 직접 말한 내용, 대화를 통해 정리된 내용, 아직 확인이 필요한 내용을 구분했어요. 지금 흐름에는 {recommended === "decision" ? "의사결정 MAP" : "생각정리 MAP"}이 가장 잘 맞아 보여요.</p>
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <button className="rounded-full bg-blue-700 px-5 py-3 font-black text-white" onClick={() => onSelectType("thinking")}>생각정리 MAP</button>
            <button className="rounded-full bg-slate-950 px-5 py-3 font-black text-white" onClick={() => onSelectType("decision")}>의사결정 MAP</button>
            <button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onContinue}>다시 이야기하기</button>
            <button className="rounded-full border bg-white px-5 py-3 font-black" onClick={onContinue}>특정 내용 수정하기</button>
            <button className="rounded-full border bg-white px-5 py-3 font-black" onClick={() => window.print()}>인쇄 / PDF 저장</button>
            <button className="rounded-full border bg-white px-5 py-3 font-black opacity-70" title="안정적인 이미지 저장은 내보내기 서비스 연동 후 제공됩니다" onClick={() => demoPaymentProvider.requestUpgrade("이미지 저장").then((result) => window.alert(result.message))}>이미지 저장 준비 중</button>
            <button className="rounded-full bg-rose-600 px-5 py-3 font-black text-white" onClick={onReset}>새 MAP 만들기</button>
          </div>
        </header>
        <div className="mt-6"><MapCanvas session={session} /></div>
        <section className="mt-6 grid gap-4 lg:grid-cols-2 print:hidden">
          <article className="rounded-[1.5rem] bg-white/85 p-5 shadow-xl"><h2 className="font-black">이 MAP을 다른 기기에서도 다시 보고 싶나요?</h2><p className="mt-2 font-semibold text-slate-600">지금은 로그인 없이 이 브라우저에 임시 저장돼요. Google, Apple, Kakao, Naver 저장은 인증 백엔드 연결 뒤 켤 수 있게 분리해두었습니다.</p><button className="mt-3 rounded-full bg-slate-950 px-4 py-2 font-black text-white" onClick={() => localAuthProvider.saveCurrentDevice(session).then((result) => window.alert(result.message))}>지금은 이 기기에만 저장</button></article>
          <article className="rounded-[1.5rem] bg-white/85 p-5 shadow-xl"><h2 className="font-black">프리미엄 내보내기</h2><p className="mt-2 font-semibold text-slate-600">기본 MAP과 인쇄/PDF는 무료입니다. 결제 연동 전에는 빠른 결제 버튼을 공개하지 않습니다.</p><button className="mt-3 rounded-full border bg-white px-4 py-2 font-black" onClick={() => demoPaymentProvider.requestUpgrade("프리미엄 내보내기").then((result) => window.alert(result.message))}>연동 요구사항 보기</button></article>
        </section>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ResultCard title="내가 직접 말한 내용" body={session.nodes.filter((node) => node.confidence !== "ai").slice(0, 7).map((node) => `• ${node.label}: ${node.text}`).join("\n") || "아직 직접 말한 조각이 적어요."} />
          <ResultCard title="대화를 통해 정리된 내용" body={`지금 이야기는 ‘생각정리 MAP’으로 먼저 보고, 그다음 ‘의사결정 MAP’까지 이어가면 좋을 것 같아요.\n\n현재 마음은 ${shorten(direction)} 쪽에 가까워 보여요.`} />
          <ResultCard title="아직 확인이 필요한 내용" body={missing} />
          <ResultCard title="선택지와 장점" body={`${byKind("option")}\n\n${byKind("benefit")}`} />
          <ResultCard title="리스크" body={byKind("risk")} />
          <ResultCard dark title="24시간 첫 행동" body={action !== "아직 더 이야기하면 선명해져요." ? action : "오늘 안에 관련 조건 하나를 확인하거나, 믿을 만한 사람 한 명에게 현재 고민을 10분만 설명해보세요."} />
        </div>
        <article className="mt-6 rounded-[2rem] bg-slate-950 p-7 text-white">
          <h2 className="text-2xl font-black">현실적인 현재 방향</h2>
          <p className="mt-4 whitespace-pre-line text-xl font-bold leading-9">현재 이야기만 보면 중요한 기준을 더 확인하면서 움직이는 것이 좋아 보여요. 다만 이 MAP은 결정을 대신하지 않아요. 확인할 정보가 채워졌을 때 다시 보고, 방향이 여전히 맞는지 검토해보세요.{`\n\n`}다음 리뷰 조건: 확인할 정보 1개를 얻었거나 24시간 첫 행동을 실행한 뒤.</p>
        </article>
      </section>
    </main>
  );
}

function ResultCard({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  return <article className={cx("rounded-[1.5rem] p-6 shadow-xl", dark ? "bg-blue-700 text-white" : "bg-white/85 text-slate-950")}><h2 className="font-black text-lg">{title}</h2><p className="mt-3 whitespace-pre-line font-semibold leading-7">{body}</p></article>;
}

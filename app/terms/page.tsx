import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | MAP Decision",
  description: "MAP Decision 이용약관입니다.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-text-primary sm:px-6 lg:px-8">
      <article className="map-container max-w-3xl">
        <p className="kicker">MAP Decision</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">이용약관</h1>

        <div className="mt-6 rounded-large border border-border bg-surface-elevated p-4 text-sm font-semibold leading-7 text-text-secondary">
          이 문서는 실무 참고 수준의 초안이며 법률 자문이 아닙니다. 오너가 최종
          검토하고, 게시 전 반드시 변호사 확인을 받아야 합니다.
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">1. 목적</h2>
          <p className="break-keep leading-7 text-text-secondary">
            이 약관은 MAP Decision(이하 &ldquo;서비스&rdquo;)의 이용 조건과
            절차, 이용자와 서비스 제공자의 권리·의무를 정하는 것을 목적으로
            합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">2. 서비스 설명</h2>
          <p className="break-keep leading-7 text-text-secondary">
            서비스는 이용자가 입력하거나 말한 내용을 구조화된 시각 자료(MAP)로
            정리해서 보여주는 의사결정 참고 도구입니다. 서비스가 제공하는
            분석·요약·추천은 이용자의 생각을 정리하는 것을 돕는 참고 자료일
            뿐이며, 확정된 결론이나 전문적인 조언을 대체하지 않습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">3. 이용자의 의무</h2>
          <ul className="ml-5 list-disc space-y-1 break-keep leading-7 text-text-secondary">
            <li>서비스를 통해 타인의 권리를 침해하거나 불법적인 목적으로 이용하지 않습니다.</li>
            <li>서비스의 정상적인 운영을 방해하는 행위(과도한 반복 요청 등)를 하지 않습니다.</li>
            <li>본인이 입력한 내용에 대한 책임은 이용자 본인에게 있습니다.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">4. 면책 조항</h2>
          <p className="break-keep leading-7 text-text-secondary">
            서비스는 의사결정을 돕는 참고 도구이며, 제공되는 분석과 추천은
            조언일 뿐 확정된 답이 아닙니다. 건강·법률·재무·진로 등 중요한
            결정은 반드시 관련 분야의 전문가와 상의하시기 바랍니다. 서비스
            제공자는 이용자가 서비스의 결과물만을 근거로 내린 결정에 대해
            책임을 지지 않습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">5. 지적재산권</h2>
          <p className="break-keep leading-7 text-text-secondary">
            이용자가 입력한 내용과 그 내용을 바탕으로 생성된 MAP에 대한
            권리는 이용자에게 있습니다. 서비스 랜딩 페이지에 있는 예시
            이미지는 실제 서비스 결과물이 아닌 AI로 생성한 참고용 목업이며,
            해당 이미지에는 &ldquo;예시 이미지&rdquo; 표기가 되어 있습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">6. 약관의 변경</h2>
          <p className="break-keep leading-7 text-text-secondary">
            서비스 제공자는 필요한 경우 이 약관을 변경할 수 있으며, 변경된
            약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">7. 문의처</h2>
          <p className="break-keep leading-7 text-text-secondary">[오너 확인 필요]</p>
        </section>

        <p className="mt-10 text-xs font-semibold text-text-muted">시행일: [오너 확인 필요]</p>
      </article>
    </main>
  );
}

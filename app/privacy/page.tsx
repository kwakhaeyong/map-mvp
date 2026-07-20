import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | MAP Decision",
  description: "MAP Decision이 입력 내용을 어떻게 다루는지 안내합니다.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-10 text-text-primary sm:px-6 lg:px-8">
      <article className="map-container max-w-3xl">
        <p className="kicker">MAP Decision</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">개인정보처리방침</h1>

        <div className="mt-6 rounded-large border border-border bg-surface-elevated p-4 text-sm font-semibold leading-7 text-text-secondary">
          이 문서는 실무 참고 수준의 초안이며 법률 자문이 아닙니다. 오너가 최종
          검토하고, 게시 전 반드시 변호사 확인을 받아야 합니다.
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">1. 수집하는 개인정보 항목</h2>
          <p className="break-keep leading-7 text-text-secondary">
            MAP Decision은 로그인을 요구하지 않으며, 이름·이메일·전화번호 등을
            별도로 수집하지 않습니다. 수집되는 정보는 사용자가 대화창에 직접
            입력한 텍스트(고민, 생각, 상황 설명 등)입니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">2. 개인정보의 이용 목적</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력하신 내용을 의사결정 구조(MAP)로 시각화하기 위한 분석과 노드
            추출에만 사용합니다. 광고, 마케팅, 프로파일링 등 다른 목적으로는
            사용하지 않습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">3. 개인정보의 보관</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력하신 내용은 원칙적으로 사용자의 브라우저(로컬 저장소)에만
            저장되며, 회사가 운영하는 서버 데이터베이스에 별도로 저장하지
            않습니다. AI 분석 기능이 켜져 있는 경우, 입력 내용은 분석을 위해
            일시적으로 처리될 뿐 처리 후 서버에 보관하지 않는 것을 원칙으로
            합니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">4. 제3자 제공 및 국외 이전</h2>
          <p className="break-keep leading-7 text-text-secondary">
            AI 분석 기능이 활성화된 경우, 입력하신 텍스트는 의사결정 구조화
            분석을 위해 미국에 소재한 Anthropic, PBC(&ldquo;Anthropic&rdquo;)의
            서버로 전송됩니다.
          </p>
          <ul className="ml-5 list-disc space-y-1 break-keep leading-7 text-text-secondary">
            <li>이전받는 자: Anthropic, PBC (미국)</li>
            <li>이전 목적: 의사결정 구조화 분석(노드 추출)</li>
            <li>이전 항목: 사용자가 입력한 텍스트</li>
            <li>
              이전받는 자의 보유·이용 기간: Anthropic의 자체 정책에 따르며,
              자세한 내용은 Anthropic의 개인정보처리방침을 참고해주세요.
            </li>
          </ul>
          <p className="break-keep leading-7 text-text-secondary">
            AI 분석 기능이 꺼져 있는 동안에는 이런 전송이 발생하지 않고,
            입력 내용은 사용자 기기 안에서만 처리됩니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">5. 보유 기간</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력 내용은 사용자의 브라우저에 남아있는 동안 보유되며, 사용자가
            브라우저 데이터를 삭제하면 즉시 삭제됩니다. 서비스 측에서 별도로
            서버에 보관하지 않으므로, 회사가 임의로 정하는 보유 기간은
            없습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">6. 이용자의 권리</h2>
          <p className="break-keep leading-7 text-text-secondary">
            이용자는 언제든지 브라우저에 저장된 데이터를 삭제하여 본인의
            정보를 삭제할 수 있습니다. 브라우저의 설정 메뉴에서 이
            사이트(mapdecision.com)의 사이트 데이터를 삭제하면 저장된 모든
            내용이 함께 삭제됩니다.
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

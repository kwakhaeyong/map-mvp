import type { Metadata } from "next";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_CONTACT_NAME } from "../../src/map-decision-v1/constants";

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
          <p className="break-keep leading-7 text-text-secondary">
            &ldquo;공유하기&rdquo; 버튼을 직접 눌러 결과를 공유 링크로 만드는
            경우에만, 아래 항목을 추가로 서버에 저장합니다. 그냥 결과 화면을
            보기만 하고 공유하지 않으면 서버에는 아무것도 남지 않습니다.
          </p>
          <ul className="ml-5 list-disc space-y-1 break-keep leading-7 text-text-secondary">
            <li>결과 카드 내용(제목, 요약, 기준, 매트릭스 등 화면에 보이는 내용)</li>
            <li>어떤 종류의 MAP인지(예: 이상형)</li>
            <li>만들어진 시각</li>
            <li>공유 링크 주소에 쓰이는 임의의 공유 ID</li>
          </ul>
          <p className="break-keep leading-7 text-text-secondary">
            대화하면서 실제로 나눈 대화 원문은 이 저장 대상에 포함되지
            않습니다 — 화면에 정리되어 나온 결과 내용만 저장됩니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">2. 개인정보의 이용 목적</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력하신 내용을 의사결정 구조(MAP)로 시각화하기 위한 분석과 노드
            추출에만 사용합니다. 사용자가 직접 공유 링크를 만든 경우에는, 그
            링크에 접속한 사람에게 결과 카드를 보여주는 목적으로만
            사용합니다. 광고, 마케팅, 프로파일링 등 다른 목적으로는 사용하지
            않습니다.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">3. 개인정보의 보관</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력하신 내용은 원칙적으로 사용자의 브라우저(로컬 저장소)에만
            저장되며, 회사가 운영하는 서버 데이터베이스에 별도로 저장하지
            않습니다. 다만 결과 화면에서 &ldquo;공유하기&rdquo;를 직접 누른
            경우에는 위 1번 항목의 내용이 예외적으로 서버에 저장됩니다. AI
            분석 기능이 켜져 있는 경우, 입력 내용은 분석을 위해 일시적으로
            처리될 뿐 처리 후 서버에 보관하지 않는 것을 원칙으로 합니다.
          </p>
          <p className="break-keep leading-7 text-text-secondary">
            공유 링크는 주소(URL)를 아는 사람이라면 누구나 볼 수 있습니다 —
            검색 엔진에는 노출되지 않지만, 그 링크를 다른 사람에게 전달하면
            그 사람도 내용을 볼 수 있다는 점을 알아두세요.
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
          <p className="break-keep leading-7 text-text-secondary">
            공유 링크 기능은 미국 법인인 Upstash, Inc.(&ldquo;Upstash&rdquo;)에
            데이터 저장을 위탁합니다.
          </p>
          <ul className="ml-5 list-disc space-y-1 break-keep leading-7 text-text-secondary">
            <li>수탁자: Upstash, Inc. (미국 법인)</li>
            <li>실제 데이터 보관 위치: 일본(도쿄)</li>
            <li>위탁 목적: 공유 링크로 만든 결과 카드 저장</li>
            <li>위탁 항목: 위 1번 항목(공유 시에만 저장되는 정보)</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">5. 보유 기간</h2>
          <p className="break-keep leading-7 text-text-secondary">
            입력 내용은 사용자의 브라우저에 남아있는 동안 보유되며, 사용자가
            브라우저 데이터를 삭제하면 즉시 삭제됩니다. 서비스 측에서 별도로
            서버에 보관하지 않으므로, 회사가 임의로 정하는 보유 기간은
            없습니다. 다만 결과 화면에서 &ldquo;공유하기&rdquo;를 눌러 만든
            공유 링크는 아래와 같이 서버에 90일간 보관된 뒤 자동으로
            삭제됩니다.
          </p>
          <p className="break-keep leading-7 text-text-secondary">
            공유 링크로 저장된 결과 카드는 <strong>90일이 지나면 자동으로
            삭제</strong>됩니다. 또한 하루에 만들 수 있는 공유 링크 개수를
            제한하기 위해 IP 주소를 24시간만 임시로 보관하며, 이 IP는 공유된
            결과 카드 내용과는 별도로 저장되어 서로 연결되지 않습니다.
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
          <p className="break-keep leading-7 text-text-secondary">
            공유 링크로 만든 결과 카드는 로그인이 없어 화면에서 직접 삭제할
            수 있는 버튼을 제공하지 않습니다. 삭제를 원하시면 삭제하고 싶은
            공유 링크 주소를{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-text-primary">
              {PRIVACY_CONTACT_EMAIL}
            </a>
            로 보내주세요. 확인 후 삭제해드립니다(별도 요청이 없어도 90일이
            지나면 자동으로 삭제됩니다).
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">7. 개인정보 보호책임자</h2>
          <p className="break-keep leading-7 text-text-secondary">
            성명: {PRIVACY_CONTACT_NAME}
            <br />
            연락처:{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-text-primary">
              {PRIVACY_CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-black tracking-[-0.02em]">8. 문의처</h2>
          <p className="break-keep leading-7 text-text-secondary">
            개인정보 관련 문의는{" "}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-text-primary">
              {PRIVACY_CONTACT_EMAIL}
            </a>
            로 보내주세요.
          </p>
        </section>

        <p className="mt-10 text-xs font-semibold text-text-muted">
          시행일: 2026-07-25
          <br />
          최근 개정일: 2026-07-25 (공유 링크 관련 내용 추가)
        </p>
      </article>
    </main>
  );
}

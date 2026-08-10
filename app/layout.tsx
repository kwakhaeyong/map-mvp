import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// OG 이미지처럼 metadata에 상대 경로("/og-share.png")로 넣은 값을
// 카카오톡 등 외부 서비스가 이해할 수 있는 절대 URL로 바꾸는 데 쓰인다
// (metadataBase가 없으면 Next.js가 상대 경로를 그대로 두거나 개발용
// localhost를 기준으로 잡아서, 실제 배포 환경에서 미리보기 이미지가
// 깨질 수 있다). 프로덕션은 항상 커스텀 도메인을 기준으로 하고,
// Vercel 프리뷰 배포는 그 배포 자체의 URL을 기준으로 삼는다.
const siteUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://mapdecision.com"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

// og-share.png는 누가 언제 방문하든 완전히 동일한 고정 이미지다(사용자
// 결과·개인정보가 실리지 않는다) — og-share-image.tsx(21~24행)·
// card.png/route.ts(20~23행)가 말하는 "동적 OG 금지" 원칙은 사용자마다
// 달라지는 결과 내용이 카톡 대화 로그·외부 캐시에 영구히 남는 것을
// 막기 위한 것이라, 이 고정 이미지를 랜딩에 붙이는 건 그 원칙과
// 무관하다(위배하지 않는다).
//
// 다만 이 이미지에 박힌 문구("MBTI 16개로는 안 나오는 / 나만의 유형")는
// /r/{id}(친구가 보낸 링크를 여는 맥락)에 맞춰 만든 것이라, 처음 방문하는
// 사람에게 서비스를 소개하는 랜딩 맥락에는 최적이 아니다 — 랜딩 카피가
// 확정되면 이미지도 함께 재검토해야 한다.
//
// 이 PNG는 정적 파일이라 다시 만들려면 satori로 렌더링하는 임시 dev
// 라우트가 필요하다(og-share-image.tsx 주석 참고) — 그런 라우트가 지금
// 코드에는 없다.
const OG_SHARE_IMAGE = { url: "/og-share.png", width: 1200, height: 630 };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MAP | 나를 설명하는 새로운 방식",
  description: "생각은 계속 변합니다. MAP는 지금을 그립니다.",
  openGraph: {
    title: "MAP | 나를 설명하는 새로운 방식",
    description: "생각은 계속 변합니다. MAP는 지금을 그립니다.",
    images: [OG_SHARE_IMAGE],
    type: "website",
    siteName: "MAP Decision",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAP | 나를 설명하는 새로운 방식",
    description: "생각은 계속 변합니다. MAP는 지금을 그립니다.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

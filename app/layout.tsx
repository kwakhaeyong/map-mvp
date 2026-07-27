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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MAP | 나를 설명하는 새로운 방식",
  description: "생각은 계속 변합니다. MAP는 지금을 그립니다.",
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

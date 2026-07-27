// A형 한 장 MAP(인스타용 PNG) 카드는 satori(next/og의 ImageResponse)로
// 렌더링되는데, satori는 CSS 파일이나 CSS 커스텀 프로퍼티(var(--...))를
// 읽지 못하고 인라인 스타일의 리터럴 색상값만 이해한다. 그래서 이
// 파일에만 예외적으로 raw 색상값을 직접 적는다(design-check.mjs의
// 예외 목록에도 등록돼 있다). src/styles/design-tokens.css와 값이
// 어긋나지 않도록, 이 파일을 고칠 때는 그 파일도 같이 확인한다.
export const CARD_COLORS = {
  background: "#fbf7ef",
  primary: "#15213b",
  primaryForeground: "#ffffff",
  textSecondary: "#465672",
  primarySoftFill: "rgba(21, 33, 59, 0.07)",
  primarySoftBorder: "rgba(21, 33, 59, 0.16)",
  foregroundSoft: "rgba(255, 255, 255, 0.7)",
  foregroundFaint: "rgba(255, 255, 255, 0.55)",
} as const;

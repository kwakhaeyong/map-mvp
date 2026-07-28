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
  // 아래 3개는 새로 만든 색이 아니라 design-tokens.css의 --color-value/
  // --color-feeling/--color-action을 그대로 옮긴 것 — 이상형 결과 화면
  // 히어로 영역(IdealTypeResultBlocks.tsx)이 이미 이 세 색으로
  // "from-value via-feeling to-action" 그라데이션을 쓰고 있다. A안은
  // 이 기존 그라데이션의 연장선이다.
  value: "#e7ddff",
  feeling: "#eee7ff",
  action: "#dff5ff",
  // B/C안에서 다크 네이비 배경 위에 얹는 옅은 흰색 오버레이 — 새 색이
  // 아니라 흰색의 투명도만 다르게 쓴 것으로, 배경과 같은 계열 안에서
  // "면 분할"만 표현한다.
  onDarkSoftFill: "rgba(255, 255, 255, 0.08)",
  onDarkSoftBorder: "rgba(255, 255, 255, 0.18)",
} as const;

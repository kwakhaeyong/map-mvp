// A형 한 장 MAP(인스타용 PNG) 카드는 satori(next/og의 ImageResponse)로
// 렌더링되는데, satori는 CSS 파일이나 CSS 커스텀 프로퍼티(var(--...))를
// 읽지 못하고 인라인 스타일의 리터럴 색상값만 이해한다. 그래서 이
// 파일에만 예외적으로 raw 색상값을 직접 적는다(design-check.mjs의
// 예외 목록에도 등록돼 있다). src/styles/design-tokens.css와 값이
// 어긋나지 않도록, 이 파일을 고칠 때는 그 파일도 같이 확인한다.
export const CARD_COLORS = {
  background: "#faf9f6",
  primary: "#3e6b70",
  primaryForeground: "#ffffff",
  textSecondary: "#5a5a58",
  // text-primary(#222222)와 textSecondary(#5a5a58) 사이 색, 같은 비율
  // (약 30.5%)로 재계산 — 2026 리브랜드 전에는 primary(그때는 본문
  // 잉크와 같은 값)와 textSecondary 사이였지만, primary가 이제 청록
  // (브랜드 액션 색)으로 갈라져서 더는 "본문 잉크" 역할을 못 한다.
  // 그래서 기준을 text-primary(잉크)로 옮겼다 — 초대장 한 줄 설명은
  // 액션 색이 아니라 읽는 텍스트이기 때문이다.
  inkStrong: "#333332",
  primarySoftFill: "rgba(62, 107, 112, 0.07)",
  primarySoftBorder: "rgba(62, 107, 112, 0.16)",
  // 초대장 카드 태그 알약 배경 전용. primarySoftFill(투명 7% 오버레이)은
  // 종이 질감 텍스처 위에 얹히면 텍스처 노이즈와 겹쳐 뭉개져 보이고
  // (반투명 오버레이가 밑에 깔린 텍스처를 그대로 비치게 한다), 375px로
  // 축소한 뒤엔 태그가 "회색 배경+회색 글자"로 읽힌다는 피드백을 받았다.
  // 그래서 텍스처와 섞이지 않는 불투명 flat 색(background 95% + primary
  // 5% 혼합)으로 바꿔 텍스트와의 대비를 항상 일정하게 유지한다.
  invitationTagFill: "#f1f2ef",
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
  // B/C안에서 다크 청록(primary) 배경 위에 얹는 옅은 흰색 오버레이 — 새 색이
  // 아니라 흰색의 투명도만 다르게 쓴 것으로, 배경과 같은 계열 안에서
  // "면 분할"만 표현한다.
  onDarkSoftFill: "rgba(255, 255, 255, 0.08)",
  onDarkSoftBorder: "rgba(255, 255, 255, 0.18)",
  // 봉랍(왁스 실) 그림자 — ideal-type-card-image.tsx와 og-share-image.tsx
  // 둘 다 같은 값을 각자 하드코딩하고 있던 걸(design:check가 raw color
  // 검사 파일 목록을 못 찾아 놓쳤던 중복, #116) 여기로 모은다.
  sealShadow: "0 3px 6px rgba(34, 34, 34, 0.3)",
} as const;

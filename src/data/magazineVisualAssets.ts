// PERSONAL MAGAZINE 비주얼 asset 레지스트리 — dev 프로토타입 전용.
// 실제 GPT/사진 이미지 경로를 화면 컴포넌트에 직접 하드코딩하지 않고
// 이 파일 하나에서만 관리한다. 다음 버전 이미지가 나오면 src만
// 바꾸면 화면 전체가 그대로 교체된다 — 컴포넌트는 건드리지 않는다.
export type MagazineVisualAsset = {
  src: string;
  alt: string;
  // 이미지의 실제 픽셀 비율("가로:세로"). CSS aspect-ratio로 그대로
  // 변환해 레이아웃이 이미지 원본 비율을 그대로 따르게 한다.
  aspectRatio: string;
  objectPositionMobile: string;
  objectPositionDesktop: string;
  role: string;
};

export const magazineVisualAssets = {
  home: {
    hero: {
      src: "/magazine/home/hero-personal-magazine.png",
      alt: "손으로 넘겨보는 PERSONAL MAGAZINE 표지 — 한 사람의 초상 사진과 ME/TASTE/FOOD/TRAVEL/STYLE/LOVE/WORK 7개 챕터 목차, 뒤로 다른 호 페이지들이 살짝 겹쳐 보인다.",
      aspectRatio: "1149:1369",
      objectPositionMobile: "center center",
      objectPositionDesktop: "center center",
      role: "homepage-hero",
    } satisfies MagazineVisualAsset,
    // 다음 라운드에서 ME/TASTE/FOOD/TRAVEL/STYLE/LOVE/WORK, QUIZ, RESULT
    // 비주얼이 이 자리에 같은 구조로 추가될 예정이다.
  },
};

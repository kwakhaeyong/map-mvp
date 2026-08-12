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
    // 다음 라운드에서 TASTE/FOOD/TRAVEL/STYLE/LOVE/WORK, QUIZ, RESULT
    // 비주얼이 이 자리에 같은 구조로 추가될 예정이다.
  },

  me: {
    // ME 챕터의 오프닝 스프레드 — 제목·인물사진·프로필·풀쿼트·
    // MIND/LIFE/VALUES 3분할까지 이미 하나의 완성된 editorial spread로
    // 들어있다. 이 자산을 자르거나 여러 프레임으로 나누지 않고 한
    // 장으로 그대로 쓴다.
    openingFeature: {
      src: "/magazine/me/me-opening-feature.png",
      alt: "ME 챕터 오프닝 스프레드 — 왼쪽에 CHAPTER 01 · ME · 나라는 사람 타이틀과 자기 인용구, 프로필 정보(Name/Birth/MBTI/Keyword/Currently), 오른쪽에 인물 사진, 하단에 01 MIND · 02 LIFE · 03 VALUES 3분할 섹션.",
      aspectRatio: "1085:1450",
      objectPositionMobile: "center top",
      objectPositionDesktop: "center center",
      role: "personal-portrait-opening-feature",
    } satisfies MagazineVisualAsset,
  },

  taste: {
    // TASTE 챕터 오프닝 — CHAPTER 02 · TASTE · 내가 좋아하는 것들 타이틀과
    // 책상에 앉은 인물 사진, PLACE/OBJECT/DETAIL/RITUAL 4개 미리보기
    // 아이콘까지 이미 하나의 완성된 chapter opening spread로 들어있다.
    hero: {
      src: "/magazine/taste/taste-hero.png",
      alt: "TASTE 챕터 오프닝 스프레드 — CHAPTER 02 · TASTE · 내가 좋아하는 것들 · THE THINGS I LOVE 타이틀, 책상에 앉은 인물 사진, 하단에 PLACE · OBJECT · DETAIL · RITUAL 4분할 미리보기.",
      aspectRatio: "1054:1492",
      objectPositionMobile: "center top",
      objectPositionDesktop: "center center",
      role: "taste-chapter-opening-hero",
    } satisfies MagazineVisualAsset,
    // PLACE — 나를 편안하게 하는 공간(카페 창가에 앉은 인물).
    place: {
      src: "/magazine/taste/taste-place.png",
      alt: "PLACE 피처 — 카페 창가 자리에 앉은 인물의 모습, 나를 편안하게 하는 공간.",
      aspectRatio: "1484:1060",
      objectPositionMobile: "center center",
      objectPositionDesktop: "center center",
      role: "taste-place-feature",
    } satisfies MagazineVisualAsset,
    // OBJECT — 취향을 드러내는 소지품 스틸라이프(라이카 카메라, Kinfolk,
    // 향수병).
    object: {
      src: "/magazine/taste/taste-object.png",
      alt: "OBJECT 피처 — 라이카 카메라, Kinfolk 매거진, 향수병으로 구성된 스틸라이프, 취향을 드러내는 소지품들.",
      aspectRatio: "1484:1060",
      objectPositionMobile: "center center",
      objectPositionDesktop: "center center",
      role: "taste-object-feature",
    } satisfies MagazineVisualAsset,
    // DETAIL — 챕터의 마지막 이미지. 커피·다이어리·초·안경 같은 일상의
    // 작은 순간들.
    detail: {
      src: "/magazine/taste/taste-detail.png",
      alt: "DETAIL 피처 — 커피, 다이어리, 초, 안경으로 구성된 일상의 작은 순간들.",
      aspectRatio: "1492:1054",
      objectPositionMobile: "center center",
      objectPositionDesktop: "center center",
      role: "taste-detail-feature",
    } satisfies MagazineVisualAsset,
    // 다음 라운드에서 FOOD/TRAVEL/STYLE/LOVE/WORK, QUIZ, RESULT 비주얼이
    // 이 자리에 같은 구조로 추가될 예정이다.
  },
};

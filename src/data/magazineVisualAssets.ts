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
  // 선택 필드 — 이 이미지 안에 실제로 무엇이 담겨 있는지에 대한 최소
  // 정보(TASTE Result의 Narrative가 이 asset을 "몰라도 되는 배경"이
  // 아니라 실제 장면으로 취급하도록, visual-cue 문장을 여기서 만든다).
  // 지금은 asset마다 하나뿐이라 값이 고정돼 있지만, 나중에 asset이
  // variant별로 늘어나도 이 필드만 채우면 Narrative는 그대로 동작한다.
  scene?: {
    light: string;
    setting: string;
    mood: string;
    details: string[];
  };
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
      scene: {
        light: "부드럽게 스며드는 낮의 빛",
        setting: "손에 익은 카페 창가 테이블",
        mood: "조용하고 편안한",
        details: ["펼쳐 둔 책", "커피잔"],
      },
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
      scene: {
        light: "정갈하게 내려앉은 정물의 빛",
        setting: "책상 위에 나란히 놓인 물건들",
        mood: "취향이 조용히 드러나는",
        details: ["라이카 카메라", "Kinfolk 매거진", "향수병"],
      },
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

  travel: {
    // TRAVEL 챕터 오프닝 — CHAPTER 03 · TRAVEL · 내가 사랑하는 여행의
    // 순간들 타이틀과 아말피 해안을 바라보는 인물 뒷모습, 하단에
    // CITY/NATURE/PEOPLE/MOMENT 4분할 미리보기까지 이미 하나의 완성된
    // chapter opening spread로 들어있다. TASTE(HERO→PLACE→OBJECT→
    // DETAIL로 점점 좁아지는 구조)와 달리 TRAVEL은 지금 Hero 한 장만
    // 검증한다 — TASTE의 프레임 문법을 그대로 복사하지 않는다.
    hero: {
      src: "/magazine/travel/travel-hero.png",
      alt: "TRAVEL 챕터 오프닝 스프레드 — CHAPTER 03 · TRAVEL · 내가 사랑하는 여행의 순간들 · THE PLACES THAT CHANGE ME 타이틀, 아말피 해안 절벽에서 바다와 마을을 내려다보는 인물 뒷모습, 하단에 CITY · NATURE · PEOPLE · MOMENT 4분할 미리보기.",
      aspectRatio: "1024:1536",
      objectPositionMobile: "center top",
      objectPositionDesktop: "center center",
      role: "travel-chapter-opening-hero",
    } satisfies MagazineVisualAsset,
  },

  quiz: {
    taste: {
      // TASTE 1번 문항(쉬는 오후, 더 마음이 가는 장면은?)의 A/B 선택지
      // 사진. 카드 프레임을 이미지의 실제 비율(3:2)로 맞춰서 렌더링
      // 하기 때문에 object-cover를 써도 잘리는 부분 없이 원본 전체가
      // 그대로 보인다 — "몰입감 있게 크게, 그러나 피사체는 안 잘리게"
      // 요구를 프레임 비율을 원본과 맞추는 방식으로 만족시켰다.
      q01: {
        a: {
          src: "/magazine/quiz/taste/taste-quiz-01-a.png",
          alt: "햇살이 드는 조용한 카페 창가에서 책과 커피를 곁에 두고 바깥을 바라보는 여성의 뒷모습.",
          aspectRatio: "1536:1024",
          objectPositionMobile: "center center",
          objectPositionDesktop: "center center",
          role: "taste-quiz-choice",
        } satisfies MagazineVisualAsset,
        b: {
          src: "/magazine/quiz/taste/taste-quiz-01-b.png",
          alt: "저녁 도시의 활기찬 바 거리에서 와인잔을 들고 사람들 사이에 서 있는 여성의 뒷모습.",
          aspectRatio: "1536:1024",
          objectPositionMobile: "center center",
          objectPositionDesktop: "center center",
          role: "taste-quiz-choice",
        } satisfies MagazineVisualAsset,
      },
      // PAGE 06(YOUR DAY / signature-choice, "BACK TO MY PLACE" /
      // "SOMEWHERE NEW") 실사 이미지 2장(2026-08, Round 8에서 GPT가 전달한
      // 최종 asset 연결). Q1과 같은 3:2 가로 컨벤션(1536:1024) — 원본이
      // 이미 정확히 이 픽셀 크기라 crop/resize/비율 보정이 필요 없었다.
      q06: {
        a: {
          src: "/magazine/quiz/taste/taste-quiz-06-a.png",
          alt: "노을이 지는 도시 야경이 보이는 창가 방으로, 에코백을 멘 여성이 문을 열고 들어서는 뒷모습. 책상 위 스탠드 조명과 책장이 있는 익숙하고 따뜻한 실내.",
          aspectRatio: "1536:1024",
          objectPositionMobile: "center center",
          objectPositionDesktop: "center center",
          role: "taste-quiz-choice",
        } satisfies MagazineVisualAsset,
        b: {
          src: "/magazine/quiz/taste/taste-quiz-06-b.png",
          alt: "해질녘 골목길, 동네 서점과 카페 불빛이 늘어선 낯선 거리를 걸어가는 여성의 뒷모습. 처음 가보는 장소를 마주하는 분위기.",
          aspectRatio: "1536:1024",
          objectPositionMobile: "center center",
          objectPositionDesktop: "center center",
          role: "taste-quiz-choice",
        } satisfies MagazineVisualAsset,
      },
    },
  },
};

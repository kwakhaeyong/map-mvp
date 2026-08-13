// PERSONAL MAGAZINE 챕터 레지스트리 — dev 프로토타입 전용.
// 화면(Progress 미리보기, Quiz 스켈레톤 등) 여러 곳에서 챕터 목록을
// 하드코딩하지 않고 이 파일 하나만 보게 하기 위한 것이다. 아래 7개
// 챕터는 최종 확정된 목록이 아니므로, 배열 순서를 바꾸거나 항목을
// 추가/삭제하는 것만으로 모든 화면에 반영되도록 구조를 단순하게
// 유지한다.
export type MagazineChapterStatus = "empty" | "in-progress" | "complete";

export type MagazineChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  status: MagazineChapterStatus;
};

export const magazineChapters: MagazineChapter[] = [
  { id: "me", number: "01", title: "ME", subtitle: "나라는 사람", status: "complete" },
  { id: "taste", number: "02", title: "TASTE", subtitle: "내가 좋아하는 것들", status: "complete" },
  { id: "food", number: "03", title: "FOOD", subtitle: "내 취향을 접시에 담는다면", status: "empty" },
  { id: "travel", number: "04", title: "TRAVEL", subtitle: "내가 세상을 보는 방식", status: "empty" },
  { id: "style", number: "05", title: "STYLE", subtitle: "고르는 것 하나하나가 곧 나", status: "empty" },
  { id: "love", number: "06", title: "LOVE", subtitle: "내가 곁을 내어주는 방식", status: "empty" },
  { id: "work", number: "07", title: "WORK", subtitle: "다음 장면을 준비하는 나", status: "empty" },
];

// 개념적 챕터 완성 흐름(구현 아님 — 참고용 메모):
//
//   QUIZ (chapter의 질문에 답한다)
//     ↓
//   PROCESSING (EditorialProcessing — 답을 편집해 챕터로 만드는 중)
//     ↓
//   CHAPTER RESULT (해당 챕터의 완성된 스프레드)
//     ↓
//   NEXT CHAPTER (magazineChapters에서 status가 "empty"인 다음 항목으로 이동)
//
// 이 흐름은 /dev/personal-magazine-quiz 스켈레톤 안에서만 구조로
// 존재하고, 실제 TASTE 결과 화면에는 CTA를 심지 않았다.

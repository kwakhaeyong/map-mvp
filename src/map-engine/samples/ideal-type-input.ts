import type { MAPInput } from "../types/core";

export const idealTypeSampleInput: MAPInput = {
  id: "sample-ideal-type-001",
  category: "ideal-type",
  locale: "ko-KR",
  createdAt: "2026-07-07T00:00:00.000Z",
  answers: [
    {
      promptId: "laugh-style",
      prompt: "어떤 순간에 상대에게 마음이 열리나요?",
      answer: "같이 별거 아닌 일로 웃을 때 오래 기억에 남아요.",
    },
    {
      promptId: "comfort",
      prompt: "편하다고 느끼는 관계는 어떤 모습인가요?",
      answer: "말이 없어도 어색하지 않고 서로의 취향을 존중해주는 관계요.",
    },
    {
      promptId: "attraction",
      prompt: "처음 끌리는 포인트는 무엇인가요?",
      answer: "다정한 말투와 장난스러운 센스에 끌려요.",
    },
  ],
};

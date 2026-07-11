import type { MapProgressData } from "./mapProgressStorage";
import { questionFlowQuestions } from "./mapQuestions";

export interface VisualMapAnswer {
  key: string;
  question: string;
  label: string;
  value: string;
}

export interface VisualMapResult {
  title: string;
  createdAt: string;
  topic?: VisualMapAnswer;
  importance?: VisualMapAnswer;
  concern?: VisualMapAnswer;
  alternatives?: VisualMapAnswer;
  strengths?: VisualMapAnswer;
  weaknesses?: VisualMapAnswer;
  realisticChoice?: VisualMapAnswer;
  firstAction?: VisualMapAnswer;
  answeredItems: VisualMapAnswer[];
}

const answerLabels = [
  "핵심 주제",
  "중요한 이유",
  "핵심 고민",
  "선택 대안",
  "장점",
  "단점",
  "현실적인 선택",
  "첫 실행 행동",
];

function cleanAnswer(value: string) {
  return value.trim().replace(/[.。!?！？]+$/g, "");
}

export function createMapTitle(topicValue?: string) {
  if (!topicValue) return "나의 의사결정 MAP";

  const topic = cleanAnswer(topicValue)
    .replace(/^(나는|제가|저는)\s*/g, "")
    .replace(/(를|을)?\s*(결정|정리)하고 싶다$/g, "")
    .replace(/(를|을)?\s*(결정|정리)하고 싶어요$/g, "")
    .replace(/\s*여부를\s*결정하고 싶다$/g, "")
    .replace(/\s*여부를\s*결정하고 싶어요$/g, "")
    .replace(/\s*여부$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!topic || topic.length > 24) return "나의 의사결정 MAP";
  return `${topic} 의사결정 MAP`;
}

export function createVisualMapResult(progress: MapProgressData | null): VisualMapResult | null {
  if (!progress) return null;

  const answeredItems = questionFlowQuestions
    .map((question, index) => {
      const value = progress.answers[`q${index + 1}`]?.trim() ?? "";
      return {
        key: `q${index + 1}`,
        question,
        label: answerLabels[index],
        value,
      };
    })
    .filter((item) => item.value.length > 0);

  if (answeredItems.length === 0) return null;

  const byKey = Object.fromEntries(answeredItems.map((item) => [item.key, item])) as Record<string, VisualMapAnswer | undefined>;

  return {
    title: createMapTitle(byKey.q1?.value),
    createdAt: progress.startedAt,
    topic: byKey.q1,
    importance: byKey.q2,
    concern: byKey.q3,
    alternatives: byKey.q4,
    strengths: byKey.q5,
    weaknesses: byKey.q6,
    realisticChoice: byKey.q7,
    firstAction: byKey.q8,
    answeredItems,
  };
}

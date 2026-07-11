import type {
  ConversationParser,
  InsightEngine,
  MAPGraphBuilder,
  MemoryBuilder,
  PatternFinder,
  ResultRenderer,
  ShareEngine,
  StoryEngine,
  ThemeAnalyzer,
  ValueDetector,
} from "../types/contracts";
import type { MAPResult } from "../types/core";

export const dummyConversationParser: ConversationParser = {
  parse(input) {
    const rawText = input.answers.map((answer) => answer.answer).join(" ");

    return {
      rawText,
      utterances: input.answers.map((answer) => ({
        id: answer.promptId,
        text: answer.answer,
        sourcePromptId: answer.promptId,
      })),
      keywords: ["웃음", "편안함", "취향", "다정함", "장난기"],
      sentimentHints: ["가벼움", "안정감", "설렘"],
    };
  },
};

export const dummyMemoryBuilder: MemoryBuilder = {
  build(parsed) {
    return {
      anchors: parsed.keywords,
      preferences: ["함께 웃는 리듬", "말 없는 편안함", "취향 존중"],
      contradictions: ["강렬한 설렘보다 오래 가는 안정감을 선호"],
      emotionalSignals: parsed.sentimentHints,
    };
  },
};

export const dummyThemeAnalyzer: ThemeAnalyzer = {
  extract() {
    return [
      { id: "laugh", label: "웃음", description: "같이 웃을 때 마음이 열린다", weight: 0.94 },
      { id: "comfort", label: "편안함", description: "침묵도 어색하지 않은 관계", weight: 0.88 },
      { id: "taste", label: "취향", description: "서로의 세계를 존중한다", weight: 0.82 },
    ];
  },
};

export const dummyValueDetector: ValueDetector = {
  detect() {
    return [
      { id: "rhythm", label: "함께 웃는 리듬", score: 94, description: "대화가 끊겨도 어색하지 않은 장난스러운 텐션" },
      { id: "space", label: "마음이 편한 거리", score: 88, description: "가까워져도 나를 잃지 않게 해주는 사람" },
      { id: "respect", label: "취향을 존중하는 태도", score: 82, description: "서로 다른 세계를 귀엽게 바라보는 여유" },
    ];
  },
};

export const dummyPatternFinder: PatternFinder = {
  find() {
    return [
      {
        id: "laugh-first",
        label: "Laugh First",
        evidence: ["별거 아닌 일로 웃을 때", "장난스러운 센스"],
        confidence: 0.91,
      },
    ];
  },
};

export const dummyGraphBuilder: MAPGraphBuilder = {
  buildGraph() {
    return {
      title: "웃음이 먼저 닿는 관계",
      centerLabel: "Laugh\nFirst",
      nodes: [
        { id: "laugh", label: "웃음", kind: "theme", weight: 0.94, x: 18, y: 24, color: "rose" },
        { id: "comfort", label: "편안함", kind: "value", weight: 0.88, x: 75, y: 23, color: "orange" },
        { id: "taste", label: "취향", kind: "theme", weight: 0.82, x: 21, y: 76, color: "sky" },
        { id: "space", label: "여유", kind: "pattern", weight: 0.79, x: 76, y: 77, color: "fuchsia" },
      ],
      edges: [
        { source: "laugh", target: "comfort", strength: 0.8 },
        { source: "comfort", target: "space", strength: 0.72 },
        { source: "taste", target: "space", strength: 0.68 },
        { source: "laugh", target: "taste", strength: 0.64 },
      ],
    };
  },
};

export const dummyInsightEngine: InsightEngine = {
  generateInsight() {
    return {
      headline: "당신은 함께 웃을 수 있는 사람에게 오래 끌립니다.",
      summary: "잘 보이려고 애쓰는 순간보다, 웃다가 자연스럽게 마음이 놓이는 순간에 더 크게 설레요.",
      hiddenInsight: "사실 당신은 설렘보다 ‘내가 나로 있어도 되는 느낌’을 먼저 봐요.",
      memorableSentence: "내 이상형은 나를 웃기고, 나답게 쉬게 해주는 사람.",
    };
  },
};

export const dummyStoryEngine: StoryEngine = {
  generateStory() {
    return {
      title: "지금 내 이상형은 이런 모습이에요",
      subtitle: "당신이 오래 바라보게 되는 사람의 모양을 그렸어요.",
      sections: [
        {
          id: "hidden-insight",
          title: "Hidden insight",
          body: "그래서 화려한 사람보다, 사소한 말투 하나로 하루를 가볍게 만들어주는 사람에게 오래 마음이 갑니다.",
        },
      ],
    };
  },
};

export const dummyResultRenderer: ResultRenderer = {
  renderResult(input, graph, values, insight, story) {
    const result: MAPResult = {
      id: `${input.id}-result`,
      category: input.category,
      title: "이상형 MAP",
      emoji: "❤️",
      headline: story.title,
      subText: story.subtitle,
      graph,
      values,
      priorities: values,
      insight,
      story,
      share: {
        previewTitle: "이상형 MAP",
        previewText: "야ㅋㅋ 내 이상형 MAP 나왔는데 완전 나잖아.\n너도 해봐.",
        ctaText: "친구에게 공유하기",
        hashtags: ["MAP", "이상형MAP", "세상에같은MAP는없습니다"],
      },
    };

    return result;
  },
};

export const dummyShareEngine: ShareEngine = {
  renderShare(result) {
    return result.share;
  },
};

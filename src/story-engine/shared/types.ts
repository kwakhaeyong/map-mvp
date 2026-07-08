export interface StoryEngineContext {
  sessionId: string;
  category: "ideal-type" | "travel" | "food" | "work" | "life" | "expression" | "friend";
  locale: "ko-KR";
  createdAt: string;
}

export interface ConversationInput {
  id: string;
  prompt: string;
  answer: string;
}

export interface ConversationSignal {
  id: string;
  text: string;
  source: "answer" | "memory" | "context";
  emphasis: number;
}

export interface ConversationModel {
  rawInputs: ConversationInput[];
  signals: ConversationSignal[];
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  emotionalTension: number;
  cues: string[];
}

export interface ValueAnalysis {
  values: Array<{
    id: string;
    label: string;
    strength: number;
    evidence: string[];
  }>;
}

export interface ConflictAnalysis {
  conflicts: Array<{
    id: string;
    says: string;
    emphasizes: string;
    gap: string;
    severity: number;
  }>;
}

export interface PatternAnalysis {
  patterns: Array<{
    id: string;
    label: string;
    description: string;
    confidence: number;
  }>;
}

export interface StoryDraft {
  oneMemorableSentence: string;
  narrative: string;
  emotionalArc: string;
}

export interface ShareableHeadline {
  headline: string;
  reason: string;
}

export interface HiddenInsight {
  insight: string;
  basedOn: string[];
}

export interface StoryEngineOutput {
  story: StoryDraft;
  headline: ShareableHeadline;
  hiddenInsight: HiddenInsight;
}

export interface StoryRenderedMAP {
  title: string;
  subtitle: string;
  nodes: Array<{
    id: string;
    label: string;
    weight: number;
  }>;
}

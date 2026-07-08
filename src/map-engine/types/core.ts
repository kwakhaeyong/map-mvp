export type MAPCategory = "ideal-type" | "travel" | "food" | "job" | "investment";

export type MAPStage =
  | "input"
  | "conversation-parser"
  | "memory-builder"
  | "theme-extractor"
  | "value-detector"
  | "pattern-finder"
  | "map-generator"
  | "insight-generator"
  | "story-generator"
  | "result-renderer"
  | "share-renderer";

export type MAPTone = "playful" | "emotional" | "premium" | "calm";

export type MAPNodeKind = "core" | "theme" | "value" | "pattern" | "insight";

export interface MAPInput {
  id: string;
  category: MAPCategory;
  locale: "ko-KR";
  createdAt: string;
  answers: MAPAnswer[];
  context?: Record<string, string | number | boolean>;
}

export interface MAPAnswer {
  promptId: string;
  prompt: string;
  answer: string;
}

export interface ParsedConversation {
  rawText: string;
  utterances: MAPUtterance[];
  keywords: string[];
  sentimentHints: string[];
}

export interface MAPUtterance {
  id: string;
  text: string;
  sourcePromptId?: string;
}

export interface MAPMemory {
  anchors: string[];
  preferences: string[];
  contradictions: string[];
  emotionalSignals: string[];
}

export interface MAPTheme {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export interface MAPValue {
  id: string;
  label: string;
  score: number;
  description: string;
}

export interface MAPPattern {
  id: string;
  label: string;
  evidence: string[];
  confidence: number;
}

export interface MAPGraphNode {
  id: string;
  label: string;
  kind: MAPNodeKind;
  weight: number;
  x: number;
  y: number;
  color: string;
}

export interface MAPGraphEdge {
  source: string;
  target: string;
  strength: number;
}

export interface MAPGraph {
  title: string;
  centerLabel: string;
  nodes: MAPGraphNode[];
  edges: MAPGraphEdge[];
}

export interface MAPInsight {
  headline: string;
  summary: string;
  hiddenInsight: string;
  memorableSentence: string;
}

export interface MAPStory {
  title: string;
  subtitle: string;
  sections: MAPStorySection[];
}

export interface MAPStorySection {
  id: string;
  title: string;
  body: string;
}

export interface MAPResult {
  id: string;
  category: MAPCategory;
  title: string;
  emoji: string;
  headline: string;
  subText: string;
  graph: MAPGraph;
  values: MAPValue[];
  priorities: MAPValue[];
  insight: MAPInsight;
  story: MAPStory;
  share: MAPSharePayload;
}

export interface MAPSharePayload {
  previewTitle: string;
  previewText: string;
  ctaText: string;
  hashtags: string[];
}

export interface MAPEngineTraceEntry {
  stage: MAPStage;
  description: string;
}

export interface MAPEngineOutput {
  result: MAPResult;
  trace: MAPEngineTraceEntry[];
}

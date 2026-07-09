import type {
  MAPEngineOutput,
  MAPGraph,
  MAPInput,
  MAPInsight,
  MAPMemory,
  MAPPattern,
  MAPResult,
  MAPSharePayload,
  MAPStory,
  MAPTheme,
  MAPValue,
  ParsedConversation,
} from "./core";

export interface ConversationParser {
  parse(input: MAPInput): ParsedConversation;
}

export interface MemoryBuilder {
  build(parsed: ParsedConversation): MAPMemory;
}

export interface ThemeAnalyzer {
  extract(memory: MAPMemory): MAPTheme[];
}

export interface ValueDetector {
  detect(memory: MAPMemory, themes: MAPTheme[]): MAPValue[];
}

export interface PatternFinder {
  find(memory: MAPMemory, themes: MAPTheme[], values: MAPValue[]): MAPPattern[];
}

export interface MAPGraphBuilder {
  buildGraph(input: MAPInput, themes: MAPTheme[], values: MAPValue[], patterns: MAPPattern[]): MAPGraph;
}

export interface InsightEngine {
  generateInsight(input: MAPInput, graph: MAPGraph, values: MAPValue[], patterns: MAPPattern[]): MAPInsight;
}

export interface StoryEngine {
  generateStory(input: MAPInput, insight: MAPInsight, themes: MAPTheme[], values: MAPValue[]): MAPStory;
}

export interface ResultRenderer {
  renderResult(input: MAPInput, graph: MAPGraph, values: MAPValue[], insight: MAPInsight, story: MAPStory): MAPResult;
}

export interface ShareEngine {
  renderShare(result: MAPResult): MAPSharePayload;
}

export interface MAPEngine {
  run(input: MAPInput): MAPEngineOutput;
}

export interface MAPEngineModules {
  conversationParser: ConversationParser;
  memoryBuilder: MemoryBuilder;
  themeAnalyzer: ThemeAnalyzer;
  valueDetector: ValueDetector;
  patternFinder: PatternFinder;
  graphBuilder: MAPGraphBuilder;
  insightEngine: InsightEngine;
  storyEngine: StoryEngine;
  resultRenderer: ResultRenderer;
  shareEngine: ShareEngine;
}

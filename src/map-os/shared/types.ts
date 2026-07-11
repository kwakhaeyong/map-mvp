export type MAPOSCategory = "expression" | "life" | "friend" | "work" | "ideal-type" | "travel" | "food";

export type MAPOSMode = "create" | "journal" | "compare" | "share";

export interface MAPOSContext {
  sessionId: string;
  userId?: string;
  category: MAPOSCategory;
  mode: MAPOSMode;
  locale: "ko-KR";
  createdAt: string;
}

export interface MAPQuestion {
  id: string;
  text: string;
  intent: "open" | "contrast" | "memory" | "emotion" | "value";
  optional?: boolean;
}

export interface MAPAnswer {
  questionId: string;
  text: string;
  answeredAt: string;
}

export interface ConversationTurn {
  id: string;
  questionId?: string;
  role: "system" | "user";
  text: string;
  timestamp: string;
}

export interface ConversationMemorySnapshot {
  turns: ConversationTurn[];
  durableSignals: string[];
  temporarySignals: string[];
  unresolvedSignals: string[];
}

export interface ThemeSignal {
  id: string;
  label: string;
  evidence: string[];
  weight: number;
}

export interface ValueSignal {
  id: string;
  label: string;
  description: string;
  strength: number;
}

export interface EmotionSignal {
  id: string;
  label: string;
  tone: "bright" | "soft" | "deep" | "restless" | "calm";
  intensity: number;
}

export interface PatternSignal {
  id: string;
  label: string;
  description: string;
  confidence: number;
  evidence: string[];
}

export interface MAPStoryBlock {
  id: string;
  role: "headline" | "one-line" | "hidden-insight" | "priority" | "share-copy";
  text: string;
}

export interface MAPStoryOutput {
  title: string;
  subtitle: string;
  blocks: MAPStoryBlock[];
}

export interface IdentityProfile {
  id: string;
  category: MAPOSCategory;
  reusableLabels: string[];
  stableValues: ValueSignal[];
  recurringPatterns: PatternSignal[];
  updatedAt: string;
}

export interface RenderedMAPNode {
  id: string;
  label: string;
  x: number;
  y: number;
  weight: number;
  accent: string;
}

export interface RenderedMAP {
  title: string;
  storyTitle: string;
  nodes: RenderedMAPNode[];
  visualLanguage: "story-card" | "constellation" | "timeline" | "relationship-map";
}

export interface ShareArtifact {
  title: string;
  text: string;
  imageAlt: string;
  hashtags: string[];
}

export interface MAPOSResult {
  context: MAPOSContext;
  story: MAPStoryOutput;
  identity: IdentityProfile;
  renderedMap: RenderedMAP;
  share: ShareArtifact;
}

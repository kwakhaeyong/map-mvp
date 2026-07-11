export type ConversationCategory = "ideal-type" | "travel" | "food" | "work" | "life" | "expression" | "friend";

export type ConversationTone = "warm" | "playful" | "curious" | "reflective";

export interface ConversationContext {
  sessionId: string;
  category: ConversationCategory;
  locale: "ko-KR";
  tone: ConversationTone;
  startedAt: string;
}

export interface CuriosityPrompt {
  id: string;
  text: string;
  purpose: "open-story" | "follow-up" | "reflection" | "bridge";
  avoidsSurveyLanguage: boolean;
}

export interface UserStoryTurn {
  id: string;
  promptId: string;
  text: string;
  createdAt: string;
}

export interface MAPSmallResponse {
  id: string;
  text: string;
  role: "warm-reaction" | "gentle-mirror" | "curious-bridge";
}

export interface ConversationMoment {
  prompt: CuriosityPrompt;
  userTurn?: UserStoryTurn;
  mapResponse?: MAPSmallResponse;
}

export interface ConversationState {
  context: ConversationContext;
  moments: ConversationMoment[];
  currentPrompt?: CuriosityPrompt;
  isReadyForStory: boolean;
  maxTurns: number;
  targetMinutes: 3;
}

export interface DiscoveredPattern {
  id: string;
  label: string;
  evidenceTurnIds: string[];
  confidence: number;
}

export interface ConversationStoryHandoff {
  context: ConversationContext;
  moments: ConversationMoment[];
  patterns: DiscoveredPattern[];
  storySeeds: string[];
}

export interface ConversationMAPPayload {
  storyHandoffId: string;
  mapSeeds: string[];
}

export interface ConversationShareCue {
  text: string;
  reason: string;
}

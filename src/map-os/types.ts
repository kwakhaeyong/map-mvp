import type { ConversationMemory } from "./conversation-memory/types";
import type { EmotionEngine } from "./emotion-engine/types";
import type { IdentityEngine } from "./identity-engine/types";
import type { MAPRenderer } from "./map-renderer/types";
import type { PatternEngine } from "./pattern-engine/types";
import type { QuestionEngine } from "./question-engine/types";
import type { ShareRenderer } from "./share-renderer/types";
import type { StoryEngine } from "./story-engine/types";
import type { ThemeEngine } from "./theme-engine/types";
import type { ValueEngine } from "./value-engine/types";
import type { MAPAnswer, MAPOSContext, MAPOSResult } from "./shared/types";

export interface MAPOSModules {
  questionEngine: QuestionEngine;
  conversationMemory: ConversationMemory;
  themeEngine: ThemeEngine;
  valueEngine: ValueEngine;
  emotionEngine: EmotionEngine;
  patternEngine: PatternEngine;
  storyEngine: StoryEngine;
  identityEngine: IdentityEngine;
  mapRenderer: MAPRenderer;
  shareRenderer: ShareRenderer;
}

export interface MAPOSRunInput {
  context: MAPOSContext;
  answers: MAPAnswer[];
}

export interface MAPOS {
  run(input: MAPOSRunInput): MAPOSResult;
}

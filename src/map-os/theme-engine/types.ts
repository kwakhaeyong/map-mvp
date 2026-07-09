import type { ConversationMemorySnapshot, MAPOSContext, ThemeSignal } from "../shared/types";

export interface ThemeEngineInput {
  context: MAPOSContext;
  memory: ConversationMemorySnapshot;
}

export interface ThemeEngine {
  extractThemes(input: ThemeEngineInput): ThemeSignal[];
}

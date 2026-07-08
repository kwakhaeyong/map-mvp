import type { ConversationEngine, ConversationEngineModules, ConversationEngineRunInput } from "./types";

export function createConversationEngine(modules: ConversationEngineModules): ConversationEngine {
  return {
    run(input: ConversationEngineRunInput) {
      const previousMoments = input.state?.moments ?? [];
      const reaction = modules.reactionEngine.createReaction({
        context: input.context,
        userTurn: input.userTurn,
        previousMoments,
      });
      const prompt = modules.curiosityEngine.createPrompt({
        context: input.context,
        previousMoments,
      });

      const state = modules.conversationFlow.continue(input);
      const reflection = input.userTurn
        ? modules.reflectionEngine.reflect({ moments: state.moments })
        : undefined;
      const mapResponse = reflection ?? reaction;
      const moments = state.currentPrompt ? state.moments : [...state.moments, { prompt, mapResponse }];
      const reflectedState = {
        ...state,
        moments,
        currentPrompt: prompt,
      };

      if (!reflectedState.isReadyForStory) {
        return { state: reflectedState };
      }

      const patterns = modules.patternDiscovery.discover({
        context: input.context,
        moments: reflectedState.moments,
      });
      const storyHandoff = modules.storyHandoff.prepareStory({
        context: input.context,
        moments: reflectedState.moments,
        patterns,
      });
      modules.mapHandoff.prepareMAP(storyHandoff);
      const shareCue = modules.shareHandoff.prepareShareCue(storyHandoff);

      return {
        state: reflectedState,
        storyHandoff,
        shareCue,
      };
    },
  };
}

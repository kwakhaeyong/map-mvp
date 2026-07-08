import type { MAPOS, MAPOSModules, MAPOSRunInput } from "./types";

export function createMAPOS(modules: MAPOSModules): MAPOS {
  return {
    run(input: MAPOSRunInput) {
      modules.questionEngine.planQuestions({
        context: input.context,
        previousAnswers: input.answers,
      });

      const memory = modules.conversationMemory.buildSnapshot(input);
      const themes = modules.themeEngine.extractThemes({ context: input.context, memory });
      const values = modules.valueEngine.detectValues({ context: input.context, memory, themes });
      const emotions = modules.emotionEngine.readEmotions({ context: input.context, memory, themes, values });
      const patterns = modules.patternEngine.findPatterns({ context: input.context, themes, values, emotions });
      const story = modules.storyEngine.generateStory({ context: input.context, themes, values, emotions, patterns });
      const identity = modules.identityEngine.buildIdentity({ context: input.context, story, values, patterns });
      const renderedMap = modules.mapRenderer.renderMap({ context: input.context, story, identity });
      const share = modules.shareRenderer.renderShare({ context: input.context, story, identity, renderedMap });

      return {
        context: input.context,
        story,
        identity,
        renderedMap,
        share,
      };
    },
  };
}

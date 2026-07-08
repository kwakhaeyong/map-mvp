import type { StoryEngineModules, StoryEngineMVP, StoryEngineRunInput } from "./types";

export function createStoryEngineMVP(modules: StoryEngineModules): StoryEngineMVP {
  return {
    run(input: StoryEngineRunInput) {
      const conversation = modules.conversation.buildConversation(input);
      const emotion = modules.emotionAnalyzer.analyzeEmotion({ context: input.context, conversation });
      const values = modules.valueAnalyzer.analyzeValues({ context: input.context, conversation, emotion });
      const conflicts = modules.conflictDetector.detectConflicts({ context: input.context, conversation, emotion, values });
      const patterns = modules.patternDetector.detectPatterns({ context: input.context, conversation, emotion, values, conflicts });
      const story = modules.storyGenerator.generateStory({ context: input.context, emotion, values, conflicts, patterns });
      const headline = modules.headlineGenerator.generateHeadline({ context: input.context, story });
      const hiddenInsight = modules.insightGenerator.generateInsight({ context: input.context, story, headline, conflicts, patterns });
      const renderedMap = modules.mapRenderer.renderMAP({ context: input.context, story, headline, hiddenInsight });

      return {
        story,
        headline,
        hiddenInsight,
        renderedMap,
      };
    },
  };
}

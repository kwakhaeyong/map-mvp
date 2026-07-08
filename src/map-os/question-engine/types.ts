import type { MAPAnswer, MAPOSContext, MAPQuestion } from "../shared/types";

export interface QuestionEngineInput {
  context: MAPOSContext;
  previousAnswers: MAPAnswer[];
}

export interface QuestionEngineOutput {
  questions: MAPQuestion[];
  nextQuestion?: MAPQuestion;
}

export interface QuestionEngine {
  planQuestions(input: QuestionEngineInput): QuestionEngineOutput;
}

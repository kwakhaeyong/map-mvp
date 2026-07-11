import type { ConversationMoment, MAPSmallResponse } from "../shared/types";

export interface ReflectionEngineInput {
  moments: ConversationMoment[];
}

export interface ReflectionEngine {
  reflect(input: ReflectionEngineInput): MAPSmallResponse;
}

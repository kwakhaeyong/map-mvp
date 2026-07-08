export type ReactionTone = "warm" | "playful" | "surprised" | "gentle" | "visual";

export interface ReactionTemplate {
  id: string;
  emoji: string;
  text: string;
  tone: ReactionTone;
  useWhen: string;
}

export const reactionLibrary = [
  {
    id: "warm-expression",
    emoji: "😊",
    text: "그 말, 왠지 남아요.",
    tone: "warm",
    useWhen: "The user describes a feeling or preference in their own words.",
  },
  {
    id: "playful-expression",
    emoji: "✨",
    text: "아 그 느낌 알 것 같아요.",
    tone: "playful",
    useWhen: "The user gives a vivid, funny, or unexpected phrase.",
  },
  {
    id: "soft-surprise",
    emoji: "🤔",
    text: "오, 그건 조금 의외예요.",
    tone: "surprised",
    useWhen: "The user's answer reveals a contrast or contradiction.",
  },
  {
    id: "keep-going",
    emoji: "🌿",
    text: "좋아요. 조금만 더 들려주세요.",
    tone: "gentle",
    useWhen: "The user seems close to a meaningful memory but has not told the full scene yet.",
  },
  {
    id: "scene-forms",
    emoji: "😄",
    text: "그 장면이 바로 그려져요.",
    tone: "visual",
    useWhen: "The user shares a concrete scene, memory, or moment.",
  },
] as const satisfies readonly ReactionTemplate[];

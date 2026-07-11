import { createDiscoveryCandidate, type DiscoveryEngine } from "./discovery";
import type { ConnectionDetector } from "./connection";
import type { ContrastDetector } from "./contrast";
import type { EmotionDetector } from "./emotion";
import type { MeaningEngine } from "./meaning";
import type { MemoryExtractor } from "./memory";
import type { PatternDetector } from "./pattern";
import type { SignalEngine } from "./signals";
import type { DiscoveryStoryBuilder } from "./story";
import type { DiscoveryConversationTurn, DiscoveryPatternConcept, DiscoverySignal, MAPDiscoveryResult, MemoryMoment } from "./types";
import { createMAPDiscoveryEngine } from "./pipeline";

const patternLexicon: Record<DiscoveryPatternConcept, string[]> = {
  laugh: ["웃", "funny", "laugh"],
  comfort: ["편", "편안", "comfort", "calm"],
  kindness: ["다정", "친절", "kind"],
  challenge: ["도전", "어려운", "문제", "challenge", "해보고"],
  adventure: ["여행", "떠", "낯선", "골목", "adventure"],
  family: ["가족", "family"],
  freedom: ["자유", "혼자", "freedom"],
  growth: ["성장", "배우", "growth"],
};

const discoveryByContrast: Partial<Record<DiscoveryPatternConcept, string>> = {
  laugh: "처음에는 외모를 이야기했지만, 오래 머문 이야기는 함께 웃는 시간이었어요.",
  comfort: "말로는 조건을 말했지만, 계속 남은 건 편안하게 머물 수 있던 시간이었어요.",
  adventure: "계획이 중요하다고 말했지만, 가장 선명한 장면은 혼자 낯선 곳을 걷던 자유였어요.",
  challenge: "스펙을 말했지만, 오래 남은 건 함께 어려운 문제를 풀던 순간이었어요.",
  growth: "결과보다 더 오래 남은 건 배우고 성장하던 감각이었어요.",
};

function userText(conversation: DiscoveryConversationTurn[]) {
  return conversation.filter((turn) => turn.source === "user").map((turn) => turn.text).join(" ");
}

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.toLowerCase().includes(word.toLowerCase()));
}

export const deterministicMemoryExtractor: MemoryExtractor = {
  extractMemories(input) {
    return input.conversation
      .filter((turn) => turn.source === "user")
      .map<MemoryMoment>((turn) => {
        const strong = includesAny(turn.text, ["기억", "장면", "아직도", "그때", "같이", "떠올라", "생각나"]);
        return {
          id: `${turn.id}-memory`,
          text: turn.text,
          strength: strong ? "strong" : "weak",
          sourceTurnIds: [turn.id],
        };
      });
  },
};

export const deterministicEmotionDetector: EmotionDetector = {
  detectEmotion(input) {
    const text = input.memories.map((memory) => memory.text).join(" ");
    if (includesAny(text, ["편", "안심", "천천히"])) {
      return { label: "편안함", warmth: 92, intensity: 72, evidence: ["comfort language"] };
    }
    if (includesAny(text, ["설레", "떠", "낯선", "자유"])) {
      return { label: "가벼운 설렘", warmth: 78, intensity: 86, evidence: ["movement language"] };
    }
    return { label: "몰입", warmth: 70, intensity: 82, evidence: ["energy language"] };
  },
};

export const deterministicPatternDetector: PatternDetector = {
  detectPatterns(input) {
    const text = input.memories.map((memory) => memory.text).join(" ");
    return Object.entries(patternLexicon)
      .map(([concept, words]) => ({
        concept: concept as DiscoveryPatternConcept,
        count: words.filter((word) => text.toLowerCase().includes(word.toLowerCase())).length,
        evidence: input.memories.filter((memory) => includesAny(memory.text, words)).map((memory) => memory.text),
      }))
      .filter((pattern) => pattern.count > 0)
      .sort((a, b) => b.count - a.count);
  },
};

function signalLabels(signals: DiscoverySignal[]) {
  return signals.map((signal) => signal.label);
}

function signalEvidence(signals: DiscoverySignal[]) {
  return signals.flatMap((signal) => signal.evidence).slice(0, 3);
}

export const deterministicSignalEngine: SignalEngine = {
  extractSignals(input) {
    const memoryText = input.memories.map((memory) => memory.text).join(" ");
    const signals: DiscoverySignal[] = input.patterns.map((pattern) => ({
      id: `${input.context.sessionId}-signal-repeated-${pattern.concept}`,
      type: "repeated-word",
      label: pattern.concept,
      strength: Math.min(1, pattern.count / 3),
      evidence: pattern.evidence,
    }));

    signals.push({
      id: `${input.context.sessionId}-signal-emotion-intensity`,
      type: "emotional-intensity",
      label: input.emotion.intensity >= 80 ? "positive-emotion" : "soft-emotion",
      strength: input.emotion.intensity / 100,
      evidence: input.emotion.evidence,
    });

    if (includesAny(memoryText, ["친구", "팀", "같이", "함께", "사람"])) {
      signals.push({
        id: `${input.context.sessionId}-signal-relationship`,
        type: "relationship",
        label: "relationship-presence",
        strength: 0.86,
        evidence: input.memories.filter((memory) => includesAny(memory.text, ["친구", "팀", "같이", "함께", "사람"])).map((memory) => memory.text),
      });
    }

    if (includesAny(memoryText, ["외모", "조건", "계획", "스펙"])) {
      signals.push({
        id: `${input.context.sessionId}-signal-preference`,
        type: "preference",
        label: "stated-preference",
        strength: 0.74,
        evidence: input.memories.filter((memory) => includesAny(memory.text, ["외모", "조건", "계획", "스펙"])).map((memory) => memory.text),
      });
    }

    if (includesAny(memoryText, ["아직도", "기억", "오래", "그때", "장면"])) {
      signals.push({
        id: `${input.context.sessionId}-signal-temporal`,
        type: "temporal",
        label: "still-remembered",
        strength: 0.9,
        evidence: input.memories.filter((memory) => includesAny(memory.text, ["아직도", "기억", "오래", "그때", "장면"])).map((memory) => memory.text),
      });
    }

    signals.push({
      id: `${input.context.sessionId}-signal-topic-frequency`,
      type: "topic-frequency",
      label: input.context.category,
      strength: Math.min(1, input.memories.length / 3),
      evidence: input.memories.map((memory) => memory.text),
    });

    return signals;
  },
};

export const deterministicConnectionDetector: ConnectionDetector = {
  detectConnections(input) {
    const labels = signalLabels(input.signals);
    const groundedIn = signalEvidence(input.signals);

    if (labels.includes("adventure") && labels.includes("freedom")) {
      return [{
        id: `${input.context.sessionId}-connection-place-people-atmosphere`,
        from: "signal",
        to: "hidden-desire",
        sentence: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
        groundedIn,
      }];
    }

    if (labels.includes("laugh") && labels.includes("comfort")) {
      return [{
        id: `${input.context.sessionId}-connection-laugh-comfort`,
        from: "signal",
        to: "reflection",
        sentence: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
        groundedIn,
      }];
    }

    if (labels.includes("challenge") && labels.includes("growth")) {
      return [{
        id: `${input.context.sessionId}-connection-challenge-growth`,
        from: "signal",
        to: "value",
        sentence: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
        groundedIn,
      }];
    }

    return [{
      id: `${input.context.sessionId}-connection-signal-reflection`,
      from: "signal",
      to: "reflection",
      sentence: "반복해서 나온 신호가 지금 가장 강한 감정과 연결돼요.",
      groundedIn,
    }];
  },
};

export const deterministicContrastDetector: ContrastDetector = {
  detectContrast(input) {
    const said = userText(input.conversation);
    const emphasized = input.patterns.slice(0, 3).map((pattern) => pattern.concept);
    if (includesAny(said, ["외모", "조건", "계획", "돈", "스펙"]) && emphasized.length > 0) {
      return {
        says: includesAny(said, ["외모", "조건", "스펙"]) ? "조건이 중요하다고 말함" : "계획이 중요하다고 말함",
        conversationEmphasizes: emphasized,
        candidate: `말보다 ${emphasized.join(", ")}에 더 오래 머무름`,
        confidence: 0.78,
      };
    }
    return undefined;
  },
};

export const deterministicMeaningEngine: MeaningEngine = {
  deriveMeaning(input) {
    const strongestMemory = input.memories.find((memory) => memory.strength === "strong") ?? input.memories[0];
    const strongestConnection = input.connections[0];
    const topPattern = input.patterns[0];
    const sentence = strongestConnection?.sentence
      ?? (strongestMemory ? `가장 선명한 장면은 ${strongestMemory.text}에 남아 있어요.` : `${input.emotion.label}이 지금 이야기의 중심에 있어요.`);
    const supportingEvidence = [
      strongestMemory ? { source: "memory" as const, text: strongestMemory.text } : undefined,
      strongestConnection ? { source: "connection" as const, text: strongestConnection.sentence } : undefined,
      topPattern ? { source: "pattern" as const, text: `${topPattern.concept}:${topPattern.evidence[0] ?? topPattern.count}` } : undefined,
      { source: "emotion" as const, text: input.emotion.label },
    ].filter((e): e is NonNullable<typeof e> => Boolean(e));

    const confidenceScore = Math.min(0.95, 0.55 + supportingEvidence.length * 0.1 + (strongestMemory?.strength === "strong" ? 0.1 : 0));

    return {
      id: `${input.context.sessionId}-meaning`,
      sentence,
      supportingEvidence,
      confidenceScore,
    };
  },
};

export const deterministicDiscoveryEngine: DiscoveryEngine = {
  discover(input) {
    const candidate = createDiscoveryCandidate(input);
    const topPattern = input.patterns[0]?.concept ?? "comfort";
    const groundedContrast = input.contrast ? discoveryByContrast[topPattern] : undefined;
    const connectionDiscovery = input.connections[0]?.sentence;

    return {
      candidate,
      whyItMatters: groundedContrast ?? connectionDiscovery ?? `가장 오래 남은 이야기는 ${candidate.memory.text}였어요.`,
      isOneCoreDiscovery: true,
      isSurprisingInsight: true,
    };
  },
};

export const deterministicStoryBuilder: DiscoveryStoryBuilder = {
  buildStory(input) {
    const sentence = input.meaning.sentence;
    return {
      finalStory: sentence.slice(0, 150),
      memorableLine: sentence.slice(0, 80),
    };
  },
};

export function createDeterministicDiscoveryEngine() {
  return createMAPDiscoveryEngine({
    memory: deterministicMemoryExtractor,
    emotion: deterministicEmotionDetector,
    pattern: deterministicPatternDetector,
    signals: deterministicSignalEngine,
    connection: deterministicConnectionDetector,
    contrast: deterministicContrastDetector,
    discovery: deterministicDiscoveryEngine,
    meaning: deterministicMeaningEngine,
    story: deterministicStoryBuilder,
  });
}

export function runDeterministicDiscovery(conversation: Parameters<ReturnType<typeof createDeterministicDiscoveryEngine>["run"]>[0]): MAPDiscoveryResult {
  return createDeterministicDiscoveryEngine().run(conversation);
}

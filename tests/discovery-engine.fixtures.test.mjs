import assert from "node:assert/strict";
import test from "node:test";

const fixtures = {
  love: {
    memories: ["같이 별거 아닌 일로 웃던 장면", "말이 없어도 편하고 다정한 사람"],
    emotions: "편안함",
    signalTypes: ["repeated-word", "emotional-intensity", "relationship", "preference", "temporal", "topic-frequency"],
    repeatedPatterns: ["laugh", "comfort", "kindness"],
    connections: ["함께 웃던 장면이 편안함의 감정으로 이어져요."],
    contrast: "조건이 중요하다고 말함 → laugh, comfort, kindness",
    coreDiscovery: "처음에는 외모를 이야기했지만, 오래 머문 이야기는 함께 웃는 시간이었어요.",
    coreMeaning: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
    evidence: ["memory", "connection", "pattern", "emotion"],
    confidenceScore: 0.95,
    story: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
  },
  travel: {
    memories: ["혼자 낯선 골목을 걷던 장면", "자유롭고 조금 설렜던 순간"],
    emotions: "가벼운 설렘",
    signalTypes: ["repeated-word", "emotional-intensity", "preference", "temporal", "topic-frequency"],
    repeatedPatterns: ["adventure", "freedom"],
    connections: ["목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요."],
    contrast: "계획이 중요하다고 말함 → adventure, freedom",
    coreDiscovery: "계획이 중요하다고 말했지만, 가장 선명한 장면은 혼자 낯선 곳을 걷던 자유였어요.",
    coreMeaning: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
    evidence: ["memory", "connection", "pattern", "emotion"],
    confidenceScore: 0.95,
    story: "목적지보다 낯선 곳에서 느낀 자유와 분위기를 더 오래 기억해요.",
  },
  work: {
    memories: ["팀이 어려운 문제를 같이 풀던 때", "배우고 성장하는 느낌"],
    emotions: "몰입",
    signalTypes: ["repeated-word", "emotional-intensity", "relationship", "preference", "temporal", "topic-frequency"],
    repeatedPatterns: ["challenge", "growth"],
    connections: ["어려운 문제를 푸는 과정이 성장의 감각으로 이어져요."],
    contrast: "스펙이 중요하다고 말함 → challenge, growth",
    coreDiscovery: "스펙을 말했지만, 오래 남은 건 함께 어려운 문제를 풀던 순간이었어요.",
    coreMeaning: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
    evidence: ["memory", "connection", "pattern", "emotion"],
    confidenceScore: 0.95,
    story: "어려운 문제를 푸는 과정이 성장의 감각으로 이어져요.",
  },
};

for (const [topic, expected] of Object.entries(fixtures)) {
  test(`${topic} fixture has normalized signals before connection and story`, () => {
    assert.ok(expected.memories.length >= 1);
    assert.ok(expected.signalTypes.includes("repeated-word"));
    assert.ok(expected.signalTypes.includes("emotional-intensity"));
    assert.ok(expected.signalTypes.includes("topic-frequency"));
    assert.ok(expected.repeatedPatterns.length >= 1);
    assert.ok(expected.connections.length >= 1);
    assert.ok(expected.contrast.includes("→"));
    assert.notEqual(expected.coreDiscovery, "");
    assert.equal(expected.coreMeaning, expected.story);
    assert.ok(expected.evidence.includes("connection"));
    assert.ok(expected.confidenceScore >= 0.75);
    assert.match(expected.coreDiscovery, /지만|보다|남은|머문/);
    assert.ok(expected.story.length <= 150);
    assert.doesNotMatch(expected.story, /타입|분류|진단/);
  });
}

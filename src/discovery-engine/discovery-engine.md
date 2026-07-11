# MAP Discovery Engine MVP

The Discovery Engine transforms conversation into MAP insights. It is not an AI classifier. It does not sort people into types. It discovers memorable moments, repeated patterns, contrasts, and one warm story that can become a MAP result.

## Pipeline

```text
Conversation
    ↓
Memory Extraction
    ↓
Emotion Detection
    ↓
Pattern Detection
    ↓
Contrast Detection
    ↓
Discovery
    ↓
Story
    ↓
MAP Result
```

## Why Discovery Is MAP's Core Product

MAP is a self-expression format. The core product is not the question, the chat, or the visual card by itself. The core product is the moment a user feels: “Oh, this explains me.”

That moment comes from discovery. Discovery finds the living detail inside conversation: a scene the user remembers, a repeated concept, a contrast between stated preference and emotional emphasis, or a pattern that feels true without becoming a label.

## Why Discovery Is Different From AI Summarization

Summarization compresses what was said. Discovery reveals what mattered.

Example:

```text
Input: I like funny people.
Weak summary: He likes humor.
```

That is only an opinion. It is not enough for MAP.

```text
Input: I still remember laughing together.
Strong memory: Laughing together.
```

A memory carries emotion, context, and identity. MAP should prefer memorable moments over abstract opinions.

## Stage Responsibilities

### Memory Extraction
Extract memorable moments, not opinions.

### Emotion Detection
Read warmth, intensity, and emotional evidence from memories.

### Pattern Detection
Find repeated concepts such as laugh, comfort, kindness, challenge, adventure, family, freedom, and growth.

### Contrast Detection
Detect contradictions between what the user explicitly says and what the conversation mostly emphasizes.

### Discovery
Choose the strongest discovery candidate from memory, emotion, pattern, and contrast signals.

### Story Builder
Generate only one final story. Never classify. Never judge. Never diagnose. Always warm. Always memorable.

## Architecture Rules

- This is not an AI classifier.
- Every stage is separated.
- Memory extraction must prefer scenes over opinions.
- Pattern detection looks for repeated concepts.
- Contrast detection can turn contradiction into a discovery candidate.
- Story Builder produces one final story only.
- MAP Result renders the discovery and story; it does not invent the insight.

## Discovery Rule Engine

The MVP rule engine is deterministic. It does not classify the user. It connects only signals that appear in the user's own words.

Rules currently cover:

- memory extraction from scene markers such as `기억`, `장면`, `아직도`, `같이`, `생각나`
- repeated pattern detection for concepts such as laugh, comfort, kindness, adventure, challenge, freedom, and growth
- emotion signals from words that carry comfort, movement, excitement, or immersion
- contrast detection when stated preferences such as 외모, 조건, 계획, or 스펙 differ from repeated emotional patterns
- discovery candidate generation that turns the contrast into one grounded sentence

## Sample Input / Output

### Love MAP

Input:

```text
외모도 중요하다고 생각했는데, 아직도 같이 별거 아닌 일로 웃던 장면이 생각나요.
말이 없어도 편하고 다정한 사람이 오래 남아요.
```

Output:

```text
처음에는 외모를 이야기했지만, 오래 머문 이야기는 함께 웃는 시간이었어요.
```

### Travel MAP

Input:

```text
계획이 중요하다고 말하지만 아직도 혼자 낯선 골목을 걷던 장면이 선명해요.
그때 이상하게 자유롭고 조금 설렜어요.
```

Output:

```text
계획이 중요하다고 말했지만, 가장 선명한 장면은 혼자 낯선 곳을 걷던 자유였어요.
```

### Work MAP

Input:

```text
스펙이 중요하다고 생각했는데, 팀이 어려운 문제를 같이 풀던 때가 제일 기억나요.
도전적이었지만 배우고 성장하는 느낌이 좋았어요.
```

Output:

```text
스펙을 말했지만, 오래 남은 건 함께 어려운 문제를 풀던 순간이었어요.
```

## Discovery Quality Checklist

- Do not classify.
- Do not diagnose.
- Do not judge.
- Do not create facts the user did not say.
- Connect only what the user already said.
- Make the user feel: `어? 그러네.`
- Prefer: `당신은 화려한 사람보다 함께 웃을 수 있는 시간을 더 오래 기억합니다.`
- Avoid: `당신은 유머를 중요하게 생각합니다.`

## Why Connection Is the Core of Discovery

A summary says what appeared. A connection shows why two user-owned details belong together.

Discovery works when MAP connects:

- memory to memory
- memory to emotion
- repeated words to value
- stated preference to actual emphasis
- topic to hidden desire

Example:

```text
User talks about: 여행, 친구, 편했다, 계속 웃었다
Connection: The user remembers the people and atmosphere more than the destination.
Discovery: 당신은 장소보다, 그곳에서 함께 웃었던 사람을 더 오래 기억합니다.
```

Connection is the bridge between conversation and expression. Without connection, MAP becomes a summary. With connection, the user can feel: `어? 그러네.`

## Meaning Engine MVP

Meaning Engine sits between Discovery and Story. Discovery can still produce candidates and contrasts, but Story no longer reads raw Discovery output directly. Instead, Meaning Engine receives only user-grounded signals:

- memories
- connections
- repeated patterns
- emotions

It returns exactly one core meaning, supporting evidence, and a confidence score. This keeps Story generation focused on expression, not analysis.

### Why Meaning comes before Story

Story should feel like one warm sentence a user would save or send. If Story consumes every raw signal, it can become a summary. Meaning Engine compresses the signals into one grounded point first, so Story can stay short, emotional, and shareable.

### Meaning output contract

```ts
{
  sentence: "함께 웃던 장면이 편안함의 감정으로 이어져요.",
  supportingEvidence: [
    { source: "memory", text: "아직도 같이 별거 아닌 일로 웃던 장면이 생각나요." },
    { source: "connection", text: "함께 웃던 장면이 편안함의 감정으로 이어져요." },
    { source: "pattern", text: "laugh:아직도 같이 별거 아닌 일로 웃던 장면이 생각나요." },
    { source: "emotion", text: "편안함" }
  ],
  confidenceScore: 0.95
}
```

## Signal Engine MVP

Signal Engine sits between Pattern detection and Connection. Connection should not consume raw memories directly because raw memory text is too unstructured for stable product behavior. Signal Engine converts memory artifacts into reusable Discovery signals:

- repeated words
- emotional intensity
- topic frequency
- preference signals
- relationship signals
- temporal signals

### Signal example

```text
Memory
"친구"
"웃음"
"편했다"

↓

Signals
Relationship Signal: relationship-presence
Repeated Word Signal: laugh
Repeated Word Signal: comfort
Emotional Intensity Signal: positive-emotion

↓

Connection
함께 웃던 장면이 편안함의 감정으로 이어져요.

↓

Reflection
당신은 화려한 말보다 함께 편하게 웃던 시간을 더 오래 기억해요.
```

### Why Signals come before Connection

Signals make Connection reusable across topics. Love MAP, Travel MAP, Work MAP, and future MAPs can all connect normalized signals without each topic creating its own memory parsing rules.

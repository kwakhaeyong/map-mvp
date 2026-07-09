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

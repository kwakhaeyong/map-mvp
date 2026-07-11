# MAP MVP

MAP is a new self-expression format.

MAP does not classify people.
MAP helps people express themselves through conversation.

Signal Engine turns memories, emotions, and repeated patterns into normalized signals before Connection runs. Meaning Engine then turns signals-backed connections into one grounded meaning before Story renders a shareable sentence.

> 사람은 분류되는 존재가 아니라, 표현되는 존재입니다.

## MAP OS Diagram

```text
Question Engine
      ↓
Conversation Memory
      ↓
Theme Engine
      ↓
Value Engine
      ↓
Emotion Engine
      ↓
Pattern Engine
      ↓
Signal Engine
      ↓
Connection Engine
      ↓
Meaning Engine
      ↓
Story Engine
      ↓
Identity Engine
      ↓
MAP Renderer
      ↓
Share Renderer
```

## Data Flow

1. **Question Engine** plans the next prompts for a MAP category or mode.
2. **Conversation Memory** turns answers into a reusable memory snapshot.
3. **Theme Engine** extracts the main themes from memory.
4. **Value Engine** detects user values from memory and themes.
5. **Emotion Engine** reads emotional tones and intensity.
6. **Pattern Engine** finds repeated expression patterns.
7. **Signal Engine** normalizes repeated words, emotional intensity, topic frequency, preference, relationship, and temporal signals.
8. **Connection Engine** connects signals into reflection candidates without reading raw memories directly.
9. **Meaning Engine** compresses memories, signal-backed connections, patterns, and emotions into one grounded meaning.
10. **Story Engine** creates the user-facing story from Meaning output. This must happen before rendering.
11. **Identity Engine** stores reusable identity profile data across MAP surfaces.
12. **MAP Renderer** visualizes only the Story Engine output plus identity context.
13. **Share Renderer** packages the final story and rendered MAP into a share artifact.

## Folder Structure

```text
src/map-os/
  question-engine/       prompt planning interfaces
  conversation-memory/   memory snapshot interfaces
  theme-engine/          theme extraction interfaces
  value-engine/          value detection interfaces
  emotion-engine/        emotional signal interfaces
  pattern-engine/        repeated pattern interfaces
  signal-engine/         normalized signal interfaces
  connection-engine/     signal connection interfaces
  meaning-engine/        meaning synthesis interfaces
  story-engine/          story generation interfaces
  identity-engine/       reusable identity profile interfaces
  map-renderer/          story visualization interfaces
  share-renderer/        share artifact interfaces
  shared/                common MAP OS data types
  journal/               future Journal surface
  compare/               future Compare surface
  expression-map/        future Expression MAP surface
  life-map/              future Life MAP surface
  friend-map/            future Friend MAP surface
  work-map/              future Work MAP surface
```

## Responsibilities

### Question Engine
Owns question strategy. It decides what to ask next, but does not generate a result.

### Conversation Memory
Stores the conversation as a structured memory snapshot. It separates durable signals from temporary or unresolved signals.

### Theme Engine
Finds recurring topics and themes in memory.

### Value Engine
Detects what the user appears to value right now.

### Emotion Engine
Reads emotional tone. It is separate from values so MAP can express both what matters and how it feels.

### Pattern Engine
Finds repeated behavior, preference, or expression patterns.

### Signal Engine
Normalizes raw memory artifacts into reusable signals: repeated words, emotional intensity, topic frequency, preference signals, relationship signals, and temporal signals.

### Connection Engine
Consumes signals, not raw memories, and connects them into reflection candidates.

### Meaning Engine
Synthesizes memories, signal-backed connections, repeated patterns, and emotions into one grounded meaning with evidence and confidence.

### Story Engine
Turns the Meaning Engine output into one warm, short, shareable story. Story must not read raw Discovery signals directly.

### Identity Engine
Stores reusable identity profile data. This enables future Journal, Compare, Expression MAP, Life MAP, Friend MAP, and Work MAP experiences to share a common identity layer.

### MAP Renderer
Visualizes Story Engine output. It must not invent new meaning or bypass Story Engine.

### Share Renderer
Creates share-ready artifacts that users want to screenshot, save, and send to friends.

## Architecture Rules

- MAP is not a chatbot.
- MAP is not an AI assistant.
- MAP is a self-expression operating system.
- Every engine is separated behind an interface.
- Connection Engine must consume Signals instead of raw memories.
- Meaning must always be generated before Story.
- Story must always be generated before MAP rendering.
- MAP Renderer only visualizes Story Engine output.
- Identity Engine owns reusable identity profile data.
- Future surfaces must use MAP OS instead of creating one-off pipelines.

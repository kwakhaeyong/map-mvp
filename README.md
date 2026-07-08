# MAP MVP

MAP is a new self-expression format.

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
7. **Story Engine** creates the user-facing story. This must happen before rendering.
8. **Identity Engine** stores reusable identity profile data across MAP surfaces.
9. **MAP Renderer** visualizes only the Story Engine output plus identity context.
10. **Share Renderer** packages the final story and rendered MAP into a share artifact.

## Folder Structure

```text
src/map-os/
  question-engine/       prompt planning interfaces
  conversation-memory/   memory snapshot interfaces
  theme-engine/          theme extraction interfaces
  value-engine/          value detection interfaces
  emotion-engine/        emotional signal interfaces
  pattern-engine/        repeated pattern interfaces
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

### Story Engine
Turns themes, values, emotions, and patterns into a story. Story is the source of meaning for rendering.

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
- Story must always be generated before MAP rendering.
- MAP Renderer only visualizes Story Engine output.
- Identity Engine owns reusable identity profile data.
- Future surfaces must use MAP OS instead of creating one-off pipelines.

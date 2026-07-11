# Story Engine MVP

The Story Engine is MAP's core IP. It turns conversation into a story before any visual MAP is rendered.

## Pipeline

```text
Conversation
    ↓
Emotion Analyzer
    ↓
Value Analyzer
    ↓
Conflict Detector
    ↓
Pattern Detector
    ↓
Story Generator
    ↓
Headline Generator
    ↓
Insight Generator
    ↓
MAP Renderer
```

## Why Story Comes Before MAP

MAP is a self-expression format, not a dashboard. If the renderer creates meaning directly, the product becomes a chart. The story must come first because it defines what the MAP is trying to express.

The MAP Renderer therefore has one job: visualize Story Engine output. It must not create new stories, new meanings, new hidden insights, or new user identity labels.

## Layer Responsibilities

### Conversation
Normalizes raw answers into conversation signals.

### Emotion Analyzer
Reads emotional tone and tension from the conversation.

### Value Analyzer
Finds what the user appears to value.

### Conflict Detector
Identifies gaps between what users say and what users actually emphasize.

### Pattern Detector
Finds repeated patterns across emotion, value, and conflict signals.

### Story Generator
Creates the narrative and always produces one memorable sentence.

### Headline Generator
Creates one shareable headline that can travel in screenshots and messages.

### Insight Generator
Creates one hidden insight after story and headline exist.

### MAP Renderer
Visualizes story, headline, and hidden insight. It never creates stories.

## Architecture Rules

- Every layer is independent.
- Every layer has an interface.
- Conflict Detector compares explicit statements against emphasis signals.
- Story Generator always produces one memorable sentence.
- Headline Generator always produces one shareable headline.
- Insight Generator always produces one hidden insight.
- MAP Renderer never creates stories.

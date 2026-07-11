# Conversation Experience MVP

MAP is not an interview. MAP is not a questionnaire. MAP should feel like talking to a close friend.

## Architecture

```text
Curiosity
    ↓
Conversation
    ↓
Pattern Discovery
    ↓
Story
    ↓
MAP
    ↓
Share
```

## Why Conversation Experience Is MAP's First Moat

The result only feels worth saving when the user remembers the conversation that created it. If MAP asks like a survey, users answer defensively or mechanically. If MAP talks with warmth, curiosity, and small reflections, users share stories. Those stories create richer patterns, stronger insights, and a result that feels personal enough to send to friends.

Conversation is therefore the first moat: it is the emotional input layer that makes the output feel like self-expression instead of a generated report.

## Principles

- Never interrogate.
- Never feel like a survey.
- Always sound warm.
- Use small MAP responses before asking more.
- Encourage stories instead of short answers.

## Curiosity Engine

The Curiosity Engine creates prompts that make users want to remember and tell a story.

Bad:

```text
외모가 중요해요?
유머가 중요해요?
```

Good:

```text
처음 만났는데 이상하게 계속 생각나는 사람이 있었나요?
같이 있었을 때 가장 많이 웃었던 사람은 어떤 사람이었나요?
```

## Layer Responsibilities

### Curiosity Engine
Creates warm prompts that open stories instead of collecting survey answers.

### Conversation Flow
Controls the rhythm: small response, curiosity, follow-up, reflection.

### Reflection Engine
Mirrors a user's answer in a short, warm way before the next prompt.

### Pattern Discovery
Finds repeated themes in the user's stories.

### Story Handoff
Packages conversation moments and patterns for the Story Engine.

### MAP Handoff
Prepares story seeds for future MAP rendering.

### Share Handoff
Finds the first share cue before the final result.

## Sprint #011 Conversation Flow

```text
Conversation
    ↓
Reaction
    ↓
Curiosity
    ↓
Small Story
    ↓
Reaction
    ↓
Next Curiosity
    ↓
Discovery
    ↓
Story Engine
    ↓
MAP
```

### Reaction Engine
MAP should react before it asks. The reusable reaction library gives the conversation a warm rhythm so users do not feel interrogated.

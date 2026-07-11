# Topic System MVP

MAP topics configure the experience. They do not create separate engines.

Every topic uses the same flow:

```text
Conversation
    ↓
Discovery
    ↓
Story
    ↓
MAP
```

## Topics

- Love MAP
- Work MAP
- Travel MAP
- Food MAP
- Friend MAP
- Today MAP

## Topic Configuration

Each topic has:

- `title`
- `description`
- `conversationStarter`
- `promptConfig`

Future topics should be added by creating a new config file under `src/topic-config/topics/` and registering it in `registry.ts`. The engine should not change.

## Why This Exists

MAP should scale by adding topics, not by forking the core pipeline. Love MAP, Work MAP, Travel MAP, Food MAP, Friend MAP, and Today MAP all share the same Conversation → Discovery → Story → MAP architecture.

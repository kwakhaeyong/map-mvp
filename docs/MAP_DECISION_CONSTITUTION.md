# MAP Decision Constitution

MAP Decision is the first product of an Executive AI / Thinking OS. This document is the source of truth for product, design, AI conversation, voice, map, business, and engineering decisions.

## 1. Product identity

MAP Decision is **not** a survey, fixed questionnaire, generic chatbot, therapy service, answer machine, consulting report, or decorative mind-map generator.

MAP Decision is a voice-first thinking product where a person speaks or types naturally, AI helps uncover their own thinking, the structure becomes visible while the conversation continues, and the final output is one actionable visual MAP.

Core promise:

> 정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.

The final output should feel like **my own thinking, organized visually**.

## 2. Desired emotional arc

The product must create this progression:

1. “그냥 편하게 말하면 되는구나.”
2. “내 말을 이해하고 있네.”
3. “내 생각이 실제로 보이기 시작한다.”
4. “이제 내가 무엇을 중요하게 생각하는지 알겠다.”
5. “무엇부터 확인하거나 행동하면 될지 알겠다.”

## 3. Experience principles

1. Entry is light.
2. Conversation is natural.
3. Structure is deep.
4. Change is immediately visible.
5. The result is understandable at a glance.
6. The product never forces a conclusion.
7. Every MAP connects to a next action.
8. The first useful reward appears within the first minute.
9. The user may stop before a perfect answer and still receive value.
10. Expansion should be broad: personal, work, education, healthcare, government, and operations.

## 4. Anti-patterns

Never make the primary experience feel like:

- a numbered survey
- a form with required fields
- ChatGPT with a different skin
- therapy or emotional diagnosis
- corporate consulting
- a report generator
- disconnected decorative circles
- a career-only service

## 5. Target users and launch tone

Initial launch focuses on 18–30 users: students, job seekers, young professionals, founders, and people making everyday decisions.

The tone is mobile-first, light, modern, fast to try, and useful in 3–10 minutes. It must support both light and meaningful decisions: travel, iPad purchase, moving, confession, study abroad, quitting, changing jobs, side business, priorities, relationships, and daily plans.

## 6. Voice principle

Voice is the default path; typing is always available.

Voice must be real where supported, using browser microphone capabilities with Korean recognition. The user must be able to record, stop, cancel, see a timer, see interim/final transcript, edit transcript, continue speaking, and submit the edited text.

Voice failure must never block progress. Unsupported browsers and permission denial fall back to text with friendly language.

Speech technology is a provider, not a product dependency. The architecture must allow replacement with OpenAI Realtime, Whisper, Gemini Live, or another provider.

## 7. Conversation principle

The AI is a thinking partner. It should acknowledge, reflect, identify one emerging theme when useful, and ask one concise follow-up question.

It must not interrogate. It must not ask all categories in a fixed order. It must not repeat information already provided.

The AI may internally extract topic, trigger, emotion, people, values, reasons, constraints, options, benefits, risks, missing information, leaning, and action. Externally, this should feel like conversation.

## 8. Interpretation and safety principle

The AI never says “you must do this” or “this is the answer.”

Use language such as:

- “지금까지 이야기만 보면…”
- “제가 이해한 게 맞을까요?”
- “이 부분은 아직 확인이 더 필요해 보여요.”
- “현재 마음은 이쪽에 조금 더 가까워 보여요.”

Important interpretations must be confirmable or correctable. User corrections become higher-confidence information.

## 9. Live MAP principle

The MAP grows during conversation, not only at the end. Every meaningful statement should create visible structure.

The MAP must include meaningful node types and relationships. Lines communicate cause, influence, conflict, alternative, benefit, risk, verification need, or next action.

Visual conventions:

- confirmed direct relationship: solid line
- uncertain / needs verification: dotted line
- important value or action: stronger accent line
- node styles distinguish fact, feeling, value, option, risk, missing information, and action

## 10. Final MAP principle

The final output is a beautiful thinking map, not a collection of cards and not a report.

It must include:

- central topic
- values, emotions, constraints, reasons, alternatives, risks, unresolved information
- current leaning without forced conclusion
- user-said content vs AI interpretation vs information to verify
- first action within 24 hours
- next review condition

## 11. Output roadmap

Architecture must support:

- Thinking MAP
- Decision MAP
- Execution MAP
- Priority MAP
- Comparison MAP
- Career MAP
- Patient Journey MAP
- Handover MAP
- Process MAP

Version 1 prioritizes Thinking MAP and Decision MAP while keeping the domain model extensible.

## 12. Login philosophy

No signup before the first meaningful experience.

If authentication is introduced later, it must be one-click and familiar: Google, Apple, Kakao, and Naver. Authentication should save, sync, or share MAPs; it must not block first thinking.

## 13. Payment philosophy

No complicated checkout.

Future paid flows should require only a few taps and support Apple Pay, Google Pay, Naver Pay, Kakao Pay, and Toss Pay. Payment should unlock saving, export, collaboration, templates, or domain workflows without interrupting the first MAP.

## 14. Business expansion principle

Start B2C, but design the architecture so the same engine can expand to companies, hospitals, education, public services, meetings, handovers, patient journeys, and process planning.

Domain expansion must reuse the same primitives: conversation, extraction, map structure, confirmation, output mode, action, and review condition.

## 15. Technical architecture principle

Separate concerns:

- product shell and landing
- conversation UI
- voice provider
- conversation provider
- thinking extraction
- MAP renderer
- result renderer
- storage and schema migration
- export and sharing adapters
- future auth/payment adapters

No API keys in the repository. Live AI and speech services must be environment-based server integrations.

Local deterministic fallback is required so previews work without a backend, but the UI must not pretend a live model is connected.

## 16. Development philosophy

Every future task must ask:

1. Does this make entry lighter?
2. Does it make conversation more natural?
3. Does it make thinking more visible?
4. Does it avoid forcing conclusions?
5. Does it create a useful next action?
6. Does it preserve future expansion?
7. Does it remove prototype feelings?

If not, do not build it.

## 17. Version roadmap

### Version 1

- voice-first no-login start
- text fallback
- natural guided conversation
- deterministic local conversation provider
- live growing MAP
- understanding checkpoint and correction
- Thinking/Decision final MAP
- local autosave/resume
- print/PDF-friendly output

### Version 2

- server-side LLM provider
- stronger semantic extraction
- account sync with one-click login
- real share links with privacy controls
- image export service
- payments for advanced exports/history/templates
- domain-specific MAP modes

### Version 3

- collaborative MAP sessions
- B2B workspaces
- domain workflows for education, healthcare, government, and operations
- multimodal voice/meeting capture
- structured integrations and longitudinal thinking memory

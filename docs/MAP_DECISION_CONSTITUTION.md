# MAP Decision Constitution

MAP Decision is the first product of a broader **Executive AI / Thinking OS**. This document is the source of truth for future product, Codex, design, conversation, map, business, and engineering work.

## 1. Product identity

MAP Decision is **not** a survey, fixed questionnaire, generic chatbot, ChatGPT clone, therapy service, consulting report, simple mind-map editor, or AI that decides for the user.

MAP Decision is a **voice-first thinking partner** where the user speaks or types naturally, the system communicates based on what was said, the user's thinking becomes visible while the conversation continues, and the result becomes an actionable visual MAP.

Core philosophy:

> 정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.

The final output must feel like the user's own thinking, not a conclusion imposed by AI.

## 2. Target users and launch tone

Primary launch audience: university students, job seekers, early-career professionals, young professionals in their 20s and early 30s, first-time founders, side-project builders, and people making ordinary but meaningful daily choices.

Tone: easy to approach, light but not shallow, modern, mobile-first, useful within 3–10 minutes, not corporate, not heavy counseling, and not childish.

Product principle:

> 진입은 가볍게, 소통은 자연스럽게, 구조는 깊게, 결과는 실행 가능하게.

The engine must still support expansion to experienced professionals, teams, education, hospitals, public institutions, founders, and B2B workflows.

## 3. Communication philosophy

Visible UX language must be about **이야기, 소통, 같이 정리하기, 이어서 말하기, 제가 이해한 내용, 지금 보이는 흐름, 조금 더 살펴보기**.

Avoid positioning the experience as **질문, 문항, 설문, 질문 1/8, 답변 제출**. Internally the system may ask follow-ups, but externally the user should feel they are communicating.

Conversation pattern:

1. acknowledge
2. briefly reflect
3. identify one emerging theme when useful
4. continue with one concise follow-up

The system must not repeatedly ask for information already provided and must not use robotic or therapy-like phrasing.

## 4. Voice principle

Voice is the default path; typing is always available.

Version 1 uses a Web Speech API provider with `ko-KR` recognition where supported. Required states are microphone permission request, listening state, timer, interim transcript, final transcript, stop, cancel, continue speaking, editable transcript, permission-denied recovery, unsupported-browser recovery, and mixed voice/text conversation.

Voice technology is a provider abstraction. Future providers may include OpenAI Realtime, Whisper, Gemini Live, or another speech provider. Voice failure must never block progress.

## 5. AI interpretation and no-forced-answer principle

The product never decides for the user. Do not say “이직해야 합니다”, “이 선택이 정답입니다”, or “반드시 이렇게 하세요”.

Use language such as:

- 지금까지 이야기만 보면
- 현재 마음은 이 방향에 조금 더 가까워 보여요
- 아직 확인할 정보가 남아 있어요
- 제가 이해한 게 맞을까요?
- 이 선택을 검증해보기 위한 작은 행동은 무엇일까요?

Always distinguish:

- 내가 직접 말한 내용
- 대화를 통해 정리된 내용
- 아직 확인이 필요한 내용
- 검증하거나 리뷰해야 할 조건

Corrections are higher-confidence than previous interpretations.

## 6. Adaptive conversation architecture

Conversation must be modular through a `ConversationProvider` architecture.

Version 1 has a deterministic local fallback that works without external AI credentials. The local provider must adapt to selected topic, keywords, prior messages, existing map nodes, missing information, corrections, and confirmed interpretations.

Future external AI must be routed through server/environment configuration with no committed secrets. The UI must not pretend a live AI model is connected when only the local provider is active.

Internal thinking structure supports topic, trigger, facts, emotion, people, values, reasons, constraints, options, advantages, risks, missing information, current leaning, action, and review condition. This structure must not be exposed as a fixed sequence.

## 7. Understanding checkpoints

Periodically show short understanding summaries and ask whether the interpretation is right. Actions are **맞아요** and **조금 달라요**.

If the user selects **조금 달라요**, allow voice/text correction, treat corrected information as higher-confidence, update messages, update structured data, and update the live MAP immediately.

## 8. Immediate reward and live MAP principle

The MAP grows during communication, not only at the end. The first meaningful node should appear within the first 30 seconds after a meaningful statement or topic selection.

Required node types: 핵심 주제, 계기, 사실, 감정, 사람, 가치, 이유, 제약, 선택지, 장점, 리스크, 확인할 정보, 현재 방향, 다음 행동.

Relationships communicate 원인, 영향, 충돌, 선택지, 장점, 리스크, 확인 필요, 다음 행동. Solid lines are confirmed, dotted lines are uncertain/verification-needed, and thicker/accent lines indicate important relationships.

The map must be calm, minimal, premium, readable, and screenshot-worthy—not decorative disconnected bubbles.

## 9. Final MAP principle

The final screen begins with:

> 이야기해주신 내용을 한 장으로 정리했어요.

It includes a Thinking MAP, decision structure, interpretation layers, action, and user controls. It must show alternatives, benefits, risks, missing information, current leaning, first action within 24 hours, information to verify, and review condition.

Final controls include more conversation, edit/correct, reorganize MAP, new MAP, print/PDF, future-safe image export, and future-safe share flow.

## 10. Multiple MAP types

Architecture must support 생각정리 MAP, 의사결정 MAP, 비교분석 MAP, 실행계획 MAP, 우선순위 MAP, 커리어 MAP, 프로세스 MAP, 인수인계 MAP, and 환자 여정 MAP.

For this release, Thinking MAP and Decision MAP are functional. The product recommends an output after enough communication and does not force users to choose a technical map type before starting.

## 11. No-login-first and social login

No signup before starting, talking, viewing the live MAP, or completing the first MAP. Local no-login usage remains the default.

If account functionality is introduced, preferred providers are Google, Apple, Kakao, and Naver. No email/password-first flow, no long registration form, and no mandatory profile setup.

Social authentication must not be faked. Without provider credentials/backend, keep only truthful local/no-login mode visible and document unavailable integrations for developers.

## 12. Fast payment and monetization

Payment must not interrupt thinking. Do not create long checkout, repeated confirmations, mandatory account creation, or complex pricing during the first experience.

Payment appears only when the user requests paid value: premium export, additional MAP type, deeper comparison, history/cloud sync, advanced sharing, or professional templates.

Desired payment options: Apple Pay, Google Pay, Naver Pay, Kakao Pay, Toss Pay. Without credentials/providers, keep checkout disabled or explicit demo/requirements mode and never claim a payment completed.

Preserve a useful free experience. The first MAP must demonstrate value before asking for payment.

## 13. Storage and continuity

Use localStorage autosave with a versioned schema. Preserve messages, voice transcript/draft, structured nodes, relationships, checkpoints, user corrections, result state, timestamps, reset/new MAP, and safe migration of legacy/corrupted data.

Visible wording:

> 작성 내용은 이 브라우저에 임시 저장돼요.

Future architecture should support account sync, cross-device history, share links, and cloud persistence.

## 14. Design and accessibility

Visual direction: friendly but intelligent, light but meaningful, premium but approachable, modern, mobile-first, and worth sharing. Reference quality bar: Apple, Linear, Notion, Arc, without copying layouts.

Use warm neutral backgrounds, dark slate/navy typography, restrained accents, generous whitespace, strong Korean readability, subtle shadows, polished micro-interactions, visible focus states, and consistent primitives.

Avoid excessive gradients, neon, generic SaaS dashboards, corporate consulting copy, therapy aesthetics, meaningless motion, and instruction-heavy screens.

Accessibility requirements: verify 375px, 768px, 1440px; no horizontal overflow; no overlapping map nodes; mobile keyboard should not cover composer; Korean text wraps correctly; full-screen mobile MAP works; recording state is clear; keyboard accessibility; proper aria labels; visible focus; reduced-motion support; and no information communicated only by color.

## 15. Technical architecture

Separate concerns for product shell/landing, conversation UI, voice provider, conversation provider, thinking extraction, map rendering, result rendering, storage and schema migration, export/share adapters, auth adapters, and payment adapters.

No API keys or secrets in the repository. Live AI and external speech services must be server/environment-based integrations.

## 16. Release validation

Every release must validate landing, example topics, voice or truthful fallback, text journey, mixed voice/text journey, microphone denial, unsupported-browser fallback, autosave/resume, checkpoint correction, live map update, final Thinking MAP, final Decision MAP, edit/reset, mobile/tablet/desktop, print/PDF, no console errors, and old storage handling.

## 17. Practical roadmap

### Implemented now

- No-login landing with broad university, early-career, relationship, money, and daily-life examples
- Voice-first Web Speech API provider with typing fallback
- Conversation UI with history, chips, checkpoint, correction, and mixed input
- Deterministic local conversation provider
- Thinking extraction into nodes and relationships
- Live MAP preview on desktop and full-screen mobile MAP
- Final Thinking/Decision MAP result with interpretation layers, risks, missing information, 24-hour action, print/PDF
- Versioned localStorage migration and reset/new MAP
- Truthful local-only save and disabled/requirements-style premium entry points

### Working local fallback

- Local conversation replies without pretending a live model is connected
- Local auth storage only in the current browser
- Free print/PDF export through browser print

### Integration-ready

- `ConversationProvider` for future AI APIs
- `VoiceProvider` abstraction for future speech providers
- Auth provider interface for Google, Apple, Kakao, Naver
- Payment provider interface for Apple Pay, Google Pay, Naver Pay, Kakao Pay, Toss Pay
- Map output type model for future MAP variants

### Requires external credentials/backend

- Real LLM conversation route
- OpenAI Realtime/Whisper/Gemini Live speech providers
- Social login and cross-device sync
- Share links and cloud history
- Payment gateway/orchestration and premium entitlements
- Stable server-side image export

### Future release

- Stronger semantic extraction and relationship weighting
- Multiple output generation from one conversation
- Collaboration and team workspaces
- Education, hospital, public institution, founder, and B2B workflow templates
- Longitudinal thinking memory and privacy controls

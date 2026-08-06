# MAP Constitution

MAP Decision is the product source of truth for product, design, AI, storage, payment, and engineering decisions.

## 1. Product identity

MAP Decision is **not** a survey, **not** a generic chatbot, **not** a therapy product, and **not** an AI that chooses for the user. It helps the user see and structure their own thinking.

Core statement:

> 정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.

The final output must feel user-owned, not imposed by the system.

## 2. Product experience

- Voice-first; typing remains optional and always available.
- No login before value: users can start, converse, see the live MAP, and reach a useful result locally.
- The experience is communication rather than a questionnaire; avoid fixed survey language in visible UX.
- A live MAP grows during the conversation.
- The first meaningful visual change should appear within 30 seconds of a meaningful statement or topic selection.
- The result must lead to a realistic first action, preferably within 24 hours.

## 3. Target

Primary users are university students, job seekers, and early-career workers, mainly in their late teens to early 30s. The architecture remains extensible to B2B, education, hospitals, public institutions, founders, and team workflows without making the first-user experience feel corporate.

## 4. AI principles

- Distinguish explicit user statements, system interpretation, and uncertainty.
- Never force an answer or declare the correct choice for the user.
- Never falsely claim live AI is connected when the local provider is active.
- Corrections override previous inferences.
- Never ask for information already supplied.
- Use language such as “지금까지 이야기만 보면”, “제가 이해한 게 맞을까요?”, and “아직 확인할 정보가 남아 있어요”.

## 5. Conversation principles

Visible UX language should emphasize 이야기, 소통, 같이 정리하기, 이어서 말하기, 제가 이해한 내용, 지금 보이는 흐름, and 조금 더 살펴보기. Avoid visible wording such as 설문, 답변 제출, or other survey framing.

**Updated 2026-08-06 (owner decision):** this line originally also banned 질문 1/8-style counters and the word 문항 outright. That ban is lifted for quiz-format topics (이상형·나 소개·친구·인간관계·일할 때의 나·취향·여행 스타일). Showing the question count and expected duration before starting (e.g. a landing card reading "38문항 · 약 9분", shipped in PR #190) and a truthful in-progress counter (e.g. "3 / 20") during the quiz are both allowed — competing products already signal duration up front, and withholding it makes users assume the wait is longer than it is. What is still banned is a counter or percentage that does not reflect the real remaining steps (fabricated or inflated progress) — see MAP_DESIGN_SYSTEM.md section 11's Golden Screens for that still-active rule.

## 6. MAP principles

- MAP nodes must be meaningful, not decorative bubbles.
- Relationships must communicate meaningful cause, influence, conflict, option, risk, verification, or action.
- The user owns the result and can correct it.
- The MAP must be readable, calm, premium, and screenshot-worthy.
- Solid edges are confirmed, dotted/dashed edges are inferred or uncertain, and emphasized edges show important relationships.

## 7. Authentication, storage, and payment principles

- Local no-login use comes first.
- Social save appears only after value is demonstrated.
- No fake login, fake payment, or fake microphone success.
- The first MAP must demonstrate value before monetization.
- Back/cancel must never destroy the current session.
- Local autosave must preserve conversation, voice draft/transcript, structured nodes, relationships, corrections, result state, and safe migration paths.

## 8. Product decision rules

- User value over feature count.
- Stable complete journey over many incomplete features.
- Visual quality must be validated visually, not only by build success.
- Do not silently omit requirements; document gaps and constraints.
- Preserve voice, conversation, storage, live MAP, and result behavior when changing infrastructure.

## 9. Launch implementation boundaries

Version 1 may use deterministic local conversation and Web Speech API fallback. Future external AI, auth, payment, cloud sync, share links, and stable image export must be truthful, environment-backed integrations with no committed secrets.

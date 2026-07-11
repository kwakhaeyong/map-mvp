# MAP Design System v1

This is the binding visual system for MAP Decision. Future work must use the coded tokens and shared primitives before creating new patterns.

## 1. Brand

- Product name: **MAP Decision**.
- Never use duplicated or inconsistent branding such as “MMAP Decision”.
- Primary brand line: **말하면, 생각이 보입니다.**
- Product identity line: **정답을 대신 주는 AI가 아니라, 내 생각이 보이게 만드는 AI.**

## 2. Color tokens

Use semantic tokens only in feature components. Do not write raw hex/RGB/HSL values outside token files.

| Token | CSS variable | Role |
| --- | --- | --- |
| background | `--color-background` | Warm off-white app base |
| background-subtle | `--color-background-subtle` | Quiet secondary regions |
| surface | `--color-surface` | Cards and panels |
| surface-elevated | `--color-surface-elevated` | Raised cards, sheets, modals |
| border | `--color-border` | Default dividers |
| border-strong | `--color-border-strong` | Emphasized separation |
| text-primary | `--color-text-primary` | Deep navy text/actions |
| text-secondary | `--color-text-secondary` | Supporting copy |
| text-muted | `--color-text-muted` | Hints and metadata |
| primary | `--color-primary` | Primary actions |
| primary-hover | `--color-primary-hover` | Primary action hover |
| primary-foreground | `--color-primary-foreground` | Text on primary |
| focus | `--color-focus` | Focus rings |
| fact | `--color-fact` | Fact nodes |
| feeling | `--color-feeling` | Feeling nodes |
| value | `--color-value` | Value nodes |
| option | `--color-option` | Option nodes |
| uncertainty | `--color-uncertainty` | Unknowns / verification |
| risk | `--color-risk` | Risks |
| action | `--color-action` | Next action |
| success | `--color-success` | Successful state |
| error | `--color-error` | Error state |

Direction: warm off-white base, deep navy text/actions, calm indigo accent, soft blue facts, lavender feelings/values, mint options, amber uncertainty, restrained coral risks. Do not use pure black for large surfaces or washed-out low-contrast controls.

## 3. Typography

| Style | Desktop | Mobile | Line-height | Weight | Use |
| --- | --- | --- | --- | --- | --- |
| display | 64px | 42px | 1.05 | 900 | Rare hero moments |
| hero | 52px | 34px | 1.12 | 900 | Landing hero |
| page-title | 40px | 30px | 1.18 | 850 | Page headers |
| section-title | 28px | 24px | 1.25 | 800 | Major sections |
| card-title | 20px | 18px | 1.35 | 800 | Card headings |
| body-large | 18px | 17px | 1.7 | 500 | Lead text |
| body | 16px | 16px | 1.65 | 500 | Main copy |
| label | 14px | 14px | 1.35 | 750 | Controls |
| caption | 13px | 12px | 1.45 | 600 | Metadata |

Korean text uses slight negative letter-spacing only for large headings (`-0.02em` to `-0.04em`). Body copy should stay between `-0.014em` and `0`. Maximum readable line length is 64 Korean characters or about 38rem.

## 4. Spacing scale

Approved spacing tokens: `0`, `1` 4px, `2` 8px, `3` 12px, `4` 16px, `5` 20px, `6` 24px, `8` 32px, `10` 40px, `12` 48px, `16` 64px, `20` 80px, `24` 96px. Do not use arbitrary spacing values when a token fits.

## 5. Radius

Approved radii only: small 12px, medium 18px, large 28px, pill 999px.

## 6. Shadows

Approved shadows only: none, subtle, floating, modal.

## 7. Motion

Tokens: duration-fast 160ms, duration-normal 240ms, duration-slow 360ms, easing-standard `cubic-bezier(.2,0,0,1)`, easing-emphasized `cubic-bezier(.16,1,.3,1)`. Approved motions: message-enter, node-enter, edge-draw, modal-enter, toast-enter. Always respect `prefers-reduced-motion`.

## 8. MAP visual grammar

- Topic node: largest node, primary outline, text-primary label, no emoji-only meaning.
- Fact node: fact color fill, confirmed statements only.
- Feeling/value node: feeling/value lavender family, concise emotional or priority language.
- Option node: option mint fill, represents an actionable path.
- Uncertainty node: uncertainty amber fill, phrased as something to verify.
- Risk node: risk coral fill, restrained emphasis.
- Action node: action color fill, begins with a concrete verb when possible.
- Confirmed edge: solid, border-strong/primary family.
- Inferred edge: dashed or dotted, visibly lighter than confirmed.
- Uncertain edge: dotted amber family.
- Emphasized edge: thicker primary line, limited to the most important relationship.

## 9. Responsive rules

Validate 375px, 768px, 1280px, 1440px, and 1920px widths. Browser zoom checks: 90%, 100%, 110%, 125%. No horizontal overflow, clipped MAP labels, hidden primary actions, or keyboard-trapped controls.

## 10. Shared primitives

Use shared primitives for Button, IconButton, Card, Surface, Badge, Input, Textarea, VoiceButton, MessageBubble, ReflectionCard, ResponseChip, CheckpointCard, MapNode, MapLegend, Modal, BottomSheet, Toast, EmptyState, and ResultActionBar. New variants require a design-system update first.

## 11. Golden Screens

### Landing
- Purpose: help a user begin without login and understand that speaking reveals thinking.
- Primary action: start by voice; typing is a secondary safe path.
- Hierarchy: brand, brand line, concise value, start action, resume when available, example topics, live MAP preview.
- Allowed patterns: Brand, Button, VoiceButton, Card, ResponseChip, MapNode preview.
- Mobile: primary action visible without horizontal scroll; resume remains reachable.
- Empty/loading/error: no draft hides resume; microphone permission is explained truthfully after action.
- Must never appear: survey framing, forced signup, fake AI/live claims, “MMAP Decision”.

### Conversation + Live MAP
- Purpose: keep communication flowing while the MAP grows visibly.
- Primary action: continue speaking or typing.
- Hierarchy: conversation, composer, checkpoint/correction, live MAP, local-save status.
- Allowed patterns: MessageBubble, VoiceButton, Textarea, ResponseChip, CheckpointCard, MapNode, MapLegend, BottomSheet.
- Mobile: MAP can open full-screen; composer remains usable with keyboard.
- Empty/loading/error: unsupported microphone falls back to text; permission denial never blocks progress.
- Must never appear: question counters, dead microphone success states, repeated requests for supplied info.

### Result MAP
- Purpose: turn the conversation into a user-owned structure and realistic first action.
- Primary action: take or refine the first action.
- Hierarchy: result summary, MAP, decision structure, risks/missing information, 24-hour action, controls.
- Allowed patterns: ReflectionCard, MapLegend, ResultActionBar, Button, Modal, Toast, EmptyState.
- Mobile: result actions remain reachable after the MAP; labels stay readable.
- Empty/loading/error: incomplete result invites more conversation; export limitations are truthful.
- Must never appear: AI-decided final answer, fake payment/share/login, decorative-only bubbles.

# MAP Decision Repository Instructions

## Before coding

1. Read `docs/MAP_CONSTITUTION.md`.
2. Read `docs/MAP_DESIGN_SYSTEM.md`.
3. Inspect latest `main` before major edits; fetch/rebase when a remote is available.
4. Inspect existing shared primitives in `src/map-decision-v1/components/ui/primitives.tsx`.
5. State which files will be changed.

## Design restrictions

- Never invent a new color.
- Never write raw hex/RGB/HSL values in feature components.
- Never invent a radius, shadow, or spacing value.
- Use approved semantic tokens only.
- Use shared UI primitives before creating another button, card, node, modal, toast, sheet, input, or badge.
- Do not create duplicate buttons/cards/nodes.
- Do not alter brand copy without checking the Constitution.
- Do not create survey wording.
- Do not fake AI, login, payment, or microphone success.

## Development restrictions

- Preserve voice, conversation, storage, MAP, and result behavior.
- One PR must have one clear purpose.
- Do not reuse closed PRs.
- Do not automatically merge.
- Avoid concurrent modification of the same core files.
- Rebase/fetch latest main before major edits when a remote exists.
- Resolve conflicts by preserving valid behavior from both sides.
- Do not blindly accept current or incoming changes.

## Validation

Run `npm install`, `npm run build`, lint/type checks when available, `npm run harness:check`, and `npm run design:check`. Validate no console/hydration errors, minimum 375/768/1440 visual checks, no horizontal overflow, no clipped MAP labels, no dead buttons, and preserved back/resume behavior.

## Completion report

Include files changed, tokens/components used, any new token requested, build results, visual checks, and known limitations.

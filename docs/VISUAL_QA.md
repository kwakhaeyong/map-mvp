# Visual QA Harness

## Viewports

Minimum required captures: 375x812 mobile, 768x1024 tablet, 1440x1000 desktop. Extended checks: 1280, 1920 and browser zoom 90%, 100%, 110%, 125%.

## States to capture

- Landing desktop and mobile.
- Conversation + Live MAP desktop and mobile.
- Result MAP desktop and mobile.

## Commands

- `npm run visual:install` installs Playwright browsers when the environment allows downloads.
- `npm run visual:test` runs the page-state screenshot harness.
- `npm run visual:update` updates screenshot snapshots intentionally.

## Checklist

- No horizontal overflow.
- No clipped MAP labels.
- Brand reads MAP Decision, never MMAP Decision.
- Primary action is visible and enabled.
- Voice fallback copy is truthful.
- Result does not claim AI chose for the user.
- Focus states are visible.
- Reduced-motion mode remains usable.

## Baseline updates

Update baselines only after human review of all six golden captures. Baseline updates require the PR description to explain why visual changes are intended. Do not mark visual comparison as successful if browsers or snapshots are unavailable.

## Approval before merge

A reviewer must inspect the screenshots or the running app at the required viewports before merge. Build success alone is insufficient.

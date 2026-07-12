# PR7 Production QA Report

Date: 2026-07-12
Scope: QA-only review from the current local `main` branch checkout. No feature work or product behavior changes were made.

## Executive summary

Production QA is partially complete. Build, TypeScript, repository harness checks, and design-token checks pass. Browser-executed QA could not be completed in this container because Playwright browser downloads are blocked by the network policy, and no system Chrome, Safari/WebKit, Edge, or Firefox executable is installed.

The release should not be considered fully production-approved until the browser matrix below is re-run in an environment with installed browsers and screenshots are reviewed by a human.

## Files changed

- `docs/QA_REPORT_PR7.md` — QA report, remaining bugs, and priority list.

## Validation commands run

| Area | Command | Result | Notes |
| --- | --- | --- | --- |
| Dependency install | `npm install` | Pass with warnings | Dependencies are up to date. npm reports 2 vulnerabilities and an unknown `http-proxy` env config warning. |
| Production build | `npm run build` | Pass | Next.js production build completed successfully. |
| Type checks | `npm run typecheck` | Pass | `tsc --noEmit` completed successfully. |
| Harness | `npm run harness:check` | Pass | Repository harness check passed. |
| Design system | `npm run design:check` | Pass | Design check passed. |
| Browser install | `npx playwright install chromium firefox webkit msedge || true` | Warning / blocked | Browser downloads failed with HTTP 403 `Domain forbidden` from Playwright CDN. |
| Visual/browser harness | `npm run visual:test` | Warning / blocked | All six tests failed before page execution because the Chromium executable is missing. |
| Security audit | `npm audit --audit-level=moderate` | Fail | npm reports 1 high vulnerability in `next` and 1 moderate vulnerability in `postcss`. |
| Static code scan | `rg -n "console\.|localStorage|sessionStorage|useEffect|aria-|role=|href=|button|overflow|hydrate|dangerouslySetInnerHTML|setInterval|setTimeout" app src/map-decision-v1 tests scripts` | Review completed | Found no app `console.*` calls or `dangerouslySetInnerHTML`; storage and history usage are client-gated. |

## Browser and viewport matrix

| Target | Status | Evidence / limitation |
| --- | --- | --- |
| Desktop 1440px Chrome / Chromium | Blocked | Playwright Chromium executable unavailable and download blocked. |
| Tablet 768px Chrome / Chromium | Blocked | Existing config does not include tablet; browser unavailable. |
| Mobile 375px Chrome / Chromium | Blocked | Existing mobile project could not launch Chromium. |
| Safari / WebKit | Blocked | WebKit download blocked; real Safari is unavailable in Linux container. |
| Edge | Blocked | Edge download/install blocked; no system Edge executable present. |

## QA checklist findings

### Accessibility

- Static review found visible labels or text for core interactive controls including MAP open/close, voice start/stop, send, preview, result actions, and correction controls.
- Focus styling is present through shared primitives and global focus CSS.
- Browser-level keyboard traversal, screen reader semantics, dialog focus trapping, and contrast checks still require manual or automated browser QA.

### Performance

- Production build first-load JavaScript reported by Next.js:
  - `/`: 117 kB
  - `/result`: 109 kB
  - Shared first-load JS: 102 kB
- No browser runtime performance trace, memory profile, or Lighthouse result was generated because browsers could not be launched.

### Navigation and state preservation

- Static review confirms stage navigation is backed by browser history state and `popstate` handling.
- Static review confirms local autosave is client-gated after hydration.
- Back/resume behavior still needs browser execution at landing, conversation, result, reload, and back-button states.

### Responsive layout

- The code contains mobile, tablet-ish, and desktop responsive classes, including compact MAP access on small screens and a desktop side-by-side MAP layout.
- Required visual checks at 375, 768, 1280, 1440, 1920 and zoom levels 90%, 100%, 110%, 125% were not completed due to browser unavailability.

### Hydration and console

- Static review found hydration-sensitive storage access guarded by client effects.
- Browser console and hydration warnings could not be verified because Playwright could not launch a browser.
- No app-level `console.*` calls were found in `app` or `src/map-decision-v1`.

### Memory

- Static review found interval cleanup in speech timer and timeout cleanup in autosave effect.
- Runtime memory growth during repeated conversation, MAP opening/closing, result navigation, and back/resume could not be profiled without a browser.

## Remaining bugs / risks

1. **P0 — Browser QA blocked**
   - Impact: Desktop, tablet, mobile, Chrome, Safari/WebKit, Edge, accessibility, console, hydration, visual, and memory runtime checks are not production-confirmed.
   - Evidence: Playwright browser install failed with HTTP 403 `Domain forbidden`; no system browser executable exists.

2. **P0 — Security audit reports vulnerable dependencies**
   - Impact: `npm audit --audit-level=moderate` reports high-severity Next.js advisories and a moderate PostCSS advisory.
   - Constraint: This PR is QA-only, so dependency upgrades were intentionally not applied.

3. **P1 — Visual harness does not cover the full requested matrix**
   - Impact: Current Playwright config only defines desktop 1440 Chromium and mobile 375 Chromium projects. It does not include tablet 768, Edge-branded Chromium, WebKit/Safari, extended widths, or zoom levels.
   - Constraint: No feature/test harness changes were made in this QA-only PR.

4. **P1 — Manual accessibility verification remains open**
   - Impact: Keyboard-only navigation, dialog/sheet focus behavior, screen reader names, and reduced-motion behavior need browser-level validation.

5. **P1 — Runtime memory and performance profiling remains open**
   - Impact: No browser trace or heap profile is available for long sessions or repeated MAP open/close cycles.

6. **P2 — npm environment warning**
   - Impact: npm warns `Unknown env config "http-proxy"`; this did not block install/build but should be cleaned up in CI/container configuration.

## Priority list

### P0 before production approval

1. Run the full browser QA matrix in an environment with installed Chrome, Edge, and Safari/WebKit.
2. Resolve or formally accept the `npm audit` dependency risk; recommended follow-up is a dependency-only PR.
3. Review screenshots for landing, conversation, and result at minimum 375, 768, and 1440 widths.

### P1 shortly after P0

1. Expand automated visual/browser coverage to include tablet, WebKit, Edge, and zoom checks.
2. Add automated accessibility checks or document manual keyboard/screen-reader pass criteria.
3. Capture Lighthouse or equivalent performance reports for `/` and `/result`.
4. Profile memory through repeated start, draft, submit, MAP sheet open/close, result, back, and resume flows.

### P2 cleanup

1. Remove or correct the unknown npm `http-proxy` environment config in the execution environment.
2. Keep this report as the baseline for the next QA run and replace blocked items with browser evidence.

## Production recommendation

Do not mark PR7 as fully production-approved yet. The codebase passes non-browser checks, but browser QA and dependency security audit items remain open. Treat this report as a QA gate report that identifies blockers and the exact follow-up validation required.

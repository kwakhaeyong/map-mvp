# PR #19 Fix Plan

## Current verified state

- PR #19 is open and not mergeable.
- The PR branch still has only two changed files and has not received the Career Decision MAP image update.
- `src/map-decision-v1/components/Landing.tsx` conflicts with the latest `main` branch.
- `https://www.mapdecision.com` is production from `main`, so it will remain unchanged until a conflict-free PR is merged.

## Required implementation

1. Rebase or rebuild the PR branch from the latest `main`.
2. Resolve the `Landing.tsx` conflict by preserving latest `main` behavior.
3. Add the supplied high-resolution career decision MAP asset at:
   `public/showcases/career-decision-map.png`
4. Replace the simplified Thinking/Decision node previews with the actual final-result showcase image.
5. Render the image with its original aspect ratio using `object-contain`.
6. Add click-to-zoom, full-screen lightbox, close button, ESC close, and mobile-safe viewing.
7. Keep the existing voice, text, 30-second demo, autosave, resume, navigation, Harness v1, and design-system behavior.
8. Update the existing PR branch only. Do not create another PR and do not auto-merge.
9. Run build, typecheck, harness check, and design check.
10. Confirm zero merge conflicts and provide a Vercel Preview.

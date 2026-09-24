# Login loading UI design QA

## Comparison target

- Source visual truth: `C:\Users\NITHISHKUMAR\.codex\generated_images\01a0d25e-8c91-78d3-936f-43a3d3dddec0\exec-685f20d4-42e2-4fc8-955d-807c6ad478a1.png`
- Intended viewport: mobile, 390 × 844 CSS pixels.
- Intended state: login submitted; Academia connecting, Student Portal queued.
- Implementation: `app/page.tsx`, `.portal-connection-overlay`.

## Evidence

The selected source has been captured and the implementation type-checks with `npx tsc --noEmit`.

The browser-rendered implementation in the matching authenticated loading state could not be captured. Triggering that state makes a live SRM portal login request; the project rules prohibit using the demo account or mock credentials as feature validation, and no real-user session was provided for this QA run.

## Required fidelity surfaces

- Fonts and typography: implemented with the existing Inter variable and restrained 700/500 weights; browser-state comparison pending.
- Spacing and layout rhythm: implemented as a 24px-gutter, mobile-first overlay with a two-endpoint transfer line; browser-state comparison pending.
- Colors and visual tokens: uses the existing `#09090F`, `#12121A`, `#292532`, `#F7F5FA`, `#B8B2C2`, and `#2563EB` system; browser-state comparison pending.
- Image quality and assets: reuses the existing Nexus logo and Lucide icon library; no generated assets are required in the shipped UI.
- Copy and content: reflects actual high-level authentication states only; it does not imply that attendance or marks have already loaded.

## Findings

- [P1] Loading-state visual comparison is blocked.
  Location: login loading overlay.
  Evidence: no matching browser screenshot is available without a real login submission.
  Impact: final mobile rendering, animation, and wrap behavior cannot be certified against the selected design.
  Fix: submit a real student login in local development, capture the 390 × 844 loading state, then compare it with the source target and revise any P1/P2 drift.

## Implementation checklist

1. Submit one real local login and capture the loading state at 390 × 844.
2. Check the connection line, endpoint labels, headline wrapping, and safe-area padding against the source.
3. Update this report after visual comparison.

## Final result

final result: blocked

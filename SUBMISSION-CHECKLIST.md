# WebMCP Challenge submission checklist

## Repository

- [x] Public feature branch: https://github.com/affinity-health/tanstack-start-example/tree/webmcp-challenge
- [x] Root MIT `LICENSE` is present.
- [x] Public source contains `document.modelContext.registerTool`.
- [x] Challenge commits are dated after the August 5 baseline.
- [ ] Open a pull request to `master`; do not merge it.

## Product and safety

- [x] Four marketplace and cart tools register inside the authenticated clinic.
- [x] Every tool updates the visible Marketplace or Cart screen.
- [x] Agents cannot confirm checkout, create an order, prescribe, sign, or enter a PIN.
- [x] Only synthetic patients and products appear in the demo.
- [x] No Affinity Live credential or patient is used.

## Verification

- [x] `bun run check` and `bun run build` pass after the marketplace pivot.
- [ ] Native Chrome WebMCP smoke passes against the built app.
- [ ] Desktop and mobile screenshots pass visual review.
- [ ] The Alchemy v2 `webmcp-challenge` URL passes health and browser checks.

## Submission

- [ ] Add the verified live URL to `SUBMISSION.md`.
- [ ] Record `DEMO-SCRIPT.md` in under three minutes.
- [ ] Upload the video to YouTube and add its URL to `SUBMISSION.md`.
- [ ] Enter the source, live demo, video, and project description in Devpost.

# WebMCP Challenge submission checklist

## Repository

- [x] Public feature branch: https://github.com/affinity-health/tanstack-start-example/tree/webmcp-challenge
- [x] Root MIT `LICENSE` is present on the public branch.
- [x] Public source contains the direct `document.modelContext.registerTool` implementation.
- [x] Commit `cc63826` is dated September 2, 2026 and is separated from baseline `f55eede`, dated
      August 5, 2026.
- [ ] Open pull request from `webmcp-challenge` to `master`; do not merge it.

## Product and safety

- [x] Three public synthetic discovery/handoff tools are usable without sign-in.
- [x] Two authenticated prescribing tools use hosted Affinity Test data.
- [x] Agent-prepared drafts cannot satisfy the clinician confirmation gate.
- [x] Signing and PIN entry remain inside Affinity.
- [x] No Affinity Live credential, patient, pharmacy, or deployment is used.

## Verification

- [x] `bun install --frozen-lockfile`, `bun run check`, and `bun run build` pass locally.
- [x] Native Chrome WebMCP smoke executes registered tools against the built app.
- [x] Desktop and mobile screenshots pass Impeccable visual review.
- [ ] Non-production Alchemy v2 `webmcp-challenge` URL passes `/api/health` and browser checks.

## Submission

- [ ] Add the verified live URL to `SUBMISSION.md`.
- [ ] Record `DEMO-SCRIPT.md` in under three minutes without visible credentials.
- [ ] Upload the recording as public or unlisted YouTube and add its URL to `SUBMISSION.md`.
- [ ] Enter the source, live demo, video, and project description in Devpost.

# WebMCP challenge scope

Northstar is a copyable example telehealth clinic. Affinity Test is the backend for its synthetic cart and order flow. WebMCP gives a browser agent optional access to the same marketplace and patient carts used by a clinician.

## MVP

1. A browser agent searches the synthetic medication marketplace.
2. The agent opens a matching product in the visible product sheet.
3. The agent adds the product to a named synthetic patient's visible cart.
4. The agent inspects the cart.
5. A clinician reviews the patient and line items, checks the confirmation, and submits the Test order.

The tools cannot confirm checkout, create an order, prescribe, sign, or transmit anything. The public implementation calls `document.modelContext.registerTool` directly and uses JSON Schema for tool input.

## Definition of done

- Root MIT license published on the public branch.
- Direct `document.modelContext.registerTool` source in the repository.
- Tests cover tool inputs, visible state actions, checkout boundaries, and unsupported browsers.
- `bun run check` and `bun run build` pass.
- Alchemy v2 deploys a nonproduction stage with Affinity Test credentials only.
- The live URL works at desktop and mobile widths.
- Submission docs distinguish baseline work from challenge commits dated after August 25, 2026.
- A script supports a public YouTube demo under three minutes.

## Existing work

Commit `f55eedef7c8833f15dad335c23ba8f29bb521835` is the August 5, 2026 baseline. Challenge work begins on `webmcp-challenge` with dated commits for the WebMCP tools, shared marketplace state, safety rules, tests, deployment, and submission material.

## Publication flags

- Root MIT license: published on `webmcp-challenge`; GitHub detection is tracked separately.
- Live demo: incomplete until the Alchemy v2 challenge URL passes browser checks.
- YouTube video: incomplete until a public or unlisted video under three minutes exists.
- Devpost: incomplete until the source, live URL, and video URL are entered.

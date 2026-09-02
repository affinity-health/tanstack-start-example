# Demo script

Target length: 2 minutes 35 seconds. Hard stop: 2 minutes 50 seconds.

## 0:00 to 0:20

Show the public Northstar patient demo and the "3 browser tools ready" status.

Say: "This is Affinity Agent-Native Telehealth. The public page exposes three WebMCP tools directly.
They use synthetic data and share the same workflow code as the visible app."

## 0:20 to 0:55

Ask the browser agent: "Find eligible California patients."

Show the filtered directory and the structured tool result. Then ask: "Open Ada Zieme."

Say: "The tools do not scrape the screen. They call the page's registered functions, and every
change is visible to the clinician."

## 0:55 to 1:30

Ask: "Prepare Ada's medication review."

Show the medication orders route, the agent-prepared handoff, the Headless SDK tab, and Ada selected
when the hosted Test records match.

Ask the agent to inspect the Test options, then fill a draft using details you state aloud. Show the
two additional tools and the unchecked clinician confirmation.

Say: "The agent copied my supplied details into the visible form. It cannot check this confirmation,
create the order, or access the signing PIN. No order has been created."

## 1:30 to 1:55

Return to the public demo and ask the agent to prepare Denise Kuhn, whose status is Review.

Show the rejection.

Say: "The shared workflow rejects patients who still need eligibility review. The agent cannot route
around that check."

## 1:55 to 2:20

Show `src/lib/webmcp.ts`, the five tools across `src/features/webmcp/`, and the adapter tests.

Say: "The public source uses `document.modelContext.registerTool`, JSON Schema, an AbortSignal for
cleanup, and a no-op fallback for browsers without WebMCP. The same module drives a synthetic adapter
and a hosted Affinity Test adapter, with a separate human confirmation gate."

## 2:20 to 2:35

Show the live URL and repository branch.

Say: "Alchemy v2 deploys this isolated challenge stage to Cloudflare. It uses Affinity Test,
synthetic patients, Stripe Test, and an internal Test pharmacy. It never uses Live."

## Capture checklist

- Use a 1440 by 900 browser viewport and 125 percent editor zoom.
- Hide personal browser tabs, notifications, tokens, and terminal history.
- Keep the WebMCP agent panel and the affected UI visible in the same frame.
- Record one clean take. Trim dead time, but do not accelerate tool results.
- Upload as an unlisted or public YouTube video and confirm the final duration is under three minutes.

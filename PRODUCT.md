# Northstar demo telehealth platform

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is someone evaluating or copying Northstar, a small example telehealth clinic. In
the working demo, a clinician finds a synthetic patient, reviews the care context, and opens a
medication workflow backed by Affinity Test.

WebMCP is optional. When a copier keeps it enabled, browser agents receive explicit, typed tools tied
to the same visible state and actions as the clinician, not a separate hidden workflow.

## Product purpose

Northstar demonstrates a compact telehealth workspace that people can fork and adapt. It includes
synthetic patients, basic EHR views, and an unsigned medication proposal workflow. Affinity Test is
the prescribing backend inside the example. WebMCP provides optional agent access to prepare work
while the clinician retains every clinical and signing decision.

Success means the public repository contains `document.modelContext.registerTool`, the authenticated
clinic exposes useful tools to a compatible browser agent, and the human can see and continue every
agent started workflow in the Northstar interface.

## Positioning

Northstar works as a normal human interface. When WebMCP is available, the same application state
powers the clinician UI and the optional browser tools. Agent actions update the visible workspace,
and prescribing still crosses the Affinity Test authorization and signing boundaries.

## Operating context

The build extends the existing Northstar Health demonstration workspace. It uses synthetic patients,
Affinity Test, Stripe Test, and an internal Test pharmacy. The TanStack Start application, Better
Auth session, Affinity SDK routes, and Alchemy v2 deployment remain in place.

## Capabilities and constraints

- WebMCP uses the current imperative browser API at `document.modelContext.registerTool`.
- Tools may search synthetic patients, select a patient, prepare a visible review workflow, inspect
  hosted Test options, and fill a draft from clinician-supplied details.
- Tools must not confirm, create, sign, submit, or transmit a prescription.
- The clinician must perform any consequential clinical action through the existing interface.
- The demo never uses Affinity Live or production patient data.
- The target deployment is an Alchemy v2 non-production release stage.
- Work stays on branch `webmcp-challenge`; it does not merge to `master`.
- The root license is prepared locally. Publication remains incomplete until explicitly flagged.

## Product model

Northstar is the product on this site: a demo telehealth platform and example clinic EHR that people
can copy. Affinity Test is an integration inside Northstar for unsigned Test drafts. It is never the
site's offer, and the example never connects to Live. WebMCP is optional agent wiring already included
in the repository. Copy is direct, clinical, and explicit about Test mode and synthetic data.

## Evidence on hand

- Existing working Affinity integration examples live in `src/features/affinity/`.
- Synthetic patient and workspace data lives in `src/lib/demo-data.ts`.
- Trusted Affinity SDK calls and webhook verification live in `src/server/`.
- Alchemy v2 infrastructure lives in `alchemy.run.ts`.
- No customer claims, clinical outcomes, or production-use evidence are available and none may be
  invented.

## Product principles

- Keep the clinician in control of clinical decisions.
- Make agent work visible in the existing interface.
- Reuse application logic instead of building a parallel agent-only backend.
- Return bounded, useful results with clear next steps.
- Label Test mode and synthetic data wherever confusion could cause harm.

## Accessibility and inclusion

WebMCP is additive. Every agent action must remain available through keyboard-accessible human UI,
and tool-triggered changes must be announced through an accessible live region.

# Affinity Agent-Native Telehealth

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a clinician working in Northstar Health's telehealth workspace. The clinician
needs to find a synthetic Test patient, review the patient's care context, and move into the
appropriate Affinity prescribing workflow.

Browser agents are a second user. They need explicit, typed tools tied to the same visible state and
actions as the clinician, not a separate hidden workflow.

## Product purpose

This challenge build demonstrates an agent-native telehealth workflow with WebMCP. A browser agent
can search and open synthetic patient records and prepare a prescribing review while the clinician
retains control of every clinical and signing decision.

Success means the public repository contains `document.modelContext.registerTool`, the live Test
demo exposes useful tools to a compatible browser agent, and the human can see and continue every
agent-started workflow in the Northstar interface.

## Positioning

The same application state powers the clinician UI and the WebMCP tools. Agent actions update the
visible workspace, and prescribing still crosses the existing Affinity authorization and signing
boundaries.

## Operating context

The build extends the existing Northstar Health demonstration workspace. It uses synthetic patients,
Affinity's production-hosted Test environment, Stripe Test, and an internal Test pharmacy. The
existing TanStack Start application, Better Auth session, Affinity SDK routes, Elements integration,
Hosted workflows, and Alchemy v2 deployment remain in place.

## Capabilities and constraints

- WebMCP uses the current imperative browser API at `document.modelContext.registerTool`.
- Tools may search synthetic patients, select a patient, and prepare a visible review workflow.
- Tools must not create, sign, submit, or transmit a prescription.
- The clinician must perform any consequential clinical action through the existing interface.
- The demo never uses Affinity Live or production patient data.
- The target deployment is an Alchemy v2 non-production release stage.
- Work stays on branch `webmcp-challenge`; it does not merge to `master`.
- The root license is prepared locally. Publication remains incomplete until explicitly flagged.

## Brand commitments

The application is named Affinity Agent-Native Telehealth. Northstar Health remains the fictional
partner workspace. Copy is direct, clinical, and explicit about Test mode and synthetic data.

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

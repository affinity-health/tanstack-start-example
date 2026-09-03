# Devpost submission draft

## Project

Northstar, a demo telehealth platform

## One-line summary

A copyable example telehealth clinic with synthetic patients, an Affinity Test prescribing backend,
and optional WebMCP tools that cannot cross the clinician confirmation gate.

## What it does

Northstar works as a normal clinic workspace and exposes three optional browser tools. An agent can search synthetic
patients, open the same record shown to the clinician, and prepare an eligible patient's Affinity
Test medication review. Each action updates Northstar's visible interface. The same tools also appear
on the authenticated Patients route, where prepared context continues into the existing workflow.

The authenticated Test form exposes two additional tools: one reports options already on screen and
one fills a draft from clinician-supplied details. The agent cannot check the confirmation gate or
call order creation. The clinician reviews the form, explicitly confirms it, and completes signing
inside Affinity Test.

## How we built it

- TanStack Start and React power the existing clinician workspace.
- `document.modelContext.registerTool` exposes five imperative WebMCP tools with JSON Schema.
- One small prescribing workflow module provides two adapters: local synthetic demo records and the
  authenticated Affinity Test routes.
- The existing authenticated server routes use `@affinity-health/sdk` with production-hosted Test
  credentials.
- Alchemy v2 deploys the isolated `webmcp-challenge` stage to Cloudflare Workers and D1.
- Bun tests cover patient matching, eligibility rejection, tool side effects, tool registration,
  unsupported browsers, request origins, and webhook verification.

## Why the safety boundary matters

Healthcare agents should make routine navigation easier without silently becoming clinicians. This
demo makes the boundary executable. An ineligible patient cannot enter the prescribing flow; an
agent-prepared clinical draft cannot pass the separate human confirmation gate. Every agent action
is visible and reversible. Affinity Test still owns provider authorization and signing.

## What is new for the challenge

Baseline `f55eedef7c8833f15dad335c23ba8f29bb521835` is dated August 5, 2026. It contains the
pre-existing Northstar workspace and Affinity Test integrations.

Branch `webmcp-challenge` adds all challenge work in commits dated after August 25, 2026:

- direct WebMCP registration and lifecycle cleanup;
- patient search, selection, and safe review preparation tools;
- shared workflow logic and focused tests;
- visible agent status, handoff state, and accessible announcements;
- safety, architecture, deployment, and submission documentation;
- a root MIT license.

## Test evidence

- `bun run check`: 23 tests passing; lint, formatting, and TypeScript passing.
- `bun run build`: client and SSR production builds passing.
- Native Chrome WebMCP smoke: three public tools discovered; search execution returned two eligible
  California patients and updated the visible query to `CA`.

## Links

- Live demo: `PENDING_ALCHEMY_V2_DEPLOY`
- Source: https://github.com/affinity-health/tanstack-start-example/tree/webmcp-challenge
- Video: `PENDING_YOUTUBE_URL`

## Submission checklist

- [x] MIT license published on the public GitHub branch
- [x] Public repository includes `document.modelContext.registerTool`
- [x] Dated challenge commit visible after August 25, 2026
- [ ] Alchemy v2 non-production live URL verified
- [ ] Public YouTube demo is under three minutes
- [ ] Devpost fields contain the final repository, live demo, and video URLs

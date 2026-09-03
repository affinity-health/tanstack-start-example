# Devpost submission draft

## Project

Northstar, a demo telehealth platform

## One line summary

A copyable telehealth clinic where a browser agent can search a synthetic medication marketplace and fill a patient cart, while checkout stays with the clinician.

## What it does

Northstar opens into a searchable Test catalog. A clinician or browser agent can open a product and add it to a named synthetic patient's cart. The Cart screen shows the patient, line items, quantities, and estimated total. Only a clinician can check the confirmation and submit the Test order.

The authenticated app registers four WebMCP tools. They search the marketplace, open a product, add a product to a patient cart, and inspect the cart. Each tool changes the visible Northstar UI. None can confirm checkout, create an order, prescribe, sign, or enter a PIN.

## How we built it

- TanStack Start and React power the clinic.
- `document.modelContext.registerTool` exposes four tools with JSON Schema.
- One shared React model owns catalog filters, product detail, patient carts, and submitted Test orders.
- Affinity Test remains the backend boundary inside Northstar.
- Alchemy v2 deploys the isolated `webmcp-challenge` stage to Cloudflare Workers and D1.
- Bun tests cover tool inputs, visible actions, the checkout boundary, registration, request origins, and webhooks.

## Why the boundary matters

The agent can do useful setup work without becoming the clinician. A filled cart is visible and reversible. Northstar does not create a Test order until the clinician reviews the cart and confirms checkout. The demo uses only synthetic patients and products, and never connects to Live.

## What is new for the challenge

Baseline `f55eedef7c8833f15dad335c23ba8f29bb521835` is dated August 5, 2026. Branch `webmcp-challenge` adds the direct WebMCP registration, marketplace and cart tools, shared visible state, safety tests, clinic UI, MIT license, and submission docs in commits dated after August 25, 2026.

## Test evidence

- `bun run check`: 27 tests pass; lint, formatting, and TypeScript checks pass.
- `bun run build`: client and server production builds pass.
- Native Chrome WebMCP smoke: pending final marketplace verification.

## Links

- Live demo: `PENDING_ALCHEMY_V2_DEPLOY`
- Source: https://github.com/affinity-health/tanstack-start-example/tree/webmcp-challenge
- Video: `PENDING_YOUTUBE_URL`

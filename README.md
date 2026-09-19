# Affinity prescribing demo

A small TanStack Start website and API running on Bun for trying the [Affinity TypeScript SDK](https://docs.joinaffinityai.com/guides/reference/sdks/typescript/).
It uses `@affinity-health/sdk` **1.9.0-beta.4**, the `next` release from
[affinity-typescript](https://github.com/affinity-health/affinity-typescript). The stable 1.8.0 release does not include prescribing defaults or previews.

## Run

```sh
bun install
cp .env.example .env.dev # Skip if .env.dev already exists.
# Set AFFINITY_TEST_API_KEY to a current sk_test_ key.
bun run dev
```

Open http://localhost:3001.

1. Practices and the first medication page load during streamed server rendering. Select a practice in the header dropdown; use the toolbar to switch Test or Live.
2. Select an EMR patient, then search for a medication in the Coss command picker. Medication defaults load when you select it.
3. Open the header settings cog and save a prescriber name and NPI for each destination state. Live also requires your email, phone, practice address, and a current license number and expiry for each patient state. Settings are stored in this browser separately for Test and Live.
4. Select a medication. Supplies such as alcohol pads cannot be prescribed on their own. If the pharmacy requires a compounding reason, select its category and enter the patient-specific context.
5. Click **Review prescription**. Affinity validates the defaults and opens the review dialog with directions, quantity, pharmacy, patient, and shipping information.
6. Choose **Create draft**, or confirm the allergy and prescription review and click **Sign and send to pharmacy**. The saved NPI is selected by the patient's state. If the created prescription differs from the preview, review the saved draft and confirm again. A failed submission can be retried without signing again.

Open **Orders** in the header to see the selected practice’s saved orders. The **Drafts** filter includes orders waiting for a prescriber signature. Open an order to review every prescription and sign and send it using your saved state-specific prescriber. Orders are loaded from Affinity and paginated, so they remain available after reloading. If an order changed since you opened it, the app requires another review before signing.

An NPI identifies the prescriber; signing uses
the registered user ID and matching actor external ID. Affinity enforces practice access and prescribing authority.
Use a Test NPI issued for your Affinity Test setup, with authority for the selected patient's state.

The Test key needs permissions for practices, catalog, patients, team, order creation/read, `orders:sign`, and order submission permissions.
A 401 means the key is missing or invalid; a 403 may indicate missing scopes or access.
API errors appear beside the relevant action. Full order details are available in the review dialog.

## Environments

Test uses only `AFFINITY_TEST_API_KEY`; Production uses only `AFFINITY_PRODUCTION_API_KEY`.
Development and `bun run example` load only `.env.dev`. `bun run start` and `bun run deploy`
load only `.env.prod`. The old `.env` is not used. Restart the server after editing a file.
The client checks the key prefix against the selected
mode; Affinity authenticates each SDK request. There is no separate key-validation request or
credential fallback. Signing sets the registered prescriber's actor explicitly.

`AFFINITY_API_URL` selects the API server in each file, for example
`https://affinity.harbr.run/api/v1` for development or `https://api.joinaffinityai.com/v1`
for deployment. The SDK adds `/v1`, so the client removes that suffix from its base URL
while preserving `/api`. When unset, the URL defaults to `https://api.joinaffinityai.com/v1`.
The Test/Live switch selects the matching key on that server, not a different API URL.

For a Devbox-protected development URL, set `DEVBOX_API_KEY` in `.env.dev` to your Devbox
personal API key. The SDK sends it server-side as `X-Api-Key`; Affinity's key stays in
`Authorization`. Devbox verifies the key owner's access to the requested environment.
The header is omitted when unset. The production Affinity server does not need it. Deployment uploads it only when explicitly supplied; otherwise it preserves the existing Worker secret. Use a personal key, not a workspace automation credential.
Redirects are rejected so credentials are not forwarded to a login page.

Both modes create or reuse records from `src/data/patients.ts` by external ID. Replace the shipped sample
records with your own EMR data before using Production. Switching environments clears patient,
prescriber, preview, draft, and signing state. Live requests have been verified on development with synthetic records and simulator fulfillment. No production Affinity requests were made.

Controls are copied from the official [Coss UI registry](https://coss.com/ui/), built on Base UI.
Tailwind is bundled by Vite. TanStack Start serves the page and file-based API routes; Nitro builds the Bun server.

## Standalone TypeScript

```sh
bun run example
```

Edit [example.ts](./example.ts) and use `createAffinity("test")` or `createAffinity("production")`.
The current example retrieves API-key access information and prints its request time.
It needs no running website. Patient-resolution helpers are available in `src/server/affinity/patients.ts`.

## Code

- `example.ts`: standalone SDK calls.
- `src/routes/`: TanStack Start page, document shell, and API endpoints.
- `src/features/prescribing/`: prescribing screen, feature components, and SDK-derived types.
- `src/server/`: request handling and server-only Affinity client, pagination, and patient helpers.
- `src/data/patients.ts`: editable EMR sample records.
- `src/components/ui/`: shared Coss controls.
- `src/styles/` and `src/lib/`: app styles and shared UI utilities.
- `vite.config.ts`: development server and production build.

`src/routeTree.gen.ts` is generated by development or build and is not committed.

## API

| Method | Endpoint                                       | Purpose                                   |
| ------ | ---------------------------------------------- | ----------------------------------------- |
| GET    | `/api/health`                                  | Health check                              |
| GET    | `/api/practices`                               | All accessible practices                  |
| GET    | `/api/catalog`                                 | Search catalog; 25 results per page       |
| GET    | `/api/options?practiceId=...&medicationId=...` | Prescribing defaults                      |
| POST   | `/api/patient`                                 | Create or reuse by EMR external ID        |
| POST   | `/api/allergies`                               | Explicit no-known-allergies review        |
| POST   | `/api/prescriber`                              | Register or reuse a prescriber            |
| POST   | `/api/preview`                                 | Resolve defaults and validate input       |
| GET    | `/api/orders?practiceId=...`                   | List orders or drafts, 25 per page        |
| POST   | `/api/orders`                                  | Create a draft and retrieve it for review |
| GET    | `/api/order?practiceId=...&orderId=...`        | Retrieve a draft for review               |
| POST   | `/api/submit`                                  | Submit the signed order to the pharmacy   |
| POST   | `/api/sign`                                    | Sign the explicitly reviewed versions     |

The catalog route accepts `query`, `practiceId`, and `startingAfter`. Search runs through
`affinity.catalog.list({ query })`, with a 75 ms debounce and stale-response protection.
Medication rows show `imageUrl` when available, or a pill icon when missing or unavailable.

POST requests use `Idempotency-Key`. The website reuses keys for identical requests within the
current page session, so an uncertain response can be retried. Reloading clears this local state;
inspect Affinity before recreating an order after a reload. Preview itself creates no persistent order.

Local development binds to loopback. Hosted pages, server functions, and API routes require a
PIN session. Cross-origin writes are rejected, and API keys stay out of browser code.

## Checks

```sh
bun run build   # Generate routes and build into .output/
bun run check   # Lint, formatting, TypeScript
bun test src/server/webhooks.test.ts
bun run start   # Run without development mode
```

Set `PORT` to change port 3001. No database or Cloudflare account is required.

## Verification notes

Verified September 19, 2026 against development in Live mode using synthetic records and an Affinity pharmacy simulator. The deployed Worker resolved a patient, recorded allergy review, registered the synthetic clinician with contact and license data, retrieved prescribing defaults, previewed, created, signed, and submitted an order. The order reached delivered with simulated tracking. The Worker received signed events from creation through delivery.

The broader API acceptance run covered patient and address operations, draft cancellation, idempotent retries, external references, and signing rejection for missing scope, wrong actor, stale versions, and the wrong mode. See [the integration handoff](./HANDOFF.md) for boundaries and setup.

## Responsiveness and Worker builds

TanStack Start streams the form shell while the server loads practices and the first catalog page.
Hydration reuses those results. Read-only practices, catalog searches, and prescribing options share
a browser-memory cache: 60 seconds, at most 100 entries, keyed by environment and full request
parameters. Concurrent reads share one request, and errors are not cached.

Highlighting a medication for 100 ms prefetches its defaults. Search keeps previous results visible
but disables them until the new query completes. Reopening a picker or switching back to an environment
reuses fresh cached reads. Patient writes, previews, order retrieval, and signing are never prefetched
or served from this cache. Preview still validates the medication revision with Affinity.
The response inspector formats its JSON only when opened.

```sh
bun run build:worker
```

This builds the Cloudflare Worker and generates `.output/server/wrangler.json`.
Hashed assets use a one-year immutable cache; HTML and API data stay private and uncached.
`bun run build` still produces the local Bun server. Both builds are checked in CI.

## Deploy to Harbor

```sh
bun run deploy
```

Deploys to https://affinity-prescribing-demo.harborrun.workers.dev in the Harbor account.
Wrangler must be authenticated. Copy `.env.example` to `.env.prod` and configure it first.
The script builds the Worker and uploads `AFFINITY_API_URL`, `AFFINITY_TEST_API_KEY`,
`AFFINITY_PRODUCTION_API_KEY`, `DEMO_PIN`, and `DEMO_SESSION_SECRET` from `.env.prod`
as encrypted Worker secrets. An empty Production key disables that mode and clears any
previously deployed Production credential. Other Worker secrets are preserved.

On first deployment, the script generates a 10-digit PIN and a random session secret and saves
both in your ignored `.env.prod`. Share the PIN with demo users. They enter it once per 12-hour session;
no email or account is needed. The cookie is signed, HttpOnly, and SameSite=Strict. Hosted HTTPS uses a Secure cookie;
local HTTP uses a separate cookie so the PIN flow works on localhost too.
Cloudflare limits PIN attempts to five per minute per IP at each Cloudflare location.
Changing either PIN or session secret and redeploying invalidates existing sessions.

Local development skips the gate when `DEMO_PIN` is unset. Hosted access fails closed if its secrets
or login rate-limit binding are missing. Hashed static assets are public and contain no credentials.
Preview deployment URLs are disabled so there is one supported demo address.
This shared PIN grants access to everyone who knows it; it is not individual prescriber identity.

Medication images from the configured development API origin under `/cdn/` load through the PIN-protected `/api/medication-image` route. It adds `X-Api-Key` from `DEVBOX_API_KEY` on the server, refuses redirects and external targets, and leaves public CDN images unchanged. Production does not require this key.

## Webhook receiver

Register `POST /api/webhooks/affinity` as an Affinity webhook endpoint. It is exempt from the shared PIN and verifies the raw request bytes with the official SDK before accepting an event. Configure `AFFINITY_WEBHOOK_SECRET`, `AFFINITY_WEBHOOK_ORGANIZATION_ID`, and `AFFINITY_WEBHOOK_LIVEMODE`. Set the last value explicitly to `true` for Live or `false` for Test.

The `WEBHOOK_RECEIPTS` KV binding stores event ID, type, mode, resource ID, and creation time for seven days. Replays replace the same event key. The PIN-protected `GET /api/webhook-events` shows recent receipts. KV is eventually consistent and this receiver performs no clinical or billing side effects. A production EMR needs a transactional inbox keyed by event ID before performing such effects. Return a success response only after durable acceptance.

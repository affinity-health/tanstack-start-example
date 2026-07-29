# Affinity platform example

A deliberately small example of the Affinity platform integration model:

- TanStack Start for routing, SSR, and server functions
- Elysia for the HTTP API
- Better Auth for email/password authentication
- `@affinity-health/sdk` for trusted server-side Affinity API calls
- An origin-bound Affinity prescription composer session
- Signed Affinity webhooks stored idempotently in Cloudflare D1
- Cloudflare D1 for auth storage
- Elysia OpenAPI for generated API documentation
- Alchemy v2 for Cloudflare Workers infrastructure and deployment

The user signs in to this application. Its backend uses the Affinity service key and returns only a
short-lived component secret to the authenticated browser. The service key never reaches client
code.

## Run it

Create `.env` with the staging test credentials:

```bash
AFFINITY_API_KEY=sk_test_...
AFFINITY_WEBHOOK_SECRET=whsec_...
AFFINITY_PROVIDER_MAPPING_ID=pmap_...
```

The provider mapping must be verified and its `externalId` must equal the Better Auth user ID shown
on the signed-in dashboard. In the Affinity staging Platform settings, allow both origins you use:

```text
http://localhost:3001
https://api.dawson.gg
```

Then start the app:

```bash
bun install
bun run dev
```

Alchemy authenticates with Cloudflare on first use, provisions the D1 database, applies SQL
migrations, and starts the app at `http://localhost:3001`. Local development uses the real managed
D1 binding.

The public TypeScript SDK is `@affinity-health/sdk`. This demo pins `0.1.1` and explicitly selects
the current `2026-07-29` staging API version. That npm release predates the delegated-session
resources, so this example uses the SDK for API-key access validation and makes the two new
versioned requests through server-side `fetch`. The API key remains server-only in both cases.

The browser Elements and webhook-helper packages are not public yet, so the example contains the
small origin-checked iframe handshake and Web Crypto signature verifier directly.

## HTTP surface

| Method     | URL                               | Purpose                               |
| ---------- | --------------------------------- | ------------------------------------- |
| `GET`      | `/api/health`                     | Health check                          |
| `POST`     | `/api/affinity/component-session` | Create a delegated component session  |
| `POST`     | `/api/affinity/webhook`           | Verify and record an Affinity webhook |
| `GET`      | `/api/openapi`                    | Interactive OpenAPI reference         |
| `GET`      | `/api/openapi/json`               | Raw OpenAPI document                  |
| `GET/POST` | `/api/auth/*`                     | Better Auth handler                   |

Configure the Affinity webhook endpoint as:

```text
https://api.dawson.gg/api/affinity/webhook
```

The receiver verifies the `affinity-signature` HMAC against the exact raw request body with a
five-minute timestamp tolerance. Valid events are inserted into `affinity_webhook_event` by event
ID, so retries are acknowledged without duplicating rows. It logs only event metadata to the
Worker console. The D1 payload log is for synthetic test-mode data; do not use this demo retention
policy for production PHI.

## Commands

```bash
bun run dev          # migrate auth DB and start development
bun run test         # webhook verification tests
bun run check        # test, lint, format check, and typecheck
bun run build        # production build
bun run deploy       # deploy the Worker and D1 database
bun run destroy      # remove the managed stack
```

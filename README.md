# Affinity platform example

A deliberately small example of the Affinity platform integration model:

- TanStack Start for routing, SSR, and server functions
- Elysia for the HTTP API
- Better Auth for email/password authentication
- `@affinity-health/sdk` for trusted server-side Affinity API calls
- An origin-bound Affinity prescription composer session
- A single-use Affinity Hosted prescription session
- Signed Affinity webhooks stored idempotently in Cloudflare D1
- Cloudflare D1 for auth storage
- Elysia OpenAPI for generated API documentation
- Alchemy v2 for Cloudflare Workers infrastructure and deployment

The user signs in to this application. Its backend uses the Affinity service key and returns only a
short-lived component secret to the authenticated browser. The service key never reaches client
code.

## Run it

Create `.env` with a production-hosted Test credential:

```bash
AFFINITY_API_KEY=sk_test_...
AFFINITY_WEBHOOK_SECRET=whsec_...
AFFINITY_PROVIDER_MAPPING_ID=pmap_...
```

`AFFINITY_PROVIDER_MAPPING_ID` is not a credential. It is the durable `pmap_...` identifier that
links one provider in this platform to Affinity's independently verified provider identity, Test
practice, and platform user. This deliberately single-provider demo stores one mapping in the
environment. A real platform resolves and authorizes a separate mapping ID from its own provider
record for every session.

There is no separate membership ID to configure. The provider mapping answers “which verified
Affinity provider is this?” Affinity then resolves that provider's active access to the requested
practice, which answers “what may this provider do here?” Keeping identity and practice access
separate prevents a platform from granting itself prescribing authority, but the demo backend only
needs the provider mapping ID.

The configured mapping must be verified. In the Affinity production Platform portal's Test mode,
allow every browser origin you use:

```text
http://localhost:3001
https://api.dawson.gg
https://your-generated-worker.workers.dev
```

Then start the app:

```bash
bun install
bun run dev
```

Alchemy authenticates with Cloudflare on first use, provisions the D1 database, applies SQL
migrations, and starts the app at `http://localhost:3001`. Local development uses the real managed
D1 binding.

The public TypeScript SDK is `@affinity-health/sdk`. It owns the dated API types, provider-mapping
and component-session resources, exhaustive webhook event union, and raw-body HMAC verifier. The
API key and webhook secret remain server-only.

The public browser package is `@affinity-health/elements`. Its React wrapper creates the
origin-checked iframe, exchanges the one-time component secret, validates lifecycle messages, and
applies the approved appearance options.

The hosted workflow uses `@affinity-health/sdk` on the platform backend. The backend returns a
single-use hosted session URL to the authenticated browser. The platform API key remains on the
backend.

## Test the prescribing modes

Sign in and open **Medication orders**. Use the launch-mode control to select one mode:

- **Embedded** renders the Affinity Elements iframe in the platform page.
- **Popup window** opens the complete Affinity Hosted workflow in a focused window.

The popup opens directly from the user click. The browser can then wait for the backend to create
the hosted session without blocking the popup.

## HTTP surface

| Method     | URL                               | Purpose                       |
| ---------- | --------------------------------- | ----------------------------- |
| `GET`      | `/api/health`                     | Health check                  |
| `POST`     | `/api/affinity/component-session` | Create a component session    |
| `POST`     | `/api/affinity/hosted-session`    | Create a hosted session       |
| `POST`     | `/api/affinity/webhook`           | Verify and record a webhook   |
| `GET`      | `/api/openapi`                    | Interactive OpenAPI reference |
| `GET`      | `/api/openapi/json`               | Raw OpenAPI document          |
| `GET/POST` | `/api/auth/*`                     | Better Auth request handler   |

Configure the Affinity webhook endpoint for the environment that should receive events:

```text
https://your-generated-worker.workers.dev/api/affinity/webhook
```

The receiver verifies the `affinity-signature` HMAC against the exact raw request body with a
five-minute timestamp tolerance. Valid events are inserted into `affinity_webhook_event` by event
ID, so retries are acknowledged without duplicating rows. It logs only event metadata to the
Worker console. The D1 payload log is for synthetic test-mode data; do not use this demo retention
policy for production PHI.

`api.dawson.gg` is the optional Cloudflare Tunnel entrypoint for local development on
`localhost:3001`; deployment does not create or modify that DNS record. Set `APP_URL` to the
generated Worker origin when deploying a persistent hosted demo.

## Commands

```bash
bun run dev          # migrate auth DB and start development
bun run test         # webhook verification tests
bun run check        # test, lint, format check, and typecheck
bun run build        # production build
bun run deploy       # deploy the Worker and D1 database
bun run destroy      # remove the managed stack
```

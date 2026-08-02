# Affinity platform example

A deliberately small example of the Affinity platform integration model:

- TanStack Start for routing, SSR, and server functions
- Elysia for the HTTP API
- Better Auth for email/password authentication
- `@affinity-health/sdk` for trusted server-side Affinity API calls
- Stripe.js practice card setup without card data touching the platform server
- An origin-bound Affinity prescription composer session
- Single-use Affinity Hosted prescribing and provider-verification sessions
- A headless SDK route that creates one multi-prescription patient order and signing session
- Signed Affinity webhooks stored idempotently in Cloudflare D1
- Cloudflare D1 for auth storage
- Elysia OpenAPI for generated API documentation
- Alchemy v2 for Cloudflare Workers infrastructure and deployment

The user signs in to this application. Its backend uses the Affinity service key and returns only a
short-lived component secret to the authenticated browser. The service key never reaches client
code.

Hosted Test demo: [tanstackstartexample-website-release-ksulwrzuogvlekqa.dawsson.workers.dev](https://tanstackstartexample-website-release-ksulwrzuogvlekqa.dawsson.workers.dev). It uses Affinity's
Production-hosted Test environment, Stripe Test, synthetic patients, and the internal Test
pharmacy; it cannot create a Live prescription or send one to a real pharmacy.

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
https://api.dawson.gg
https://your-generated-worker.workers.dev
```

Affinity's Test allowlist accepts HTTPS origins. When developing locally, browse through the
existing `https://api.dawson.gg` tunnel to `localhost:3001`; do not replace that tunnel with the
deployed Worker.

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

The payment setup uses the SDK only on the backend. The authenticated browser receives a one-time
Stripe Test client secret and publishable key, renders Stripe's Payment Element, and sends only the
confirmed SetupIntent ID back to the backend. This demo assumes its signed-in user is authorized to
manage billing for the practice linked to the configured provider mapping. A real platform must
enforce that practice authorization in its own session before calling the Affinity payment-profile
endpoints.

## Test the prescribing modes

Sign in and open **Medication orders**. Use the launch-mode control to select one mode:

- **Practice billing** records the user's consent and adds a Stripe Test card before an order can
  be accepted.
- **Embedded** renders the Affinity Elements iframe in the platform page.
- **Headless SDK** renders a Northstar-owned prescription form, creates the unsigned order from the
  platform backend, and opens Affinity only for provider signing.
- **Popup window** opens the complete Affinity Hosted workflow in a focused window.
- **Provider setup** opens a single-use verification session where the provider sets or resets the
  six-digit signing PIN. The PIN is entered only inside Affinity and is never returned to the
  platform.

The embedded component emits only the current `order.draft_created`, `order.signed`, and
`order.submitted` browser events. Treat those events as UI hints and use
the signed webhook receiver for authoritative state changes.

The popup opens directly from the user click. The browser can then wait for the backend to create
the hosted session without blocking the popup.

## Test the headless SDK flow

Use this route when your platform owns the prescribing interface. Send one patient and the complete
prescription list from your authenticated backend session. The example creates the unsigned order
and returns one provider-bound signing URL. Affinity collects the signing PIN on that URL.

```bash
curl --request POST http://localhost:3001/api/affinity/headless-order \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: encounter_123' \
  --cookie 'your-authenticated-session-cookie' \
  --data '{
    "patientId": "pat_01j2y8m6jcc9tt24af5pw9x1bc",
    "prescriptions": [{
      "daysSupply": 30,
      "directions": "Inject 0.25 mL subcutaneously once weekly",
      "medicationId": "cat_01j2y8m6jcc9tt24af5pw9x1bc",
      "quantity": 1,
      "quantityUnit": "mL",
      "refills": 0,
      "structuredSig": {
        "dose": "0.25",
        "doseUnit": "mL",
        "frequency": "once weekly",
        "prn": false,
        "route": "subcutaneous"
      },
      "substitutionPermitted": false
    }]
  }'
```

Repeat the prescription object to create multiple prescriptions for the same patient. Reuse the
same idempotency key only when retrying the identical logical request. Open the returned
`signingSession.url` only for the authenticated provider. Diagnoses are optional. When supplied,
put the primary ICD-10-CM diagnosis first. When the selected catalog formulation requires a
patient-specific compounding reason, send `compoundingReason` with one of the documented categories
and the provider-entered explanation; do not infer or preselect it.

## HTTP surface

| Method     | URL                                    | Purpose                               |
| ---------- | -------------------------------------- | ------------------------------------- |
| `GET`      | `/api/health`                          | Health check                          |
| `POST`     | `/api/affinity/component-session`      | Create a component session            |
| `GET`      | `/api/affinity/headless-options`       | List Test patients and formulations   |
| `POST`     | `/api/affinity/hosted-session`         | Create a prescribing or setup session |
| `POST`     | `/api/affinity/headless-order`         | Create an order and signing session   |
| `GET`      | `/api/affinity/payment-profile`        | Read safe practice payment status     |
| `POST`     | `/api/affinity/payment-setup`          | Start Stripe Test card setup          |
| `POST`     | `/api/affinity/payment-setup/complete` | Complete Test card setup              |
| `POST`     | `/api/affinity/webhook`                | Verify and record a webhook           |
| `GET`      | `/api/openapi`                         | Interactive OpenAPI reference         |
| `GET`      | `/api/openapi/json`                    | Raw OpenAPI document                  |
| `GET/POST` | `/api/auth/*`                          | Better Auth request handler           |

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
bun run deploy:hosted  # deploy the persistent release-stage demo with explicit process secrets
bun run destroy      # remove the managed stack
```

For the persistent hosted demo, export `APP_URL`, `AFFINITY_API_KEY`,
`AFFINITY_PROVIDER_MAPPING_ID`, and `AFFINITY_WEBHOOK_SECRET` in the calling shell, then run
`bun run deploy:hosted`. The deploy script reads only non-secret Cloudflare configuration from
`.alchemy-deploy.env`, so an older local `.env` cannot replace the intended Test credentials.

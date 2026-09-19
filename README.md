# Affinity EMR demo

[Try the demo](https://demo-emr.joinaffinityai.com) · [TypeScript SDK](https://github.com/affinity-health/affinity-typescript)

A standalone TanStack Start application using `@affinity-health/sdk@1.10.0`.
This repository owns the runnable demo and its independent Alchemy deployment.

## Try it

1. Confirm you will use synthetic data, then select **Start Test demo**.
2. The server creates your own Test practice. Choose a sample patient and medication.
3. Review the populated directions, quantity, days supply, shipping, and prices.
4. Confirm the allergy and prescription review, then save a draft or sign and send.
5. Open **Orders** to inspect drafts and simulator fulfillment.

No account, shared PIN, or API key is needed in the browser. The synthetic Test Prescriber
uses NPI `1234567893`. The application creates an unsigned draft, then supplies the NPI
when signing. Affinity resolves the prescriber. Signing requires an explicit attestation
and the exact prescription versions. Submission is separate so a failed send can be retried
without signing again.

The header's settings cog saves a default NPI and optional patient-state overrides in
this browser. No name entry is required. Test NPI `1234567893` covers all states;
`1111111112` covers CA, FL, NY, PA, and TX. Each order still requires signing review.

The public UI currently handles one prescription per order. It does not yet have an OTC
cart or a multi-prescription editor. The SDK supports those independently.

## Isolation and limits

Each anonymous browser session has one Test practice, a signed HttpOnly cookie, and a
12-hour expiry. Returning in that browser resumes the workspace until expiry.
There is no recovery or sharing of an anonymous session.

All requests are server-side SDK calls. Practice requests must match the session.
Order reads, signing, and submission check order ownership before proceeding.
Patient requests use the session's practice. Inline patients and arbitrary prescribers
are not accepted by the demo. Live mode is rejected server-side, and no Live key is bound.

The dedicated demo platform has Live access disabled. Its Test key cannot access Harbor's
platform directory. Affinity Test orders route only to simulators.

Limits are 5 starts per IP per UTC day, 100 starts globally per UTC day,
120 API requests per session per minute, and 30 order-creation attempts per session per
UTC day. Retries count toward these abuse limits. Quotas use atomic Durable Object
transactions. IPs are salted and hashed before becoming quota keys. Durable Object alarms
remove expired session mappings and quota counters. Synthetic records in Affinity remain
for audit history; session expiry is not clinical-record deletion.

Cross-origin and missing-Origin writes are rejected. Mutation keys are namespaced by
session. A pending browser mutation retains its key until the result is known.
The public deployment has no shared webhook inbox, prescriber-management endpoint, or
authenticated image proxy. The signed webhook helper remains as reference code only.

## Develop and check

Use Bun. The app uses Vite 8 through Vite+, TypeScript native preview, Oxlint, and Oxfmt.

```sh
bun install --frozen-lockfile
bun run check
bun test
bun run build
```

The website requires its Worker session binding. Run the local Worker through Alchemy
with an isolated Test key and session secret supplied in the child environment:

```sh
doppler run --project affinity --config stg -- bun run dev
```

The local Worker binds to loopback at port 1337. Do not publish a development server
or point this app at Live credentials. The deploy graph fixes the hosted Affinity API
to `https://api.joinaffinityai.com`.

On the Affinity Devbox, use the optional `emr-demo` service in the sibling Affinity
repository. It runs this checkout with hot reload at the protected URL
[affinity.harbr.run/emr-demo/](https://affinity.harbr.run/emr-demo/):

```sh
dt services start emr-demo --environment affinity
dt services logs emr-demo --environment affinity
```

This service sets `VITE_BASE_PATH=/emr-demo/` and `PORT=3002`. Public builds retain `/`.
Saving source files updates development only; it does not deploy the public demo.

For standalone SDK experiments without a website, copy `.env.example` to the ignored
`.env.dev`, set your own Test key, and run `bun run example`.
Never put hosted secrets in environment files.

## Deploy

The canonical stack is `affinity-emr-demo`, stage `demo`, in this repository's
`alchemy.run.ts`. It owns Worker `affinity-emr-demo`, its session Durable Object binding,
and `demo-emr.joinaffinityai.com`.

Operator and runtime secrets come from Doppler `affinity/stg` for this independent demo:

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`: deployment only.
- `AFFINITY_DEMO_API_KEY`: dedicated demo platform Test key.
- `AFFINITY_DEMO_SESSION_SECRET`: cookie signing key.

Alchemy binds only the last two secrets to the Worker, under
`AFFINITY_TEST_API_KEY` and `DEMO_SESSION_SECRET`. The demo key needs
`catalog:read`, `practices:read`, `practices:write`, `patients:read`,
`patients:write`, `orders:read`, `orders:write`, `orders:sign`, and `team:write`.
The provisioned key expires after 90 days and must be rotated before expiry.
Rotating the session secret invalidates existing cookies.

```sh
doppler run --project affinity --config stg -- bun run preview:demo
doppler run --project affinity --config stg -- bun run deploy
doppler run --project affinity --config stg -- bun run preview:demo
```

Review the plan and require a no-op after deployment. Preserve this checkout's ignored
`.alchemy` state. Do not deploy from a second empty state or use Wrangler as a parallel
deployment path. This graph does not redeploy the Affinity API or dashboards.

The older `affinity-prescribing-demo` and `affinity-sdk-emr-example` Workers are separate
private deployments. This stack does not delete, adopt, or expose them.

## Main code paths

- `src/server/auth/`: signed sessions, ownership, quota storage.
- `src/server/api-handler.ts`: request scope and CSRF checks.
- `src/server/bootstrap.ts`: only the current session's practice and catalog.
- `src/routes/api/`: server-side SDK calls.
- `src/features/prescribing/`: existing prescribing and order review UI.
- `src/data/patients.ts`: synthetic patient fixtures.
- `alchemy.run.ts`: independent Worker deployment.

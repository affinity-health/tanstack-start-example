# Development and deployment

The demo is a standalone TanStack Start app. Its Alchemy stack is separate from
the Affinity API and dashboards.

## Isolation and limits

Better Auth stores anonymous users and sessions in a demo-owned D1 database. Each browser
has one Test practice, an HttpOnly session cookie, and a fixed 12-hour expiry. Returning in that browser resumes the workspace until expiry.
There is no recovery or sharing of an anonymous session.

The UI uses typed TanStack Start server functions and TanStack Query. SDK calls stay on
the server. Practice IDs come from the session, not browser input.
Order reads, signing, and submission check order ownership before proceeding.
Patient requests use the session's practice. Inline patients and arbitrary prescribers
are not accepted by the demo. Live mode is rejected server-side, and no Live key is bound.

New demo practices belong to Harbor Platform. The demo uses a dedicated Test-only key;
the browser receives only its own session's practice, never Harbor's platform directory.
Affinity Test orders route only to simulators. Practices created before the Harbor cutover
remain under Affinity Public EMR Demo. The cutover starts fresh browser sessions rather
than moving those practices or their orders.

Limits are 5 starts per IP per UTC day, 100 starts globally per UTC day,
120 API requests per session per minute, and 30 order-creation attempts per session per
UTC day. Retries count toward these abuse limits. Quotas use atomic Durable Object
transactions. IPs are salted and hashed before becoming quota keys. Durable Object alarms
remove expired session mappings and quota counters. Synthetic records in Affinity remain
for audit history; session expiry is not clinical-record deletion.

Cross-origin and missing-Origin writes are rejected. Mutation keys are namespaced by
session. A pending browser mutation retains its key until the result is known.
The public deployment has no shared webhook inbox, prescriber-management endpoint, or
authenticated image proxy. Unused proxy and webhook handlers are removed.

## Develop and check

Use Bun. The app uses Vite 8 through Vite+, TypeScript native preview, Oxlint, and Oxfmt.

```sh
bun install --frozen-lockfile
bun run check
bun test
bun run build
```

The website requires its Worker D1 and Durable Object bindings. Run the local Worker through Alchemy
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
`alchemy.run.ts`. It owns Worker `affinity-emr-demo`, its Better Auth D1 database, ownership/quota Durable Object binding,
and `demo-emr.joinaffinityai.com`.

Operator and runtime secrets come from Doppler `affinity/stg` for this independent demo:

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_EMR_DEMO_API_TOKEN`: deployment only.
  The dedicated token needs Workers deployment, domain, and Account → D1 → Edit permissions.
  `scripts/alchemy.ts` maps it to Alchemy's token variable only in the child process.
- `AFFINITY_HARBOR_DEMO_API_KEY`: dedicated Harbor platform Test key for this demo.
- `AFFINITY_DEMO_SESSION_SECRET`: Better Auth signing/encryption secret.

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

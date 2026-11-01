# Development and deployment

The demo is a standalone TanStack Start app. Its Alchemy stack is separate from
the Affinity API and dashboards.

## Isolation and limits

Better Auth stores anonymous users and sessions in a demo-owned D1 database. Each browser
has one Test practice, an HttpOnly session cookie, and a fixed 12-hour expiry. Returning in that browser resumes the workspace until expiry.
There is no recovery or sharing of an anonymous session.

The UI uses typed TanStack Start server functions and TanStack Query.
`AffinityClient` from SDK 2.0.0-beta.11 sends API version `2026-11-01`.
The client reads medications and creates complete orders with the session-owned `practiceId`.
Each SDK call takes one request object; every write carries its persisted `idempotencyKey` in it.
List calls return the API's page (`data`, `hasMore`, `nextCursor`) to the browser. The medication
catalog is read whole on the server and filtered in the browser, because the API has no search.
The server normalizes API JSON before returning it through TanStack Start. SDK calls stay on
the server. Practice IDs come from the session, not browser input.
Order reads check ownership before returning data. Order creation takes the practice from the session,
passes the selected synthetic patient inline, and includes the selected Test NPI and name.
Retired patient, preview, draft, sign, and submit routes are not used. Live mode is rejected server-side, and no Live key is bound.

The demo uses a dedicated platform Test key. The browser receives only its own session's
practice, never the platform's practice directory. Affinity Test orders route to simulators.

Limits are 5 starts per IP per UTC day, 100 starts globally per UTC day,
120 API requests per session per minute, and 30 order-creation attempts per session per
UTC day. Retries count toward these abuse limits. Quotas use atomic Durable Object
transactions. IPs are salted and hashed before becoming quota keys. Durable Object alarms
remove expired session mappings and quota counters. Synthetic records in Affinity remain
for audit history; session expiry is not clinical-record deletion.

Cross-origin and missing-Origin writes are rejected. Mutation keys are namespaced by
session. A pending browser mutation saves its reviewed synthetic request and key in tab storage until the result is known,
so a reload retries the same order. Real EMRs should persist reviewed requests server-side.
The public deployment has no shared webhook inbox, prescriber-management endpoint, or
authenticated image proxy. Unused proxy and webhook handlers are removed.

## Develop and check

Dependencies are current except the Alchemy toolchain, which stays at `alchemy` 2.0.0-beta.76 with
`effect`, `@effect/platform-bun` and `@effect/platform-node` 4.0.0-rc.112. `alchemy` 2.0.0-beta.84
(the latest) starts its local Vite child with `bin/register-dev-mode.js`, which its published
package does not include, so `bun run dev` fails; beta.76 also needs `effect`'s rc.112 module layout.
`package.json` overrides patch vulnerable packages that only `alchemy`'s `@prisma/dev` uses; the
deployed Worker includes none of them.

Use Bun. Vite+ runs Vite 8, formatting, linting, and TypeScript checks from
`vite.config.ts`.

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
or point this app at Live credentials. The deploy graph fixes the hosted demo's Affinity API
to `https://api.affinityrx.com`.

To call staging from the local Worker, set `AFFINITY_API_URL=https://api-staging.affinityrx.com`
and a staging platform Test key in the child environment. The `demo` stage ignores it.

For standalone SDK experiments without a website, copy `.env.example` to the ignored
`.env.dev`, set your own Test key, and run `bun run example`.
Never put hosted secrets in environment files.

## Deploy

The canonical stack is `affinity-emr-demo`, stage `demo`, in this repository's
`alchemy.run.ts`. It owns Worker `affinity-emr-demo`, its Better Auth D1 database, ownership/quota Durable Object binding,
and `demo-emr.affinityrx.com`. Alchemy retains `demo-emr.joinaffinityai.com` as an alias;
the Worker redirects it to the new hostname with HTTP 308, preserving paths and queries.

Operator and runtime secrets come from Doppler `affinity/stg` for this independent demo:

- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_EMR_DEMO_API_TOKEN`: deployment only.
  The dedicated token needs Workers deployment, domain, and Account → D1 → Edit permissions.
  `scripts/alchemy.ts` maps it to Alchemy's token variable only in the child process.
- `AFFINITY_HARBOR_DEMO_API_KEY`: dedicated Harbor platform Test key for this demo.
- `AFFINITY_DEMO_SESSION_SECRET`: Better Auth signing/encryption secret.

Alchemy binds only the last two secrets to the Worker, under
`AFFINITY_API_KEY` and `DEMO_SESSION_SECRET`. The demo key acts for its platform and Test mode; current API keys have no permission scopes.
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

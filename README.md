# Affinity EMR example

A Test-mode prescribing app built with TanStack Start and the [Affinity TypeScript SDK](https://github.com/affinity-health/affinity-typescript). It creates a private practice for each demo session, lets you review prescriptions locally, and sends signed orders to simulated pharmacies.

[Try the demo](https://demo-emr.affinityrx.com) · [TypeScript SDK guide](https://github.com/affinity-health/affinity-typescript/blob/main/docs/guide.md) · [MIT license](LICENSE)

The app uses `@affinity-health/sdk@2.0.0-beta.8` and its `AffinityClient`, targeting
API version `2026-10-28`. SDK calls stay in server functions.

## Try the demo

Open the demo, confirm you will use synthetic data, and choose a sample patient. Search for a medication available in that patient's state, review the prescription, then sign and send it. Orders shows the result.

The public demo needs no login or API key in your browser. It uses Test mode only. Nothing is filled or shipped.

## Install the current SDK

```sh
bun add @affinity-health/sdk@next
# npm install @affinity-health/sdk@next
```

This repository pins `2.0.0-beta.8` for repeatable installs. Use `@next` when adding the SDK to your own app. Bare installs still select `1.16.0`, which targets a retired API version.

## Use your own Test key

The [standalone script](example.ts) checks your API key's mode and lists medications without starting the website. Keep the key on your server.

```sh
bun install --frozen-lockfile
cp .env.example .env.dev
# Set AFFINITY_API_KEY in the ignored .env.dev file to your Test key.
bun run example
```

The standalone script reads the ignored `.env.dev` file:

- `AFFINITY_API_KEY`: your Affinity Test API key. Keep it server-side.
- `AFFINITY_API_URL`: optional API base URL, default `https://api.affinityrx.com`. For local Devbox use `https://affinity.harbr.run/api`.
- `DEVBOX_API_KEY`: needed only to authenticate a protected local Devbox proxy.

Read the [SDK guide](https://github.com/affinity-health/affinity-typescript/blob/main/docs/guide.md) for API calls. The app's [server functions](src/api) and [SDK helpers](src/server/affinity) show the full Test prescribing flow.

## Run the website locally

The full website needs Cloudflare Worker, D1, and Durable Object bindings, plus an Affinity platform Test key and a session secret. Affinity operators supply these through Doppler and start the local Worker with:

```sh
bun install --frozen-lockfile
doppler run --project affinity --config stg -- bun run dev
```

The Worker listens on [localhost:1337](http://localhost:1337). See [development and deployment](docs/development.md) for local Devbox service and hosted deployment commands. Platform developers can use the standalone script above without these operator credentials.

The website's Alchemy workflow reads `AFFINITY_HARBOR_DEMO_API_KEY` and `AFFINITY_DEMO_SESSION_SECRET`, binding them to `AFFINITY_API_KEY` and `DEMO_SESSION_SECRET` inside the Worker. Its operator wrapper also requires `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_EMR_DEMO_API_TOKEN`. It provisions the `AUTH_DATABASE` D1 and `DEMO_SESSIONS` Durable Object bindings. Keep these credentials in the operator environment; never commit them or put API keys in public frontend variables.

Run the repository checks with:

```sh
bun run check
bun test
bun run build
```

## Code map

- `src/routes`: prescribing and order pages.
- `src/api`: server functions and input validation.
- `src/server/affinity`: server-side SDK calls. API keys stay out of the browser.
- `src/server/auth`: anonymous session and quota storage.
- `src/data/patients.ts`: synthetic patients.

The website demonstrates one prescription per order. The API supports 1–20 complete prescriptions for one patient in a single order.

## Current order flow

The server creates each session's practice with its required name, address, and phone, with one idempotency key per demo user so a retried start reuses the practice. It reads the whole medication catalog from `/v1/medications` (the API has no medication search, so the picker filters the loaded catalog in the browser) and reads `/v1/medications/{medicationId}` for the chosen medication. Orders list one page at a time; the SDK passes each page's `nextCursor` unchanged as `startingAfter`.

After the user reviews the complete request and explicitly confirms no known allergies and signing intent, the server sends one `POST /v1/orders` containing `practiceId`, inline `patient`, `prescriber` with NPI and name, complete `prescriptions`, `shipping.optionId`, and `signatureAttestation: true`, with the saved key as `idempotencyKey`. There are no patient, preview, draft, separate sign, or separate submit API calls. The demo accepts only its synthetic patients and Test prescribers. API keys have no permission scopes.

The tab saves the reviewed synthetic request and idempotency key before sending. An uncertain result freezes the review for retry with the same key and body, including after a reload. The SDK's own retries are off (`maxRetries: 0`), so the user decides when to retry. A real EMR must store its approved body and key in its server-side order record and authenticate its clinician; an NPI identifies a prescriber and does not authenticate them.

IDs come from API responses, including `prac_`, `med_`, `shp_`, and `ord_`. The app never converts private database IDs.

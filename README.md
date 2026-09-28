# Affinity EMR example

A Test-mode prescribing app built with TanStack Start and the [Affinity TypeScript SDK](https://github.com/affinity-health/affinity-typescript). It creates a private practice for each demo session, previews prescriptions, saves drafts, and sends signed orders to simulated pharmacies.

[Try the demo](https://demo-emr.joinaffinityai.com) · [TypeScript SDK guide](https://docs.joinaffinityai.com/guides/reference/sdks/typescript/) · [MIT license](LICENSE)

## Try the demo

Open the demo, confirm you will use synthetic data, and choose a sample patient. Search for a medication available in that patient's state, review the prescription, then save a draft or sign and send it. Orders shows the result.

The public demo needs no login or API key in your browser. It uses Test mode only. Nothing is filled or shipped.

## Use your own Test key

The [standalone script](example.ts) checks your API key's mode and scopes without starting the website. Keep the key on your server.

```sh
bun install --frozen-lockfile
cp .env.example .env.dev
# Set AFFINITY_API_KEY in the ignored .env.dev file to your Test key.
bun run example
```

Read the [SDK guide](https://docs.joinaffinityai.com/guides/reference/sdks/typescript/) for API calls. The app's [server functions](src/api) and [SDK helpers](src/server/affinity) show the full Test prescribing flow.

## Run the website locally

The full website needs Cloudflare Worker, D1, and Durable Object bindings, plus an Affinity platform Test key and a session secret. Affinity operators supply these through Doppler and start the local Worker with:

```sh
bun install --frozen-lockfile
doppler run --project affinity --config stg -- bun run dev
```

The Worker listens on [localhost:1337](http://localhost:1337). See [development and deployment](docs/development.md) for the required scopes, local Devbox service, and hosted deployment commands. Platform developers can use the standalone script above without these operator credentials.

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

The website demonstrates one prescription per order. The SDK also supports multi-prescription and OTC orders.

# Affinity EMR demo

A small EMR built with TanStack Start and the [Affinity TypeScript SDK](https://github.com/affinity-health/affinity-typescript).

[Try the demo](https://demo-emr.joinaffinityai.com) · [SDK docs](https://docs.joinaffinityai.com/guides/reference/sdks/typescript/) · [MIT license](LICENSE)

## Try it

Start a private Test workspace. Choose a sample patient and medication, review the
prefilled prescription, then save a draft or sign and send it. Open Orders to follow
its progress.

No account or API key needed in the browser. Everything runs in Test mode:
synthetic patients, simulated pharmacies, nothing filled or shipped.

The settings button lets you choose a Test prescriber by NPI. The default works
across all states. No separate prescriber-registration step is needed.

## Run locally

Requires Bun and the credentials listed in the [development guide](docs/development.md#deploy).
Alchemy supplies the local Worker, D1 database, and Durable Object bindings.

```sh
bun install --frozen-lockfile
bun run dev
```

The local Worker runs at [localhost:1337](http://localhost:1337).
For Affinity's protected Devbox setup and deployment commands, see the
[development guide](docs/development.md).

```sh
bun run check
bun test
bun run build
```

## Find your way around

```text
src/
├── routes/
│   └── _workspace/     # /prescribe, /orders, /orders/:orderId
├── api/                # Server functions, queries, and input schemas
│   ├── auth/
│   ├── workspace/
│   ├── prescribing/
│   └── orders/
├── features/           # Workspace, prescribing, and orders UI
├── components/         # Shared controls
├── server/             # Auth, authorization, and server-side SDK helpers
├── data/               # Synthetic patients
└── lib/                # Small shared utilities
```

Routes own navigation. Features own UI. Server functions call the SDK with the
current session's practice. API keys never reach the browser.

Better Auth stores anonymous sessions in D1. Each session gets one private Test
practice and lasts 12 hours. Signing uses the exact prescription versions reviewed;
submission can be retried without signing again.

This example handles one prescription per order. The SDK also supports
multi-prescription and OTC orders; those editors are not included here.

For a standalone SDK script, start with [example.ts](example.ts).

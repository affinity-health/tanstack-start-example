# TanStack Start + Elysia

A deliberately small full-stack starter:

- TanStack Start for routing, SSR, and server functions
- Elysia for the HTTP API
- Better Auth for email/password authentication
- Cloudflare D1 for auth storage
- Elysia OpenAPI for generated API documentation
- Alchemy v2 for Cloudflare Workers infrastructure and deployment

There is one app, one dependency graph, and one `src/` tree.

## Run it

```bash
bun install
bun run dev
```

Alchemy authenticates with Cloudflare on first use, provisions the D1 database, applies SQL
migrations, and starts the app at `http://localhost:3000`. Local development uses the real managed
D1 binding.

## HTTP surface

| Method     | URL                     | Purpose                       |
| ---------- | ----------------------- | ----------------------------- |
| `GET`      | `/api/health`           | Health check                  |
| `POST`     | `/api/webhooks/:source` | Receive a webhook event       |
| `GET`      | `/api/openapi`          | Interactive OpenAPI reference |
| `GET`      | `/api/openapi/json`     | Raw OpenAPI document          |
| `GET/POST` | `/api/auth/*`           | Better Auth handler           |

Example webhook:

```bash
curl -i http://localhost:3000/api/webhooks/example \
  -H 'content-type: application/json' \
  -H 'x-webhook-id: evt_123' \
  -d '{"type":"thing.created","data":{"id":"thing_123"}}'
```

The starter validates and acknowledges webhook payloads with `202 Accepted`. Put
provider-specific signature verification and durable queueing in the handler before using it in
production.

## Commands

```bash
bun run dev          # migrate auth DB and start development
bun run check        # lint, format check, and typecheck
bun run build        # production build
bun run deploy       # deploy the Worker and D1 database
bun run destroy      # remove the managed stack
```

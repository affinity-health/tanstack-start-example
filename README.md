# Affinity prescribing demo

A small React website and Bun API for trying the [Affinity TypeScript SDK](https://docs.joinaffinityai.com/guides/reference/sdks/typescript/).
It uses `@affinity-health/sdk` **1.9.0-beta.4**, the `next` release from
[affinity-typescript](https://github.com/affinity-health/affinity-typescript). The stable 1.8.0 release does not include prescribing defaults or previews.

## Run

```sh
bun install
cp .env.example .env # Skip if .env already exists.
# Set AFFINITY_API_KEY to a current sk_test_ key.
bun run dev
```

Open http://localhost:3001.

1. Connect to Affinity and select a Test practice.
2. Select a synthetic patient from the demo EMR and click **Create or reuse patient**. A matching `externalId` reuses the existing record without overwriting it.
3. Review and save the patient's allergy status. The demo can confirm no known allergies; it refuses to clear recorded allergies.
4. Select a medication and view its prescribing defaults. Select a preset or enter explicit directions and days supply. Advanced JSON overrides cover quantities or clinical requirements.
5. Preview the prescription. Review the resolved directions, shipping, estimated prices, and any missing fields. Incomplete previews cannot become drafts.
6. Register or reuse a prescriber with an Affinity Test NPI. The demo uses a stable external ID and synthetic `.test` email based on the NPI.
7. Create the draft, review the complete order, and explicitly attest before signing its exact prescription versions.

Signing does **not** submit the order to a pharmacy. An NPI identifies the prescriber; signing uses
the registered user ID and matching actor external ID. Affinity enforces practice access and prescribing authority.
Use a Test NPI issued for your Affinity Test setup, with authority for the selected patient's state.

The Test key needs permissions for practices, catalog, patients, team, order creation/read, and `orders:sign`.
A 401 means the key is missing or invalid; a 403 may indicate missing scopes or access.
API errors and the last response are shown on the page.

## Standalone TypeScript

```sh
bun run example
```

Edit [example.ts](./example.ts). It checks Test access and lists practices and medications.
Set `AFFINITY_PRACTICE_ID` and `AFFINITY_MEDICATION_ID` in `.env` to also create/reuse the synthetic
California patient, read defaults, and preview a prescription. It never creates an order or signs automatically.
The script needs no running website.

## Code

- `example.ts`: standalone SDK calls.
- `src/patients.ts`: two editable synthetic EMR records.
- `src/affinity.ts`: server-side SDK configuration.
- `src/workflow.ts`: create-or-reuse patient and shared SDK types.
- `src/api.ts`: website API; all Affinity requests use the SDK.
- `src/app.tsx`: patient → medication → preview → sign.
- `server.ts`: Bun serves the website and API on one port.

## Local API

| Method | Endpoint                                       | Purpose                                   |
| ------ | ---------------------------------------------- | ----------------------------------------- |
| GET    | `/api/health`                                  | Local health check                        |
| GET    | `/api/practices`                               | First 100 accessible practices            |
| GET    | `/api/catalog`                                 | First 100 catalog medications             |
| GET    | `/api/options?practiceId=...&medicationId=...` | Prescribing defaults                      |
| POST   | `/api/patient`                                 | Create or reuse by EMR external ID        |
| POST   | `/api/allergies`                               | Explicit no-known-allergies review        |
| POST   | `/api/prescriber`                              | Register or reuse a Test prescriber       |
| POST   | `/api/preview`                                 | Resolve defaults and validate input       |
| POST   | `/api/orders`                                  | Create a draft and retrieve it for review |
| POST   | `/api/sign`                                    | Sign the explicitly reviewed versions     |

POST requests use `Idempotency-Key`. The website reuses keys for identical requests within the
current page session, so an uncertain response can be retried. Reloading clears this local state;
inspect Affinity before recreating an order after a reload. Preview itself creates no persistent order.

This is a local, unauthenticated Test playground. It binds to loopback, rejects non-local API hosts
and cross-origin writes, and keeps API keys out of browser code. Do not expose it through a tunnel.
The mock dashboard, messages, scheduling, auth/database, Stripe billing, and Cloudflare deployment
configuration were removed. Existing hosted resources and local environment files were not changed.

## Checks

```sh
bun run check   # Tests, lint, formatting, TypeScript
bun run build   # Bundle the website and server into dist/
bun run start   # Run without development mode
```

Set `PORT` to change port 3001. No database or Cloudflare account is required.

## Verification notes

Verified against the Affinity Test API on September 18, 2026: standalone script, patient creation and
reuse, prescribing options, incomplete and complete previews, explicit allergy review, and draft
creation. Test draft: `ord_7816d73pjs9dhvtajp1fy3209v`.

Prescriber registration currently returns `400 idempotency_key_required` even though SDK 1.9.0-beta.4
sends the header. Reproduced directly through the SDK, outside this app; request ID
`723f3294-b565-488e-bc83-9973a6d64df6`. Signing is implemented and tested locally, but live Test signing
remains unverified until registration succeeds. No order was signed or submitted during verification.

If signing returns a version conflict, use **Refresh order for review**, inspect the updated order,
and attest again. Refreshing never carries forward a previous attestation.

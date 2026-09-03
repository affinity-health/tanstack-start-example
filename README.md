# Northstar demo telehealth platform

Northstar is a small example telehealth clinic you can copy. The signed in app centers on one task: search a synthetic medication marketplace, open a product, add it to a named patient cart, and review the cart as a clinician.

Affinity Test is the backend for carts and Test orders. Northstar never uses Affinity Live or real patient data. Optional WebMCP wiring lets a compatible browser agent work in the same marketplace and cart. The agent cannot confirm checkout, create an order, prescribe, sign, or enter a PIN.

## Enter the clinic

Open `/login` and choose **Use demo clinician**. Northstar signs in the shared synthetic clinician, creating the account on first use. You can also create an account at `/signup`.

After sign in:

- **Marketplace** searches a small synthetic catalog and opens product details.
- **Cart** groups products by patient and keeps checkout behind clinician confirmation.
- **Patients** provides the synthetic records used to target a cart.
- **Orders** lists carts that a clinician submitted to Affinity Test.

## Optional WebMCP tools

The authenticated clinic registers four tools through `document.modelContext.registerTool`.

| Tool                              | Visible effect                                 | Boundary                                |
| --------------------------------- | ---------------------------------------------- | --------------------------------------- |
| `search_medication_marketplace`   | Applies the marketplace query and category     | Reads the synthetic catalog only        |
| `open_marketplace_product`        | Opens the product detail sheet                 | Does not add or order anything          |
| `add_marketplace_product_to_cart` | Adds one product for a named synthetic patient | Cannot confirm checkout                 |
| `inspect_patient_cart`            | Opens and returns the named patient's cart     | Cannot create, sign, or submit an order |

Try this prompt after signing in:

```text
Search the marketplace for semaglutide, open the result, and add it to Ada Zieme's cart. Do not check out.
```

Every tool updates the same React state used by the clinician UI. See [SAFETY.md](SAFETY.md).

## Run Northstar

```bash
bun install
dev up --cwd .
```

The `dev` CLI starts Alchemy on `http://127.0.0.1:3001` and provisions the development D1 database. Better Auth powers normal accounts and the demo clinician.

For the hosted Test integration, create `.env` with Test credentials:

```bash
AFFINITY_API_KEY=sk_test_...
AFFINITY_WEBHOOK_SECRET=whsec_...
AFFINITY_PROVIDER_MAPPING_ID=pmap_...
AFFINITY_DEMO_PATIENT_STATE=CA
```

Keep keys and webhook secrets on the server. Never use an Affinity Live key in Northstar.

## Verify

```bash
bun install --frozen-lockfile
bun run check
bun run build
```

The repository includes `webmcp-evals.json` for Chrome's experimental WebMCP evaluator.

```bash
npx webmcp-evals smoke -u http://localhost:3001 -e webmcp-evals.json -v
```

## Deploy the challenge stage

Deploy only the isolated Alchemy v2 challenge stage with Affinity Test credentials.

```bash
APP_URL=https://your-challenge-worker.workers.dev \
AFFINITY_API_KEY=sk_test_... \
AFFINITY_WEBHOOK_SECRET=whsec_... \
AFFINITY_PROVIDER_MAPPING_ID=pmap_... \
bun run deploy:challenge
```

## Challenge provenance

Commit `f55eedef7c8833f15dad335c23ba8f29bb521835`, dated August 5, 2026, is the prechallenge baseline. Challenge work begins with commit `cc63826`, dated September 2, 2026, on branch `webmcp-challenge`.

See [CHALLENGE.md](CHALLENGE.md), [DEMO-SCRIPT.md](DEMO-SCRIPT.md), and [SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md).

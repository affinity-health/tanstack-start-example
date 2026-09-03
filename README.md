# Northstar demo telehealth platform

Northstar is a small example telehealth clinic you can copy. It has a clinician dashboard, schedule,
patient charts, medication orders, documents, and secure message examples. All records are synthetic.

Affinity Test is the prescribing backend for the unsigned medication order workflow. Northstar never
uses Affinity Live or real patient data. Optional WebMCP wiring lets a compatible browser agent
prepare work inside the authenticated clinic. The agent cannot diagnose, confirm an order, prescribe,
or enter a signing PIN.

## Enter the clinic

Open `/login` and choose **Use demo clinician**. Northstar signs in the shared synthetic clinician,
creating that demo account on first use. You can also create a separate account at `/signup`.

After sign in:

- **Overview** shows the day's schedule, work that needs attention, and recent medication orders.
- **Schedule** switches between clinic days and links each appointment to its patient chart.
- **Patients** searches synthetic records and shows medications, allergies, and recent visits.
- **Medication orders** shows the order queue, order detail, and the guarded unsigned review.
- **Documents** supports search, category filters, preview, and local review state.
- **Messages** supports thread search and local demo replies.

## Optional WebMCP tools

Open **Patients** in a browser with WebMCP enabled for the three patient tools. Prepared context
continues into **Medication orders**, where two more tools inspect Affinity Test options and fill the
visible unsigned draft.

| Tool                              | Visible effect                                               | Safety boundary                                 |
| --------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| `search_synthetic_patients`       | Applies query and eligibility filters                        | Returns only local synthetic directory fields   |
| `open_synthetic_patient`          | Selects the matching patient chart                           | Requires an exact synthetic name or ID          |
| `prepare_medication_review`       | Opens the Northstar medication review for that patient       | Never creates, signs, or submits a prescription |
| `inspect_affinity_test_options`   | Lists options already visible in the authenticated Test form | Omits hosted resource IDs from its result       |
| `prepare_test_prescription_draft` | Fills the visible form from clinician supplied details       | Cannot satisfy the clinician confirmation gate  |

The public source calls `document.modelContext.registerTool` directly. The tools and React screens
share the workflow in `src/lib/patient-workflow.ts`. One adapter reads Northstar's synthetic records.
The other owns the hosted Affinity Test requests and identifiers.

Try this prompt after signing in:

```text
Prepare Ada Zieme's medication review. Do not create an order.
```

Agent changes appear in the clinic and are announced through an ARIA live region. Editing a draft
clears the clinician confirmation. The create action remains disabled until the clinician reviews the
current values and checks the confirmation control. See [SAFETY.md](SAFETY.md).

## Run Northstar

Install dependencies and start the local workspace:

```bash
bun install
dev up --cwd .
```

The `dev` CLI starts Alchemy on `http://127.0.0.1:3001` and provisions the development D1 database.
The normal account flow and the demo clinician both use Better Auth.

For the hosted prescribing adapter, create `.env` with Affinity Test credentials:

```bash
AFFINITY_API_KEY=sk_test_...
AFFINITY_WEBHOOK_SECRET=whsec_...
AFFINITY_PROVIDER_MAPPING_ID=pmap_...
AFFINITY_DEMO_PATIENT_STATE=CA
```

`AFFINITY_PROVIDER_MAPPING_ID` identifies the verified Test provider used by this small example.
Keep API keys and webhook secrets on the server. Never use an Affinity Live key in Northstar.

The integration uses:

- `@affinity-health/sdk` for trusted server requests
- `@affinity-health/elements` for the supported embedded component module
- origin bound hosted sessions for provider signing
- signed webhooks stored idempotently in Cloudflare D1

The active medication order page uses Northstar's own review form and calls Affinity Test through
`src/lib/patient-workflow.ts`. Older integration modules remain isolated under
`src/features/affinity/` for people who want to adapt them, but they are not presented as clinic modes.

## Verify

```bash
bun install --frozen-lockfile
bun run check
bun run build
```

The repository also includes `webmcp-evals.json` for Chrome's experimental WebMCP evaluator. With
Northstar running on port 3001, execute the smoke suite:

```bash
npx webmcp-evals smoke -u http://localhost:3001 -e webmcp-evals.json -v
```

## Deploy the challenge stage

Deploy only the isolated challenge stage with hosted Affinity Test credentials. The generated Worker
URL becomes `APP_URL` so Better Auth callbacks stay on the same origin.

```bash
APP_URL=https://your-challenge-worker.workers.dev \
AFFINITY_API_KEY=sk_test_... \
AFFINITY_WEBHOOK_SECRET=whsec_... \
AFFINITY_PROVIDER_MAPPING_ID=pmap_... \
bun run deploy:challenge
```

## Challenge provenance

Commit `f55eedef7c8833f15dad335c23ba8f29bb521835`, dated August 5, 2026, is the prechallenge baseline.
It already contained the first Northstar workspace, authentication, Affinity SDK modules, webhook
verification, and Alchemy v2 infrastructure.

Challenge work begins with commit `cc63826`, dated September 2, 2026, on branch
`webmcp-challenge`. Its diff from the baseline isolates the WebMCP workflow, safety rules, tests,
license, clinic product work, and submission material added after the challenge opened.

See [CHALLENGE.md](CHALLENGE.md), [DEMO-SCRIPT.md](DEMO-SCRIPT.md), and
[SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md) for the submission record.

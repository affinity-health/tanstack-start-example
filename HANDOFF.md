# EMR integration handoff

Demo: https://affinity-prescribing-demo.harborrun.workers.dev/

This deployment calls development Affinity at https://affinity.harbr.run/api/v1.
The Test/Live selector chooses the API key and data environment on that server.
Live here does not mean the production Affinity server. Use synthetic records only.
Fulfillment is performed by the Affinity simulator.

## What was verified

On September 19, 2026, the deployed Worker completed patient resolution, explicit allergy review,
prescriber registration, catalog/defaults lookup, preview, draft creation, headless signing,
submission, and simulated delivery with tracking.

Delivered order: `ord_6mfr7yk9j58x7rjjvwrdsygn7t`.
Practice: `prac_4bbc5cfhc98ecbcsg6jetzbejd`.

The signed webhook receiver accepted creation, signing, submission, acceptance, processing,
shipping, and delivery events. An event replay replaced the same receipt. Invalid signatures
were rejected. Automated tests cover tampering, stale signatures, wrong account/mode, and storage failure.

The Affinity API acceptance suite additionally exercises external patient references, address
creation/deduplication/pagination/edit/archive, patient deletion, draft cancellation, signing
scope and actor checks, stale prescription versions, mode isolation, and conflicting idempotency keys.
These are development results, not pharmacy certification or production clinical approval.

## Try it

Start in **Test** for a repeatable integration trial. Unlock with the separately supplied PIN,
choose Ellis Clinic and Sam Example (TX), then set the TX prescriber in Settings to the existing
synthetic identity:

- Name: Dawson CA
- NPI: 1234567893

The name is the registered fixture name even when prescribing for the TX sample patient. Recheck
the identity confirmation after editing settings and save. Select Enclomiphene, review the
prescription, and confirm the review before signing and sending. Do not substitute a real NPI or
rename this shared fixture; registration rejects a conflicting identity. Test registration supplies
the synthetic email automatically. No license fields are required.

After the SDK 1.9.2 deployment, this hosted Test flow created, signed, submitted, and delivered
order `ord_19p0a23p2f962t4yrhy11fnedc` with simulator tracking. Use Orders to inspect it.

To inspect the earlier development Live example, choose Live and the practice above. Preparing
another Live example uses the TX sample patient and this synthetic clinician:

- Name: Synthetic Demo Prescriber
- NPI: 1999999968
- Email: demo-http-clinician@example.test
- Phone: +12025550198
- Address: 100 Synthetic Way, Austin, TX 78701
- License details: optional; leave blank to exercise headless signing without license records.

Select Enclomiphene, review the resolved prescription, and explicitly confirm the patient and
prescription review. These values are test fixtures, not a clinician's verified credentials.

The development TX jurisdiction policy is normally draft. For the acceptance run an operator
temporarily installed a synthetic policy fixture and restored the original row afterward.
Consequently **a new Live signature currently fails the jurisdiction approval check**.
An operator must supply an isolated development policy fixture before repeating Live signing.
Do not approve a real jurisdiction or bypass signing checks to make a demo pass.
Test mode remains available for ordinary integration work.

The dedicated deployed demo keys expire September 26, 2026. Replace them with appropriately scoped
development keys and redeploy before that date. The personal Devbox key is an encrypted Worker
secret and is preserved by deploy when not explicitly supplied.

## Build the actual EMR integration

1. Authenticate clinicians in your EMR. Resolve their current practice membership and external
   actor identity on the backend. Never trust a browser-supplied prescriber identity without that check.
2. Keep platform keys on the backend. Use stable external patient, clinician, order, and prescription
   references. Resolve the patient in the intended practice and mode.
3. Save an unsigned draft. Show the exact persisted prescriptions to the clinician.
4. Capture explicit signing intent and send the matching registered actor, attestation, and every
   exact prescription version. Changed prescriptions require another review.
5. Submit the signed order. Persist idempotency keys across retries and process restarts.
   After a confirmed submission rejection, retrieve the order and retry the existing order with
   a new key. A multi-prescription order may already have some fulfillments queued; do not create
   a replacement order. Reuse the original key when the outcome is uncertain or still in progress.
6. Verify raw webhook bytes with the SDK and the endpoint's signing secret. Check owner and mode.
   Use a transactional event inbox before side effects. Reconcile order state through retrieval;
   do not assume events arrive once or in order.

The shared demo PIN and browser prescriber settings are demonstration controls. They are not
individual clinician authentication. Replace those controls before using this code for real patients.
The demo's allergy action asserts no known allergies; an EMR must transmit and review the patient's
actual allergy history instead of applying that assertion to everyone.

Production requires production credentials, platform/practice Live authorization, current
prescriber authority, applicable jurisdiction policy, and eligible pharmacy/product routing.
Affinity has been deployed to staging and production, and SDK 1.9.2 is published. This demo still
calls development Affinity. No real prescription was transmitted during these checks.

The deployed SDK 1.9.2 webhook receiver also passed fresh signature/replay checks: valid repeated
delivery returned 200 with one receipt; altered bodies and stale signatures returned 400; wrong
account and mode returned 403. The receiver is configured for development Live events, so this
Test-mode order does not deliver events to that Live endpoint. Configure a separate Test webhook
endpoint and receiver when testing the telehealth company's own event processing.

## Webhook inspection

After unlocking, open [/api/webhook-events](https://affinity-prescribing-demo.harborrun.workers.dev/api/webhook-events).
Receipts retain only identifiers, event type, mode, and creation time for seven days.
The KV inbox is eventually consistent and performs no clinical or billing actions.

# Affinity EMR demo

A public, Test-only EMR integration demo using the published Affinity TypeScript SDK.
Keep the existing neutral surfaces, blue actions, typography, and Coss prescribing form.

Visitors start an anonymous session and receive one isolated Test practice. No shared
practice directory, Live switch, real patient entry, or login is part of this demo.

The prescribing screen contains the sample patient and medication picker. Load defaults
on selection, resolve the synthetic patient during preview, and show directions, quantity,
shipping, and prices in review. Prefill the Test Prescriber identity. Require explicit
review before signing; supply the synthetic NPI at signing rather than registering a user
in a separate step. Create unsigned drafts, sign exact versions, then submit to simulators.
Keep submission retry separate from signing.

Orders lists the current session's drafts and submitted orders. Session ownership applies
to every server route. Expiry removes access to the workspace, not the Affinity audit history.

The website currently demonstrates one prescription per order. Multi-item and OTC ordering
remain SDK capabilities, not UI features claimed by this demo.

Keep the independent `bun run example` entry point for developers. Infrastructure belongs
to this repository's Alchemy graph, separate from Affinity dashboard deployments.

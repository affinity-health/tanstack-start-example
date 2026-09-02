# Safety contract

This repository is a synthetic-data demonstration. It is not a production clinical system.

## Allowed agent actions

- Search the local synthetic patient directory.
- Change visible filters and select a synthetic patient.
- Navigate to a clinician review screen with non-clinical context preselected.
- Explain what changed and what the clinician must do next.

## Prohibited agent actions

- Diagnose a patient or recommend a medication, dose, route, quantity, or refill count.
- Create, sign, submit, cancel, or transmit a prescription.
- Enter or infer a provider signing PIN.
- Bypass authentication, provider mapping, patient eligibility, or practice authorization.
- Use Affinity Live, real patient data, or a real pharmacy.
- Claim that a prepared screen is a completed clinical action.

## Enforcement

WebMCP tools expose only reversible UI preparation. Their schemas do not accept clinical order
details. Tool handlers validate inputs against the local synthetic records and return errors for
unknown or ineligible patients. The existing authenticated Affinity routes remain the only path to
Test order creation, and the clinician must submit those forms and complete signing inside Affinity.

Every tool-triggered change is visible in the Northstar workspace and announced in an ARIA live
region. A compatible browser agent is optional; the human interface remains complete without it.

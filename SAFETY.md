# Safety contract

This repository is a synthetic-data demonstration. It is not a production clinical system.

## Allowed agent actions

- Search the local synthetic patient directory.
- Change visible filters and select a synthetic patient.
- Navigate to a clinician review screen with non-clinical context preselected.
- Inspect patients and formulations already visible in the authenticated Affinity Test form.
- Fill the visible Test draft with explicitly supplied clinical fields.
- Explain what changed and what the clinician must do next.

## Prohibited agent actions

- Diagnose a patient or recommend a medication, dose, route, quantity, or refill count.
- Create, sign, submit, cancel, or transmit a prescription.
- Enter or infer a provider signing PIN.
- Bypass authentication, provider mapping, patient eligibility, or practice authorization.
- Use Affinity Live, real patient data, or a real pharmacy.
- Claim that a prepared screen is a completed clinical action.

## Enforcement

WebMCP tools expose only reversible UI preparation. Draft fields are accepted only by the
authenticated Test-page tool and copied into the visible form; that tool has no order-creation
callback. Tool handlers validate names against the loaded adapter records and return errors for
unknown or ineligible patients. The confirmation checkbox resets whenever a draft field changes.
The existing authenticated Affinity route remains the only path to Test order creation, and the
clinician must confirm the reviewed form and complete signing inside Affinity.

Every tool-triggered change is visible in the Northstar workspace and announced in an ARIA live
region. A compatible browser agent is optional; the human interface remains complete without it.

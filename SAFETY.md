# Safety contract

This repository is a synthetic data demonstration. It is not a production clinical system.

## Allowed agent actions

- Search Northstar's synthetic medication marketplace.
- Apply visible marketplace filters.
- Open a synthetic product in the visible detail sheet.
- Add a product to a named synthetic patient's cart.
- Open and inspect the visible patient cart.
- Explain what changed and what the clinician must do next.

## Prohibited agent actions

- Diagnose a patient or recommend a medication, strength, dose, route, quantity, or refill count.
- Confirm checkout or create, sign, submit, cancel, or transmit a prescription.
- Enter or infer a provider signing PIN.
- Bypass authentication or practice authorization.
- Use Affinity Live, real patient data, or a real pharmacy.
- Claim that a filled cart is a completed clinical action.

## Enforcement

The four WebMCP tools expose catalog search, product detail, cart addition, and cart inspection. No tool receives the clinician confirmation callback. Tool handlers accept only products and patients from the synthetic data module. Every successful call updates the same React state rendered by Marketplace or Cart.

Northstar creates a Test order only after the clinician reviews the patient and line items, then checks the confirmation control in the cart. Browser agents cannot reach that callback. Affinity Test remains isolated from Live.

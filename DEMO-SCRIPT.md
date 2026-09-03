# Demo script

Target length: 2 minutes 30 seconds. Hard stop: 2 minutes 50 seconds.

## 0:00 to 0:25

Open Northstar and choose **Use demo clinician**. Land on **Medication marketplace**.

Say: "Northstar is a demo telehealth clinic you can copy. The signed in app has a synthetic medication marketplace, patient carts, patients, and Test orders."

## 0:25 to 1:05

Ask the browser agent: "Search the marketplace for semaglutide and open the result."

Show the visible search, product grid, and product sheet. Say: "The tool calls a registered Northstar function. It updates the same interface the clinician uses."

## 1:05 to 1:40

Ask: "Add this product to Ada Zieme's cart, then inspect her cart. Do not check out."

Show the route change, patient name, line item, quantity controls, and unchecked clinician confirmation.

Say: "The agent can fill the cart. It cannot check this box or submit the Test order."

## 1:40 to 2:05

As the clinician, review the patient and product, check the confirmation, and select **Confirm Test checkout**. Open **Orders** and show the new row.

Say: "The human action moved the cart into Affinity Test. The example never uses Live or real patient data."

## 2:05 to 2:30

Show `src/lib/webmcp.ts`, `src/features/webmcp/marketplace-tools.ts`, and the marketplace tool tests.

Say: "The public source uses document.modelContext.registerTool, JSON Schema, and an AbortSignal for cleanup. All four tools stop before checkout."

## Capture checklist

- Use a 1440 by 900 viewport and 125 percent editor zoom.
- Hide tokens, personal tabs, notifications, and terminal history.
- Keep the agent panel and changed clinic UI in the same frame.
- Record one clean take and keep the final video under three minutes.

import { ResponseError } from "@affinity-health/sdk";
import { createAffinity } from "./src/affinity";
import { resolvePatient } from "./src/workflow";

// Edit this file, then run: bun run example. No web server needed.
const affinity = createAffinity();
try {
  const access = await affinity.apiKeys.retrieve();
  if (access.livemode) throw new Error("Use a Test API key.");
  console.log("Access:", JSON.stringify(access, null, 2));
  console.log("Practices:", JSON.stringify(await affinity.practices.list({ limit: 10 }), null, 2));
  console.log("Catalog:", JSON.stringify(await affinity.catalog.list({ limit: 10 }), null, 2));

  // Set both IDs in .env to also create/reuse a synthetic patient and preview a prescription.
  const practiceId = process.env.AFFINITY_PRACTICE_ID;
  const medicationId = process.env.AFFINITY_MEDICATION_ID;
  if (practiceId && medicationId) {
    const { patient, reused } = await resolvePatient(affinity, practiceId, "demo-emr-patient-ca");
    console.log(reused ? "Reused patient:" : "Created patient:", patient.id);
    const options = await affinity.catalog.retrievePrescribingOptions(medicationId, { practiceId });
    console.log("Prescribing options:", JSON.stringify(options, null, 2));
    const preview = await affinity.orders.preview({
      practiceId,
      patientId: patient.id,
      prescriptions: [{ medicationId, preset: "default", expectedRevision: options.revision }],
      shipping: { selection: "lowest_cost" },
    });
    console.log("Preview:", JSON.stringify(preview, null, 2));
    // After reviewing a complete preview, create a draft:
    // if (preview.status === "complete") console.log(await affinity.orders.create(preview.orderInput));
    // The website demonstrates explicit review and signing. This script never signs automatically.
  }
} catch (error) {
  if (error instanceof ResponseError) {
    console.error(`Affinity returned HTTP ${error.response.status}:`, await error.response.text());
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
}

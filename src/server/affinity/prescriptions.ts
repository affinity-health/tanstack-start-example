import type { OrderCreateParams } from "@affinity-health/sdk";
import type { PrescriptionInput } from "../../api/prescribing/schema";
import { patients } from "../../data/patients";
import { isTestNpi, demoNpi } from "../../features/workspace/demo-profile";

export function buildOrderInput(
  practiceId: string,
  input: PrescriptionInput,
  npi: string,
): OrderCreateParams {
  const patient = patients.find((patient) => patient.externalId === input.externalId);
  if (!patient) throw new Error("Choose a patient from the demo EMR.");
  if (!isTestNpi(npi)) throw new Error("Choose a supported Test NPI.");
  return {
    practiceId,
    patient: { ...patient, allergies: [] }, // Only sent after the explicit no-known-allergies attestation.
    prescriber: {
      npi,
      firstName: npi === demoNpi ? "Test" : "Riley",
      lastName: npi === demoNpi ? "Prescriber" : "Five-State Test",
    },
    prescriptions: [
      {
        medicationId: input.medicationId,
        directions: input.directions,
        quantity: input.quantity,
        refills: input.refills,
        ...(input.compoundingReason ? { compoundingReason: input.compoundingReason } : {}),
      },
    ],
    shippingOptionId: input.shippingOptionId,
    signatureAttestation: true,
  };
}

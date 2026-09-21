import type { PreviewOrderParams } from "@affinity-health/sdk";
import type { WorkspaceContext } from "../context";
import type { PrescriptionInput } from "../../api/prescribing/schema";
import { resolvePatient } from "./patients";

export async function previewPrescription(context: WorkspaceContext, input: PrescriptionInput) {
  const { affinity, practiceId, id } = context;
  const { patient } = await resolvePatient(
    affinity,
    practiceId,
    input.externalId,
    `${id}:patient:${input.externalId}`,
  );
  const options = await affinity.catalog.retrievePrescribingOptions(input.medicationId, {
    practiceId,
  });
  if (options.revision !== input.expectedRevision)
    throw new Error(
      "Prescribing defaults changed. Select the medication again and review the updated defaults.",
    );
  const requirements = options.catalog.prescriptionRequirements;
  const categories = requirements?.allowedReasonCategories ?? [];
  const category = categories.find((value) => value === input.category);
  if (input.category && !category)
    throw new Error("Choose an allowed compounding reason category.");
  const reasonRequired =
    requirements?.compoundingReason === "required" ||
    requirements?.compoundingReasonContext === "required";
  const body: PreviewOrderParams = {
    practiceId,
    patientId: patient.id,
    prescriptions: [
      {
        medicationId: input.medicationId,
        preset: "default",
        expectedRevision: input.expectedRevision,
        overrides: {
          ...(input.directions !== undefined
            ? { sig: { format: "free_text", text: input.directions } }
            : {}),
          ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
          ...(input.daysSupply !== undefined ? { daysSupply: input.daysSupply } : {}),
          ...(input.refills !== undefined ? { refills: input.refills } : {}),
          ...(input.shippingOptionId
            ? { dispensing: { shippingOptionId: input.shippingOptionId } }
            : {}),
          ...(reasonRequired
            ? {
                clinical: {
                  compoundingReason: { context: input.reason, ...(category ? { category } : {}) },
                },
              }
            : {}),
        },
      },
    ],
    shipping: { selection: "lowest_cost" },
  };
  return affinity.orders.preview(body);
}

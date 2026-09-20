import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withWorkspace } from "../../server/context";
import { previewPrescription } from "../../server/affinity/prescriptions";
import { prescriptionInput } from "./schema";

export const getCatalog = createServerFn({ method: "GET" })
  .validator(
    z.object({ query: z.string().max(200).default(""), cursor: z.string().max(200).optional() }),
  )
  .handler(({ data }) =>
    withWorkspace(({ affinity, practiceId }) =>
      affinity.catalog.list({
        practiceId,
        query: data.query || undefined,
        startingAfter: data.cursor,
        limit: 25,
      }),
    ),
  );
export const getPrescribingOptions = createServerFn({ method: "GET" })
  .validator(z.object({ medicationId: z.string().startsWith("cat_").max(100) }))
  .handler(({ data }) =>
    withWorkspace(({ affinity, practiceId }) =>
      affinity.catalog.retrievePrescribingOptions(data.medicationId, { practiceId }),
    ),
  );
export const previewOrder = createServerFn({ method: "POST" })
  .validator(prescriptionInput)
  .handler(({ data }) => withWorkspace((context) => previewPrescription(context, data)));
export const createDraft = createServerFn({ method: "POST" })
  .validator(
    z.object({
      prescription: prescriptionInput,
      key: z.string().uuid(),
      allergiesReviewed: z.literal(true),
    }),
  )
  .handler(({ data }) =>
    withWorkspace(async (context) => {
      if (!(await context.store.quota("orders:" + context.id, 30, 86400)))
        throw new Error("This Test session has reached its order limit.");
      const preview = await previewPrescription(context, data.prescription);
      if (preview.status !== "complete")
        throw new Error("Complete the prescription before creating a draft.");
      const patientId =
        "patientId" in preview.orderInput ? preview.orderInput.patientId : undefined;
      if (!patientId) throw new Error("Patient is missing.");
      const allergies = await context.affinity.patients.retrieveAllergies(
        context.practiceId,
        patientId,
      );
      if (allergies.allergies.length)
        throw new Error("This patient has recorded allergies. This demo will not clear them.");
      await context.affinity.patients.replaceAllergies(
        context.practiceId,
        patientId,
        { reviewStatus: "no_known", allergies: [] },
        { idempotencyKey: `${context.id}:${data.key}:allergies` },
      );
      const created = await context.affinity.orders.create(preview.orderInput, {
        idempotencyKey: `${context.id}:${data.key}`,
      });
      return context.affinity.orders.retrieve(created.id);
    }),
  );

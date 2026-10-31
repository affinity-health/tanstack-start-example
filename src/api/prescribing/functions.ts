import { AffinityError, type Affinity } from "@affinity-health/sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { problemDetail, withWorkspace } from "../../server/context";
import { prescriptionInput } from "./schema";
import { buildOrderInput } from "../../server/affinity/prescriptions";
import { isTestNpi } from "../../features/workspace/demo-profile";

// The API lists the whole catalog with no search, so the picker filters it in the browser.
export const getCatalog = createServerFn({ method: "GET" }).handler(() =>
  withWorkspace(async ({ affinity }) => {
    const medications: Affinity.Medication[] = [];
    for await (const medication of await affinity.medications.list({ limit: 100 }))
      medications.push(medication);
    return medications;
  }),
);
export const getPrescribingOptions = createServerFn({ method: "GET" })
  .validator(z.object({ medicationId: prescriptionInput.shape.medicationId }))
  .handler(({ data }) =>
    withWorkspace(({ affinity }) => affinity.medications.get({ medicationId: data.medicationId })),
  );
export const createOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      prescription: prescriptionInput,
      key: z.string().uuid(),
      npi: z.string().refine(isTestNpi, "Choose a supported Test NPI."),
      attested: z.literal(true),
    }),
  )
  .handler(({ data }) =>
    withWorkspace(async (context) => {
      if (!(await context.store.quota("orders:" + context.id, 30, 86400)))
        throw new Error("This Test session has reached its order limit.");
      const body = buildOrderInput(context.practiceId, data.prescription, data.npi);
      try {
        const order = await context.affinity.orders.create({
          ...body,
          idempotencyKey: `${context.id}:${data.key}`,
        });
        return { ok: true as const, order };
      } catch (error) {
        // Only definitive refusals let the user edit. An uncertain write retains its body and key.
        if (
          error instanceof AffinityError &&
          [400, 401, 403, 404, 422].includes(error.statusCode ?? 0)
        )
          return {
            ok: false as const,
            message: `${problemDetail(error) ?? "The order was rejected."}${error.requestId ? ` (request ${error.requestId})` : ""}`,
          };
        throw error;
      }
    }),
  );

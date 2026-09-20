import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { withWorkspace, ownedOrder } from "../../server/context";
import { listDrafts } from "../../server/affinity/orders";
import { isTestNpi } from "../../features/workspace/demo-profile";
import { AffinityError } from "@affinity-health/sdk";
const orderId = z.string().startsWith("ord_").max(100);
export const getOrders = createServerFn({ method: "GET" })
  .validator(
    z.object({
      filter: z.enum(["all", "draft"]).default("all"),
      cursor: z.string().max(1000).optional(),
    }),
  )
  .handler(({ data }) =>
    withWorkspace(async ({ affinity, practiceId }) =>
      data.filter === "draft"
        ? listDrafts(affinity, practiceId, data.cursor)
        : {
            ...(await affinity.orders.list({
              practiceId,
              startingAfter: data.cursor,
              limit: 25,
              sort: "newest",
            })),
            nextCursor: undefined,
          },
    ),
  );
export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId }))
  .handler(({ data }) => withWorkspace((context) => ownedOrder(context, data.orderId)));
export const signOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId,
      key: z.string().uuid(),
      npi: z.string().refine(isTestNpi, "Choose a supported Test NPI."),
      attested: z.literal(true),
      expectedVersions: z
        .array(
          z.object({
            prescriptionId: z.string().min(1).max(100),
            version: z.number().int().positive(),
          }),
        )
        .min(1)
        .max(20),
    }),
  )
  .handler(({ data }) =>
    withWorkspace(async (context) => {
      const order = await ownedOrder(context, data.orderId);
      const allergies = await context.affinity.patients.retrieveAllergies(
        context.practiceId,
        order.patientId,
      );
      if (allergies.allergies.length)
        throw new Error("This patient has recorded allergies. This demo will not clear them.");
      await context.affinity.patients.replaceAllergies(
        context.practiceId,
        order.patientId,
        { reviewStatus: "no_known", allergies: [] },
        { idempotencyKey: `${context.id}:${data.key}:allergies` },
      );
      return context.affinity.orders.sign(
        data.orderId,
        {
          practiceId: context.practiceId,
          prescriber: { npi: data.npi },
          signatureAttestation: true,
          expectedVersions: data.expectedVersions,
        },
        { idempotencyKey: `${context.id}:${data.key}` },
      );
    }),
  );
export const submitOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderId, key: z.string().uuid() }))
  .handler(({ data }) =>
    withWorkspace(async (context) => {
      await ownedOrder(context, data.orderId);
      try {
        await context.affinity.orders.submit(
          data.orderId,
          { practiceId: context.practiceId },
          { idempotencyKey: `${context.id}:${data.key}` },
        );
        return { ok: true as const };
      } catch (error) {
        if (
          error instanceof AffinityError &&
          error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          !String(error.code).startsWith("idempotency_")
        )
          return { ok: false as const, message: error.message };
        throw error;
      }
    }),
  );

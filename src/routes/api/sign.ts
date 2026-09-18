import type { SignOrderParams } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/sign")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<
          SignOrderParams & { orderId: string; actorId: string; signatureAttestation: boolean }
        >(request, async ({ affinity, body, options }) => {
          if (
            body.signatureAttestation !== true ||
            typeof body.actorId !== "string" ||
            !body.actorId.trim()
          )
            return json(
              { error: "Review the order and confirm signing as the registered prescriber." },
              400,
            );
          const { orderId, actorId, ...signature } = body;
          return json(
            await affinity
              .withActor({ type: "user", id: actorId })
              .orders.sign(orderId, signature, options),
          );
        }),
    },
  },
});

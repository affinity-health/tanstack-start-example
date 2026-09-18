import type { SubmitOrderParams } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/submit")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<SubmitOrderParams & { orderId: string; actorId: string }>(
          request,
          async ({ affinity, body, options }) => {
            const { orderId, actorId, ...submission } = body;
            if (!orderId || typeof actorId !== "string" || !actorId.trim())
              return json({ error: "A signed order and registered prescriber are required." }, 400);
            return json(
              await affinity
                .withActor({ type: "user", id: actorId })
                .orders.submit(orderId, submission, options),
            );
          },
        ),
    },
  },
});

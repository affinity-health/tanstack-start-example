import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/submit")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<{ orderId: string; practiceId: string }>(
          request,
          async ({ affinity, body, options, practiceId }) =>
            json(await affinity.orders.submit(body.orderId, { practiceId }, options)),
        ),
    },
  },
});

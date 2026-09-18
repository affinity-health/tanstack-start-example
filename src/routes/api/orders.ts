import type { CreateOrderParams } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<CreateOrderParams>(request, async ({ affinity, body, options }) => {
          const created = await affinity.orders.create(body, options);
          return json(await affinity.orders.retrieve(created.id));
        }),
    },
  },
});

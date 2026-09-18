import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/order")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(request, async ({ affinity, body }) => {
          const order = await affinity.orders.retrieve(body.orderId);
          if (order.practiceId !== body.practiceId)
            return json({ error: "Order belongs to another practice." }, 400);
          return json(order);
        }),
    },
  },
});

import type { CreateOrderParams } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { listDrafts } from "../../server/affinity/orders";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(request, async ({ affinity, body }) => {
          if (body.status && body.status !== "draft")
            return json({ error: "Unknown order filter." }, 400);
          if (body.status === "draft")
            return json(await listDrafts(affinity, body.practiceId, body.startingAfter));
          return json(
            await affinity.orders.list({
              practiceId: body.practiceId,
              startingAfter: body.startingAfter || undefined,
              limit: 25,
              sort: "newest",
            }),
          );
        }),
      POST: ({ request }) =>
        apiHandler<CreateOrderParams>(request, async ({ affinity, body, options }) => {
          const created = await affinity.orders.create(body, options);
          return json(await affinity.orders.retrieve(created.id));
        }),
    },
  },
});

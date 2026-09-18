import type { PreviewOrderParams } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/preview")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<PreviewOrderParams>(request, async ({ affinity, body }) => {
          return json(await affinity.orders.preview(body));
        }),
    },
  },
});

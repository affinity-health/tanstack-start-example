import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/options")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(request, async ({ affinity, body }) => {
          return json(
            await affinity.catalog.retrievePrescribingOptions(body.medicationId, {
              practiceId: body.practiceId,
            }),
          );
        }),
    },
  },
});

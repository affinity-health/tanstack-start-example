import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/options")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(request, async ({ affinity, body }) => {
          const start = performance.now();
          const options = await affinity.catalog.retrievePrescribingOptions(body.medicationId, {
            practiceId: body.practiceId,
          });
          const duration = (performance.now() - start).toFixed(1);
          const response = json(options);
          response.headers.set("X-Affinity-Duration-Ms", duration);
          response.headers.set(
            "Server-Timing",
            `affinity;dur=${duration};desc="Affinity prescribing defaults request"`,
          );
          return response;
        }),
    },
  },
});

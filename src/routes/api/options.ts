import { withMedicationImages } from "../../server/affinity/images";
import { ResponseError } from "@affinity-health/sdk";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/options")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(request, async ({ affinity, body }) => {
          const start = performance.now();
          const options = await affinity.catalog
            .retrievePrescribingOptions(body.medicationId, {
              practiceId: body.practiceId,
            })
            .catch((error) => {
              if (error instanceof ResponseError && error.response.status === 404) return null;
              throw error;
            });
          if (!options)
            return json(
              {
                error:
                  "Prescribing defaults are unavailable for this item. Choose another prescription medication.",
              },
              404,
            );
          const duration = (performance.now() - start).toFixed(1);
          const response = json({ ...options, catalog: withMedicationImages(options.catalog) });
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

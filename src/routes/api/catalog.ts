import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(
          request,
          async ({ affinity, body }) => {
            const start = performance.now();
            const catalog = await affinity.catalog.list({
              limit: 25,
              query: body.query?.trim() || undefined,
              practiceId: body.practiceId || undefined,
              startingAfter: body.startingAfter || undefined,
            });
            const response = json(catalog);
            const duration = (performance.now() - start).toFixed(1);
            response.headers.set("X-Affinity-Duration-Ms", duration);
            response.headers.set(
              "Server-Timing",
              `affinity;dur=${duration};desc="Affinity catalog request"`,
            );
            return response;
          },
          { practiceRequired: false },
        ),
    },
  },
});

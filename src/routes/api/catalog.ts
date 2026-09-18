import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
import { listAll } from "../../server/affinity/pagination";
export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(
          request,
          async ({ affinity }) =>
            json(
              await listAll((cursor) =>
                affinity.catalog.list({ limit: 100, startingAfter: cursor }),
              ),
            ),
          { practiceRequired: false },
        ),
    },
  },
});

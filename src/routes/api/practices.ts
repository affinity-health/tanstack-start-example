import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
import { listAll } from "../../server/affinity/pagination";
export const Route = createFileRoute("/api/practices")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(
          request,
          async ({ affinity }) =>
            json(
              await listAll((cursor) =>
                affinity.practices.list({ limit: 100, startingAfter: cursor }),
              ),
            ),
          { practiceRequired: false },
        ),
    },
  },
});

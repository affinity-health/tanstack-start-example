import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(
          request,
          async ({ affinity, body }) =>
            json(
              await affinity.catalog.list({
                limit: 25,
                query: body.query?.trim() || undefined,
                practiceId: body.practiceId || undefined,
                startingAfter: body.startingAfter || undefined,
              }),
            ),
          { practiceRequired: false },
        ),
    },
  },
});

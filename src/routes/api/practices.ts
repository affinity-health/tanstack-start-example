import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/practices")({
  server: {
    handlers: {
      GET: ({ request }) =>
        apiHandler(
          request,
          async ({ affinity, practiceId }) =>
            json({
              object: "list",
              data: [await affinity.practices.retrieve(practiceId)],
              hasMore: false,
            }),
          { practiceRequired: false },
        ),
    },
  },
});

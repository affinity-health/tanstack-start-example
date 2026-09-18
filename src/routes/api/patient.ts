import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
import { resolvePatient } from "../../server/affinity/patients";
export const Route = createFileRoute("/api/patient")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler(request, async ({ affinity, body, key }) => {
          return json(await resolvePatient(affinity, body.practiceId, body.externalId, key));
        }),
    },
  },
});

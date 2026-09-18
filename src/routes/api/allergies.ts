import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/allergies")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<{ practiceId: string; patientId: string; confirmed: boolean }>(
          request,
          async ({ affinity, body, options }) => {
            if (body.confirmed !== true)
              return json({ error: "Confirm the allergy review first." }, 400);
            const current = await affinity.patients.retrieveAllergies(
              body.practiceId,
              body.patientId,
            );
            if (current.allergies.length)
              return json(
                {
                  error:
                    "This patient has recorded allergies. Review them in Affinity; this demo will not clear them.",
                },
                409,
              );
            return json(
              await affinity.patients.replaceAllergies(
                body.practiceId,
                body.patientId,
                { reviewStatus: "no_known", allergies: [] },
                options,
              ),
            );
          },
        ),
    },
  },
});

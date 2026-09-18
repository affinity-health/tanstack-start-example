import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/prescriber")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<{
          practiceId: string;
          npi: string;
          email: string;
          name: string;
          identityAttestation: boolean;
        }>(request, async ({ affinity, body, mode, options }) => {
          if (body.identityAttestation !== true || !/^\d{10}$/.test(body.npi ?? ""))
            return json(
              { error: "Enter a 10-digit NPI and confirm the prescriber identity." },
              400,
            );
          if (
            mode === "production" &&
            (typeof body.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
          )
            return json({ error: "Enter the prescriber's email." }, 400);
          return json(
            await affinity.team.createUser(
              body.practiceId,
              {
                externalId: `demo-emr-prescriber-${body.npi}`,
                email: mode === "production" ? body.email : `prescriber-${body.npi}@example.test`,
                name: body.name,
                role: "prescriber",
                npi: body.npi,
                identityAttestation: true,
              },
              options,
            ),
          );
        }),
    },
  },
});

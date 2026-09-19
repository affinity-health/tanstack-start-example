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
          phone: string;
          address: {
            line1: string;
            city: string;
            state: string;
            postalCode: string;
            country: "US";
          };
          licenses?: Array<{ state: string; licenseNumber: string; expiresAt?: string }>;
          identityAttestation: boolean;
        }>(request, async ({ affinity, body, mode, options }) => {
          if (
            body.identityAttestation !== true ||
            body.npi !== "1234567893" ||
            body.name !== "Test Prescriber"
          )
            return json(
              { error: "Enter a 10-digit NPI and confirm the prescriber identity." },
              400,
            );
          if (
            mode === "production" &&
            (typeof body.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
          )
            return json({ error: "Enter the prescriber's email." }, 400);
          if (
            mode === "production" &&
            (!body.phone?.trim() ||
              !body.address?.line1?.trim() ||
              body.licenses?.some(
                (license) =>
                  !license.licenseNumber?.trim() ||
                  !/^[A-Z]{2}$/.test(license.state) ||
                  (!!license.expiresAt &&
                    !(new Date(license.expiresAt + "T23:59:59Z").getTime() > Date.now())),
              ))
          )
            return json(
              {
                error:
                  "Enter prescriber contact details and check any optional license information.",
              },
              400,
            );
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
                ...(mode === "production"
                  ? {
                      phone: body.phone,
                      address: body.address,
                      licenses: body.licenses?.map((license) => ({
                        ...license,
                        expiresAt: license.expiresAt
                          ? license.expiresAt + "T23:59:59.000Z"
                          : undefined,
                      })),
                    }
                  : {}),
              },
              options,
            ),
          );
        }),
    },
  },
});

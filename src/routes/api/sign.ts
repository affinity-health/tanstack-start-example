import type { SignOrderParams } from "@affinity-health/sdk";
import { isTestNpi } from "../../features/prescribing/demo-profile";
import { createFileRoute } from "@tanstack/react-router";
import { apiHandler, json } from "../../server/api-handler";
export const Route = createFileRoute("/api/sign")({
  server: {
    handlers: {
      POST: ({ request }) =>
        apiHandler<SignOrderParams & { orderId: string; npi: string }>(
          request,
          async ({ affinity, body, options, practiceId }) => {
            if (body.signatureAttestation !== true || !isTestNpi(body.npi))
              return json(
                { error: "Review the order and confirm signing as the Test Prescriber." },
                400,
              );
            return json(
              await affinity.orders.sign(
                body.orderId,
                {
                  practiceId,
                  prescriber: { npi: body.npi },
                  signatureAttestation: true,
                  expectedVersions: body.expectedVersions,
                },
                options,
              ),
            );
          },
        ),
    },
  },
});

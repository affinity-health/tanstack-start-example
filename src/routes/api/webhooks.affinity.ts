import { createFileRoute } from "@tanstack/react-router";
import { receiveWebhook } from "../../server/webhooks";
export const Route = createFileRoute("/api/webhooks/affinity")({
  server: { handlers: { POST: ({ request }) => receiveWebhook(request) } },
});

import { createFileRoute } from "@tanstack/react-router";
import { receiptStore } from "../../server/webhooks";
import { hasSession } from "../../server/auth/session";
export const Route = createFileRoute("/api/webhook-events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await hasSession(request))) return new Response("Unauthorized", { status: 401 });
        const store = receiptStore(request);
        if (!store)
          return Response.json({ error: "Webhook storage is not configured." }, { status: 503 });
        const records = await store.list({ prefix: "event:", limit: 1000 });
        return Response.json(
          {
            data: records.keys
              .flatMap((key) => (key.metadata ? [key.metadata] : []))
              .sort((a, b) => b.created - a.created)
              .slice(0, 50),
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});

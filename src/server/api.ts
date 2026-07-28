import "@tanstack/react-start/server-only";

import { openapi } from "@elysia/openapi";
import { Elysia, t } from "elysia";

const webhookBody = t.Object({
  type: t.String({
    description: "Provider event type",
    examples: ["thing.created"],
    minLength: 1,
  }),
  data: t.Record(t.String(), t.Unknown(), {
    description: "Provider-specific event payload",
  }),
});

const acceptedWebhook = t.Object({
  accepted: t.Literal(true),
  id: t.String(),
  source: t.String(),
  acceptedAt: t.String({ format: "date-time" }),
});

export const api = new Elysia({
  prefix: "/api",
  // Cloudflare Workers do not allow runtime code generation with `new Function`.
  aot: false,
})
  .use(
    openapi({
      documentation: {
        info: {
          title: "Plain Start API",
          version: "1.0.0",
          description: "The small public HTTP surface for this TanStack Start app.",
        },
        tags: [
          { name: "System", description: "Operational endpoints" },
          { name: "Webhooks", description: "Inbound event delivery" },
        ],
      },
    }),
  )
  .get(
    "/health",
    () => ({
      ok: true as const,
      service: "tanstack-start-example",
    }),
    {
      detail: {
        summary: "Check API health",
        tags: ["System"],
      },
      response: t.Object({
        ok: t.Literal(true),
        service: t.String(),
      }),
    },
  )
  .post(
    "/webhooks/:source",
    ({ body, headers, params, status }) => {
      const id = headers["x-webhook-id"] ?? crypto.randomUUID();

      console.info("webhook.accepted", {
        id,
        source: params.source,
        type: body.type,
      });

      return status(202, {
        accepted: true as const,
        id,
        source: params.source,
        acceptedAt: new Date().toISOString(),
      });
    },
    {
      body: webhookBody,
      params: t.Object({
        source: t.String({
          description: "Name of the system sending the event",
          examples: ["example"],
          minLength: 1,
        }),
      }),
      response: {
        202: acceptedWebhook,
      },
      detail: {
        summary: "Accept an inbound webhook",
        description:
          "Validates a generic event envelope and acknowledges it. Add source-specific signature verification before production use.",
        tags: ["Webhooks"],
      },
    },
  );

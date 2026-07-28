import "@tanstack/react-start/server-only";

import { openapi } from "@elysia/openapi";
import { Elysia, t } from "elysia";

const productionOrigin =
  "https://tanstackstartexample-website-ptrck3f2wizqxmzmk4grvhgi4.dawsson.workers.dev";

const scalarTheme = `
  :root {
    --scalar-font: "Avenir Next", Avenir, "Century Gothic", sans-serif;
    --scalar-font-code: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  }

  .light-mode {
    --scalar-color-1: #151512;
    --scalar-color-2: #58534a;
    --scalar-color-3: #7b7469;
    --scalar-color-accent: #c9431a;
    --scalar-background-1: #f3efe5;
    --scalar-background-2: #e6dfd0;
    --scalar-background-3: #d8d0c1;
    --scalar-background-accent: #f05a2814;
    --scalar-border-color: #c9c0af;
    --scalar-color-green: #1f7a4f;
    --scalar-color-red: #b8341a;
    --scalar-color-yellow: #806100;
    --scalar-color-blue: #1f5f86;
    --scalar-color-orange: #c9431a;
    --scalar-color-purple: #6d4e89;
  }

  .dark-mode {
    --scalar-color-1: #f3efe5;
    --scalar-color-2: #c9c0af;
    --scalar-color-3: #8f887c;
    --scalar-color-accent: #d8ff3e;
    --scalar-background-1: #151512;
    --scalar-background-2: #20201c;
    --scalar-background-3: #2b2a25;
    --scalar-background-accent: #d8ff3e12;
    --scalar-border-color: #393831;
  }

  .light-mode .sidebar,
  .light-mode .t-doc__sidebar {
    --scalar-sidebar-background-1: #151512;
    --scalar-sidebar-color-1: #f3efe5;
    --scalar-sidebar-color-2: #aaa398;
    --scalar-sidebar-color-active: #d8ff3e;
    --scalar-sidebar-item-active-background: #d8ff3e14;
    --scalar-sidebar-item-hover-background: #ffffff0f;
    --scalar-sidebar-search-background: #20201c;
    --scalar-sidebar-search-border-color: #393831;
    --scalar-sidebar-search-color: #aaa398;
    --scalar-sidebar-border-color: #393831;
  }

  ::selection {
    color: #151512;
    background: #d8ff3e;
  }
`;

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
      scalar: {
        theme: "saturn",
        layout: "modern",
        customCss: scalarTheme,
        defaultHttpClient: {
          targetKey: "shell",
          clientKey: "curl",
        },
      },
      documentation: {
        info: {
          title: "Plain Start API",
          version: "1.0.0",
          description:
            "A small, typed API for health checks and inbound webhooks. Use the production server to exercise the live Cloudflare Worker, or select local development when running the app with Bun.",
        },
        servers: [
          {
            url: productionOrigin,
            description: "Production — Cloudflare Workers",
          },
          {
            url: "http://localhost:3000",
            description: "Local development",
          },
        ],
        externalDocs: {
          description: "Open the Plain Start app",
          url: productionOrigin,
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
        operationId: "getHealth",
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
        operationId: "acceptWebhook",
        summary: "Accept an inbound webhook",
        description:
          "Validates a generic event envelope and acknowledges it. Add source-specific signature verification before production use.",
        tags: ["Webhooks"],
      },
    },
  );

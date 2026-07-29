import "@tanstack/react-start/server-only";

import {
  Affinity,
  AffinityWebhookVerificationError,
  ResponseError,
  verifyAffinityWebhook,
} from "@affinity-health/sdk";
import { openapi } from "@elysia/openapi";
import { Elysia, t } from "elysia";

import { env } from "../env";
import { createAuth } from "./auth";
import { requestOrigin } from "./request-origin";

const directWorkerOrigin =
  "https://tanstackstartexample-website-ptrck3f2wizqxmzmk4grvhgi4.dawsson.workers.dev";
const productionOrigin = env.APP_URL;
const affinityApiVersion = "2026-07-29";

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

const affinityError = t.Object({
  error: t.String(),
});

const affinityWebhookAccepted = t.Object({
  accepted: t.Literal(true),
  duplicate: t.Boolean(),
  id: t.String(),
});

const componentSessionResponse = t.Object({
  clientSecret: t.String(),
  connectUrl: t.String({ format: "uri" }),
  expiresAt: t.String({ format: "date-time" }),
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
          title: "Affinity Platform Example API",
          version: "1.0.0",
          description:
            "A minimal partner backend that authenticates its own user, creates scoped Affinity component sessions, and verifies Affinity webhooks.",
        },
        servers: [
          {
            url: productionOrigin,
            description: "Configured demo endpoint",
          },
          {
            url: directWorkerOrigin,
            description: "Direct Cloudflare Worker",
          },
          {
            url: "http://localhost:3001",
            description: "Local development",
          },
        ],
        externalDocs: {
          description: "Open the Affinity platform example",
          url: productionOrigin,
        },
        tags: [
          { name: "System", description: "Operational endpoints" },
          { name: "Affinity", description: "Delegated sessions and signed events" },
          { name: "Webhooks", description: "Verified inbound event delivery" },
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
    "/affinity/component-session",
    async ({ request, status }) => {
      const session = await createAuth(request).api.getSession({
        headers: request.headers,
      });
      if (!session) return status(401, { error: "Sign in before opening Affinity." });

      const providerMappingId = env.AFFINITY_PROVIDER_MAPPING_ID.trim();
      if (!providerMappingId) {
        return status(503, {
          error: "Set AFFINITY_PROVIDER_MAPPING_ID to a verified test provider mapping.",
        });
      }

      const affinity = new Affinity(env.AFFINITY_API_KEY, {
        apiVersion: affinityApiVersion,
        baseUrl: env.AFFINITY_API_URL,
      });
      try {
        const access = await affinity.account.retrieveAccess();
        if (access.livemode) {
          return status(409, {
            error: "Use an Affinity test-mode API key for this demo.",
          });
        }

        const mapping = await affinity.providerMappings.retrieve(providerMappingId);
        if (mapping.status !== "verified") {
          return status(409, {
            error: "Complete Affinity provider verification before opening the composer.",
          });
        }

        const componentSession = await affinity.componentSessions.create(
          {
            allowedOrigin: requestOrigin(request, env.APP_URL),
            components: {
              prescriptionComposer: {
                enabled: true,
                features: {
                  changePatient: true,
                  createDraft: true,
                  sign: false,
                  viewHistory: false,
                },
              },
            },
            consent: {
              authorizedProviderAccess: true,
              minimumNecessaryPhi: true,
              recordedAt: new Date(),
            },
            context: {
              patientSelection: "search",
            },
            practiceId: mapping.practiceId,
            providerMappingId: mapping.id,
            userId: mapping.userId,
          },
          { idempotencyKey: `component:${crypto.randomUUID()}` },
        );

        return {
          clientSecret: componentSession.clientSecret,
          connectUrl: env.AFFINITY_CONNECT_URL,
          expiresAt: componentSession.expiresAt.toISOString(),
        };
      } catch (error) {
        return status(502, {
          error: `Affinity could not create the component session (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      detail: {
        description:
          "Authenticates the partner user, resolves its verified Affinity provider mapping, and creates a one-time origin-bound prescription composer session.",
        operationId: "createAffinityComponentSession",
        summary: "Create an Affinity component session",
        tags: ["Affinity"],
      },
      response: {
        200: componentSessionResponse,
        401: affinityError,
        403: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
  )
  .post(
    "/affinity/webhook",
    async ({ body, request, status }) => {
      if (!(body instanceof ArrayBuffer)) {
        return status(400, { error: "Affinity webhook body is unavailable." });
      }
      const rawBody = new Uint8Array(body);
      let event;
      try {
        event = await verifyAffinityWebhook({
          body: rawBody,
          secret: env.AFFINITY_WEBHOOK_SECRET,
          signature: request.headers.get("affinity-signature"),
        });
      } catch (error) {
        if (error instanceof AffinityWebhookVerificationError) {
          return status(400, { error: error.message });
        }
        throw error;
      }

      const payload = new TextDecoder().decode(rawBody);
      const result = await env.DB.prepare(
        `INSERT OR IGNORE INTO affinity_webhook_event
          (id, type, apiVersion, livemode, payload, receivedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          event.id,
          event.type,
          event.api_version,
          event.livemode ? 1 : 0,
          payload,
          new Date().toISOString(),
        )
        .run();
      const duplicate = result.meta.changes === 0;

      console.info("affinity.webhook.accepted", {
        duplicate,
        id: event.id,
        livemode: event.livemode,
        type: event.type,
      });
      return { accepted: true as const, duplicate, id: event.id };
    },
    {
      detail: {
        description:
          "Verifies the Affinity HMAC signature against the exact request bytes and stores the event idempotently in D1.",
        operationId: "acceptAffinityWebhook",
        summary: "Accept an Affinity webhook",
        tags: ["Affinity", "Webhooks"],
      },
      parse: "arrayBuffer",
      response: {
        200: affinityWebhookAccepted,
        400: affinityError,
      },
    },
  );

async function affinityErrorCode(error: unknown) {
  if (!(error instanceof ResponseError)) return "request_failed";
  try {
    const problem = (await error.response.clone().json()) as { code?: unknown };
    if (typeof problem.code === "string") return problem.code;
  } catch {
    // Fall through to the stable HTTP status below.
  }
  return `http_${error.response.status}`;
}

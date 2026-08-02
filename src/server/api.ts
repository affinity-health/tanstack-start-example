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

const hostedSessionResponse = t.Object({
  expiresAt: t.String({ format: "date-time" }),
  id: t.String(),
  url: t.String({ format: "uri" }),
});

const headlessOrderResponse = t.Object({
  orderId: t.String(),
  prescriptionIds: t.Array(t.String()),
  signingSession: t.Object({
    expiresAt: t.String({ format: "date-time" }),
    url: t.String({ format: "uri" }),
  }),
});

const headlessOptionsResponse = t.Object({
  medications: t.Array(
    t.Object({
      dosageForm: t.String(),
      id: t.String(),
      name: t.String(),
      route: t.String(),
      strength: t.Nullable(t.String()),
    }),
  ),
  patients: t.Array(
    t.Object({
      id: t.String(),
      name: t.String(),
      state: t.String(),
    }),
  ),
  recommendedPatientId: t.Nullable(t.String()),
});

const headlessPrescription = t.Object({
  compoundingReason: t.Optional(
    t.Object({
      category: t.Union([
        t.Literal("drug_shortage"),
        t.Literal("commercial_product_discontinued"),
        t.Literal("modified_release"),
        t.Literal("inactive_ingredient_sensitivity"),
        t.Literal("concentration_adjustment"),
        t.Literal("alternate_route"),
        t.Literal("dosage_form_unavailable"),
        t.Literal("patient_cannot_use_commercial_product"),
        t.Literal("no_approved_product_available"),
        t.Literal("other_patient_specific_need"),
      ]),
      context: t.String({ maxLength: 2000, minLength: 1 }),
    }),
  ),
  daysSupply: t.Integer({ maximum: 365, minimum: 1 }),
  diagnoses: t.Optional(
    t.Array(
      t.Object({
        code: t.String({ maxLength: 16, minLength: 1 }),
        display: t.String({ maxLength: 240, minLength: 1 }),
      }),
      { maxItems: 20 },
    ),
  ),
  directions: t.String({ maxLength: 2000, minLength: 1 }),
  medicationId: t.String({ minLength: 1 }),
  quantity: t.Number({ exclusiveMinimum: 0, maximum: 100000 }),
  quantityUnit: t.String({ maxLength: 80, minLength: 1 }),
  refills: t.Integer({ maximum: 99, minimum: 0 }),
  structuredSig: t.Object({
    dose: t.String({ maxLength: 80, minLength: 1 }),
    doseUnit: t.String({ maxLength: 80, minLength: 1 }),
    frequency: t.String({ maxLength: 120, minLength: 1 }),
    prn: t.Boolean({ default: false }),
    route: t.String({ maxLength: 120, minLength: 1 }),
  }),
  substitutionPermitted: t.Boolean({ default: false }),
});

const paymentMethodResponse = t.Nullable(
  t.Object({
    brand: t.String(),
    last4: t.String(),
    type: t.Literal("card"),
  }),
);

const paymentProfileResponse = t.Object({
  environment: t.Literal("sandbox"),
  paymentMethod: paymentMethodResponse,
  status: t.Union([
    t.Literal("setup_required"),
    t.Literal("ready"),
    t.Literal("action_required"),
    t.Literal("disabled"),
  ]),
});

const paymentSetupResponse = t.Object({
  clientSecret: t.String(),
  consentVersion: t.String(),
  publishableKey: t.String(),
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
    "/affinity/headless-options",
    async ({ request, status }) => {
      try {
        const { affinity, mapping, session } = await requireTestPractice(
          request,
          "loading the headless prescribing demo",
        );
        const actingAffinity = affinity.withActor({ id: session.user.id, type: "user" });
        const [patientList, catalog] = await Promise.all([
          actingAffinity.patients.list(mapping.practiceId, { limit: 50 }),
          affinity.catalog.list({ limit: 50 }),
        ]);
        const patients = patientList.data
          .filter((patient) => patient.status === "active")
          .map((patient) => ({
            id: patient.id,
            name: [patient.name.preferred ?? patient.name.first, patient.name.last].join(" "),
            state: patient.address.state,
          }));
        const preferredState = env.AFFINITY_DEMO_PATIENT_STATE.trim().toUpperCase();
        return {
          medications: catalog.data
            .filter((item) => item.isOrderable)
            .map((item) => ({
              dosageForm: item.dosageForm,
              id: item.id,
              name: item.name,
              route: item.route,
              strength: item.strength,
            })),
          patients,
          recommendedPatientId:
            patients.find((patient) => patient.state.toUpperCase() === preferredState)?.id ?? null,
        };
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not load the headless demo (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      detail: {
        description:
          "Returns the Test patients and orderable formulations available to the authenticated provider for the native headless SDK demo.",
        operationId: "getAffinityHeadlessOptions",
        summary: "List headless demo options",
        tags: ["Affinity"],
      },
      response: {
        200: headlessOptionsResponse,
        401: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
  )
  .post(
    "/affinity/headless-order",
    async ({ body, headers, request, status }) => {
      try {
        const { affinity, mapping, session } = await requireTestPractice(
          request,
          "creating a patient order",
        );
        const actingAffinity = affinity.withActor({ id: session.user.id, type: "user" });
        const order = await actingAffinity.orders.create(
          {
            patientId: body.patientId,
            practiceId: mapping.practiceId,
            prescriptions: body.prescriptions.map((prescription) => ({
              clinical: {
                compoundingReason: prescription.compoundingReason,
                currentMedications: [],
                diagnoses: prescription.diagnoses ?? [],
                observations: [],
              },
              daysSupply: prescription.daysSupply,
              directions: prescription.directions,
              dispensing: {
                dispenseUponAcceptance: true,
                substitutionPermitted: prescription.substitutionPermitted,
              },
              medicationId: prescription.medicationId,
              quantity: prescription.quantity,
              quantityUnit: prescription.quantityUnit,
              refills: prescription.refills,
              structuredSig: prescription.structuredSig,
            })),
            providerMappingId: mapping.id,
          },
          { idempotencyKey: `${headers["idempotency-key"]}:order` },
        );
        const signingSession = await affinity.orderSigningSessions.create(
          {
            consent: {
              authorizedProviderAccess: true,
              minimumNecessaryPhi: true,
              recordedAt: new Date(),
            },
            orderId: order.id,
            practiceId: mapping.practiceId,
            providerMappingId: mapping.id,
            returnUrl: body.returnUrl ?? null,
            userId: mapping.userId,
          },
          { idempotencyKey: `${headers["idempotency-key"]}:signing` },
        );

        return {
          orderId: order.id,
          prescriptionIds: order.prescriptions.map((prescription) => prescription.id),
          signingSession: {
            expiresAt: signingSession.expiresAt.toISOString(),
            url: signingSession.url,
          },
        };
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not create the patient order (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      body: t.Object({
        patientId: t.String({ minLength: 1 }),
        prescriptions: t.Array(headlessPrescription, { maxItems: 20, minItems: 1 }),
        returnUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
      }),
      detail: {
        description:
          "Creates one Test patient order with one or more prescriptions, then returns a single-use provider signing URL. The backend supplies actor attribution and never receives the provider PIN.",
        operationId: "createAffinityHeadlessOrder",
        summary: "Create a headless patient order",
        tags: ["Affinity"],
      },
      headers: t.Object(
        {
          "idempotency-key": t.String({ minLength: 1 }),
        },
        { additionalProperties: true },
      ),
      response: {
        200: headlessOrderResponse,
        400: affinityError,
        401: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
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
      try {
        const { affinity, mapping } = await requireTestPractice(
          request,
          "opening Affinity Elements",
        );
        const componentSession = await affinity.componentSessions.create(
          {
            allowedOrigin: requestOrigin(request, env.APP_URL),
            components: {
              prescriptionComposer: {
                enabled: true,
                features: {
                  changePatient: true,
                  createDraft: true,
                  sign: true,
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
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
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
    "/affinity/hosted-session",
    async ({ body, request, status }) => {
      try {
        const { affinity, mapping } = await requireTestPractice(request, "opening Affinity Hosted");
        const hostedSession = await affinity.hostedSessions.create(
          {
            consent: {
              authorizedProviderAccess: true,
              minimumNecessaryPhi: true,
              recordedAt: new Date(),
            },
            flow: body?.flow ?? "prescription_composer",
            practiceId: mapping.practiceId,
            providerMappingId: mapping.id,
            returnUrl: null,
            userId: mapping.userId,
          },
          { idempotencyKey: `hosted:${crypto.randomUUID()}` },
        );

        return {
          expiresAt: hostedSession.expiresAt.toISOString(),
          id: hostedSession.id,
          url: hostedSession.url,
        };
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not create the hosted session (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      detail: {
        description:
          "Authenticates the partner user and creates a single-use Affinity Hosted prescribing or provider-verification URL for a popup, new tab, or redirect.",
        operationId: "createAffinityHostedSession",
        summary: "Create an Affinity Hosted session",
        tags: ["Affinity"],
      },
      body: t.Optional(
        t.Object({
          flow: t.Union([t.Literal("prescription_composer"), t.Literal("provider_verification")]),
        }),
      ),
      response: {
        200: hostedSessionResponse,
        401: affinityError,
        403: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
  )
  .get(
    "/affinity/payment-profile",
    async ({ request, status }) => {
      try {
        const { affinity, practiceId } = await requireTestPractice(request);
        const profile = await affinity.billing.retrievePaymentProfile(practiceId);
        if (profile.environment !== "sandbox") {
          return status(409, { error: "This demo only supports Affinity Test billing." });
        }
        return paymentProfileView(profile);
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not retrieve the payment profile (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      detail: {
        description:
          "Returns the configured Test practice's safe payment status and card display summary to an authenticated practice user.",
        operationId: "getAffinityPaymentProfile",
        summary: "Get the practice payment profile",
        tags: ["Affinity"],
      },
      response: {
        200: paymentProfileResponse,
        401: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
  )
  .post(
    "/affinity/payment-setup",
    async ({ body, request, status }) => {
      try {
        const { affinity, practiceId } = await requireTestPractice(request);
        return await affinity.billing.createPaymentSetup(
          practiceId,
          { consentAccepted: body.consentAccepted },
          { idempotencyKey: `payment-setup:${crypto.randomUUID()}` },
        );
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not start payment setup (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      body: t.Object({ consentAccepted: t.Literal(true) }),
      detail: {
        description:
          "Records the authenticated practice user's consent and returns a one-time Stripe Test SetupIntent secret for Stripe.js.",
        operationId: "createAffinityPaymentSetup",
        summary: "Start practice payment setup",
        tags: ["Affinity"],
      },
      response: {
        200: paymentSetupResponse,
        401: affinityError,
        409: affinityError,
        502: affinityError,
        503: affinityError,
      },
    },
  )
  .post(
    "/affinity/payment-setup/complete",
    async ({ body, request, status }) => {
      try {
        const { affinity, practiceId } = await requireTestPractice(request);
        const profile = await affinity.billing.completePaymentSetup(
          practiceId,
          { setupIntentId: body.setupIntentId },
          { idempotencyKey: `payment-complete:${crypto.randomUUID()}` },
        );
        if (profile.environment !== "sandbox") {
          return status(409, { error: "This demo only supports Affinity Test billing." });
        }
        return paymentProfileView(profile);
      } catch (error) {
        if (error instanceof DemoRequestError) {
          return status(error.statusCode, { error: error.message });
        }
        return status(502, {
          error: `Affinity could not complete payment setup (${await affinityErrorCode(error)}).`,
        });
      }
    },
    {
      body: t.Object({ setupIntentId: t.String({ minLength: 1 }) }),
      detail: {
        description:
          "Completes the Test practice payment profile after Stripe.js confirms the SetupIntent; no card data reaches this API.",
        operationId: "completeAffinityPaymentSetup",
        summary: "Complete practice payment setup",
        tags: ["Affinity"],
      },
      response: {
        200: paymentProfileResponse,
        401: affinityError,
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

class DemoRequestError extends Error {
  constructor(
    readonly statusCode: 401 | 409 | 503,
    message: string,
  ) {
    super(message);
    this.name = "DemoRequestError";
  }
}

async function requireTestPractice(request: Request, action = "managing practice billing") {
  const session = await createAuth(request).api.getSession({ headers: request.headers });
  if (!session) throw new DemoRequestError(401, `Sign in before ${action}.`);

  const providerMappingId = env.AFFINITY_PROVIDER_MAPPING_ID.trim();
  if (!providerMappingId) {
    throw new DemoRequestError(
      503,
      "Set AFFINITY_PROVIDER_MAPPING_ID to a verified test provider mapping.",
    );
  }

  const affinity = new Affinity(env.AFFINITY_API_KEY, {
    apiVersion: affinityApiVersion,
    baseUrl: env.AFFINITY_API_URL,
  });
  const access = await affinity.account.retrieveAccess();
  if (access.livemode) {
    throw new DemoRequestError(409, "Use an Affinity test-mode API key for this demo.");
  }

  const mapping = await affinity.providerMappings.retrieve(providerMappingId);
  if (mapping.status !== "verified") {
    throw new DemoRequestError(409, `Complete Affinity provider verification before ${action}.`);
  }

  return { affinity, mapping, practiceId: mapping.practiceId, session };
}

function paymentProfileView(profile: {
  environment: "production" | "sandbox";
  paymentMethod: { brand: string; last4: string; type: "card" } | null;
  status: "action_required" | "disabled" | "ready" | "setup_required";
}) {
  return {
    environment: "sandbox" as const,
    paymentMethod: profile.paymentMethod,
    status: profile.status,
  };
}

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

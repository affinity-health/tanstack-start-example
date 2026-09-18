import { ResponseError } from "@affinity-health/sdk";
import { createAffinity } from "./affinity";
import { resolvePatient } from "./workflow";

export async function handleApi(request: Request, getClient = createAffinity) {
  const url = new URL(request.url);
  const json = (body: unknown, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    return json({ error: "Local access only." }, 403);
  if (
    request.method === "POST" &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== url.origin
  )
    return json({ error: "Cross-origin request rejected." }, 403);
  if (url.pathname === "/api/health") return json({ ok: true });
  const routes = [
    "/api/practices",
    "/api/catalog",
    "/api/patient",
    "/api/prescriber",
    "/api/options",
    "/api/preview",
    "/api/orders",
    "/api/order",
    "/api/sign",
    "/api/allergies",
  ];
  if (!routes.includes(url.pathname)) return json({ error: "Endpoint not found." }, 404);
  const method = ["/api/practices", "/api/catalog", "/api/options", "/api/order"].includes(
    url.pathname,
  )
    ? "GET"
    : "POST";
  if (request.method !== method) return json({ error: `Use ${method}.` }, 405);
  try {
    const body = method === "POST" ? await request.json() : Object.fromEntries(url.searchParams);
    const affinity = getClient();
    const access = await affinity.apiKeys.retrieve();
    if (access.livemode) return json({ error: "Use a Test API key." }, 400);
    if (url.pathname === "/api/practices")
      return json(await affinity.practices.list({ limit: 100 }));
    if (url.pathname === "/api/catalog") return json(await affinity.catalog.list({ limit: 100 }));
    if (typeof body.practiceId !== "string" || !body.practiceId.trim())
      return json({ error: "Select a practice." }, 400);
    const key = request.headers.get("idempotency-key");
    if (method === "POST" && !key)
      return json({ error: "Supply an Idempotency-Key for retries." }, 400);
    const options = { idempotencyKey: key! };
    switch (url.pathname) {
      case "/api/patient":
        return json(await resolvePatient(affinity, body.practiceId, body.externalId, key!));
      case "/api/prescriber": {
        if (body.identityAttestation !== true || !/^\d{10}$/.test(body.npi ?? ""))
          return json({ error: "Enter a Test NPI and confirm the prescriber identity." }, 400);
        return json(
          await affinity.team.createUser(
            body.practiceId,
            {
              externalId: `demo-emr-prescriber-${body.npi}`,
              email: `prescriber-${body.npi}@example.test`,
              name: body.name,
              role: "prescriber",
              npi: body.npi,
              identityAttestation: true,
            },
            options,
          ),
        );
      }
      case "/api/options":
        return json(
          await affinity.catalog.retrievePrescribingOptions(body.medicationId, {
            practiceId: body.practiceId,
          }),
        );
      case "/api/preview":
        return json(await affinity.orders.preview(body));
      case "/api/orders": {
        const created = await affinity.orders.create(body, options);
        return json(await affinity.orders.retrieve(created.id));
      }
      case "/api/allergies": {
        if (body.confirmed !== true)
          return json({ error: "Confirm the allergy review first." }, 400);
        const current = await affinity.patients.retrieveAllergies(body.practiceId, body.patientId);
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
      }
      case "/api/order": {
        const order = await affinity.orders.retrieve(body.orderId);
        if (order.practiceId !== body.practiceId)
          return json({ error: "Order belongs to another practice." }, 400);
        return json(order);
      }
      case "/api/sign": {
        if (
          body.signatureAttestation !== true ||
          typeof body.actorId !== "string" ||
          !body.actorId.trim()
        )
          return json(
            { error: "Review the order and confirm signing as the registered prescriber." },
            400,
          );
        const { orderId, actorId, ...signature } = body;
        return json(
          await affinity
            .withActor({ type: "user", id: actorId })
            .orders.sign(orderId, signature, options),
        );
      }
    }
  } catch (error) {
    if (error instanceof ResponseError)
      return json(
        {
          error: `Affinity returned HTTP ${error.response.status}.`,
          details: await error.response.json().catch(() => null),
        },
        error.response.status,
      );
    return json(
      { error: error instanceof Error ? error.message : "Request failed." },
      error instanceof SyntaxError ? 400 : 500,
    );
  }
  return json({ error: "Endpoint not found." }, 404);
}

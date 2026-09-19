import { AffinityError, FetchError, ResponseError, type Affinity } from "@affinity-health/sdk";
import { createAffinity, type AffinityMode } from "./affinity/client";
import { getSession } from "./auth/session";
import { sessionStore, takeQuota } from "./auth/store";

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type ApiContext<TBody> = {
  affinity: Affinity;
  body: TBody;
  mode: AffinityMode;
  key: string;
  options: { idempotencyKey: string };
  practiceId: string;
};

export async function apiHandler<TBody = Record<string, string>>(
  request: Request,
  handle: (context: ApiContext<TBody>) => Promise<Response>,
  { practiceRequired = true } = {},
) {
  const url = new URL(request.url);
  const session = await getSession(request);
  if (!session)
    return json({ code: "SESSION_REQUIRED", error: "Start a Test demo to continue." }, 401);
  if (request.method === "POST" && request.headers.get("origin") !== url.origin)
    return json({ error: "Cross-origin request rejected." }, 403);
  try {
    const mode = url.searchParams.get("mode") ?? "test";
    if (mode !== "test") return json({ error: "This demo only supports Test mode." }, 403);
    const raw = request.method === "POST" ? await request.text() : "";
    if (raw.length > 32_768) return json({ error: "Request too large." }, 413);
    const body = request.method === "POST" ? JSON.parse(raw) : Object.fromEntries(url.searchParams);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return json({ error: "Expected a JSON object." }, 400);
    if (practiceRequired && (typeof body.practiceId !== "string" || !body.practiceId.trim()))
      return json({ error: "Select a practice." }, 400);
    if (body.practiceId !== undefined && body.practiceId !== session.practiceId)
      return json({ error: "Practice not found." }, 404);
    body.practiceId = session.practiceId;
    if (body.patient !== undefined || body.prescriber !== undefined || body.userId !== undefined)
      return json({ error: "Use the demo's synthetic patient and prescriber." }, 400);
    const suppliedKey = request.headers.get("idempotency-key") ?? "";
    if (request.method === "POST" && (!suppliedKey || suppliedKey.length > 128))
      return json({ error: "Supply an Idempotency-Key for retries." }, 400);
    const key = session.id + ":" + suppliedKey;
    const db = await sessionStore();
    if (!(await takeQuota(db, "requests:" + session.id, 120, 60)))
      return json({ error: "Too many requests. Try again in a minute." }, 429);
    if (
      request.method === "POST" &&
      appPathname(url.pathname) === "/api/orders" &&
      !(await takeQuota(db, "orders:" + session.id, 30, 86400))
    )
      return json({ error: "This Test session has reached its order limit." }, 429);
    const affinity = createAffinity(mode);
    // Order endpoints are platform-scoped upstream. Check ownership before any action.
    if (body.orderId !== undefined) {
      if (typeof body.orderId !== "string") return json({ error: "Invalid order." }, 400);
      const order = await affinity.orders.retrieve(body.orderId);
      if (order.practiceId !== session.practiceId) return json({ error: "Order not found." }, 404);
    }
    if (body.patientId !== undefined)
      await affinity.patients.retrieve(session.practiceId, body.patientId);
    return await handle({
      affinity,
      body,
      mode,
      key,
      options: { idempotencyKey: key },
      practiceId: session.practiceId,
    });
  } catch (error) {
    if (error instanceof AffinityError)
      return json(
        {
          error:
            (error.statusCode ?? 500) < 500
              ? error.message
              : "Affinity is temporarily unavailable.",
          code: error.code,
          requestId: error.requestId,
        },
        error.statusCode ?? 502,
      );
    if (error instanceof FetchError)
      return json({ error: "Affinity is temporarily unavailable. Retry this action." }, 502);
    if (error instanceof ResponseError)
      return json(
        {
          error: `Affinity returned HTTP ${error.response.status}.`,
          details: await error.response.json().catch(() => null),
        },
        error.response.status,
      );
    return json(
      {
        error:
          error instanceof SyntaxError ? "Invalid JSON." : "Request failed. Retry this action.",
      },
      error instanceof SyntaxError ? 400 : 500,
    );
  }
}
import { appPathname } from "../lib/app-path";

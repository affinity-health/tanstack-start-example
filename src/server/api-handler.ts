import { ResponseError, type Affinity } from "@affinity-health/sdk";
import { getAffinity, type AffinityMode } from "./affinity/client";

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

type ApiContext<TBody> = {
  affinity: Affinity;
  body: TBody;
  mode: AffinityMode;
  key: string;
  options: { idempotencyKey: string };
};

export async function apiHandler<TBody = Record<string, string>>(
  request: Request,
  handle: (context: ApiContext<TBody>) => Promise<Response>,
  { practiceRequired = true } = {},
) {
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    return json({ error: "Local access only." }, 403);
  if (
    request.method === "POST" &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== url.origin
  )
    return json({ error: "Cross-origin request rejected." }, 403);
  try {
    const mode = url.searchParams.get("mode") ?? "test";
    if (mode !== "test" && mode !== "production")
      return json({ error: "Unknown environment." }, 400);
    const body =
      request.method === "POST" ? await request.json() : Object.fromEntries(url.searchParams);
    if (!body || typeof body !== "object" || Array.isArray(body))
      return json({ error: "Expected a JSON object." }, 400);
    if (practiceRequired && (typeof body.practiceId !== "string" || !body.practiceId.trim()))
      return json({ error: "Select a practice." }, 400);
    const key = request.headers.get("idempotency-key") ?? "";
    if (request.method === "POST" && !key)
      return json({ error: "Supply an Idempotency-Key for retries." }, 400);
    const affinity = await getAffinity(mode);
    return await handle({ affinity, body, mode, key, options: { idempotencyKey: key } });
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
}

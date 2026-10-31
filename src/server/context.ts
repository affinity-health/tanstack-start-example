import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { AffinityError } from "@affinity-health/sdk";
import { createAffinity } from "./affinity/client";
import { getSession } from "./auth/session";
import { sessionStore } from "./auth/store";
import { jsonResponse, type JsonResponse } from "./json-response";

async function workspaceContext() {
  const request = getRequest();
  setResponseHeader("Cache-Control", "private, no-store");
  if (request.method === "POST" && request.headers.get("origin") !== new URL(request.url).origin)
    throw new Error("Cross-origin request rejected.");
  const session = await getSession(request);
  if (!session) throw redirect({ to: "/unlock" });
  const store = await sessionStore();
  if (!(await store.quota("requests:" + session.id, 120, 60)))
    throw new Error("Too many requests. Try again in a minute.");
  const affinity = createAffinity();
  return { ...session, affinity, store };
}
export type WorkspaceContext = Awaited<ReturnType<typeof workspaceContext>>;
export async function withWorkspace<T>(
  operation: (context: WorkspaceContext) => Promise<T>,
): Promise<JsonResponse<Awaited<T>>> {
  const context = await workspaceContext();
  try {
    return jsonResponse(await operation(context));
  } catch (cause) {
    const error = cause;
    if (error instanceof AffinityError)
      throw new Error(
        (error.statusCode ?? 500) < 500
          ? `${problemDetail(error) ?? "The request could not be completed."}${error.requestId ? ` (request ${error.requestId})` : ""}`
          : "Affinity is temporarily unavailable. Retry this action.",
      );
    throw error;
  }
}
/** The API's explanation of a refused request, from its problem document. */
export function problemDetail(error: AffinityError): string | undefined {
  const body = error.body as { detail?: unknown } | undefined;
  return typeof body?.detail === "string" ? body.detail : undefined;
}
export async function ownedOrder(context: WorkspaceContext, orderId: string) {
  const order = await context.affinity.orders.get({ orderId });
  if (order.practiceId !== context.practiceId) throw new Error("Order not found.");
  return order;
}

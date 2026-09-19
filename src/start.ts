import { createMiddleware, createStart } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { hasSession } from "./server/auth/session";

const requireSession = createMiddleware().server(async ({ request, next, handlerType }) => {
  const url = new URL(request.url);
  // The public demo has no shared webhook inbox or authenticated image proxy.
  if (
    [
      "/api/prescriber",
      "/api/webhooks/affinity",
      "/api/webhook-events",
      "/api/medication-image",
    ].includes(url.pathname)
  )
    return new Response("Not found", { status: 404 });
  if (url.pathname === "/unlock" || (await hasSession(request))) return next();
  const headers = { "Cache-Control": "private, no-store" };
  if (handlerType === "serverFn") throw redirect({ href: "/unlock" });
  if (url.pathname.startsWith("/api/"))
    return Response.json(
      { code: "SESSION_REQUIRED", error: "Start a Test demo to continue." },
      { status: 401, headers },
    );
  return new Response(null, { status: 302, headers: { ...headers, Location: "/unlock" } });
});

export const startInstance = createStart(() => ({ requestMiddleware: [requireSession] }));

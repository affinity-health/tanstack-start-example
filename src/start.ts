import { createMiddleware, createStart } from "@tanstack/react-start";
import { hasSession } from "./server/auth/session";

const requireSession = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.pathname === "/unlock" || (await hasSession(request))) return next();
  const headers = { "Cache-Control": "private, no-store" };
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/"))
    return Response.json({ error: "Enter the demo PIN to continue." }, { status: 401, headers });
  return new Response(null, { status: 302, headers: { ...headers, Location: "/unlock" } });
});

export const startInstance = createStart(() => ({ requestMiddleware: [requireSession] }));

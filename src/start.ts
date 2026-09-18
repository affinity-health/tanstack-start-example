import { createMiddleware, createStart } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { hasSession } from "./server/auth/session";

const requireSession = createMiddleware().server(async ({ request, next, handlerType }) => {
  const url = new URL(request.url);
  if (url.pathname === "/unlock" || (await hasSession(request))) return next();
  const headers = { "Cache-Control": "private, no-store" };
  if (handlerType === "serverFn") throw redirect({ href: "/unlock" });
  if (url.pathname.startsWith("/api/"))
    return Response.json(
      { code: "SESSION_REQUIRED", error: "Enter the demo PIN to continue." },
      { status: 401, headers },
    );
  return new Response(null, { status: 302, headers: { ...headers, Location: "/unlock" } });
});

export const startInstance = createStart(() => ({ requestMiddleware: [requireSession] }));

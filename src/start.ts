import { createMiddleware, createStart } from "@tanstack/react-start";
import { appPath, appPathname } from "./lib/app-path";
import { redirect } from "@tanstack/react-router";
import { hasSession } from "./server/auth/session";

const requireSession = createMiddleware().server(async ({ request, next, handlerType }) => {
  const url = new URL(request.url);
  const pathname = appPathname(url.pathname);
  // The public demo has no shared webhook inbox or authenticated image proxy.
  if (
    [
      "/api/prescriber",
      "/api/webhooks/affinity",
      "/api/webhook-events",
      "/api/medication-image",
    ].includes(pathname)
  )
    return new Response("Not found", { status: 404 });
  if (pathname === "/unlock" || (await hasSession(request))) return next();
  const headers = { "Cache-Control": "private, no-store" };
  if (handlerType === "serverFn") throw redirect({ href: appPath("/unlock") });
  if (pathname.startsWith("/api/"))
    return Response.json(
      { code: "SESSION_REQUIRED", error: "Start a Test demo to continue." },
      { status: 401, headers },
    );
  return new Response(null, { status: 302, headers: { ...headers, Location: appPath("/unlock") } });
});

export const startInstance = createStart(() => ({ requestMiddleware: [requireSession] }));

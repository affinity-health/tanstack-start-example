import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { appPath, appPathname } from "./lib/app-path";
import { hasSession } from "./server/auth/session";
import { isRedirect } from "@tanstack/react-router";

const sessionMiddleware = createMiddleware().server(async ({ request, next, handlerType }) => {
  // Every protected server function resolves its own workspace. beginDemo is public.
  const pathname = appPathname(new URL(request.url).pathname);
  if (handlerType === "serverFn" || pathname === "/unlock") return next();
  if (await hasSession(request)) return next();
  return new Response(null, {
    status: 302,
    headers: { "Cache-Control": "private, no-store", Location: appPath("/unlock") },
  });
});
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});
// Calls made by Query or button handlers are outside router loaders. Expiry must
// leave the old workspace and its in-memory cache, not render a redirect as an error.
const expiredSession = createMiddleware({ type: "function" }).client(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isRedirect(error) && error.options.to === "/unlock")
      window.location.assign(appPath("/unlock"));
    throw error;
  }
});
export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, sessionMiddleware],
  functionMiddleware: [expiredSession],
}));

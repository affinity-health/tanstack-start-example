import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import type { D1Database } from "@cloudflare/workers-types";
import { appPath } from "../../lib/app-path";

export async function getAuth(request: Request) {
  const { env } = await import("cloudflare:workers");
  const origin = new URL(request.url).origin;
  return betterAuth({
    database: env.AUTH_DATABASE as D1Database,
    secret: process.env.DEMO_SESSION_SECRET,
    baseURL: origin,
    basePath: appPath("/api/auth"),
    trustedOrigins: [origin],
    session: { expiresIn: 12 * 60 * 60, disableSessionRefresh: true },
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      cookiePrefix: "affinity-emr",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "strict",
        secure: origin.startsWith("https:"),
      },
    },
    plugins: [anonymous({ disableDeleteAnonymousUser: true }), tanstackStartCookies()],
  });
}

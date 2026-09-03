import "@tanstack/react-start/server-only";

import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "../env";
import { requestOrigin } from "./request-origin";

const configuredTrustedOrigins = ["http://localhost:3001", "https://api.dawson.gg", env.APP_URL];

export function createAuth(request: Request) {
  const requestUrl = new URL(request.url);
  const trustedOrigins = [...configuredTrustedOrigins];

  if (requestUrl.hostname === "127.0.0.1" || requestUrl.hostname === "localhost") {
    trustedOrigins.push(requestUrl.origin);
  }

  return betterAuth({
    appName: "Northstar demo clinic",
    baseURL: requestOrigin(request, env.APP_URL),
    database: env.DB,
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    plugins: [tanstackStartCookies()],
    trustedOrigins,
  });
}

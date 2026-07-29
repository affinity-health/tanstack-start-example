import "@tanstack/react-start/server-only";

import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "../env";
import { requestOrigin } from "./request-origin";

const trustedOrigins = ["http://localhost:3001", "https://api.dawson.gg"];

export function createAuth(request: Request) {
  return betterAuth({
    appName: "Plain Start",
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

import { createAuth } from "@tanstack-start-example/auth";
import { createAuthIdentifier, type BetterAuthInstance } from "evlog/better-auth";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("request", async (event) => {
    const identify = createAuthIdentifier(createAuth() as BetterAuthInstance, {
      exclude: ["/api/auth/**"],
      maskEmail: true,
    });
    await identify(event);
  });
});

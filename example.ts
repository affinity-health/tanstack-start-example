import { createAffinity } from "./src/server/affinity/client";

// Run with your own Test key: bun run example.
const affinity = createAffinity();
const access = await affinity.apiKeys.getApiAccess();
console.log(`Authenticated in ${access.livemode ? "Live" : "Test"} mode.`);
console.log("Scopes:", access.scopes.join(", "));

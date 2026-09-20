import { createAffinity } from "./src/server/affinity/client";

// Run with your own Test key: bun run example.
const affinity = createAffinity();
const access = await affinity.apiKeys.retrieve();
console.log("Access:", JSON.stringify(access, null, 2));

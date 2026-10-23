import { createAffinity } from "./src/server/affinity/client";

// Run with your own Test key: bun run example.
const affinity = createAffinity();
const account = await affinity.account.get();
if (account.mode !== "test") throw new Error("This example requires a Test key.");
const medications = await affinity.medications.list({ limit: "5" });
console.log(`Authenticated as a ${account.type} in ${account.mode} mode.`);
console.log(`Found ${medications.data.length} medications; more: ${medications.hasMore}.`);

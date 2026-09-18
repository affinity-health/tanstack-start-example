import { Affinity } from "@affinity-health/sdk";

// Shared by the local API and example.ts. Never import this into browser code.
export type AffinityMode = "test" | "production";
export function createAffinity(mode: AffinityMode = "test") {
  const variable = mode === "production" ? "AFFINITY_PRODUCTION_API_KEY" : "AFFINITY_TEST_API_KEY";
  const apiKey =
    process.env[variable] || (mode === "test" ? process.env.AFFINITY_API_KEY : undefined);
  if (!apiKey || apiKey.endsWith("replace_me")) {
    throw new Error(`Set ${variable} in .env and restart the server to use ${mode}.`);
  }
  if (mode === "test" && !apiKey.startsWith("sk_test_"))
    throw new Error("The Test environment requires a Test API key.");
  if (mode === "production" && apiKey.startsWith("sk_test_"))
    throw new Error("The Production environment requires a live API key.");
  return new Affinity(apiKey, {
    timeout: 15_000,
    maxNetworkRetries: 0,
    ...(process.env.AFFINITY_ACTOR_ID
      ? { actor: { type: "user" as const, id: process.env.AFFINITY_ACTOR_ID } }
      : {}),
  });
}

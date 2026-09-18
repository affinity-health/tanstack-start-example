import { Affinity } from "@affinity-health/sdk";

// Shared by the local API and example.ts. Never import this into browser code.
export function createAffinity() {
  const apiKey = process.env.AFFINITY_API_KEY;
  if (!apiKey || apiKey === "sk_test_replace_me") {
    throw new Error("Set AFFINITY_API_KEY in .env, then run the request again.");
  }
  if (!apiKey.startsWith("sk_test_"))
    throw new Error("Use an sk_test_ API key for this playground.");
  return new Affinity(apiKey, {
    timeout: 15_000,
    maxNetworkRetries: 0,
    ...(process.env.AFFINITY_ACTOR_ID
      ? { actor: { type: "user" as const, id: process.env.AFFINITY_ACTOR_ID } }
      : {}),
  });
}

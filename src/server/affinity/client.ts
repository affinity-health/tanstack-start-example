import { Affinity } from "@affinity-health/sdk";

export type AffinityMode = "test" | "production";

export function createAffinity(mode: AffinityMode = "test") {
  const variable = mode === "test" ? "AFFINITY_TEST_API_KEY" : "AFFINITY_PRODUCTION_API_KEY";
  const apiKey = process.env[variable];
  if (!apiKey) throw new Error(`Set ${variable} in .env and restart the server.`);
  if (apiKey.startsWith("sk_test_") !== (mode === "test"))
    throw new Error(`${variable} does not match the ${mode} environment.`);

  return new Affinity(apiKey, { timeout: 15_000, maxNetworkRetries: 0 });
}

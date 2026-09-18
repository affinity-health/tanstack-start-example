import { Affinity } from "@affinity-health/sdk";

export type AffinityMode = "test" | "production";

export function createAffinity(mode: AffinityMode = "test") {
  const variable = mode === "test" ? "AFFINITY_TEST_API_KEY" : "AFFINITY_PRODUCTION_API_KEY";
  const apiKey = process.env[variable];
  if (!apiKey)
    throw new Error(`Set ${variable} in the active environment file and restart the server.`);
  if (apiKey.startsWith("sk_test_") !== (mode === "test"))
    throw new Error(`${variable} does not match the ${mode} environment.`);

  // The SDK appends /v1 to every endpoint; preserve prefixes such as /api.
  const url = new URL(process.env.AFFINITY_API_URL || "https://api.joinaffinityai.com/v1");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "AFFINITY_API_URL must be an HTTP(S) API URL without credentials, query, or fragment.",
    );
  const baseUrl = url.href.replace(/\/+$/, "").replace(/\/v1$/, "");
  return new Affinity(apiKey, { baseUrl, timeout: 15_000, maxNetworkRetries: 0 });
}

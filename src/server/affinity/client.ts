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
  return new Affinity(apiKey, {
    baseUrl,
    timeout: 15_000,
    maxNetworkRetries: 0,
    fetch: async (input, init) => {
      const response = await fetch(input, { ...init, redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        const destination = location ? new URL(location, baseUrl).hostname : "a login page";
        throw new Error(
          `The Affinity API at ${url.hostname} redirected to ${destination}. Authenticate access to the remote development server before using this API URL.`,
        );
      }
      if (response.headers.get("content-type")?.includes("text/html"))
        throw new Error(
          `The Affinity API at ${url.hostname} returned HTML instead of JSON (HTTP ${response.status}). Check AFFINITY_API_URL and the remote server's access settings.`,
        );
      return response;
    },
  });
}

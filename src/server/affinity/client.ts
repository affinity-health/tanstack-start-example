import { Affinity } from "@affinity-health/sdk";

export function createAffinity() {
  const apiKey = process.env.AFFINITY_API_KEY;
  if (!apiKey) throw new Error("Set AFFINITY_API_KEY.");
  if (!apiKey.startsWith("sk_test_")) throw new Error("AFFINITY_API_KEY must be a Test API key.");

  // The SDK appends /v1 to its base URL; preserve development proxy prefixes.
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
    apiVersion: "2026-09-28",
    baseUrl,
    timeout: 15_000,
    maxNetworkRetries: 0,
    fetch: Object.assign(
      async (input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1]) => {
        const headers = new Headers(init?.headers);
        // Devbox authenticates the proxy separately from Affinity's Authorization header.
        if (process.env.DEVBOX_API_KEY) headers.set("X-Api-Key", process.env.DEVBOX_API_KEY);
        const response = await fetch(input, { ...init, headers, redirect: "manual" });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          const destination = location ? new URL(location, baseUrl).hostname : "a login page";
          throw new Error(
            `The Affinity API at ${url.hostname} redirected to ${destination}. Set DEVBOX_API_KEY to authenticate the development proxy.`,
          );
        }
        if (response.headers.get("content-type")?.includes("text/html"))
          throw new Error(
            `The Affinity API at ${url.hostname} returned HTML instead of JSON (HTTP ${response.status}). Check AFFINITY_API_URL and the server's access settings.`,
          );
        return response;
      },
      { preconnect: fetch.preconnect },
    ),
  });
}

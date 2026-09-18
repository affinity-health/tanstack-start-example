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

// Share concurrent validation and reuse it for one minute. A key or actor change
// replaces the client immediately; failed validation is never cached.
const clients = new Map<
  AffinityMode,
  {
    credential: string;
    actor: string | undefined;
    client: Affinity;
    validation?: Promise<void>;
    validUntil: number;
  }
>();

export async function getAffinity(mode: AffinityMode) {
  const credential =
    (mode === "production"
      ? process.env.AFFINITY_PRODUCTION_API_KEY
      : process.env.AFFINITY_TEST_API_KEY || process.env.AFFINITY_API_KEY) ?? "";
  const actor = process.env.AFFINITY_ACTOR_ID;
  let entry = clients.get(mode);
  if (!entry || entry.credential !== credential || entry.actor !== actor) {
    entry = { credential, actor, client: createAffinity(mode), validUntil: 0 };
    clients.set(mode, entry);
  }
  const current = entry;
  if (Date.now() >= current.validUntil) {
    current.validation ??= current.client.apiKeys
      .retrieve()
      .then((access) => {
        if (access.livemode !== (mode === "production"))
          throw new Error("API key does not match the selected environment.");
        current.validUntil = Date.now() + 60_000;
      })
      .finally(() => {
        current.validation = undefined;
      });
    await current.validation;
  }
  return current.client;
}

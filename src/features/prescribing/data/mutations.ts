export type MutationFetch = (url: string, init: RequestInit) => Promise<Response>;

type MutationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Persist only a request digest and random key, never patient or prescription fields.
export function createMutationClient(storage: MutationStorage, send: MutationFetch = fetch) {
  return async (mode: string, path: string, body: unknown) => {
    const serialized = JSON.stringify(body);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify([mode, path, serialized])),
    );
    const fingerprint =
      "affinity-pending:" +
      Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    const key = storage.getItem(fingerprint) ?? crypto.randomUUID();
    // If persistence is unavailable, fail before starting an uncertain mutation.
    storage.setItem(fingerprint, key);
    const response = await send(`/api/${path}?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: serialized,
    });
    const data = await response.json();
    const code = data.details?.code ?? data.code;
    // A received submission rejection may follow a partial batch release. The next
    // attempt needs a new key; Affinity deduplicates each existing fulfillment.
    const rejectedSubmission =
      path === "submit" &&
      response.status >= 400 &&
      response.status < 500 &&
      !String(code ?? "").startsWith("idempotency_");
    if (response.ok || rejectedSubmission) storage.removeItem(fingerprint);
    return { response, data };
  };
}

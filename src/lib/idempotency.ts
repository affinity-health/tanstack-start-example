// Keep only a digest and retry key in browser storage, never prescription data.
export async function idempotent<T>(
  scope: string,
  input: unknown,
  send: (key: string) => Promise<T>,
): Promise<T> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify([scope, input])),
  );
  const fingerprint =
    "affinity-pending:" +
    Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const key = sessionStorage.getItem(fingerprint) ?? crypto.randomUUID();
  sessionStorage.setItem(fingerprint, key);
  const result = await send(key);
  sessionStorage.removeItem(fingerprint);
  return result;
}

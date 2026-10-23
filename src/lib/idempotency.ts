const storageKey = (scope: string) => `affinity-pending-order:${scope}`;

// This public Test demo stores synthetic review data in this tab so a reload can retry it.
// A real EMR should persist the approved body and key in its server-side order record.
export function pendingInput<T>(scope: string): T | undefined {
  const saved = sessionStorage.getItem(storageKey(scope));
  return saved ? (JSON.parse(saved) as { input: T }).input : undefined;
}
export async function idempotent<T>(
  scope: string,
  input: unknown,
  send: (key: string) => Promise<T>,
): Promise<T> {
  const saved = sessionStorage.getItem(storageKey(scope));
  const pending = saved
    ? (JSON.parse(saved) as { input: unknown; key: string })
    : { input, key: crypto.randomUUID() };
  if (JSON.stringify(pending.input) !== JSON.stringify(input))
    throw new Error("Resolve the pending reviewed order before starting another order.");
  sessionStorage.setItem(storageKey(scope), JSON.stringify(pending));
  const result = await send(pending.key);
  sessionStorage.removeItem(storageKey(scope));
  return result;
}

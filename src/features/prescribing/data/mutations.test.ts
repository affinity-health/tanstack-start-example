import { expect, test } from "bun:test";
import { createMutationClient, type MutationFetch } from "./mutations";

function storage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

test("a lost draft response reuses its key after remount; a confirmed new draft gets a new key", async () => {
  const saved = storage();
  const keys: string[] = [];
  const send = (async (_url: unknown, init: RequestInit) => {
    keys.push(new Headers(init.headers).get("Idempotency-Key")!);
    if (keys.length === 1) throw new TypeError("Connection lost after commit");
    return Response.json({ id: "order" });
  }) as MutationFetch;
  const input = { practiceId: "practice", patientId: "private-patient" };
  await expect(createMutationClient(saved, send)("test", "orders", input)).rejects.toThrow();
  expect(JSON.stringify([...saved.values])).not.toContain("private-patient");
  await createMutationClient(saved, send)("test", "orders", input);
  expect(keys[1]).toBe(keys[0]);
  await createMutationClient(saved, send)("test", "orders", input);
  expect(keys[2]).not.toBe(keys[0]);
});

test("partial submission rejection allows a new attempt; in-progress and uncertain failures keep the key", async () => {
  for (const [status, code, rotate] of [
    [409, "conflict", true],
    [409, "idempotency_request_in_progress", false],
    [409, "idempotency_key_reused", false],
    [503, "idempotency_response_unavailable", false],
    [502, "upstream_error", false],
  ] as const) {
    const saved = storage();
    const keys: string[] = [];
    const send = (async (_url: unknown, init: RequestInit) => {
      keys.push(new Headers(init.headers).get("Idempotency-Key")!);
      return Response.json({ details: { code } }, { status });
    }) as MutationFetch;
    const call = createMutationClient(saved, send);
    await call("production", "submit", { orderId: "order" });
    await call("production", "submit", { orderId: "order" });
    expect(keys[0] === keys[1]).toBe(!rotate);
  }
});

test("pending mutations are isolated by mode and practice", async () => {
  const saved = storage();
  const keys: string[] = [];
  const send = (async (_url: unknown, init: RequestInit) => {
    keys.push(new Headers(init.headers).get("Idempotency-Key")!);
    throw new TypeError("Offline");
  }) as MutationFetch;
  const call = createMutationClient(saved, send);
  for (const [mode, practiceId] of [
    ["test", "a"],
    ["production", "a"],
    ["test", "b"],
  ]) {
    await expect(call(mode!, "orders", { practiceId })).rejects.toThrow();
  }
  expect(new Set(keys).size).toBe(3);
});

test("unavailable persistence prevents sending a mutation", async () => {
  let sent = false;
  const saved = storage();
  saved.setItem = () => {
    throw new Error("Storage unavailable");
  };
  const send = (async () => {
    sent = true;
    return Response.json({});
  }) as MutationFetch;
  await expect(createMutationClient(saved, send)("test", "orders", {})).rejects.toThrow(
    "Storage unavailable",
  );
  expect(sent).toBe(false);
});

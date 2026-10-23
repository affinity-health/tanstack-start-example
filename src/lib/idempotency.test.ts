import { afterEach, expect, test } from "bun:test";
import { idempotent, pendingInput } from "./idempotency";
const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
afterEach(() => {
  if (original) Object.defineProperty(globalThis, "sessionStorage", original);
  else Reflect.deleteProperty(globalThis, "sessionStorage");
});
test("an uncertain order retains the approved body and key through reload and rejects changed retries", async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  });
  const input = { directions: "Synthetic reviewed directions", quantity: 1 };
  let firstKey = "";
  await expect(
    idempotent("test-session", input, async (key) => {
      firstKey = key;
      expect(pendingInput<typeof input>("test-session")).toEqual(input);
      throw new Error("Response lost");
    }),
  ).rejects.toThrow("Response lost");
  await expect(
    idempotent("test-session", { ...input, quantity: 2 }, async () => {
      throw new Error("Must not send changed input");
    }),
  ).rejects.toThrow("Resolve the pending");
  const restored = pendingInput<typeof input>("test-session")!;
  await idempotent("test-session", restored, async (key) => {
    expect(key).toBe(firstKey);
    return "ord_test";
  });
  expect(pendingInput("test-session")).toBeUndefined();
});

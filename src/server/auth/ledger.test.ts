import { expect, test } from "bun:test";
import type { DurableObjectState } from "@cloudflare/workers-types";
import { DemoSessions } from "./ledger";

function ledger() {
  const values = new Map<string, unknown>();
  const storage = {
    get: async (key: string) => values.get(key),
    put: async (key: string, value: unknown) => {
      values.set(key, value);
    },
    setAlarm: async () => {},
    deleteAll: async () => {
      values.clear();
    },
    transaction: async (fn: (value: unknown) => Promise<unknown>) => fn(storage),
  };
  const object = new DemoSessions({ storage } as unknown as DurableObjectState);
  return {
    object,
    call: async (body: object) =>
      (
        await object.fetch(
          new Request("https://test", { method: "POST", body: JSON.stringify(body) }),
        )
      ).json(),
  };
}
test("session ownership is immutable, expires, and is removed by the alarm", async () => {
  const a = ledger(),
    b = ledger();
  expect(await a.call({ action: "read" })).toBeNull();
  await a.call({ action: "save", practiceId: "practice-a", expires: Date.now() / 1000 + 60 });
  expect(await a.call({ action: "read" })).toBe("practice-a");
  expect(await b.call({ action: "read" })).toBeNull();
  await expect(
    a.call({ action: "save", practiceId: "practice-b", expires: Date.now() / 1000 + 60 }),
  ).rejects.toThrow("already assigned");
  await a.object.alarm();
  expect(await a.call({ action: "read" })).toBeNull();
  await b.call({ action: "save", practiceId: "expired", expires: 1 });
  expect(await b.call({ action: "read" })).toBeNull();
});
test("quota bucket rejects requests after the configured limit", async () => {
  const { call } = ledger();
  const input = { action: "quota", limit: 2, expires: Date.now() / 1000 + 60 };
  expect(await call(input)).toBe(true);
  expect(await call(input)).toBe(true);
  expect(await call(input)).toBe(false);
});

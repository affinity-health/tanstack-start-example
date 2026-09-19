import { afterEach, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { receiveWebhook, type WebhookReceipt } from "./webhooks";
const names = [
  "AFFINITY_WEBHOOK_SECRET",
  "AFFINITY_WEBHOOK_ORGANIZATION_ID",
  "AFFINITY_WEBHOOK_LIVEMODE",
] as const;
const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
afterEach(() => {
  for (const name of names) {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }
});
function fixture() {
  const secret = "whsec_live_synthetic_receiver_test_12345";
  const organization = "acct_01k16x4ydkz6j7d9sn3xk2m4q8";
  Object.assign(process.env, {
    AFFINITY_WEBHOOK_SECRET: secret,
    AFFINITY_WEBHOOK_ORGANIZATION_ID: organization,
    AFFINITY_WEBHOOK_LIVEMODE: "true",
  });
  const records = new Map<string, string>();
  const store = {
    put: async (key: string, value: string) => {
      records.set(key, value);
    },
    list: async () => ({ keys: [] as Array<{ metadata?: WebhookReceipt }> }),
  };
  const event = {
    api_version: "2026-08-11",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "ord_01k16x4ydkz6j7d9sn3xk2m4q8", object: "order" } },
    id: "evt_01k16x4ydkz6j7d9sn3xk2m4q8",
    livemode: true,
    object: "event",
    organization_id: organization,
    request_id: null,
    type: "order.created",
  };
  const request = (value = event, age = 0, tamper = false) => {
    const body = JSON.stringify(value);
    const timestamp = Math.floor(Date.now() / 1000) - age;
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    return new Request("https://demo.example/api/webhooks/affinity", {
      method: "POST",
      headers: { "affinity-signature": `t=${timestamp},v1=${signature}` },
      body: body + (tamper ? " " : ""),
    });
  };
  return { records, store, event, request };
}
test("verified delivery and replay store one metadata-only receipt", async () => {
  const f = fixture();
  expect((await receiveWebhook(f.request(), f.store)).status).toBe(200);
  expect((await receiveWebhook(f.request(), f.store)).status).toBe(200);
  expect(f.records.size).toBe(1);
  expect(JSON.parse([...f.records.values()][0])).toEqual({
    id: f.event.id,
    type: f.event.type,
    livemode: true,
    resourceId: f.event.data.object.id,
    created: f.event.created,
  });
});
test("tampering, stale signatures, and wrong account or mode cannot create receipts", async () => {
  const f = fixture();
  expect((await receiveWebhook(f.request(f.event, 0, true), f.store)).status).toBe(400);
  expect((await receiveWebhook(f.request(f.event, 301), f.store)).status).toBe(400);
  expect((await receiveWebhook(f.request({ ...f.event, livemode: false }), f.store)).status).toBe(
    403,
  );
  expect(
    (
      await receiveWebhook(
        f.request({ ...f.event, organization_id: "acct_01k16x4ydkz6j7d9sn3xk2m4q9" }),
        f.store,
      )
    ).status,
  ).toBe(403);
  expect(f.records.size).toBe(0);
});
test("storage failure requests retry instead of acknowledging lost delivery", async () => {
  const f = fixture();
  expect(
    (
      await receiveWebhook(f.request(), {
        ...f.store,
        put: async () => {
          throw Error("unavailable");
        },
      })
    ).status,
  ).toBe(503);
});

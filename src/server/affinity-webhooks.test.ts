import { describe, expect, test } from "bun:test";

import { WebhookVerificationError, verifyAffinityWebhook } from "./affinity-webhooks";

const encoder = new TextEncoder();
const timestamp = 1_785_326_400;
const secret = "whsec_test_example";
const payload = JSON.stringify({
  api_version: "2026-07-29",
  created: timestamp,
  data: {
    object: {
      id: "order_01k00000000000000000000000",
      object: "order",
    },
  },
  id: "evt_01k00000000000000000000000",
  livemode: false,
  object: "event",
  organization_id: "org_01k00000000000000000000000",
  request_id: null,
  type: "webhook_endpoint.test",
});

describe("Affinity webhook verification", () => {
  test("accepts a current signed event", async () => {
    const event = await verifyAffinityWebhook({
      body: encoder.encode(payload),
      now: new Date(timestamp * 1_000),
      secret,
      signature: await signatureFor(payload),
    });

    expect(event.id).toBe("evt_01k00000000000000000000000");
    expect(event.type).toBe("webhook_endpoint.test");
  });

  test("rejects a changed body", async () => {
    expect(
      verifyAffinityWebhook({
        body: encoder.encode(payload.replace("test", "changed")),
        now: new Date(timestamp * 1_000),
        secret,
        signature: await signatureFor(payload),
      }),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  test("rejects an old delivery", async () => {
    expect(
      verifyAffinityWebhook({
        body: encoder.encode(payload),
        now: new Date((timestamp + 301) * 1_000),
        secret,
        signature: await signatureFor(payload),
      }),
    ).rejects.toBeInstanceOf(WebhookVerificationError);
  });
});

async function signatureFor(body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signed = encoder.encode(`${timestamp}.${body}`);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  const hex = [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}

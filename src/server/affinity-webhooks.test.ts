import { describe, expect, test } from "bun:test";

import { AffinityWebhookVerificationError, verifyAffinityWebhook } from "@affinity-health/sdk";

const encoder = new TextEncoder();
const timestamp = 1_785_326_400;
const secret = "whsec_test_example_signing_secret";
const payload = JSON.stringify({
  api_version: "2026-07-29",
  created: timestamp,
  data: {
    object: {
      id: "whe_01k00000000000000000000000",
      object: "webhook_endpoint",
    },
  },
  id: "evt_01k00000000000000000000000",
  livemode: false,
  object: "event",
  organization_id: "acct_01k00000000000000000000000",
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
    ).rejects.toBeInstanceOf(AffinityWebhookVerificationError);
  });

  test("rejects an old delivery", async () => {
    expect(
      verifyAffinityWebhook({
        body: encoder.encode(payload),
        now: new Date((timestamp + 301) * 1_000),
        secret,
        signature: await signatureFor(payload),
      }),
    ).rejects.toBeInstanceOf(AffinityWebhookVerificationError);
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

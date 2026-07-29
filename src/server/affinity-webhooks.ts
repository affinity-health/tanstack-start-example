const encoder = new TextEncoder();
const decoder = new TextDecoder();
const eventIdPattern = /^evt_[0-9a-hjkmnp-tv-z]{26}$/u;
const signaturePattern = /^[a-f0-9]{64}$/u;

export type AffinityWebhookEvent = {
  api_version: string;
  created: number;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  id: string;
  livemode: boolean;
  object: "event";
  organization_id: string;
  request_id: string | null;
  type: string;
};

export async function verifyAffinityWebhook(input: {
  body: Uint8Array;
  now?: Date;
  secret: string;
  signature: string | null;
  toleranceSeconds?: number;
}) {
  const parsedSignature = parseSignature(input.signature);
  const now = Math.floor((input.now ?? new Date()).getTime() / 1_000);
  if (Math.abs(now - parsedSignature.timestamp) > (input.toleranceSeconds ?? 300)) {
    throw new WebhookVerificationError("Webhook timestamp is outside the allowed tolerance");
  }

  const signedBody = concatBytes(encoder.encode(`${parsedSignature.timestamp}.`), input.body);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(input.secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["verify"],
  );
  let verified = false;
  for (const signature of parsedSignature.signatures) {
    if (await crypto.subtle.verify("HMAC", key, hexToBytes(signature), signedBody)) {
      verified = true;
    }
  }
  if (!verified) throw new WebhookVerificationError("Webhook signature is invalid");

  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(input.body));
  } catch {
    throw new WebhookVerificationError("Webhook body is not valid JSON");
  }
  if (!isAffinityWebhookEvent(value)) {
    throw new WebhookVerificationError("Webhook event envelope is invalid");
  }
  return value;
}

export class WebhookVerificationError extends Error {}

function parseSignature(value: string | null) {
  const parts = (value ?? "").split(",").map((part) => part.trim());
  const timestampValue = parts.find((part) => part.startsWith("t="))?.slice(2);
  if (!timestampValue || !/^\d{10}$/u.test(timestampValue)) {
    throw new WebhookVerificationError("Webhook timestamp is invalid");
  }
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter((part) => signaturePattern.test(part));
  if (signatures.length === 0) {
    throw new WebhookVerificationError("Webhook signature is missing");
  }
  return { signatures, timestamp: Number(timestampValue) };
}

function isAffinityWebhookEvent(value: unknown): value is AffinityWebhookEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record<string, unknown>;
  const data = event.data;
  return (
    event.api_version === "2026-07-29" &&
    Number.isSafeInteger(event.created) &&
    typeof event.created === "number" &&
    event.created >= 0 &&
    typeof data === "object" &&
    data !== null &&
    "object" in data &&
    typeof data.object === "object" &&
    data.object !== null &&
    typeof event.id === "string" &&
    eventIdPattern.test(event.id) &&
    typeof event.livemode === "boolean" &&
    event.object === "event" &&
    typeof event.organization_id === "string" &&
    event.organization_id.length > 0 &&
    (event.request_id === null || typeof event.request_id === "string") &&
    typeof event.type === "string" &&
    event.type.length > 0
  );
}

function concatBytes(left: Uint8Array, right: Uint8Array) {
  const value = new Uint8Array(left.length + right.length);
  value.set(left);
  value.set(right, left.length);
  return value;
}

function hexToBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/gu) ?? [], (byte) => Number.parseInt(byte, 16));
}

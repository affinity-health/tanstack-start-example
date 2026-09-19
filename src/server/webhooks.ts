import { verifyAffinityWebhook, AffinityWebhookVerificationError } from "@affinity-health/sdk";

export type WebhookReceipt = {
  id: string;
  type: string;
  livemode: boolean;
  resourceId: string;
  created: number;
};
type ReceiptStore = {
  put(
    key: string,
    value: string,
    options: { expirationTtl: number; metadata: WebhookReceipt },
  ): Promise<void>;
  list(options: {
    prefix: string;
    limit: number;
  }): Promise<{ keys: Array<{ metadata?: WebhookReceipt }> }>;
};
export function receiptStore(request: Request): ReceiptStore | undefined {
  return (
    request as Request & { runtime?: { cloudflare?: { env: { WEBHOOK_RECEIPTS?: ReceiptStore } } } }
  ).runtime?.cloudflare?.env.WEBHOOK_RECEIPTS;
}

export async function receiveWebhook(request: Request, store = receiptStore(request)) {
  const secret = process.env.AFFINITY_WEBHOOK_SECRET;
  const organizationId = process.env.AFFINITY_WEBHOOK_ORGANIZATION_ID;
  if (!secret || !organizationId || !store)
    return Response.json({ error: "Webhook receiver is not configured." }, { status: 503 });
  const reader = request.body?.getReader();
  if (!reader) return new Response("Missing body", { status: 400 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 1_048_576) {
      await reader.cancel();
      return new Response("Payload too large", { status: 413 });
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const event = await verifyAffinityWebhook({
      body,
      signature: request.headers.get("affinity-signature"),
      secret,
    });
    if (
      event.organization_id !== organizationId ||
      event.livemode !== (process.env.AFFINITY_WEBHOOK_LIVEMODE === "true")
    )
      return new Response("Wrong webhook account or mode", { status: 403 });
    const receipt: WebhookReceipt = {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      resourceId: event.data.object.id,
      created: event.created,
    };
    // Replayed events write the same key and value. No billing or clinical action occurs here.
    // KV is eventually consistent; a production EMR should use a transactional inbox before side effects.
    await store.put(`event:${event.id}`, JSON.stringify(receipt), {
      expirationTtl: 604800,
      metadata: receipt,
    });
    return Response.json({ received: true, eventId: event.id });
  } catch (error) {
    if (error instanceof AffinityWebhookVerificationError)
      return Response.json({ error: "Invalid webhook signature or event." }, { status: 400 });
    return Response.json({ error: "Could not save webhook. Retry delivery." }, { status: 503 });
  }
}

import { getOrder, signOrder, submitOrder } from "../../api/orders/functions";
import { idempotent } from "../../lib/idempotency";
import type { Order } from "../../api/types";

export async function sendReviewedOrder(
  sessionId: string,
  reviewed: Order,
  npi: string,
  onSigned: (order: Order) => void,
) {
  const current = await getOrder({ data: { orderId: reviewed.id } });
  // A lost submission response can leave the browser behind the actual order.
  if (["submitted", "processing", "shipped", "delivered"].includes(current.status))
    return { status: "submitted" as const, order: current };
  const versions = (order: Order) =>
    order.prescriptions.map((rx) => ({ prescriptionId: rx.id, version: rx.version }));
  if (
    JSON.stringify(versions(current)) !== JSON.stringify(versions(reviewed)) ||
    current.prescriberNpi !== reviewed.prescriberNpi ||
    current.status !== reviewed.status
  )
    return { status: "changed" as const, order: current };
  if (
    !["draft", "requires_provider_signature", "ready", "partially_submitted"].includes(
      current.status,
    )
  )
    throw new Error("This order can no longer be sent. Refresh it to see its current status.");
  if (["draft", "requires_provider_signature"].includes(current.status)) {
    const input = {
      orderId: current.id,
      npi,
      attested: true as const,
      expectedVersions: versions(current),
    };
    await idempotent(sessionId + ":sign", input, (key) => signOrder({ data: { ...input, key } }));
    const signed = await getOrder({ data: { orderId: current.id } });
    onSigned(signed);
  }
  const result = await idempotent(sessionId + ":submit", { orderId: current.id }, (key) =>
    submitOrder({ data: { orderId: current.id, key } }),
  );
  if (!result.ok) throw new Error(result.message);
  return { status: "submitted" as const, order: await getOrder({ data: { orderId: current.id } }) };
}

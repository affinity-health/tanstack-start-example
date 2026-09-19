import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { useWorkspace } from "../prescribing-app";
import { orderQuery } from "../queries";
import { resolvePrescriber } from "../demo-profile";
import { sendReviewedOrder } from "../order-workflow";
import type { Order } from "../types";

export function OrderDetail({ orderId }: { orderId: string }) {
  const {
    initial: { sessionId },
    profile,
    onBusy,
    openSettings,
  } = useWorkspace();
  const client = useQueryClient();
  const query = useQuery(orderQuery(sessionId, orderId));
  // Keep the reviewed snapshot stable while background queries refresh.
  const [order, setOrder] = useState<Order>();
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (!order && query.data) setOrder(query.data);
  }, [order, query.data]);
  useEffect(() => setAttested(false), [profile]);
  const identity = order ? resolvePrescriber(profile, order.patientState) : undefined;
  const identityReady =
    identity?.eligible && (!order?.prescriberNpi || identity.npi === order.prescriberNpi);
  const signed = order?.status === "ready" || order?.status === "partially_submitted";
  const actionable =
    !!order &&
    ["draft", "requires_provider_signature", "ready", "partially_submitted"].includes(order.status);
  async function refresh() {
    setAttested(false);
    setError("");
    const result = await query.refetch();
    if (result.data) setOrder(result.data);
  }
  async function send() {
    if (lock.current || !order || !attested || !identityReady || !identity) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const result = await sendReviewedOrder(sessionId, order, identity.npi, setOrder);
      setOrder(result.order);
      setAttested(false);
      if (result.status === "changed")
        setNotice("This order changed. Review the updated details and confirm again.");
      else {
        setNotice("");
        toast.success("Prescription sent to the pharmacy.");
      }
      client.setQueryData(orderQuery(sessionId, orderId).queryKey, result.order);
      void client.invalidateQueries({ queryKey: [sessionId, "orders"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send prescription.");
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <main>
      <Link to="/orders" disabled={busy}>
        Back to orders
      </Link>
      <div className="page-heading">
        <h1>Order details</h1>
      </div>
      {!order && query.isPending && <p role="status">Loading order…</p>}
      {query.error && (
        <div role="alert">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      )}
      {order && (
        <div className="order-detail">
          <p>
            {order.patientName} · {order.patientState} · Test mode
          </p>
          <p className="hint">
            {order.status.replaceAll("_", " ")} · {order.id}
          </p>
          {order.prescriptions.map((rx) => (
            <div className="saved-prescription order-review" key={rx.id}>
              <div className="review-medication">
                <div>
                  <h3>
                    {rx.medicationName} {rx.strength}
                  </h3>
                  <p className="hint">{rx.pharmacyName}</p>
                </div>
              </div>
              <p className="review-directions">{rx.directions}</p>
              <dl className="review-facts">
                <div>
                  <dt>Quantity</dt>
                  <dd>
                    {String(rx.quantity)} {rx.quantityUnit}
                  </dd>
                </div>
                <div>
                  <dt>Days supply</dt>
                  <dd>{String(rx.daysSupply ?? "Not specified")}</dd>
                </div>
                <div>
                  <dt>Refills</dt>
                  <dd>{rx.refills}</dd>
                </div>
              </dl>
              {rx.clinical?.compoundingReason && (
                <div>
                  <span className="hint">Patient-specific reason</span>
                  <p>{rx.clinical.compoundingReason.context}</p>
                </div>
              )}
              <div className="review-delivery">
                <span className="hint">Deliver to</span>
                <p>{rx.patientSnapshot.legalName}</p>
                <p>
                  {Object.values(rx.patientSnapshot.address ?? {})
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="hint">
                  Born {rx.patientSnapshot.dateOfBirth} · Version {rx.version}
                </p>
              </div>
            </div>
          ))}

          <div className="review-prescriber">
            <span className="hint">Prescriber</span>
            <p>
              {order.prescriberNpi
                ? `${order.prescriberName ?? "Prescriber"} · NPI ${order.prescriberNpi}`
                : identityReady
                  ? `${identity!.name} · NPI ${identity!.npi}`
                  : `No NPI saved for ${order.patientState}.`}
            </p>
            {actionable && !identityReady && (
              <>
                <p className="hint">
                  Choose an eligible Test NPI matching this order's prescriber, if assigned.
                </p>
                <Button variant="ghost" disabled={busy} onClick={openSettings}>
                  Edit settings
                </Button>
              </>
            )}
          </div>
          {actionable && (
            <div className="review-confirmations">
              <label className="check">
                <Checkbox checked={attested} disabled={busy} onCheckedChange={setAttested} />
                {signed
                  ? "I reviewed this signed prescription and authorize sending it to the pharmacy."
                  : "I reviewed this patient's history and prescription, confirm no known allergies, and authorize signing as the prescriber shown above."}
              </label>
            </div>
          )}
          {notice && (
            <p className="review-notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <div role="alert">
              <p>{error}</p>
              {signed && (
                <p>The prescription is signed. Retry sending; it will not be signed again.</p>
              )}
              <Button variant="outline" disabled={busy} onClick={() => void refresh()}>
                Refresh order for review
              </Button>
            </div>
          )}
          {actionable && (
            <Button
              disabled={busy || !attested || !identityReady || !order.prescriptions.length}
              onClick={() => void send()}
            >
              {busy ? "Sending…" : signed ? "Send to pharmacy" : "Sign and send to pharmacy"}
            </Button>
          )}
          <details className="review-details">
            <summary>Full order details</summary>
            <pre tabIndex={0}>{JSON.stringify(order, null, 2)}</pre>
          </details>
        </div>
      )}
    </main>
  );
}

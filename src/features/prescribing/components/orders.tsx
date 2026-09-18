import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "../../../components/ui/dialog";
import type { Order, Orders, Prescriber } from "../types";
import type { Profile } from "./prescriber-settings";

type Api = <T>(path: string, body?: unknown) => Promise<T>;
const statusLabel = (status: string) =>
  status.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase());
const canSign = (order: Order) => ["draft", "requires_provider_signature"].includes(order.status);

export function OrdersView({
  practiceId,
  mode,
  profile,
  api,
  onBusy,
  openSettings,
  onChanged,
}: {
  practiceId: string;
  mode: "test" | "production";
  profile: Profile;
  api: Api;
  onBusy: (busy: boolean) => void;
  openSettings: () => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "draft">("all");
  const [page, setPage] = useState<Orders>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order>();
  const [busy, setBusy] = useState("");
  const [attested, setAttested] = useState(false);
  const [notice, setNotice] = useState("");
  const [signed, setSigned] = useState(false);
  const [sent, setSent] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const listPath = `orders?practiceId=${encodeURIComponent(practiceId)}${filter === "draft" ? "&status=draft" : ""}`;

  async function load(more = false) {
    const request = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const next = await api<Orders>(
        listPath +
          (more && page?.data.length
            ? `&startingAfter=${encodeURIComponent(page.nextCursor ?? page.data.at(-1)!.id)}`
            : ""),
      );
      if (generation.current !== request) return;
      setPage((previous) =>
        more && previous
          ? {
              ...next,
              data: [
                ...new Map(
                  [...previous.data, ...next.data].map((item) => [item.id, item]),
                ).values(),
              ],
            }
          : next,
      );
    } catch (cause) {
      if (generation.current === request)
        setError(cause instanceof Error ? cause.message : "Unable to load orders.");
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }
  useEffect(() => {
    setPage(undefined);
    void load();
    return () => {
      generation.current++;
    };
  }, [listPath]);
  useEffect(() => {
    setAttested(false);
  }, [profile]);

  async function run(label: string, action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    onBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Request failed. Try again.");
    } finally {
      lock.current = false;
      setBusy("");
      onBusy(false);
    }
  }
  const orderPath = (id: string) =>
    `order?practiceId=${encodeURIComponent(practiceId)}&orderId=${encodeURIComponent(id)}`;
  async function open(id: string) {
    await run("Opening order", async () => {
      const current = await api<Order>(orderPath(id));
      setOrder(current);
      setSigned(current.status === "ready");
      setSent(false);
      setAttested(false);
      setNotice("");
    });
  }
  const identity = order ? profile.states[order.patientState] : undefined;
  const identityReady =
    !!identity?.name.trim() &&
    /^\d{10}$/.test(identity.npi) &&
    profile.confirmed &&
    (mode === "test" || !!profile.email.trim());
  const identityMatches =
    !order?.prescriberNpi ||
    (identity?.npi === order.prescriberNpi &&
      identity?.name.trim() === order.prescriberName?.trim());
  const actionable = !!order && (canSign(order) || order.status === "ready" || signed) && !sent;

  async function send() {
    if (!order || !actionable || !identityReady || !identityMatches || !attested) return;
    await run(signed ? "Sending to pharmacy" : "Signing prescription", async () => {
      // Re-read before acting; never attest to versions the user has not seen.
      const current = await api<Order>(orderPath(order.id));
      if (JSON.stringify(current) !== JSON.stringify(order)) {
        setOrder(current);
        setSigned(current.status === "ready");
        setAttested(false);
        setNotice("This order changed. Review the updated details and confirm again.");
        return;
      }
      const registered = await api<Prescriber>("prescriber", {
        practiceId,
        npi: identity!.npi,
        name: identity!.name,
        email: profile.email,
        identityAttestation: true,
      });
      if (!signed) {
        await api("allergies", { practiceId, patientId: order.patientId, confirmed: true });
        await api("sign", {
          orderId: order.id,
          practiceId,
          userId: registered.id,
          actorId: registered.externalId,
          signatureAttestation: true,
          expectedVersions: order.prescriptions.map((rx) => ({
            prescriptionId: rx.id,
            version: rx.version,
          })),
        });
        setSigned(true);
      }
      await api("submit", {
        orderId: order.id,
        practiceId,
        userId: registered.id,
        actorId: registered.externalId,
      });
      setSent(true);
      setNotice("Prescription submitted to the pharmacy.");
      onChanged();
      await load();
    });
  }

  return (
    <section className="orders-view" aria-label="Orders">
      <div className="orders-controls">
        <div className="view-switch" aria-label="Filter orders">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            aria-pressed={filter === "all"}
            disabled={!!busy}
            onClick={() => setFilter("all")}
          >
            All orders
          </Button>
          <Button
            variant={filter === "draft" ? "secondary" : "ghost"}
            aria-pressed={filter === "draft"}
            disabled={!!busy}
            onClick={() => setFilter("draft")}
          >
            Drafts
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh orders"
          disabled={loading || !!busy}
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      {error && !order && (
        <p role="alert" className="error">
          {error}{" "}
          <Button variant="ghost" onClick={() => void load()}>
            Try again
          </Button>
        </p>
      )}
      {!page && loading && (
        <p className="hint" role="status">
          Loading orders…
        </p>
      )}
      {page && !page.data.length && !loading && (
        <p className="orders-empty">{filter === "draft" ? "No drafts yet." : "No orders yet."}</p>
      )}
      <div className="orders-list" aria-busy={loading}>
        {page?.data.map((item) => (
          <button
            className="order-row"
            key={item.id}
            disabled={!!busy}
            onClick={(event) => {
              opener.current = event.currentTarget;
              void open(item.id);
            }}
          >
            <span className="order-row-main">
              <strong>{item.patientName}</strong>
              <span>
                {item.prescriptions
                  .map((rx) => `${rx.medicationName}${rx.strength ? ` ${rx.strength}` : ""}`)
                  .join(", ")}
              </span>
              <small>
                {new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {item.patientState}
              </small>
            </span>
            <span className="order-row-status">
              <span className="order-status" data-status={item.status}>
                {statusLabel(item.status)}
              </span>
              <ArrowUpRight size={16} aria-hidden />
            </span>
          </button>
        ))}
      </div>
      {page?.hasMore && (
        <Button variant="outline" disabled={loading || !!busy} onClick={() => void load(true)}>
          {loading ? "Loading…" : "Load more orders"}
        </Button>
      )}
      <Dialog
        open={!!order}
        onOpenChange={(value) => {
          if (!value && !busy) {
            setOrder(undefined);
            setError("");
          }
        }}
      >
        <DialogPopup
          className="prescription-dialog"
          finalFocus={opener}
          closeProps={{ disabled: !!busy }}
        >
          <DialogHeader>
            <DialogTitle>
              {sent
                ? "Prescription submitted"
                : actionable
                  ? "Review prescription"
                  : "Order details"}
            </DialogTitle>
            <DialogDescription>
              {order?.patientName} · {order?.patientState} ·{" "}
              {mode === "test" ? "Test mode" : "Production"}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {order && (
              <>
                <p className="hint">
                  {statusLabel(sent ? "submitted" : signed ? "ready" : order.status)} · {order.id}
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
                      ? `${order.prescriberName} · NPI ${order.prescriberNpi}`
                      : identityReady
                        ? `${identity!.name} · NPI ${identity!.npi}`
                        : `No prescriber saved for ${order.patientState}.`}
                  </p>
                  {actionable && (!identityReady || !identityMatches) && (
                    <>
                      <p className="hint">
                        {identityMatches
                          ? "Add your prescriber settings to continue."
                          : "Your saved name and NPI must match this order's prescriber."}
                      </p>
                      <Button variant="ghost" disabled={!!busy} onClick={openSettings}>
                        Edit settings
                      </Button>
                    </>
                  )}
                </div>
                {actionable && (
                  <div className="review-confirmations">
                    <label className="check">
                      <Checkbox
                        checked={attested}
                        disabled={!!busy}
                        onCheckedChange={setAttested}
                      />
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
                  <div className="error" role="alert">
                    <p>
                      {signed
                        ? "The prescription is signed. Retry sending; it will not be signed again. "
                        : ""}
                      {error}
                    </p>
                    <Button variant="outline" disabled={!!busy} onClick={() => void open(order.id)}>
                      Refresh order for review
                    </Button>
                  </div>
                )}
                <details className="review-details">
                  <summary>Full order details</summary>
                  <pre tabIndex={0}>{JSON.stringify(order, null, 2)}</pre>
                </details>
              </>
            )}
          </DialogPanel>
          <DialogFooter>
            {actionable ? (
              <Button
                disabled={
                  !!busy ||
                  !attested ||
                  !identityReady ||
                  !identityMatches ||
                  !order?.prescriptions.length
                }
                onClick={() => void send()}
              >
                {busy ? `${busy}…` : signed ? "Send to pharmacy" : "Sign and send to pharmacy"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setOrder(undefined);
                  setError("");
                }}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </section>
  );
}

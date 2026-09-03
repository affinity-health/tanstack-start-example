import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmrShell } from "../../components/emr-shell";
import { useClinicCommerce } from "../../features/marketplace/clinic-commerce";
import { demoCatalog, demoPatients } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/cart")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Cart | Northstar Health" }] }),
  component: Cart,
});

function Cart() {
  const { session } = Route.useRouteContext();
  const commerce = useClinicCommerce();
  const [confirmed, setConfirmed] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const patientIds = [...new Set(commerce.cart.map((line) => line.patientId))];
  const selectedPatientId = patientIds.includes(commerce.selectedCartPatientId)
    ? commerce.selectedCartPatientId
    : (patientIds[0] ?? commerce.selectedCartPatientId);
  const patient = demoPatients.find((item) => item.id === selectedPatientId) ?? demoPatients[0]!;
  const lines = commerce.cart.filter((line) => line.patientId === patient.id);
  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          (demoCatalog.find((product) => product.id === line.productId)?.price ?? 0) *
            line.quantity,
        0,
      ),
    [lines],
  );

  function submit() {
    if (!confirmed) return;
    const order = commerce.submitPatientCart(patient.id);
    if (order) {
      setSubmittedId(order.id);
      setConfirmed(false);
    }
  }

  return (
    <EmrShell
      current="cart"
      description="Review products before creating a Test order"
      session={session}
      title="Cart"
    >
      {submittedId ? (
        <section className="cart-success" role="status">
          <CheckCircle2 aria-hidden size={20} />
          <span>
            <strong>Test order submitted</strong>
            <small>{submittedId} is now in Orders.</small>
          </span>
          <Link search={{ patientId: undefined }} to="/medication-orders">
            View order
          </Link>
        </section>
      ) : null}
      {commerce.cartCount ? (
        <div className="cart-layout">
          <main className="cart-workspace">
            <div className="cart-patient-tabs" aria-label="Patient carts">
              {patientIds.map((patientId) => {
                const item = demoPatients.find((candidate) => candidate.id === patientId)!;
                const count = commerce.cart
                  .filter((line) => line.patientId === patientId)
                  .reduce((sum, line) => sum + line.quantity, 0);
                return (
                  <button
                    aria-pressed={patient.id === patientId}
                    className={patient.id === patientId ? "is-active" : undefined}
                    key={patientId}
                    onClick={() => {
                      commerce.setSelectedCartPatientId(patientId);
                      setConfirmed(false);
                    }}
                    type="button"
                  >
                    <span className="emr-person-avatar" aria-hidden>
                      {initials(item.name)}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {count} {count === 1 ? "item" : "items"}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            <section className="cart-patient-header">
              <div>
                <h2>{patient.name}</h2>
                <p>
                  {patient.age} years · {patient.state} · {patient.carePlan}
                </p>
              </div>
              <Link to="/patients" search={{ patientId: patient.id }}>
                View patient
              </Link>
            </section>
            <div className="cart-lines">
              {lines.map((line) => {
                const product = demoCatalog.find((item) => item.id === line.productId)!;
                return (
                  <article key={line.productId}>
                    <span
                      className={`cart-product-mark product-art-${product.category.toLowerCase().replaceAll(" ", "-")}`}
                    >
                      {product.name.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.strength} · {product.dosageForm}
                      </small>
                      <small>{product.pharmacy}</small>
                    </span>
                    <span className="cart-quantity">
                      <button
                        aria-label={`Decrease ${product.name} quantity`}
                        disabled={line.quantity === 1}
                        onClick={() =>
                          commerce.updateQuantity(product.id, patient.id, line.quantity - 1)
                        }
                        type="button"
                      >
                        <Minus aria-hidden size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        aria-label={`Increase ${product.name} quantity`}
                        onClick={() =>
                          commerce.updateQuantity(product.id, patient.id, line.quantity + 1)
                        }
                        type="button"
                      >
                        <Plus aria-hidden size={14} />
                      </button>
                    </span>
                    <strong className="cart-line-price">${product.price * line.quantity}</strong>
                    <button
                      aria-label={`Remove ${product.name}`}
                      className="cart-remove"
                      onClick={() => commerce.removeFromCart(product.id, patient.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden size={15} />
                    </button>
                  </article>
                );
              })}
            </div>
            <Link className="cart-add-more" to="/dashboard">
              <Plus aria-hidden size={15} />
              Add another product
            </Link>
          </main>
          <aside className="cart-review">
            <header>
              <ShoppingBag aria-hidden size={18} />
              <h2>Review cart</h2>
            </header>
            <dl>
              <div>
                <dt>Patient</dt>
                <dd>{patient.name}</dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>{lines.reduce((sum, line) => sum + line.quantity, 0)}</dd>
              </div>
              <div>
                <dt>Estimated total</dt>
                <dd>${total}</dd>
              </div>
            </dl>
            <label className="cart-confirm">
              <input
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                type="checkbox"
              />
              <span>
                <strong>Clinician confirmation</strong>I reviewed the patient and every cart item.
              </span>
            </label>
            <button
              className="emr-button emr-button-primary emr-button-full"
              disabled={!confirmed || !lines.length}
              onClick={submit}
              type="button"
            >
              Confirm Test checkout
            </button>
            <p>
              <ShieldCheck aria-hidden size={14} />
              Agents cannot use this confirmation.
            </p>
          </aside>
        </div>
      ) : (
        <section className="cart-empty">
          <ShoppingBag aria-hidden size={28} />
          <h2>Your cart is empty</h2>
          <p>Search the synthetic marketplace and add a product for a patient.</p>
          <Link className="emr-button emr-button-primary" to="/dashboard">
            Browse marketplace
          </Link>
        </section>
      )}
    </EmrShell>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

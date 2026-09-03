import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { EmrShell, EmrStatus } from "../../components/emr-shell";
import { HeadlessSdkDemo } from "../../features/affinity";
import { demoOrders, demoPatients } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

type MedicationOrdersSearch = { patientId?: string };
type OrderStatus = "All" | "Draft" | "Submitted" | "Accepted";

export const Route = createFileRoute("/(workspace)/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Orders | Northstar Health" }] }),
  validateSearch: (search: Record<string, unknown>): MedicationOrdersSearch => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: MedicationOrders,
});

function MedicationOrders() {
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const preparedPatient = demoPatients.find((patient) => patient.id === search.patientId);
  const preparedOrder = demoOrders.find((order) => order.patient === preparedPatient?.name);
  const [selectedId, setSelectedId] = useState<string | null>(preparedOrder?.id ?? null);
  const [status, setStatus] = useState<OrderStatus>("All");
  const [query, setQuery] = useState("");
  const selectedOrder = demoOrders.find((order) => order.id === selectedId);
  const visibleOrders = useMemo(() => {
    const value = query.trim().toLowerCase();
    return demoOrders.filter(
      (order) =>
        (status === "All" || order.status === status) &&
        (!value ||
          [order.id, order.patient, order.medication].join(" ").toLowerCase().includes(value)),
    );
  }, [query, status]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  return (
    <EmrShell
      current="prescriptions"
      description={`${demoOrders.length} synthetic orders · Affinity Test`}
      session={session}
      title="Orders"
    >
      {preparedPatient ? (
        <div className="emr-agent-handoff" role="status">
          <Bot aria-hidden size={16} />
          <span>
            WebMCP opened {preparedPatient.name} for review. No clinical action was taken.
          </span>
        </div>
      ) : null}
      <section className="emr-list-panel">
        <div className="emr-status-tabs" role="tablist" aria-label="Order status">
          {(["All", "Draft", "Submitted", "Accepted"] as const).map((option) => {
            const count =
              option === "All"
                ? demoOrders.length
                : demoOrders.filter((order) => order.status === option).length;
            return (
              <button
                aria-selected={status === option}
                className={status === option ? "is-active" : undefined}
                key={option}
                onClick={() => setStatus(option)}
                role="tab"
                type="button"
              >
                {option}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="emr-list-toolbar">
          <label className="emr-search">
            <Search aria-hidden size={16} />
            <span className="sr-only">Search orders</span>
            <input
              placeholder="Search patient, medication, or order ID"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {visibleOrders.length ? (
          <div className="emr-order-groups">
            {visibleOrders.map((order) => (
              <section key={order.id} className="emr-order-group">
                <header>
                  <span className="emr-person-avatar" aria-hidden>
                    {initials(order.patient)}
                  </span>
                  <strong>{order.patient}</strong>
                  <small>1 order</small>
                </header>
                <button
                  className={selectedId === order.id ? "is-selected" : undefined}
                  onClick={() => setSelectedId(order.id)}
                  type="button"
                >
                  <span>
                    <strong>{order.medication}</strong>
                    <small>{order.id}</small>
                  </span>
                  <span>
                    <strong>{order.dose}</strong>
                    <small>{order.pharmacy}</small>
                  </span>
                  <EmrStatus tone={order.status === "Draft" ? "attention" : "success"}>
                    {order.status}
                  </EmrStatus>
                  <span className="emr-order-updated">{order.updated}</span>
                  <ChevronRight aria-hidden size={16} />
                </button>
              </section>
            ))}
          </div>
        ) : (
          <div className="emr-empty">
            <Search aria-hidden size={22} />
            <strong>No matching orders</strong>
            <span>Try another search or status.</span>
            <button
              className="emr-button emr-button-secondary"
              onClick={() => {
                setQuery("");
                setStatus("All");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {selectedOrder ? (
        <>
          <button
            aria-label="Close order details"
            className="emr-sheet-backdrop"
            onClick={() => setSelectedId(null)}
            type="button"
          />
          <aside
            aria-label={`${selectedOrder.patient} order details`}
            className="emr-detail-sheet emr-order-sheet"
          >
            <header className="emr-sheet-header">
              <div>
                <h2>{selectedOrder.medication}</h2>
                <p>
                  {selectedOrder.patient} · {selectedOrder.id}
                </p>
              </div>
              <EmrStatus tone={selectedOrder.status === "Draft" ? "attention" : "success"}>
                {selectedOrder.status}
              </EmrStatus>
              <button aria-label="Close details" onClick={() => setSelectedId(null)} type="button">
                <X aria-hidden size={18} />
              </button>
            </header>
            {selectedOrder.status === "Draft" ? (
              <div className="emr-order-review">
                <HeadlessSdkDemo preferredPatientName={selectedOrder.patient} />
              </div>
            ) : (
              <div className="emr-sheet-body">
                <div className="emr-order-complete">
                  <CheckCircle2 aria-hidden size={20} />
                  <div>
                    <strong>{selectedOrder.status}</strong>
                    <p>This synthetic order is read only.</p>
                  </div>
                </div>
                <dl className="emr-detail-list">
                  <div>
                    <dt>Dose</dt>
                    <dd>{selectedOrder.dose}</dd>
                  </div>
                  <div>
                    <dt>Directions</dt>
                    <dd>{selectedOrder.directions}</dd>
                  </div>
                  <div>
                    <dt>Pharmacy</dt>
                    <dd>{selectedOrder.pharmacy}</dd>
                  </div>
                  <div>
                    <dt>Prescriber</dt>
                    <dd>{selectedOrder.prescriber}</dd>
                  </div>
                  <div>
                    <dt>Started</dt>
                    <dd>{selectedOrder.written}</dd>
                  </div>
                </dl>
              </div>
            )}
          </aside>
        </>
      ) : null}
    </EmrShell>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

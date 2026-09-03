import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmrShell, EmrStatus } from "../../components/emr-shell";
import { useClinicCommerce } from "../../features/marketplace/clinic-commerce";
import { demoCatalog, demoOrders, demoPatients } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Orders | Northstar Health" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: Orders,
});

function Orders() {
  const { session } = Route.useRouteContext();
  const commerce = useClinicCommerce();
  const [query, setQuery] = useState("");
  const orders = useMemo(
    () =>
      [
        ...commerce.orders.map((order) => ({
          id: order.id,
          patient:
            demoPatients.find((patient) => patient.id === order.patientId)?.name ??
            "Synthetic patient",
          medication: order.productIds
            .map((id) => demoCatalog.find((product) => product.id === id)?.name)
            .filter(Boolean)
            .join(", "),
          status: order.status,
          updated: order.submittedAt,
        })),
        ...demoOrders.filter((order) => order.status !== "Draft"),
      ].filter(
        (order) =>
          !query.trim() ||
          [order.id, order.patient, order.medication, order.status]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [commerce.orders, query],
  );

  return (
    <EmrShell
      current="prescriptions"
      description="Orders confirmed by a clinician"
      session={session}
      title="Orders"
    >
      <section className="emr-list-panel">
        <div className="emr-list-toolbar">
          <label className="emr-search">
            <Search aria-hidden size={16} />
            <span className="sr-only">Search orders</span>
            <input
              placeholder="Search patient, product, or order ID"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <span className="orders-count">{orders.length} orders</span>
        </div>
        {orders.length ? (
          <div className="emr-table-wrap">
            <table className="emr-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.patient}</strong>
                      <small>{order.id}</small>
                    </td>
                    <td>{order.medication}</td>
                    <td>
                      <EmrStatus tone="success">{order.status}</EmrStatus>
                    </td>
                    <td>{order.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emr-empty">
            <Search aria-hidden size={22} />
            <strong>No matching orders</strong>
            <span>Try another patient, product, or order ID.</span>
          </div>
        )}
      </section>
    </EmrShell>
  );
}

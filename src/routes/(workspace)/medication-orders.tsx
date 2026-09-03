import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  FilePlus2,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../../components/emr-shell";
import { HeadlessSdkDemo } from "../../features/affinity";
import { demoOrders, demoPatients } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

type MedicationOrdersSearch = {
  patientId?: string;
};

export const Route = createFileRoute("/(workspace)/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Medication orders | Northstar Health" }],
  }),
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
  const [selectedId, setSelectedId] = useState<string>(preparedOrder?.id ?? demoOrders[0]!.id);
  const selectedOrder = useMemo(
    () => demoOrders.find((order) => order.id === selectedId) ?? demoOrders[0]!,
    [selectedId],
  );
  const [reviewPatientName, setReviewPatientName] = useState<string | undefined>(
    preparedPatient?.name ?? (selectedOrder.status === "Draft" ? selectedOrder.patient : undefined),
  );

  function selectOrder(orderId: string) {
    const order = demoOrders.find((item) => item.id === orderId);
    setSelectedId(orderId);
    setReviewPatientName(order?.status === "Draft" ? order.patient : undefined);
  }

  return (
    <EmrShell
      actions={
        <button
          className="emr-button emr-button-primary"
          type="button"
          onClick={() => {
            setSelectedId(demoOrders[0]!.id);
            setReviewPatientName(demoOrders[0]!.patient);
          }}
        >
          <FilePlus2 aria-hidden size={16} />
          New order
        </button>
      }
      current="prescriptions"
      description="Review drafts and track medication orders for your patients."
      eyebrow="Clinical workspace"
      session={session}
      title="Medication orders"
    >
      {preparedPatient ? (
        <section className="agent-review-handoff" aria-label="Prepared medication review">
          <span className="agent-tools-mark">
            <Bot aria-hidden size={18} />
          </span>
          <span>
            <strong>Unsigned review prepared for {preparedPatient.name}</strong>
            <small>
              WebMCP opened the patient context. No order was created. A clinician must review and
              confirm every field.
            </small>
          </span>
          <span className="agent-review-tag">Synthetic patient</span>
        </section>
      ) : null}

      <section className="emr-order-summary" aria-label="Order summary">
        <div>
          <span className="emr-status-icon">
            <Pill aria-hidden size={16} />
          </span>
          <span>
            <small>Open drafts</small>
            <strong>1</strong>
          </span>
        </div>
        <div>
          <span className="emr-status-icon is-success">
            <CheckCircle2 aria-hidden size={16} />
          </span>
          <span>
            <small>Sent today</small>
            <strong>1</strong>
          </span>
        </div>
        <div>
          <span className="emr-status-icon">
            <Clock3 aria-hidden size={16} />
          </span>
          <span>
            <small>Awaiting pharmacy</small>
            <strong>1</strong>
          </span>
        </div>
        <div>
          <span className="emr-status-icon">
            <ShieldCheck aria-hidden size={16} />
          </span>
          <span>
            <small>Environment</small>
            <strong>Affinity Test</strong>
          </span>
        </div>
      </section>

      <div className="emr-orders-layout">
        <section className="emr-panel">
          <EmrSectionHeading
            description={`${demoOrders.length} synthetic orders`}
            title="Order queue"
          />
          <div className="emr-table-wrap">
            <table className="emr-table emr-orders-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {demoOrders.map((order) => (
                  <tr
                    className={selectedOrder.id === order.id ? "is-selected" : undefined}
                    key={order.id}
                  >
                    <td>
                      <button
                        className="emr-order-select"
                        type="button"
                        onClick={() => selectOrder(order.id)}
                      >
                        <strong>{order.patient}</strong>
                        <small>{order.id}</small>
                      </button>
                    </td>
                    <td>
                      <strong>{order.medication}</strong>
                      <small>{order.dose}</small>
                    </td>
                    <td>
                      <EmrStatus tone={order.status === "Draft" ? "attention" : "success"}>
                        {order.status}
                      </EmrStatus>
                    </td>
                    <td>{order.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="emr-panel emr-order-detail" aria-labelledby="order-detail-title">
          <header>
            <div>
              <span>Order detail</span>
              <h2 id="order-detail-title">{selectedOrder.medication}</h2>
              <p>{selectedOrder.patient}</p>
            </div>
            <EmrStatus tone={selectedOrder.status === "Draft" ? "attention" : "success"}>
              {selectedOrder.status}
            </EmrStatus>
          </header>
          <dl>
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
          {selectedOrder.status === "Draft" ? (
            <button
              className="emr-button emr-button-primary emr-button-full"
              type="button"
              onClick={() => setReviewPatientName(selectedOrder.patient)}
            >
              <ClipboardCheck aria-hidden size={16} />
              Review unsigned draft
            </button>
          ) : (
            <p className="emr-order-note">
              This synthetic order is read only in the demo workspace.
            </p>
          )}
        </aside>
      </div>

      {reviewPatientName ? <HeadlessSdkDemo preferredPatientName={reviewPatientName} /> : null}
    </EmrShell>
  );
}

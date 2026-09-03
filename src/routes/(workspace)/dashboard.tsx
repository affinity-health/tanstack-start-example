import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Pill, UserRound } from "lucide-react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../../components/emr-shell";
import { demoOrders, demoSchedule } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/dashboard")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Home | Northstar Health" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = Route.useRouteContext();
  const appointments = demoSchedule["Jul 29"];

  return (
    <EmrShell current="overview" description="Wednesday, July 29" session={session} title="Home">
      <section className="emr-metric-strip" aria-label="Clinic summary">
        <div>
          <strong>4</strong>
          <span>Visits today</span>
        </div>
        <div>
          <strong>3</strong>
          <span>Need attention</span>
        </div>
        <div>
          <strong>1</strong>
          <span>Unsigned draft</span>
        </div>
      </section>

      <div className="emr-home-grid">
        <section className="emr-list-panel">
          <EmrSectionHeading title="Needs attention" description="3 items" />
          <div className="emr-work-queue">
            <Link to="/medication-orders" search={{ patientId: "pat_ada_zieme" }}>
              <span className="emr-row-icon is-attention">
                <ClipboardCheck aria-hidden size={17} />
              </span>
              <span>
                <strong>Review Ada Zieme’s unsigned draft</strong>
                <small>Semaglutide + B12 · 8 min ago</small>
              </span>
              <EmrStatus tone="attention">Draft</EmrStatus>
              <ArrowRight aria-hidden size={15} />
            </Link>
            <Link to="/patients" search={{ patientId: "pat_denise_kuhn" }}>
              <span className="emr-row-icon">
                <UserRound aria-hidden size={17} />
              </span>
              <span>
                <strong>Review Denise Kuhn’s chart</strong>
                <small>New lab panel received this morning</small>
              </span>
              <EmrStatus>Review</EmrStatus>
              <ArrowRight aria-hidden size={15} />
            </Link>
            <Link to="/patients" search={{ patientId: "pat_matthew_kihn" }}>
              <span className="emr-row-icon">
                <Pill aria-hidden size={17} />
              </span>
              <span>
                <strong>Reconcile Matthew Kihn’s medications</strong>
                <small>Outside medication list needs review</small>
              </span>
              <EmrStatus>Patient</EmrStatus>
              <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
        </section>

        <section className="emr-list-panel">
          <EmrSectionHeading title="Today" description="Next visits" />
          <div className="emr-compact-schedule">
            {appointments.slice(0, 4).map((appointment) => (
              <div key={appointment.id}>
                <span>
                  <strong>{appointment.time}</strong>
                  <small>{appointment.duration}</small>
                </span>
                <span>
                  <strong>{appointment.patient}</strong>
                  <small>{appointment.type}</small>
                </span>
                <EmrStatus tone={appointment.status === "Needs intake" ? "attention" : "success"}>
                  {appointment.status}
                </EmrStatus>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="emr-list-panel">
        <EmrSectionHeading
          action={
            <Link className="emr-text-link" to="/medication-orders">
              View orders
            </Link>
          }
          title="Recent orders"
        />
        <div className="emr-table-wrap">
          <table className="emr-table">
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
                <tr key={order.id}>
                  <td>
                    <strong>{order.patient}</strong>
                    <small>{order.id}</small>
                  </td>
                  <td>{order.medication}</td>
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
    </EmrShell>
  );
}

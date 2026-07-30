import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, FileWarning, MessageSquare, Pill, Users, Video } from "lucide-react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../components/emr-shell";
import { demoOrders, demoSchedule } from "../lib/demo-data";
import { requireSession } from "../lib/require-session";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Overview | Northstar Health" }],
  }),
  component: Dashboard,
});

const overviewStats = [
  { detail: "4 remaining today", icon: CalendarDays, label: "Appointments", value: "12" },
  { detail: "2 need review", icon: Users, label: "Active patients", value: "86" },
  { detail: "1 draft", icon: Pill, label: "Medication orders", value: "7" },
  { detail: "2 unread", icon: MessageSquare, label: "Messages", value: "3" },
] as const;

function Dashboard() {
  const { session } = Route.useRouteContext();
  const firstName = session.user.name.split(/\s+/u)[0] || "Clinician";
  const appointments = demoSchedule["Jul 29"].slice(0, 3);

  return (
    <EmrShell
      actions={
        <Link className="emr-button emr-button-primary" to="/medication-orders">
          <Pill aria-hidden size={16} />
          New prescription
        </Link>
      }
      current="overview"
      description="Your schedule, clinical work, and Affinity integration in one place."
      session={session}
      title={`Good evening, ${firstName}`}
    >
      <section className="emr-stat-strip" aria-label="Workspace summary">
        {overviewStats.map(({ detail, icon: Icon, label, value }) => (
          <div key={label}>
            <span className="emr-stat-icon">
              <Icon aria-hidden size={17} />
            </span>
            <span>
              <small>{label}</small>
              <strong>{value}</strong>
              <small>{detail}</small>
            </span>
          </div>
        ))}
      </section>

      <div className="emr-overview-grid">
        <section className="emr-panel">
          <EmrSectionHeading
            action={
              <Link className="emr-text-link" to="/schedule">
                View schedule
              </Link>
            }
            description="Wednesday, July 29"
            title="Next appointments"
          />
          <div className="emr-agenda-list">
            {appointments.map((appointment) => (
              <article className="emr-agenda-row" key={appointment.id}>
                <div className="emr-agenda-time">
                  <strong>{appointment.time}</strong>
                  <span>{appointment.duration}</span>
                </div>
                <div className="emr-agenda-person">
                  <strong>{appointment.patient}</strong>
                  <span>{appointment.type}</span>
                </div>
                <span className="emr-agenda-mode">
                  {appointment.mode === "Telehealth" ? (
                    <Video aria-hidden size={14} />
                  ) : (
                    <Users aria-hidden size={14} />
                  )}
                  {appointment.mode}
                </span>
                <EmrStatus tone={appointment.status === "Needs intake" ? "attention" : "success"}>
                  {appointment.status}
                </EmrStatus>
              </article>
            ))}
          </div>
        </section>

        <section className="emr-panel">
          <EmrSectionHeading description="Items that need a decision" title="Needs attention" />
          <div className="emr-task-list">
            <Link to="/documents">
              <span className="emr-task-icon">
                <FileWarning aria-hidden size={16} />
              </span>
              <span>
                <strong>Review Denise Kuhn’s lab results</strong>
                <small>Received this morning</small>
              </span>
              <span>Review</span>
            </Link>
            <Link to="/medication-orders">
              <span className="emr-task-icon">
                <Pill aria-hidden size={16} />
              </span>
              <span>
                <strong>Complete Ada Zieme’s prescription</strong>
                <small>Draft saved 8 minutes ago</small>
              </span>
              <span>Continue</span>
            </Link>
            <Link to="/messages">
              <span className="emr-task-icon">
                <MessageSquare aria-hidden size={16} />
              </span>
              <span>
                <strong>Reply to 2 patient messages</strong>
                <small>Oldest received at 9:16 AM</small>
              </span>
              <span>Open</span>
            </Link>
          </div>
        </section>
      </div>

      <section className="emr-panel">
        <EmrSectionHeading
          action={
            <Link className="emr-text-link" to="/medication-orders">
              Open prescribing
            </Link>
          }
          description="Test-mode activity from the Affinity integration"
          title="Recent medication orders"
        />
        <div className="emr-table-wrap">
          <table className="emr-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medication</th>
                <th>Pharmacy</th>
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
                  <td>{order.pharmacy}</td>
                  <td>
                    <EmrStatus tone={order.status === "Accepted" ? "success" : "neutral"}>
                      {order.status}
                    </EmrStatus>
                  </td>
                  <td>
                    <span className="emr-inline-meta">
                      <Clock3 aria-hidden size={13} />
                      {order.updated}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </EmrShell>
  );
}

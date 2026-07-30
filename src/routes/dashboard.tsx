import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  Wifi,
} from "lucide-react";

import { AffinityPrescriptionComposer } from "../components/affinity-prescription-composer";
import { authClient } from "../lib/auth-client";
import { getSession } from "../lib/session.functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    return { session };
  },
  head: () => ({
    meta: [{ title: "Medication orders | Northstar Health" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { session } = Route.useRouteContext();
  const initials = session.user.name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="emr-app">
      <header className="emr-topbar">
        <Link className="emr-brand" to="/">
          <span className="emr-brand-mark">
            <Stethoscope aria-hidden size={18} />
          </span>
          <span>
            <strong>Northstar Health</strong>
            <small>Clinical workspace</small>
          </span>
        </Link>
        <div className="emr-topbar-actions">
          <span className="emr-environment">
            <span aria-hidden />
            Demo environment
          </span>
          <div className="emr-user">
            <span className="emr-avatar" aria-hidden>
              {initials}
            </span>
            <span className="emr-user-copy">
              <strong>{session.user.name}</strong>
              <small>{session.user.email}</small>
            </span>
          </div>
          <button
            aria-label="Sign out"
            className="emr-icon-button"
            title="Sign out"
            type="button"
            onClick={async () => {
              await authClient.signOut();
              await navigate({ to: "/" });
            }}
          >
            <LogOut aria-hidden size={17} />
          </button>
        </div>
      </header>

      <div className="emr-layout">
        <aside className="emr-sidebar">
          <nav aria-label="Clinical workspace">
            <p>Workspace</p>
            <a href="#workspace-overview">
              <LayoutDashboard aria-hidden size={17} /> Overview
            </a>
            <a href="#schedule">
              <CalendarDays aria-hidden size={17} /> Schedule
              <span>12</span>
            </a>
            <a href="#patients">
              <Users aria-hidden size={17} /> Patients
            </a>
            <a className="is-active" href="#prescription-composer" aria-current="page">
              <Pill aria-hidden size={17} /> Medication orders
            </a>
            <a href="#documents">
              <FileText aria-hidden size={17} /> Documents
            </a>
            <a href="#messages">
              <MessageSquare aria-hidden size={17} /> Messages
              <span>3</span>
            </a>
          </nav>

          <div className="emr-practice-card">
            <span className="emr-practice-icon">
              <Activity aria-hidden size={17} />
            </span>
            <div>
              <small>Active practice</small>
              <strong>Northstar Telehealth</strong>
              <span>Test workspace</span>
            </div>
          </div>

          <a className="emr-api-link" href="/api/openapi">
            API reference <ArrowUpRight aria-hidden size={15} />
          </a>
        </aside>

        <section className="emr-main" id="workspace-overview">
          <div className="emr-breadcrumb">
            Clinical <span>/</span> Medication orders
          </div>

          <div className="emr-page-heading">
            <div>
              <p>Prescribing workspace</p>
              <h1>New prescription</h1>
              <span>
                Create a medication order with the verified provider and practice context.
              </span>
            </div>
            <div className="emr-date">
              <CalendarDays aria-hidden size={17} />
              <span>
                <small>Today</small>
                <strong>July 29, 2026</strong>
              </span>
            </div>
          </div>

          <section className="emr-status-grid" aria-label="Integration status">
            <article>
              <span className="emr-status-icon is-success">
                <Wifi aria-hidden size={16} />
              </span>
              <div>
                <small>Integration</small>
                <strong>Affinity connected</strong>
              </div>
              <span className="emr-status-dot">Online</span>
            </article>
            <article>
              <span className="emr-status-icon">
                <ShieldCheck aria-hidden size={16} />
              </span>
              <div>
                <small>Access</small>
                <strong>Provider verified</strong>
              </div>
            </article>
            <article>
              <span className="emr-status-icon">
                <ClipboardList aria-hidden size={16} />
              </span>
              <div>
                <small>Environment</small>
                <strong>Test data only</strong>
              </div>
            </article>
          </section>

          <section
            className="affinity-demo"
            id="prescription-composer"
            aria-labelledby="affinity-demo-title"
          >
            <div className="affinity-demo-heading">
              <div>
                <div className="affinity-demo-label">
                  <span>Affinity Elements</span>
                  <span>Secure iframe</span>
                </div>
                <h2 id="affinity-demo-title">Prescription composer</h2>
                <p>
                  The platform authenticates this user. Affinity independently scopes the provider,
                  practice, patient access, and permitted actions.
                </p>
              </div>
              <span className="affinity-mode-badge">Test mode</span>
            </div>
            <AffinityPrescriptionComposer />
          </section>
        </section>
      </div>
    </main>
  );
}

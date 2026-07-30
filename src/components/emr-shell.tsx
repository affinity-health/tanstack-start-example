import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import type { WorkspaceSession } from "../lib/require-session";
import { authClient } from "../lib/auth-client";

type WorkspacePage =
  | "documents"
  | "messages"
  | "overview"
  | "patients"
  | "prescriptions"
  | "schedule";

type EmrShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  current: WorkspacePage;
  description: string;
  eyebrow?: string;
  session: WorkspaceSession;
  title: string;
};

const navigation = [
  { icon: LayoutDashboard, id: "overview", label: "Overview", to: "/dashboard" },
  { count: 12, icon: CalendarDays, id: "schedule", label: "Schedule", to: "/schedule" },
  { icon: Users, id: "patients", label: "Patients", to: "/patients" },
  {
    icon: Pill,
    id: "prescriptions",
    label: "Medication orders",
    to: "/medication-orders",
  },
  { icon: FileText, id: "documents", label: "Documents", to: "/documents" },
  { count: 2, icon: MessageSquare, id: "messages", label: "Messages", to: "/messages" },
] as const;

export function EmrShell({
  actions,
  children,
  current,
  description,
  eyebrow,
  session,
  title,
}: EmrShellProps) {
  const navigate = useNavigate();
  const initials = session.user.name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="emr-app">
      <header className="emr-topbar">
        <Link className="emr-brand" to="/dashboard">
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
            {navigation.map((item) => {
              const { icon: Icon, id, label, to } = item;
              const count = "count" in item ? item.count : undefined;

              return (
                <Link
                  aria-current={current === id ? "page" : undefined}
                  className={current === id ? "is-active" : undefined}
                  key={id}
                  to={to}
                >
                  <Icon aria-hidden size={17} />
                  {label}
                  {count ? <span>{count}</span> : null}
                </Link>
              );
            })}
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

        <section className="emr-main">
          <div className="emr-breadcrumb">
            Northstar Telehealth <span>/</span> {title}
          </div>
          <header className="emr-page-heading">
            <div>
              {eyebrow ? <p>{eyebrow}</p> : null}
              <h1>{title}</h1>
              <span>{description}</span>
            </div>
            {actions ? <div className="emr-page-actions">{actions}</div> : null}
          </header>
          <div className="emr-page-content">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function EmrSectionHeading({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <header className="emr-section-heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function EmrStatus({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "attention" | "neutral" | "success";
}) {
  return <span className={`emr-status emr-status-${tone}`}>{children}</span>;
}

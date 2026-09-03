import { Link, useNavigate } from "@tanstack/react-router";
import { Home, LogOut, Pill, Search, Stethoscope, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { demoOrders, demoPatients } from "../lib/demo-data";
import { authClient } from "../lib/auth-client";
import type { WorkspaceSession } from "../lib/require-session";

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
  description?: string;
  eyebrow?: string;
  session: WorkspaceSession;
  title: string;
};

const navigation = [
  { icon: Home, id: "overview", label: "Home", to: "/dashboard" },
  { count: 1, icon: Pill, id: "prescriptions", label: "Orders", to: "/medication-orders" },
  { icon: Users, id: "patients", label: "Patients", to: "/patients" },
] as const;

export function EmrShell({
  actions,
  children,
  current,
  description,
  session,
  title,
}: EmrShellProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const initials = session.user.name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    const patients = demoPatients
      .filter((patient) =>
        [patient.name, patient.email, patient.phone, patient.carePlan]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 4)
      .map((patient) => ({
        detail: `${patient.age} years · ${patient.state}`,
        id: patient.id,
        kind: "Patient" as const,
        label: patient.name,
        patientId: patient.id,
        to: "/patients" as const,
      }));
    const orders = demoOrders
      .filter((order) =>
        [order.id, order.patient, order.medication, order.status]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 4)
      .map((order) => ({
        detail: `${order.medication} · ${order.status}`,
        id: order.id,
        kind: "Order" as const,
        label: order.patient,
        patientId: demoPatients.find((patient) => patient.name === order.patient)?.id,
        to: "/medication-orders" as const,
      }));
    return [...patients, ...orders];
  }, [query]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  return (
    <main className="emr-app">
      <header className="emr-topbar">
        <Link className="emr-brand" to="/dashboard">
          <span className="emr-brand-mark">
            <Stethoscope aria-hidden size={17} />
          </span>
          <strong>Northstar</strong>
        </Link>

        <div className="emr-global-search">
          <Search aria-hidden size={16} />
          <input
            aria-label="Search patients and orders"
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearchOpen(false);
            }}
            placeholder="Search patients and orders"
            ref={searchInput}
            type="search"
            value={query}
          />
          {query ? (
            <button aria-label="Clear search" onClick={() => setQuery("")} type="button">
              <X aria-hidden size={14} />
            </button>
          ) : (
            <kbd>⌘ K</kbd>
          )}
          {searchOpen && query ? (
            <div aria-label="Search results" className="emr-search-results">
              {matches.length ? (
                matches.map((match) => (
                  <Link
                    key={`${match.kind}-${match.id}`}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    search={{ patientId: match.patientId }}
                    to={match.to}
                  >
                    <span>
                      <strong>{match.label}</strong>
                      <small>{match.detail}</small>
                    </span>
                    <small>{match.kind}</small>
                  </Link>
                ))
              ) : (
                <p>No patients or orders found</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="emr-topbar-actions">
          <span className="emr-environment">Synthetic · Affinity Test</span>
          <span className="emr-avatar" aria-label={session.user.name}>
            {initials}
          </span>
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
            <LogOut aria-hidden size={16} />
          </button>
        </div>
      </header>

      <div className="emr-layout">
        <aside className="emr-sidebar">
          <nav aria-label="Clinic">
            <p>Clinic</p>
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
          <div className="emr-sidebar-user">
            <span className="emr-avatar" aria-hidden>
              {initials}
            </span>
            <span>
              <strong>{session.user.name}</strong>
              <small>Demo clinician</small>
            </span>
          </div>
        </aside>

        <section className="emr-main">
          <header className="emr-page-heading">
            <div>
              <h1>{title}</h1>
              {description ? <span>{description}</span> : null}
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

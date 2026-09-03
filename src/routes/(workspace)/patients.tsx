import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardPlus,
  History,
  Mail,
  MapPin,
  Pill,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { EmrShell, EmrStatus } from "../../components/emr-shell";
import { PatientAgentTools } from "../../features/webmcp/patient-agent-tools";
import { demoPatients } from "../../lib/demo-data";
import type { PatientFilter } from "../../lib/patient-workflow";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/patients")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Patients | Northstar Health" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: Patients,
});

function Patients() {
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Eligible" | "Review">("All");
  const [selectedId, setSelectedId] = useState<string | null>(search.patientId ?? null);
  const [agentAnnouncement, setAgentAnnouncement] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const handleAgentSearch = useCallback(
    (nextQuery: string, nextStatus: PatientFilter, message: string) => {
      setQuery(nextQuery);
      setStatus(
        nextStatus === "eligible" ? "Eligible" : nextStatus === "review" ? "Review" : "All",
      );
      setAgentAnnouncement(message);
    },
    [],
  );
  const handleAgentOpen = useCallback((patientId: string, message: string) => {
    setQuery("");
    setStatus("All");
    setSelectedId(patientId);
    setAgentAnnouncement(message);
  }, []);
  const handleAgentPrepare = useCallback((path: string, message: string) => {
    setAgentAnnouncement(message);
    window.setTimeout(() => window.location.assign(path), 150);
  }, []);
  const filteredPatients = useMemo(() => {
    const value = query.trim().toLowerCase();
    return demoPatients.filter(
      (patient) =>
        (!value ||
          [patient.name, patient.email, patient.phone, patient.state, patient.carePlan]
            .join(" ")
            .toLowerCase()
            .includes(value)) &&
        (status === "All" || patient.status === status),
    );
  }, [query, status]);
  const selectedPatient = demoPatients.find((patient) => patient.id === selectedId);

  return (
    <EmrShell
      current="patients"
      description={`${demoPatients.length} synthetic patient records`}
      session={session}
      title="Patients"
    >
      <section className="emr-list-panel">
        <div className="emr-list-toolbar">
          <label className="emr-search">
            <Search aria-hidden size={16} />
            <span className="sr-only">Search patients</span>
            <input
              placeholder="Search patients"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="emr-segmented" aria-label="Patient status">
            {(["All", "Eligible", "Review"] as const).map((option) => (
              <button
                aria-pressed={status === option}
                className={status === option ? "is-active" : undefined}
                key={option}
                onClick={() => setStatus(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
          <PatientAgentTools
            onAnnouncement={setAgentAnnouncement}
            onOpen={handleAgentOpen}
            onPrepare={handleAgentPrepare}
            onSearch={handleAgentSearch}
          />
        </div>
        <p className="sr-only" aria-live="polite">
          {agentAnnouncement}
        </p>
        {filteredPatients.length ? (
          <div className="emr-table-wrap">
            <table className="emr-table emr-patient-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Care plan</th>
                  <th>Next visit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr
                    className={selectedId === patient.id ? "is-selected" : undefined}
                    key={patient.id}
                    onClick={() => setSelectedId(patient.id)}
                  >
                    <td>
                      <button className="emr-patient-select" type="button">
                        <span className="emr-person-avatar" aria-hidden>
                          {initials(patient.name)}
                        </span>
                        <span>
                          <strong>{patient.name}</strong>
                          <small>
                            {patient.age} years · {patient.state}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <strong>{patient.phone}</strong>
                      <small>{patient.email}</small>
                    </td>
                    <td>{patient.carePlan}</td>
                    <td>{patient.nextVisit}</td>
                    <td>
                      <EmrStatus tone={patient.status === "Review" ? "attention" : "success"}>
                        {patient.status}
                      </EmrStatus>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="emr-empty">
            <Search aria-hidden size={22} />
            <strong>No matching patients</strong>
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

      {selectedPatient ? (
        <>
          <button
            aria-label="Close patient details"
            className="emr-sheet-backdrop"
            onClick={() => setSelectedId(null)}
            type="button"
          />
          <aside aria-label={`${selectedPatient.name} details`} className="emr-detail-sheet">
            <header className="emr-sheet-header">
              <div>
                <h2>{selectedPatient.name}</h2>
                <p>
                  {selectedPatient.dateOfBirth} · {selectedPatient.age} years ·{" "}
                  {selectedPatient.state}
                </p>
              </div>
              <button aria-label="Close details" onClick={() => setSelectedId(null)} type="button">
                <X aria-hidden size={18} />
              </button>
            </header>
            <div className="emr-sheet-body">
              <div className="emr-patient-summary">
                <span className="emr-person-avatar emr-person-avatar-large" aria-hidden>
                  {initials(selectedPatient.name)}
                </span>
                <div>
                  <strong>{selectedPatient.carePlan}</strong>
                  <small>Last visit {selectedPatient.lastVisit}</small>
                </div>
                <EmrStatus tone={selectedPatient.status === "Review" ? "attention" : "success"}>
                  {selectedPatient.status}
                </EmrStatus>
              </div>
              <dl className="emr-detail-list">
                <div>
                  <dt>
                    <Phone aria-hidden size={15} />
                    Phone
                  </dt>
                  <dd>{selectedPatient.phone}</dd>
                </div>
                <div>
                  <dt>
                    <Mail aria-hidden size={15} />
                    Email
                  </dt>
                  <dd>{selectedPatient.email}</dd>
                </div>
                <div>
                  <dt>
                    <MapPin aria-hidden size={15} />
                    State
                  </dt>
                  <dd>{selectedPatient.state}</dd>
                </div>
                <div>
                  <dt>
                    <CalendarDays aria-hidden size={15} />
                    Next visit
                  </dt>
                  <dd>{selectedPatient.nextVisit}</dd>
                </div>
              </dl>
              <ChartList icon={<Pill aria-hidden size={15} />} title="Medications">
                {selectedPatient.medications.map((medication) => (
                  <li key={medication.name}>
                    <span>
                      <strong>{medication.name}</strong>
                      <small>{medication.dose}</small>
                    </span>
                    <EmrStatus tone={medication.status === "Active" ? "success" : "neutral"}>
                      {medication.status}
                    </EmrStatus>
                  </li>
                ))}
              </ChartList>
              <ChartList icon={<AlertTriangle aria-hidden size={15} />} title="Allergies">
                {selectedPatient.allergies.map((allergy) => (
                  <li key={allergy}>
                    <span>
                      <strong>{allergy}</strong>
                      <small>Patient reported</small>
                    </span>
                  </li>
                ))}
              </ChartList>
              <ChartList icon={<History aria-hidden size={15} />} title="Recent visits">
                {selectedPatient.visits.map((visit) => (
                  <li key={`${visit.date}-${visit.type}`}>
                    <span>
                      <strong>{visit.type}</strong>
                      <small>
                        {visit.date} · {visit.note}
                      </small>
                    </span>
                  </li>
                ))}
              </ChartList>
            </div>
            <footer className="emr-sheet-footer">
              <Link
                className="emr-button emr-button-primary"
                search={{ patientId: selectedPatient.id }}
                to="/medication-orders"
              >
                <ClipboardPlus aria-hidden size={16} />
                Prepare order
              </Link>
              <a
                className="emr-button emr-button-secondary"
                href={`mailto:${selectedPatient.email}`}
              >
                Contact patient
              </a>
            </footer>
          </aside>
        </>
      ) : null}
    </EmrShell>
  );
}

function ChartList({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="emr-chart-section">
      <h3>
        {icon}
        {title}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

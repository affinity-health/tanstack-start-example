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
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { EmrSectionHeading, EmrShell, EmrStatus } from "../../components/emr-shell";
import { PatientAgentTools } from "../../features/webmcp/patient-agent-tools";
import { demoPatients } from "../../lib/demo-data";
import type { PatientFilter } from "../../lib/patient-workflow";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/patients")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Patients | Northstar Health" }],
  }),
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
  const [selectedId, setSelectedId] = useState(search.patientId ?? "pat_ada_zieme");
  const [agentAnnouncement, setAgentAnnouncement] = useState("");

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
    const normalizedQuery = query.trim().toLowerCase();

    return demoPatients.filter((patient) => {
      const matchesQuery =
        !normalizedQuery ||
        [patient.name, patient.email, patient.phone, patient.state, patient.carePlan]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === "All" || patient.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const selectedPatient =
    demoPatients.find((patient) => patient.id === selectedId) ?? demoPatients[0];

  return (
    <EmrShell
      current="patients"
      description="Find patients and review the context used by clinical workflows."
      session={session}
      title="Patients"
    >
      <PatientAgentTools
        onAnnouncement={setAgentAnnouncement}
        onOpen={handleAgentOpen}
        onPrepare={handleAgentPrepare}
        onSearch={handleAgentSearch}
      />
      <p className="sr-only" aria-live="polite">
        {agentAnnouncement}
      </p>
      <div className="emr-patient-layout">
        <section className="emr-panel">
          <EmrSectionHeading
            description={`${filteredPatients.length} of ${demoPatients.length} patients`}
            title="Patient directory"
          />
          <div className="emr-toolbar">
            <label className="emr-search">
              <Search aria-hidden size={16} />
              <span className="sr-only">Search patients</span>
              <input
                placeholder="Search name, phone, state, or care plan"
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
                  type="button"
                  onClick={() => setStatus(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {filteredPatients.length ? (
            <div className="emr-table-wrap">
              <table className="emr-table emr-patient-table">
                <thead>
                  <tr>
                    <th>Patient</th>
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
                    >
                      <td>
                        <button
                          className="emr-patient-select"
                          type="button"
                          onClick={() => setSelectedId(patient.id)}
                        >
                          <span className="emr-person-avatar" aria-hidden>
                            {patient.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </span>
                          <span>
                            <strong>{patient.name}</strong>
                            <small>
                              {patient.age} years · {patient.state}
                            </small>
                          </span>
                        </button>
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
              <span>Try a different search or status.</span>
              <button
                className="emr-button emr-button-secondary"
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {selectedPatient ? (
          <aside className="emr-panel emr-patient-detail" aria-label="Patient chart">
            <div className="emr-patient-identity">
              <span className="emr-person-avatar emr-person-avatar-large" aria-hidden>
                {selectedPatient.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <small>Selected patient</small>
                <h2>{selectedPatient.name}</h2>
                <p>
                  {selectedPatient.dateOfBirth} · {selectedPatient.age} years
                </p>
              </div>
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

            <div className="emr-detail-section">
              <span>Care plan</span>
              <strong>{selectedPatient.carePlan}</strong>
              <p>Last visit {selectedPatient.lastVisit}</p>
            </div>
            <section className="emr-chart-section" aria-labelledby="medications-title">
              <h3 id="medications-title">
                <Pill aria-hidden size={15} /> Medications
              </h3>
              <ul>
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
              </ul>
            </section>
            <section className="emr-chart-section" aria-labelledby="allergies-title">
              <h3 id="allergies-title">
                <AlertTriangle aria-hidden size={15} /> Allergies
              </h3>
              <ul>
                {selectedPatient.allergies.map((allergy) => (
                  <li key={allergy}>
                    <span>
                      <strong>{allergy}</strong>
                      <small>Patient reported</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="emr-chart-section" aria-labelledby="visits-title">
              <h3 id="visits-title">
                <History aria-hidden size={15} /> Recent visits
              </h3>
              <ul>
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
              </ul>
            </section>
            <div className="emr-detail-section">
              <span>Prescribing status</span>
              <strong className="emr-detail-success">
                <ShieldCheck aria-hidden size={16} />
                {selectedPatient.status === "Eligible" ? "Ready to prescribe" : "Review required"}
              </strong>
              <p>Affinity Test verifies provider scope before showing prescribing data.</p>
            </div>
            <div className="emr-chart-actions">
              <Link
                className="emr-button emr-button-primary"
                to="/medication-orders"
                search={{ patientId: selectedPatient.id }}
              >
                <ClipboardPlus aria-hidden size={16} />
                Prepare order
              </Link>
              <a
                className="emr-button emr-button-secondary"
                href={`mailto:${selectedPatient.email}`}
              >
                <UserRound aria-hidden size={16} />
                Contact patient
              </a>
            </div>
          </aside>
        ) : null}
      </div>
    </EmrShell>
  );
}

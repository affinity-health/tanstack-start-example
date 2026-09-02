import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Mail, MapPin, Phone, Search, ShieldCheck, UserRound } from "lucide-react";
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
  component: Patients,
});

function Patients() {
  const { session } = Route.useRouteContext();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Eligible" | "Review">("All");
  const [selectedId, setSelectedId] = useState("pat_ada_zieme");
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
          <aside className="emr-panel emr-patient-detail" aria-label="Selected patient">
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
            <div className="emr-detail-section">
              <span>Affinity eligibility</span>
              <strong className="emr-detail-success">
                <ShieldCheck aria-hidden size={16} />
                {selectedPatient.status === "Eligible" ? "Ready to prescribe" : "Review required"}
              </strong>
              <p>The embedded component still verifies scope before showing clinical data.</p>
            </div>
            <a
              className="emr-button emr-button-secondary emr-button-full"
              href={`mailto:${selectedPatient.email}`}
            >
              <UserRound aria-hidden size={16} />
              Contact patient
            </a>
          </aside>
        ) : null}
      </div>
    </EmrShell>
  );
}

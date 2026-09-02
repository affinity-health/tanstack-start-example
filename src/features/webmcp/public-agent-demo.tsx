import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { demoPatients } from "../../lib/demo-data";
import { searchPatients, type PatientFilter } from "../../lib/patient-workflow";
import { PatientAgentTools } from "./patient-agent-tools";

export function PublicAgentDemo() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PatientFilter>("all");
  const [selectedId, setSelectedId] = useState(demoPatients[0]!.id);
  const [preparedId, setPreparedId] = useState<string>();
  const [announcement, setAnnouncement] = useState("");

  const matches = useMemo(() => searchPatients({ query, status }), [query, status]);
  const selected = demoPatients.find((patient) => patient.id === selectedId) ?? demoPatients[0]!;
  const prepared = demoPatients.find((patient) => patient.id === preparedId);

  const handleAgentSearch = useCallback(
    (nextQuery: string, nextStatus: PatientFilter, message: string) => {
      setQuery(nextQuery);
      setStatus(nextStatus);
      setPreparedId(undefined);
      setAnnouncement(message);
    },
    [],
  );
  const handleAgentOpen = useCallback((patientId: string, message: string) => {
    setQuery("");
    setStatus("all");
    setSelectedId(patientId);
    setPreparedId(undefined);
    setAnnouncement(message);
  }, []);
  const handleAgentPrepare = useCallback((path: string, message: string) => {
    const patientId = new URL(path, window.location.origin).searchParams.get("patientId");
    if (patientId) {
      setSelectedId(patientId);
      setPreparedId(patientId);
    }
    setAnnouncement(message);
  }, []);

  return (
    <section className="public-agent-demo page-shell" id="agent-demo" aria-labelledby="demo-title">
      <header className="public-agent-demo-heading">
        <div>
          <h2 id="demo-title">Try the human-agent handoff.</h2>
          <p>
            Ask a compatible browser agent to find an eligible California patient, open Ada Zieme,
            then prepare her medication review. Every record below is synthetic.
          </p>
        </div>
        <span>Live browser tools</span>
      </header>

      <PatientAgentTools
        onAnnouncement={setAnnouncement}
        onOpen={handleAgentOpen}
        onPrepare={handleAgentPrepare}
        onSearch={handleAgentSearch}
      />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <div className="public-agent-workspace">
        <div className="public-agent-directory">
          <div className="public-agent-controls">
            <label>
              <span className="sr-only">Search synthetic patients</span>
              <Search aria-hidden size={16} />
              <input
                type="search"
                placeholder="Search synthetic patients"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </label>
            <select
              aria-label="Eligibility status"
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value as PatientFilter)}
            >
              <option value="all">All statuses</option>
              <option value="eligible">Eligible</option>
              <option value="review">Needs review</option>
            </select>
          </div>
          <div className="public-patient-list" aria-label="Synthetic patients">
            {matches.length ? (
              matches.map((patient) => (
                <button
                  className={patient.id === selected.id ? "is-selected" : undefined}
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(patient.id);
                    setPreparedId(undefined);
                  }}
                >
                  <span>
                    <strong>{patient.name}</strong>
                    <small>{patient.carePlan}</small>
                  </span>
                  <span>
                    {patient.state} · {patient.status}
                  </span>
                </button>
              ))
            ) : (
              <p>No synthetic patients match those filters.</p>
            )}
          </div>
        </div>

        <aside className="public-patient-detail" aria-label="Selected synthetic patient">
          <span className="public-patient-kicker">Selected synthetic patient</span>
          <h3>{selected.name}</h3>
          <p className="public-patient-location">
            <MapPin aria-hidden size={15} /> {selected.state} · {selected.age} years
          </p>
          <dl>
            <div>
              <dt>Care plan</dt>
              <dd>{selected.carePlan}</dd>
            </div>
            <div>
              <dt>Next visit</dt>
              <dd>{selected.nextVisit}</dd>
            </div>
            <div>
              <dt>Affinity eligibility</dt>
              <dd>
                {selected.status === "Eligible" ? "Ready for clinician review" : "Review required"}
              </dd>
            </div>
          </dl>

          {prepared?.id === selected.id ? (
            <div className="public-prepared-state" role="status">
              <ShieldCheck aria-hidden size={18} />
              <span>
                <strong>Review context prepared</strong>
                <small>No prescription was created. Sign in to continue as the clinician.</small>
              </span>
            </div>
          ) : null}

          <Link className="button button-dark" to="/login">
            Continue as clinician <ArrowUpRight aria-hidden size={16} />
          </Link>
        </aside>
      </div>
    </section>
  );
}

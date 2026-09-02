import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, CheckCircle2, Clock3, MapPin, Search, ShieldCheck } from "lucide-react";
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
  const reviewPrepared = prepared?.id === selected.id;

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

  const workflow = [
    { label: "Encounter", detail: "Complete", state: "complete" },
    { label: "Catalog match", detail: selected.name, state: "complete" },
    {
      label: "Unsigned proposal",
      detail: reviewPrepared ? "Prepared" : "Waiting",
      state: reviewPrepared ? "complete" : "current",
    },
    {
      label: "Human confirm",
      detail: reviewPrepared ? "Required" : "Locked",
      state: reviewPrepared ? "current" : "locked",
    },
    { label: "Provider review", detail: "Not started", state: "locked" },
  ] as const;

  return (
    <section className="public-agent-demo page-shell" id="agent-demo" aria-labelledby="demo-title">
      <div className="workflow-heading">
        <div>
          <p>Active workflow</p>
          <h2 id="demo-title">Medication review · {selected.name}</h2>
        </div>
        <span className="workflow-updated">
          <Clock3 aria-hidden size={15} /> Updated 09:42
        </span>
      </div>

      <ol className="workflow-progress" aria-label="Medication review progress">
        {workflow.map((step, index) => (
          <li className={`is-${step.state}`} key={step.label}>
            <span className="workflow-step-index" aria-hidden>
              {step.state === "complete" ? <Check size={14} /> : index + 1}
            </span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
          </li>
        ))}
      </ol>

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
        <section className="public-agent-directory" aria-labelledby="patient-context-title">
          <header className="workspace-section-heading">
            <div>
              <h3 id="patient-context-title">Patient context</h3>
              <p>{matches.length} synthetic records</p>
            </div>
            <span>Source · Northstar demo</span>
          </header>

          <div className="public-agent-controls">
            <label>
              <span className="sr-only">Search synthetic patients</span>
              <Search aria-hidden size={16} />
              <input
                type="search"
                placeholder="Search name, state, or care plan"
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
                  aria-pressed={patient.id === selected.id}
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
        </section>

        <aside className="public-patient-detail" aria-labelledby="proposal-title">
          <header className="workspace-section-heading">
            <div>
              <h3 id="proposal-title">Unsigned proposal</h3>
              <p>{reviewPrepared ? "Ready for confirmation" : "Awaiting preparation"}</p>
            </div>
            <span>Affinity Test</span>
          </header>

          <div className="proposal-patient">
            <div>
              <span>Patient</span>
              <strong>{selected.name}</strong>
            </div>
            <p>
              <MapPin aria-hidden size={15} /> {selected.state} · {selected.age} years
            </p>
          </div>

          <dl className="proposal-facts">
            <div>
              <dt>Encounter</dt>
              <dd>
                <CheckCircle2 aria-hidden size={15} /> Completed
              </dd>
            </div>
            <div>
              <dt>Care plan</dt>
              <dd>{selected.carePlan}</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>{selected.status === "Eligible" ? "Ready for review" : "Review required"}</dd>
            </div>
            <div>
              <dt>Order status</dt>
              <dd>Not created</dd>
            </div>
          </dl>

          <section className="agent-activity" aria-labelledby="activity-title">
            <h4 id="activity-title">Agent activity</h4>
            <ol>
              <li>
                <time>09:41</time>
                <span>
                  <strong>Encounter context received</strong>
                  <small>Synthetic visit note marked complete</small>
                </span>
              </li>
              <li className={announcement ? "is-complete" : "is-waiting"}>
                <time>09:42</time>
                <span>
                  <strong>
                    {announcement ? "Browser tool completed" : "Waiting for browser agent"}
                  </strong>
                  <small>{announcement || "Search, open, or prepare this visible workflow"}</small>
                </span>
              </li>
            </ol>
          </section>

          {reviewPrepared ? (
            <div className="public-prepared-state" role="status">
              <ShieldCheck aria-hidden size={18} />
              <span>
                <strong>Human confirmation required</strong>
                <small>No prescription was created. Continue to review the Test draft.</small>
              </span>
            </div>
          ) : null}

          <Link className="button button-primary proposal-action" to="/login">
            Review in clinician workspace <ArrowRight aria-hidden size={16} />
          </Link>
        </aside>
      </div>
    </section>
  );
}

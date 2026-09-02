import { createFileRoute } from "@tanstack/react-router";
import { Bot, Braces, ClipboardList, ShieldCheck, Wifi } from "lucide-react";
import { useState } from "react";

import { EmrShell } from "../../components/emr-shell";
import {
  ElementsDemo,
  HeadlessSdkDemo,
  HostedDemo,
  PracticeBillingDemo,
} from "../../features/affinity";
import { requireSession } from "../../lib/require-session";
import { demoPatients } from "../../lib/demo-data";

type ShowcaseFeature = "billing" | "elements" | "headless" | "hosted" | "provider";

type MedicationOrdersSearch = {
  feature?: ShowcaseFeature;
  patientId?: string;
};

export const Route = createFileRoute("/(workspace)/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Medication orders | Northstar Health" }],
  }),
  validateSearch: (search: Record<string, unknown>): MedicationOrdersSearch => ({
    feature: isShowcaseFeature(search.feature) ? search.feature : undefined,
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  component: MedicationOrders,
});

const features = [
  {
    id: "elements",
    label: "Embedded composer",
    meta: "Elements",
  },
  {
    id: "headless",
    label: "Unsigned proposal",
    meta: "Headless SDK",
  },
  {
    id: "hosted",
    label: "Hosted prescribing",
    meta: "Hosted",
  },
  {
    id: "provider",
    label: "Provider verification",
    meta: "Identity",
  },
  {
    id: "billing",
    label: "Practice billing",
    meta: "Payments",
  },
] as const satisfies ReadonlyArray<{
  id: ShowcaseFeature;
  label: string;
  meta: string;
}>;

function MedicationOrders() {
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const preparedPatient = demoPatients.find((patient) => patient.id === search.patientId);
  const [feature, setFeature] = useState<ShowcaseFeature>(search.feature ?? "elements");

  return (
    <EmrShell
      actions={
        <a className="emr-button emr-button-secondary" href="/api/openapi">
          <Braces aria-hidden size={16} />
          API reference
        </a>
      }
      current="prescriptions"
      description="Review the unsigned proposal, confirm it, then hand off to Affinity for signing."
      eyebrow="Medication operations"
      session={session}
      title="Affinity prescribing"
    >
      {preparedPatient ? (
        <section className="agent-review-handoff" aria-label="Agent-prepared review">
          <span className="agent-tools-mark">
            <Bot aria-hidden size={17} />
          </span>
          <span>
            <strong>Review prepared for {preparedPatient.name}</strong>
            <small>
              The agent opened this Test workflow. No prescription was created, and all clinical
              fields still require clinician review.
            </small>
          </span>
          <span className="agent-review-tag">Synthetic data</span>
        </section>
      ) : null}
      <section className="emr-integration-strip" aria-label="Integration status">
        <div>
          <span className="emr-status-icon is-success">
            <Wifi aria-hidden size={16} />
          </span>
          <span>
            <small>Integration</small>
            <strong>Affinity connected</strong>
          </span>
          <span className="emr-live-status">Online</span>
        </div>
        <div>
          <span className="emr-status-icon">
            <ShieldCheck aria-hidden size={16} />
          </span>
          <span>
            <small>Access</small>
            <strong>Provider verified</strong>
          </span>
        </div>
        <div>
          <span className="emr-status-icon">
            <ClipboardList aria-hidden size={16} />
          </span>
          <span>
            <small>Environment</small>
            <strong>Test data only</strong>
          </span>
        </div>
      </section>

      <section className="showcase-picker" aria-label="Affinity features">
        <header>
          <div>
            <span>Workflow mode</span>
            <h2>Choose how Northstar hands work to Affinity</h2>
          </div>
          <p>Test data only. Clinical signing and the provider PIN stay inside Affinity.</p>
        </header>
        <div className="showcase-picker-grid" role="tablist" aria-label="Affinity feature">
          {features.map(({ id, label, meta }) => (
            <button
              aria-controls={`showcase-panel-${id}`}
              aria-selected={feature === id}
              className={feature === id ? "is-active" : undefined}
              id={`showcase-tab-${id}`}
              key={id}
              role="tab"
              type="button"
              onClick={() => setFeature(id)}
            >
              <span>
                <small>{meta}</small>
                <strong>{label}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      <div
        aria-labelledby={`showcase-tab-${feature}`}
        id={`showcase-panel-${feature}`}
        role="tabpanel"
      >
        {feature === "elements" ? (
          <section className="affinity-demo" aria-labelledby="affinity-demo-title">
            <div className="affinity-demo-heading">
              <div>
                <div className="affinity-demo-label">
                  <span>Affinity Elements</span>
                  <span>Secure iframe</span>
                </div>
                <h2 id="affinity-demo-title">Prescription composer</h2>
                <p>
                  Northstar authenticates this user. Affinity independently scopes the provider,
                  practice, patient access, and permitted actions.
                </p>
              </div>
              <span className="affinity-mode-badge">Test mode</span>
            </div>
            <ElementsDemo />
          </section>
        ) : feature === "headless" ? (
          <HeadlessSdkDemo preferredPatientName={preparedPatient?.name} />
        ) : feature === "hosted" ? (
          <HostedDemo />
        ) : feature === "provider" ? (
          <HostedDemo workflow="provider_verification" />
        ) : (
          <PracticeBillingDemo />
        )}
      </div>
    </EmrShell>
  );
}

function isShowcaseFeature(value: unknown): value is ShowcaseFeature {
  return ["billing", "elements", "headless", "hosted", "provider"].includes(String(value));
}

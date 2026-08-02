import { createFileRoute } from "@tanstack/react-router";
import {
  Braces,
  ClipboardList,
  CreditCard,
  ExternalLink,
  PanelsTopLeft,
  ShieldCheck,
  UserCheck,
  Wifi,
} from "lucide-react";
import { useState } from "react";

import { AffinityHostedLauncher } from "../../components/affinity-hosted-launcher";
import { AffinityHeadlessOrder } from "../../components/affinity-headless-order";
import { AffinityPrescriptionComposer } from "../../components/affinity-prescription-composer";
import { EmrShell } from "../../components/emr-shell";
import { PracticePaymentSetup } from "../../components/practice-payment-setup";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Medication orders | Northstar Health" }],
  }),
  component: MedicationOrders,
});

type ShowcaseFeature = "billing" | "elements" | "headless" | "hosted" | "provider";

const features = [
  {
    description: "Mount Affinity's secure prescribing interface inside your product.",
    icon: PanelsTopLeft,
    id: "elements",
    label: "Elements",
    meta: "Embedded UI",
  },
  {
    description: "Own the interface and create unsigned orders with the TypeScript SDK.",
    icon: Braces,
    id: "headless",
    label: "Headless SDK",
    meta: "Server API",
  },
  {
    description: "Launch the complete Affinity workflow in a focused, single-use window.",
    icon: ExternalLink,
    id: "hosted",
    label: "Hosted",
    meta: "Fastest launch",
  },
  {
    description: "Verify the prescriber and let them create their private signing PIN.",
    icon: UserCheck,
    id: "provider",
    label: "Provider setup",
    meta: "Identity",
  },
  {
    description: "Let the practice securely add or replace its Stripe Test payment method.",
    icon: CreditCard,
    id: "billing",
    label: "Practice billing",
    meta: "Payments",
  },
] as const satisfies ReadonlyArray<{
  description: string;
  icon: typeof PanelsTopLeft;
  id: ShowcaseFeature;
  label: string;
  meta: string;
}>;

function MedicationOrders() {
  const { session } = Route.useRouteContext();
  const [feature, setFeature] = useState<ShowcaseFeature>("elements");

  return (
    <EmrShell
      actions={
        <a className="emr-button emr-button-secondary" href="/api/openapi">
          <Braces aria-hidden size={16} />
          API reference
        </a>
      }
      current="prescriptions"
      description="Five production integration patterns, running against Affinity Test data."
      eyebrow="Integration showcase"
      session={session}
      title="Affinity prescribing"
    >
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
            <span>Choose an integration</span>
            <h2>See the contract, not a mockup.</h2>
          </div>
          <p>
            Every view below uses the real Affinity Test API. The platform key stays on this server,
            and clinical signing stays inside Affinity.
          </p>
        </header>
        <div className="showcase-picker-grid" role="tablist" aria-label="Affinity feature">
          {features.map(({ description, icon: Icon, id, label, meta }) => (
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
              <span className="showcase-picker-icon">
                <Icon aria-hidden size={18} />
              </span>
              <span>
                <small>{meta}</small>
                <strong>{label}</strong>
                <span>{description}</span>
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
            <AffinityPrescriptionComposer />
          </section>
        ) : feature === "headless" ? (
          <AffinityHeadlessOrder />
        ) : feature === "hosted" ? (
          <AffinityHostedLauncher />
        ) : feature === "provider" ? (
          <AffinityHostedLauncher workflow="provider_verification" />
        ) : (
          <PracticePaymentSetup />
        )}
      </div>
    </EmrShell>
  );
}

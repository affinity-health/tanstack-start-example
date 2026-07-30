import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, ShieldCheck, Wifi } from "lucide-react";
import { useState } from "react";

import { AffinityHostedLauncher } from "../components/affinity-hosted-launcher";
import { AffinityPrescriptionComposer } from "../components/affinity-prescription-composer";
import { EmrShell } from "../components/emr-shell";
import { requireSession } from "../lib/require-session";

export const Route = createFileRoute("/medication-orders")({
  beforeLoad: requireSession,
  head: () => ({
    meta: [{ title: "Medication orders | Northstar Health" }],
  }),
  component: MedicationOrders,
});

function MedicationOrders() {
  const { session } = Route.useRouteContext();
  const [launchMode, setLaunchMode] = useState<"embedded" | "popup">("embedded");

  return (
    <EmrShell
      actions={
        <div className="emr-segmented" aria-label="Affinity launch mode">
          <button
            aria-pressed={launchMode === "embedded"}
            className={launchMode === "embedded" ? "is-active" : undefined}
            type="button"
            onClick={() => setLaunchMode("embedded")}
          >
            Embedded
          </button>
          <button
            aria-pressed={launchMode === "popup"}
            className={launchMode === "popup" ? "is-active" : undefined}
            type="button"
            onClick={() => setLaunchMode("popup")}
          >
            Popup window
          </button>
        </div>
      }
      current="prescriptions"
      description="Choose an embedded component or a focused Affinity Hosted window."
      session={session}
      title="Medication orders"
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

      {launchMode === "embedded" ? (
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
      ) : (
        <AffinityHostedLauncher />
      )}
    </EmrShell>
  );
}

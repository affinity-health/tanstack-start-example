import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { PublicAgentDemo } from "../../features/webmcp/public-agent-demo";

export const Route = createFileRoute("/(public)/")({
  component: Home,
});

function Home() {
  return (
    <main className="operations-page">
      <section className="operations-intro page-shell" aria-labelledby="page-title">
        <div>
          <p className="operations-context">Medication operations</p>
          <h1 id="page-title">Review an unsigned proposal</h1>
          <p className="operations-summary">
            Move a completed synthetic visit into Affinity Test while every clinical decision stays
            with the provider.
          </p>
        </div>
        <div className="encounter-state" aria-label="Encounter status">
          <CheckCircle2 aria-hidden size={20} />
          <span>
            <strong>Encounter complete</strong>
            <small>Visit note signed · ready for medication review</small>
          </span>
        </div>
        <p className="environment-notice">
          <ShieldCheck aria-hidden size={16} /> Affinity Test · synthetic patients · never Live
        </p>
      </section>

      <PublicAgentDemo />
    </main>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

import { PublicAgentDemo } from "../../features/webmcp/public-agent-demo";

export const Route = createFileRoute("/(public)/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <h1>
            Care work.
            <br />
            Agent <em>ready.</em>
          </h1>
          <p className="hero-summary">
            Browser agents can find a synthetic patient, open the right record, and prepare a
            medication review. The clinician sees every step and keeps every clinical decision.
          </p>
          <p className="hero-safety">
            <ShieldCheck aria-hidden size={16} /> Affinity Test · Synthetic data · Never Live
          </p>
          <div className="hero-actions">
            <Link className="button button-accent" to="/login">
              Open the patient workspace <ArrowUpRight size={17} />
            </Link>
            <a className="button button-quiet" href="/api/openapi">
              Inspect the server API
            </a>
          </div>
        </div>
        <aside className="endpoint-card" aria-label="WebMCP tool registration example">
          <div className="endpoint-topline">
            <span className="method">WebMCP</span>
            <span>Browser native</span>
          </div>
          <code>document.modelContext.registerTool</code>
          <pre>{`await document.modelContext.registerTool({
  name: "prepare_medication_review",
  inputSchema: patientSchema,
  execute: prepareVisibleReview
})`}</pre>
          <div className="response-line">
            <span />3 browser tools ready
          </div>
        </aside>
      </section>

      <PublicAgentDemo />
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(public)/terms")({
  head: () => ({ meta: [{ title: "Terms | Northstar demo" }] }),
  component: Terms,
});

function Terms() {
  return (
    <main className="legal-page section-shell">
      <p>Demo terms</p>
      <h1>Use this workspace for evaluation only.</h1>
      <p>
        This challenge demo is provided as an open source example. It uses synthetic patients and
        Affinity Test. It is not medical advice and must not be used for real clinical care.
      </p>
      <Link className="landing-button landing-button-primary" to="/">
        Return to the demo
      </Link>
    </main>
  );
}

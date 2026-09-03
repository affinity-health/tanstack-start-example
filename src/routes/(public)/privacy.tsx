import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(public)/privacy")({
  head: () => ({ meta: [{ title: "Privacy | Northstar demo" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="legal-page section-shell">
      <p>Privacy</p>
      <h1>This public demo uses synthetic data.</h1>
      <p>
        The medication workflow does not contain real patient information and does not connect to
        Affinity Live. Standard hosting logs may record technical request details needed to operate
        and secure the demo.
      </p>
      <Link className="landing-button landing-button-primary" to="/">
        Return to the demo
      </Link>
    </main>
  );
}

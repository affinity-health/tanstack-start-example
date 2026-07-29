import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, LogOut } from "lucide-react";

import { AffinityPrescriptionComposer } from "../components/affinity-prescription-composer";
import { authClient } from "../lib/auth-client";
import { getSession } from "../lib/session.functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: "/login" });
    }

    return { session };
  },
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { session } = Route.useRouteContext();

  return (
    <main className="dashboard page-shell">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Authenticated</p>
          <h1>Good to see you, {session.user.name}.</h1>
        </div>
        <button
          className="button button-quiet"
          type="button"
          onClick={async () => {
            await authClient.signOut();
            await navigate({ to: "/" });
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <section className="dashboard-grid">
        <article className="profile-card">
          <p className="eyebrow">Current session</p>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{session.user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{session.user.id}</dd>
            </div>
          </dl>
        </article>

        <article className="next-card">
          <span>Affinity API</span>
          <h2>Your signed webhook is ready.</h2>
          <p>
            Affinity signs the exact request bytes. This app verifies them before recording the
            event in D1.
          </p>
          <a href="/api/openapi">
            Open API reference <ArrowUpRight size={17} />
          </a>
        </article>
      </section>

      <section className="affinity-demo" aria-labelledby="affinity-demo-title">
        <div className="affinity-demo-heading">
          <div>
            <p className="eyebrow">Delegated platform access</p>
            <h2 id="affinity-demo-title">Affinity prescription composer</h2>
          </div>
          <p>
            This app authenticates you. Its backend creates a short-lived session for an
            independently verified Affinity provider, and the API key never reaches this browser.
          </p>
        </div>
        <AffinityPrescriptionComposer />
      </section>

      <Link className="back-link" to="/">
        Back to the overview
      </Link>
    </main>
  );
}

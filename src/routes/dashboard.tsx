import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, LogOut } from "lucide-react";

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
          <span>API</span>
          <h2>Your webhook is ready.</h2>
          <p>
            Send a validated event envelope to the Elysia route or inspect its generated schema.
          </p>
          <a href="/api/openapi">
            Open API reference <ArrowUpRight size={17} />
          </a>
        </article>
      </section>

      <Link className="back-link" to="/">
        Back to the overview
      </Link>
    </main>
  );
}

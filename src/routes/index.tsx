import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Braces, Fingerprint, Webhook } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

const stack = [
  {
    icon: Braces,
    number: "01",
    name: "TanStack Start",
    copy: "Routes, server rendering, and server functions. No second frontend framework.",
  },
  {
    icon: Webhook,
    number: "02",
    name: "Elysia",
    copy: "One typed HTTP surface with validation and an OpenAPI document generated from the routes.",
  },
  {
    icon: Fingerprint,
    number: "03",
    name: "Better Auth",
    copy: "Email and password auth backed by a managed Cloudflare D1 database at the edge.",
  },
] as const;

function Home() {
  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <p className="eyebrow">
            <span>Affinity platform example</span>
            <span>Test mode</span>
          </p>
          <h1>
            Your app.
            <br />
            Affinity <em>inside.</em>
          </h1>
          <p className="hero-summary">
            A minimal partner implementation: authenticate your user, create a scoped component
            session on your backend, and render Affinity without exposing your API key.
          </p>
          <div className="hero-actions">
            <Link className="button button-accent" to="/login">
              Open the app <ArrowUpRight size={17} />
            </Link>
            <a className="button button-quiet" href="/api/openapi">
              Explore the API
            </a>
          </div>
        </div>
        <aside className="endpoint-card" aria-label="Webhook endpoint example">
          <div className="endpoint-topline">
            <span className="method">POST</span>
            <span>OpenAPI ready</span>
          </div>
          <code>/api/affinity/webhook</code>
          <pre>{`{
  "type": "webhook_endpoint.test",
  "data": {
    "object": {
      "id": "..."
    }
  }
}`}</pre>
          <div className="response-line">
            <span />
            200 Accepted
          </div>
        </aside>
      </section>

      <section className="stack-section page-shell" aria-labelledby="stack-title">
        <div className="section-heading">
          <p className="eyebrow">What remains</p>
          <h2 id="stack-title">Three tools. Clear jobs.</h2>
        </div>
        <div className="stack-grid">
          {stack.map(({ icon: Icon, number, name, copy }) => (
            <article className="stack-card" key={name}>
              <div className="stack-card-top">
                <Icon size={21} strokeWidth={1.8} />
                <span>{number}</span>
              </div>
              <h3>{name}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

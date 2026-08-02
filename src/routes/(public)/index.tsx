import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Braces, CreditCard, ExternalLink, PanelsTopLeft } from "lucide-react";

export const Route = createFileRoute("/(public)/")({
  component: Home,
});

const features = [
  {
    icon: PanelsTopLeft,
    number: "01",
    name: "Elements",
    copy: "Embed Affinity's secure prescribing UI while your application owns navigation and identity.",
  },
  {
    icon: Braces,
    number: "02",
    name: "TypeScript SDK",
    copy: "Own the interface and create multi-prescription patient orders from your trusted server.",
  },
  {
    icon: ExternalLink,
    number: "03",
    name: "Affinity Hosted",
    copy: "Open complete prescribing and provider setup workflows with a short-lived launch URL.",
  },
  {
    icon: CreditCard,
    number: "04",
    name: "Practice billing",
    copy: "Let each practice add its own payment method directly through Stripe's secure Test flow.",
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
            A working partner implementation of Affinity Elements, the headless TypeScript SDK,
            hosted workflows, provider setup, and practice-owned billing—all using Test data.
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
        <aside className="endpoint-card" aria-label="Affinity SDK example">
          <div className="endpoint-topline">
            <span className="method">SDK</span>
            <span>Server side</span>
          </div>
          <code>affinity.orders.create</code>
          <pre>{`await affinity.orders.create({
  patientId,
  prescriberId,
  prescriptions: [
    { formulationId, quantity, sig }
  ]
})`}</pre>
          <div className="response-line">
            <span />
            Test order created
          </div>
        </aside>
      </section>

      <section className="stack-section page-shell" aria-labelledby="stack-title">
        <div className="section-heading">
          <p className="eyebrow">Choose the surface</p>
          <h2 id="stack-title">One platform. Four integration paths.</h2>
        </div>
        <div className="stack-grid">
          {features.map(({ icon: Icon, number, name, copy }) => (
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

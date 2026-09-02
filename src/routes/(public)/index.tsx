import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ClipboardText,
  CursorClick,
  FileText,
  LockKey,
  Robot,
  ShieldCheck,
  UserCircleCheck,
} from "@phosphor-icons/react";

import { LandingReveal, TaglineReveal } from "../../features/landing/tagline-reveal";
import { HeroProductVisual } from "../../features/landing/hero-product-visual";
import { PublicAgentDemo } from "../../features/webmcp/public-agent-demo";

export const Route = createFileRoute("/(public)/")({
  head: () => ({
    meta: [
      { title: "Affinity agent ready prescribing for telehealth" },
      {
        name: "description",
        content:
          "Try a synthetic telehealth prescribing workflow where browser agents prepare an unsigned draft and clinicians keep every prescribing decision.",
      },
    ],
  }),
  component: Home,
});

const benefits = [
  {
    icon: Robot,
    title: "Give agents useful work",
    copy: "Five WebMCP tools let an agent find a synthetic patient, prepare the draft, and update the same interface a clinician sees.",
  },
  {
    icon: LockKey,
    title: "Hold the clinical boundary",
    copy: "The browser agent can prepare an unsigned proposal. It cannot confirm the draft or become the prescriber.",
  },
  {
    icon: CursorClick,
    title: "Show every state change",
    copy: "Searches, patient selection, preparation, and handoff appear in the live workspace instead of disappearing into a hidden agent trace.",
  },
];

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Start with a completed encounter",
    copy: "The signed visit note provides the patient and care plan context for the medication workflow.",
  },
  {
    icon: Robot,
    number: "02",
    title: "Let the agent prepare the proposal",
    copy: "WebMCP tools match the synthetic patient and prepare an unsigned Test draft in the visible interface.",
  },
  {
    icon: UserCircleCheck,
    number: "03",
    title: "Require a clinician to continue",
    copy: "A human reviews every field, confirms the draft, and hands it to the provider for the prescribing decision.",
  },
];

const questions = [
  {
    question: "Can the browser agent create a prescription?",
    answer:
      "No. It can prepare an unsigned proposal. A clinician must review and confirm the draft before an order can move to provider review.",
  },
  {
    question: "Does the demo use real patient data?",
    answer:
      "No. Every record is synthetic and every prescribing operation is restricted to Affinity Test. The demo never connects to Live patient data.",
  },
  {
    question: "What can the five WebMCP tools do?",
    answer:
      "Three tools search, open, and prepare patient context. Two more tools expose Test catalog options and prepare the visible prescription form.",
  },
  {
    question: "Where does the clinician stay in control?",
    answer:
      "The confirmation control sits immediately before order creation. Editing the draft clears confirmation, so the clinician must review the current values.",
  },
  {
    question: "Is this a simulated interface?",
    answer:
      "The workspace below is the working product surface. Agent actions and human actions update the same React state and the same clinical form.",
  },
  {
    question: "What should I try first?",
    answer:
      "Open this page in a WebMCP enabled browser and ask the agent to prepare Ada Zieme's medication review without creating an order.",
  },
];

function Home() {
  return (
    <main className="landing-page">
      <LandingReveal />
      <section className="landing-hero section-shell" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span aria-hidden /> Agent ready telehealth prescribing
          </p>
          <h1 id="page-title">
            Let agents prepare prescriptions.
            <br /> Never let them prescribe.
          </h1>
          <p className="hero-summary">
            Affinity gives telehealth platforms five WebMCP tools to prepare an unsigned Test draft,
            while a clinician controls confirmation and provider handoff.
          </p>
          <div className="hero-actions">
            <a className="landing-button landing-button-primary" href="#agent-demo">
              Try the synthetic demo <ArrowDown aria-hidden weight="bold" />
            </a>
          </div>
          <p className="hero-proof">
            <ShieldCheck aria-hidden weight="fill" /> Synthetic patients · Affinity Test · never
            Live
          </p>
        </div>

        <HeroProductVisual />
      </section>

      <section
        className="benefits-section section-shell"
        id="benefits"
        aria-labelledby="benefits-title"
        data-landing-reveal
      >
        <header className="section-heading">
          <p>Built for the clinical boundary</p>
          <h2 id="benefits-title">Useful agent access without prescribing authority</h2>
        </header>
        <div className="benefit-grid">
          {benefits.map(({ icon: Icon, title, copy }) => (
            <article key={title}>
              <span className="feature-icon" aria-hidden>
                <Icon weight="duotone" />
              </span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <TaglineReveal />

      <section
        className="how-section section-shell"
        id="workflow"
        aria-labelledby="workflow-title"
        data-landing-reveal
      >
        <header className="section-heading">
          <p>How it works</p>
          <h2 id="workflow-title">One visible path from visit to provider review</h2>
        </header>
        <ol className="how-grid">
          {steps.map(({ icon: Icon, number, title, copy }) => (
            <li key={number}>
              <div>
                <span>{number}</span>
                <Icon aria-hidden weight="duotone" />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="proof-section" id="proof" aria-labelledby="proof-title">
        <div className="section-shell proof-layout" data-landing-reveal>
          <div>
            <p className="proof-kicker">The safety contract is visible</p>
            <h2 id="proof-title">The agent stops where clinical judgment starts.</h2>
            <p>
              Every automated step is reversible. Every consequential step is gated by a person.
              Every record in this demo is synthetic.
            </p>
          </div>
          <dl className="proof-list">
            <div>
              <dt>Five</dt>
              <dd>WebMCP tools across patient context and draft preparation</dd>
            </div>
            <div>
              <dt>Unsigned</dt>
              <dd>The only prescription state an agent can prepare</dd>
            </div>
            <div>
              <dt>Human</dt>
              <dd>Confirmation required before provider review handoff</dd>
            </div>
            <div>
              <dt>Test</dt>
              <dd>Synthetic patients only, with no Live connection</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className="faq-section section-shell"
        aria-labelledby="faq-title"
        data-landing-reveal
      >
        <header className="section-heading">
          <p>Questions before you try it</p>
          <h2 id="faq-title">Designed to make the limit obvious</h2>
        </header>
        <div className="faq-list">
          {questions.map(({ question, answer }) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="final-cta section-shell"
        aria-labelledby="final-cta-title"
        data-landing-reveal
      >
        <div>
          <ClipboardText aria-hidden weight="duotone" />
          <p>Ready to test the boundary?</p>
          <h2 id="final-cta-title">Ask the browser agent to prepare the draft.</h2>
          <p>Suggested prompt: Prepare Ada Zieme's medication review. Do not create an order.</p>
        </div>
        <a className="landing-button landing-button-light" href="#agent-demo">
          Open the live workspace <ArrowRight aria-hidden weight="bold" />
        </a>
      </section>

      <section
        className="live-demo-intro section-shell"
        aria-labelledby="live-demo-title"
        data-landing-reveal
      >
        <p>Live product surface</p>
        <h2 id="live-demo-title">Run the unsigned proposal workflow</h2>
        <p>
          Use the patient list yourself or ask a WebMCP enabled browser agent to run the suggested
          prompt. The activity log shows what changed.
        </p>
      </section>
      <PublicAgentDemo />
    </main>
  );
}

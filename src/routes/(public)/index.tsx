import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ClipboardText,
  FileText,
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
      { title: "Northstar, a demo telehealth platform" },
      {
        name: "description",
        content:
          "Fork a small example telehealth clinic with synthetic patients, an Affinity Test prescribing integration, and optional WebMCP access.",
      },
    ],
  }),
  component: Home,
});

const benefits = [
  {
    icon: FileText,
    title: "Fork a working clinic",
    copy: "Northstar includes an EHR style workspace, synthetic patients, visit context, and a medication review flow. Start from code you can run.",
  },
  {
    icon: Robot,
    title: "Use WebMCP if you want it",
    copy: "Five WebMCP tools are already installed. Keep them, change them, or remove them without changing the clinic workflow.",
  },
  {
    icon: ShieldCheck,
    title: "Keep prescribing human",
    copy: "An agent may prepare an unsigned Test draft. A clinician still reviews the form and confirms every prescribing decision.",
  },
];

const steps = [
  {
    icon: FileText,
    number: "01",
    title: "Copy the example",
    copy: "Fork Northstar and run the same small telehealth clinic shown on this page.",
  },
  {
    icon: Robot,
    number: "02",
    title: "Run the clinic workspace",
    copy: "Open synthetic patients, review a completed encounter, and move the visit into Affinity Test.",
  },
  {
    icon: UserCircleCheck,
    number: "03",
    title: "Add the agent when useful",
    copy: "Optionally ask a WebMCP enabled browser agent to prepare the unsigned draft. The clinician confirms it.",
  },
];

const questions = [
  {
    question: "What is Northstar?",
    answer:
      "Northstar is a small example telehealth platform you can fork. It includes an EHR style clinic workspace, synthetic patient data, and a medication review flow.",
  },
  {
    question: "What is Affinity in this example?",
    answer:
      "Affinity Test is the prescribing backend behind Northstar. This example prepares unsigned Test drafts only and never connects to Live.",
  },
  {
    question: "Do I need WebMCP to use the clinic?",
    answer:
      "No. The clinic works through its normal human interface. WebMCP is an optional integration that is already wired into the example.",
  },
  {
    question: "Can a browser agent prescribe?",
    answer:
      "No. An agent can prepare an unsigned proposal, but it cannot confirm or create an order. The clinician confirmation gate stops it first.",
  },
  {
    question: "Does the example use real patient data?",
    answer:
      "No. Every patient is synthetic and every prescribing operation stays in Affinity Test. Northstar never connects to Live patient data.",
  },
  {
    question: "What should I try first?",
    answer:
      "Open the clinic workspace and review the synthetic visit yourself. To try the optional agent path, ask it to prepare Ada Zieme's medication review without creating an order.",
  },
];

function Home() {
  return (
    <main className="landing-page">
      <LandingReveal />
      <section className="landing-hero section-shell" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span aria-hidden /> Example telehealth platform
          </p>
          <h1 id="page-title">
            A demo telehealth clinic
            <br /> you can copy.
          </h1>
          <p className="hero-summary">
            Northstar is a small example EHR for telehealth. Fork it. WebMCP is already wired if you
            want a browser agent to prepare an unsigned Test draft. A clinician still confirms every
            prescribing decision.
          </p>
          <div className="hero-actions">
            <a className="landing-button landing-button-primary" href="#agent-demo">
              Open the clinic workspace <ArrowDown aria-hidden weight="bold" />
            </a>
          </div>
          <p className="hero-proof">
            <ShieldCheck aria-hidden weight="fill" /> Synthetic patients. Affinity Test. Never Live.
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
          <p>A clinic example, not a vendor pitch</p>
          <h2 id="benefits-title">Fork the clinic and choose the integrations</h2>
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
          <h2 id="workflow-title">Run Northstar first. Add agent access when you want it.</h2>
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
            <p className="proof-kicker">What belongs where</p>
            <h2 id="proof-title">
              Northstar is the clinic. Affinity Test is the prescribing backend.
            </h2>
            <p>
              WebMCP gives a browser agent optional access to prepare visible work. The agent stops
              at Northstar's clinician confirmation gate.
            </p>
          </div>
          <dl className="proof-list">
            <div>
              <dt>Northstar</dt>
              <dd>Copyable clinic and EHR style workspace</dd>
            </div>
            <div>
              <dt>Affinity Test</dt>
              <dd>Prescribing backend for unsigned demo drafts</dd>
            </div>
            <div>
              <dt>WebMCP</dt>
              <dd>Optional browser agent access that is already wired</dd>
            </div>
            <div>
              <dt>Clinician</dt>
              <dd>Confirms every prescribing decision</dd>
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
          <p>Questions before you copy it</p>
          <h2 id="faq-title">Know what is included</h2>
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
          <p>The clinic is ready to run</p>
          <h2 id="final-cta-title">Open Northstar and review the synthetic visit.</h2>
          <p>
            Use the interface yourself. To try the agent path, ask it to prepare Ada Zieme's
            medication review without creating an order.
          </p>
        </div>
        <a className="landing-button landing-button-light" href="#agent-demo">
          Open the clinic workspace <ArrowRight aria-hidden weight="bold" />
        </a>
      </section>

      <section
        className="live-demo-intro section-shell"
        aria-labelledby="live-demo-title"
        data-landing-reveal
      >
        <p>Northstar clinic workspace</p>
        <h2 id="live-demo-title">Review the unsigned proposal</h2>
        <p>
          This is the working example, not a screenshot. Select a synthetic patient, inspect the
          completed encounter, and prepare an Affinity Test draft.
        </p>
      </section>
      <PublicAgentDemo />
    </main>
  );
}

import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardText,
  FileText,
  Robot,
  ShieldCheck,
  ShoppingCart,
  UserCircleCheck,
} from "@phosphor-icons/react";

import { HeroProductVisual } from "../../features/landing/hero-product-visual";
import { LandingReveal, TaglineReveal } from "../../features/landing/tagline-reveal";

export const Route = createFileRoute("/(public)/")({
  head: () => ({
    meta: [
      { title: "Northstar, a demo telehealth platform" },
      {
        name: "description",
        content:
          "Fork a small example telehealth clinic where people and browser agents search a synthetic medication marketplace and fill a patient cart.",
      },
    ],
  }),
  component: Home,
});

const benefits = [
  {
    icon: FileText,
    title: "Fork a working clinic",
    copy: "Northstar includes synthetic patients, a medication marketplace, patient carts, and Test orders. Start from code you can run.",
  },
  {
    icon: Robot,
    title: "Use WebMCP if you want it",
    copy: "Four WebMCP tools let agents search, open products, add to a cart, and inspect it in the same clinic UI.",
  },
  {
    icon: ShieldCheck,
    title: "Keep checkout human",
    copy: "An agent may fill a patient cart. A clinician still reviews every item and confirms Test checkout.",
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
    icon: ShoppingCart,
    number: "02",
    title: "Build a patient cart",
    copy: "Search the synthetic medication marketplace, open a product, and add it for a named patient.",
  },
  {
    icon: UserCircleCheck,
    number: "03",
    title: "Check out as the clinician",
    copy: "Use the normal UI or let a WebMCP agent fill the cart. Only the clinician can confirm Test checkout.",
  },
];

const questions = [
  {
    question: "What is Northstar?",
    answer:
      "Northstar is a small example telehealth platform you can fork. It includes synthetic patients, a medication marketplace, patient carts, and simple Test orders.",
  },
  {
    question: "What is Affinity in this example?",
    answer:
      "Affinity Test is the backend behind Northstar's cart and order flow. The example uses synthetic data and never connects to Live.",
  },
  {
    question: "Do I need WebMCP to use the clinic?",
    answer:
      "No. The marketplace and cart work through the normal clinic interface. WebMCP is optional and already wired into the example.",
  },
  {
    question: "Can a browser agent check out?",
    answer:
      "No. An agent can search, open a product, add it to a patient cart, and inspect the cart. Only a clinician can confirm checkout.",
  },
  {
    question: "Does the example use real patient data?",
    answer:
      "No. Every patient and product is synthetic. Cart checkout stays in Affinity Test, and Northstar never connects to Live patient data.",
  },
  {
    question: "What should I try first?",
    answer:
      "Use the demo clinician, search for Semaglutide, and add it to Ada Zieme's cart. Then open the cart and review it as the clinician.",
  },
];

function Home() {
  return (
    <main className="landing-page">
      <LandingReveal />
      <section className="landing-hero section-shell" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span aria-hidden />
            Example telehealth platform
          </p>
          <h1 id="page-title">
            A demo telehealth clinic
            <br /> you can copy.
          </h1>
          <p className="hero-summary">
            Northstar is a small example clinic for telehealth. Fork it. Search a synthetic
            medication marketplace, add products to a patient cart, and review Test orders. WebMCP
            is already wired if you want a browser agent to fill the cart. A clinician still checks
            out.
          </p>
          <div className="hero-actions">
            <Link className="landing-button landing-button-primary" to="/login">
              Sign in <ArrowRight aria-hidden weight="bold" />
            </Link>
            <Link className="landing-button landing-button-secondary" to="/signup">
              Create account
            </Link>
          </div>
          <p className="hero-proof">
            <ShieldCheck aria-hidden weight="fill" />
            Synthetic patients. Affinity Test. Never Live.
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
          <h2 id="workflow-title">Search the catalog. Build a patient cart. Check it yourself.</h2>
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
            <h2 id="proof-title">Northstar is the clinic. Affinity Test is the Test backend.</h2>
            <p>
              WebMCP lets a browser agent search the same catalog and fill the same patient cart.
              The agent stops before Northstar's clinician checkout gate.
            </p>
          </div>
          <dl className="proof-list">
            <div>
              <dt>Northstar</dt>
              <dd>Copyable clinic, marketplace, patient cart, and orders</dd>
            </div>
            <div>
              <dt>Affinity Test</dt>
              <dd>Backend for synthetic Test carts and orders</dd>
            </div>
            <div>
              <dt>WebMCP</dt>
              <dd>Optional catalog and cart tools that are already wired</dd>
            </div>
            <div>
              <dt>Clinician</dt>
              <dd>Reviews the cart and confirms checkout</dd>
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
          <p>Open the example clinic</p>
          <h2 id="final-cta-title">Sign in and open the medication marketplace.</h2>
          <p>
            Use the demo clinician for immediate access, or create your own account. Every patient,
            product, cart, and order is synthetic.
          </p>
        </div>
        <Link className="landing-button landing-button-light" to="/login">
          Open Northstar <ArrowRight aria-hidden weight="bold" />
        </Link>
      </section>
    </main>
  );
}

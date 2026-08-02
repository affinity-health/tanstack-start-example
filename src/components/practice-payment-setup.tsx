import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

type PaymentProfile = {
  environment: "sandbox";
  paymentMethod: { brand: string; last4: string; type: "card" } | null;
  status: "action_required" | "disabled" | "ready" | "setup_required";
};

type PaymentSetup = {
  clientSecret: string;
  consentVersion: string;
  publishableKey: string;
};

export function PracticePaymentSetup() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [profile, setProfile] = useState<PaymentProfile>();
  const [setup, setSetup] = useState<PaymentSetup>();
  const elementMount = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<StripeElements | undefined>(undefined);
  const stripeRef = useRef<Stripe | undefined>(undefined);

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    if (!setup || !elementMount.current) return;

    let active = true;
    const mountNode = elementMount.current;
    const mount = async () => {
      const stripe = await loadStripe(setup.publishableKey);
      if (!active) return;
      if (!stripe) {
        setError("Stripe.js could not load. Check the browser connection and try again.");
        return;
      }

      const elements = stripe.elements({ clientSecret: setup.clientSecret });
      const paymentElement = elements.create("payment", { layout: "tabs" });
      paymentElement.on("ready", () => active && setPaymentElementReady(true));
      paymentElement.mount(mountNode);
      elementsRef.current = elements;
      stripeRef.current = stripe;
    };
    void mount();

    return () => {
      active = false;
      mountNode.replaceChildren();
      elementsRef.current = undefined;
      stripeRef.current = undefined;
    };
  }, [setup]);

  async function loadProfile() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/affinity/payment-profile", { credentials: "include" });
      const result = await readJson(response);
      if (!response.ok || !isPaymentProfile(result)) {
        throw new Error(isErrorResponse(result) ? result.error : "Payment status is unavailable.");
      }
      setProfile(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment status is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function startSetup() {
    setPending(true);
    setError(undefined);
    setPaymentElementReady(false);
    try {
      const response = await fetch("/api/affinity/payment-setup", {
        body: JSON.stringify({ consentAccepted: true }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = await readJson(response);
      if (!response.ok || !isPaymentSetup(result)) {
        throw new Error(isErrorResponse(result) ? result.error : "Payment setup could not start.");
      }
      setSetup(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment setup could not start.");
    } finally {
      setPending(false);
    }
  }

  async function completeSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;

    setPending(true);
    setError(undefined);
    try {
      const confirmed = await stripe.confirmSetup({
        confirmParams: { return_url: window.location.href },
        elements,
        redirect: "if_required",
      });
      if (confirmed.error) throw new Error(confirmed.error.message);
      if (!confirmed.setupIntent)
        throw new Error("Stripe did not return the confirmed SetupIntent.");

      const response = await fetch("/api/affinity/payment-setup/complete", {
        body: JSON.stringify({ setupIntentId: confirmed.setupIntent.id }),
        credentials: "include",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = await readJson(response);
      if (!response.ok || !isPaymentProfile(result)) {
        throw new Error(isErrorResponse(result) ? result.error : "Payment setup could not finish.");
      }
      setProfile(result);
      setSetup(undefined);
      setAccepted(false);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment setup could not finish.");
    } finally {
      setPending(false);
    }
  }

  const ready = profile?.status === "ready" && profile.paymentMethod;

  return (
    <section className="practice-billing" aria-labelledby="practice-billing-title">
      <div className="practice-billing-heading">
        <span className="practice-billing-icon">
          <CreditCard aria-hidden size={18} />
        </span>
        <div>
          <h2 id="practice-billing-title">Practice billing</h2>
          <p>The practice adds its own payment method directly through Stripe Test.</p>
        </div>
        <span className="affinity-mode-badge">Test mode</span>
      </div>

      {loading ? (
        <div className="practice-billing-state" role="status">
          <LoaderCircle aria-hidden className="spin" size={18} />
          Checking payment readiness…
        </div>
      ) : setup ? (
        <form className="practice-billing-form" onSubmit={completeSetup}>
          <div ref={elementMount} className="stripe-payment-element" />
          <p className="practice-billing-consent">
            <ShieldCheck aria-hidden size={15} />
            Consent version {setup.consentVersion} was recorded before this one-time setup opened.
          </p>
          {error ? <p className="practice-billing-error">{error}</p> : null}
          <div className="practice-billing-actions">
            <button
              className="button"
              disabled={pending}
              onClick={() => {
                setAccepted(false);
                setEditing(false);
                setSetup(undefined);
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="button button-dark"
              disabled={!paymentElementReady || pending}
              type="submit"
            >
              {pending ? "Saving…" : "Save test card"}
            </button>
          </div>
        </form>
      ) : (
        <div className="practice-billing-summary">
          <div className="practice-billing-profile">
            {ready ? <CheckCircle2 aria-hidden size={18} /> : <CreditCard aria-hidden size={18} />}
            <span>
              <strong>
                {ready ? `${ready.brand} •••• ${ready.last4}` : "Payment setup required"}
              </strong>
              <small>
                {ready
                  ? "Owned by this practice and ready for automatic Test collection"
                  : "A payment method is required before an order can be accepted"}
              </small>
            </span>
          </div>
          {ready && !editing ? (
            <div className="practice-billing-manage">
              <p>
                Northstar receives only the card brand, last four digits, and readiness status. Card
                details never touch the platform server.
              </p>
              <button className="button button-dark" onClick={() => setEditing(true)} type="button">
                Replace test card
              </button>
            </div>
          ) : (
            <div className="practice-billing-enrollment">
              <label className="practice-billing-checkbox">
                <input
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  type="checkbox"
                />
                I am authorized to manage this practice payment method and accept Test collection
                terms.
              </label>
              <div className="practice-billing-enrollment-actions">
                {ready ? (
                  <button
                    className="button"
                    disabled={pending}
                    onClick={() => {
                      setAccepted(false);
                      setEditing(false);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  className="button button-dark"
                  disabled={!accepted || pending}
                  onClick={startSetup}
                  type="button"
                >
                  {pending ? "Opening Stripe…" : ready ? "Continue" : "Add test card"}
                </button>
              </div>
            </div>
          )}
          {error ? <p className="practice-billing-error">{error}</p> : null}
        </div>
      )}
    </section>
  );
}

async function readJson(response: Response): Promise<unknown> {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function isErrorResponse(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function isPaymentProfile(value: unknown): value is PaymentProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    "environment" in value &&
    value.environment === "sandbox" &&
    "paymentMethod" in value &&
    (value.paymentMethod === null ||
      (typeof value.paymentMethod === "object" &&
        value.paymentMethod !== null &&
        "brand" in value.paymentMethod &&
        typeof value.paymentMethod.brand === "string" &&
        "last4" in value.paymentMethod &&
        typeof value.paymentMethod.last4 === "string")) &&
    "status" in value &&
    typeof value.status === "string"
  );
}

function isPaymentSetup(value: unknown): value is PaymentSetup {
  return (
    typeof value === "object" &&
    value !== null &&
    "clientSecret" in value &&
    typeof value.clientSecret === "string" &&
    "consentVersion" in value &&
    typeof value.consentVersion === "string" &&
    "publishableKey" in value &&
    typeof value.publishableKey === "string"
  );
}

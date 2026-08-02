import { ArrowRight, CheckCircle2, ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { DemoCode } from "./demo-code";

type HeadlessOptions = {
  medications: Array<{
    dosageForm: string;
    id: string;
    name: string;
    route: string;
    strength: string | null;
  }>;
  patients: Array<{
    id: string;
    name: string;
    state: string;
  }>;
  recommendedPatientId: string | null;
};

type HeadlessOrder = {
  orderId: string;
  prescriptionIds: string[];
  signingSession: {
    expiresAt: string;
    url: string;
  };
};

export function HeadlessSdkDemo() {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<HeadlessOptions>();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<HeadlessOrder>();
  const [reasonCategory, setReasonCategory] = useState("");
  const [selectedMedicationId, setSelectedMedicationId] = useState("");

  useEffect(() => {
    void loadOptions();
  }, []);

  const selectedMedication = useMemo(
    () => options?.medications.find((medication) => medication.id === selectedMedicationId),
    [options, selectedMedicationId],
  );

  async function loadOptions() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/affinity/headless-options", { credentials: "include" });
      const body = await readJson(response);
      if (!response.ok || !isHeadlessOptions(body)) {
        throw new Error(isErrorResponse(body) ? body.error : "Test data is unavailable.");
      }
      setOptions(body);
      setSelectedMedicationId((current) => current || body.medications[0]?.id || "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Test data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const signingWindow = window.open(
      "about:blank",
      "affinity-headless-signing",
      "popup,width=1080,height=760",
    );
    if (signingWindow) prepareSigningWindow(signingWindow);

    setError(undefined);
    setPending(true);
    setResult(undefined);
    try {
      const compoundingContext = String(form.get("compoundingContext") ?? "").trim();
      const response = await fetch("/api/affinity/headless-order", {
        body: JSON.stringify({
          patientId: String(form.get("patientId")),
          prescriptions: [
            {
              ...(reasonCategory && compoundingContext
                ? {
                    compoundingReason: {
                      category: reasonCategory,
                      context: compoundingContext,
                    },
                  }
                : {}),
              daysSupply: Number(form.get("daysSupply")),
              directions: String(form.get("directions")),
              medicationId: String(form.get("medicationId")),
              quantity: Number(form.get("quantity")),
              quantityUnit: String(form.get("quantityUnit")),
              refills: Number(form.get("refills")),
              structuredSig: {
                dose: String(form.get("dose")),
                doseUnit: String(form.get("doseUnit")),
                frequency: String(form.get("frequency")),
                prn: false,
                route: String(form.get("route")),
              },
              substitutionPermitted: false,
            },
          ],
          returnUrl: `${window.location.origin}${window.location.pathname}`,
        }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "idempotency-key": `northstar_${crypto.randomUUID()}`,
        },
        method: "POST",
      });
      const body = await readJson(response);
      if (!response.ok || !isHeadlessOrder(body)) {
        throw new Error(isErrorResponse(body) ? body.error : "The order could not be created.");
      }
      setResult(body);
      if (signingWindow && !signingWindow.closed)
        signingWindow.location.replace(body.signingSession.url);
    } catch (cause) {
      if (signingWindow && !signingWindow.closed) signingWindow.close();
      setError(cause instanceof Error ? cause.message : "The order could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="affinity-demo" aria-labelledby="headless-demo-title">
      <div className="affinity-demo-heading">
        <div>
          <div className="affinity-demo-label">
            <span>Headless SDK</span>
            <span>Northstar-owned UI</span>
          </div>
          <h2 id="headless-demo-title">Create with your interface. Sign with Affinity.</h2>
          <p>
            Northstar collects the prescription details. Its backend creates the unsigned Test order
            with the Affinity TypeScript SDK, then sends the provider to Affinity to sign.
          </p>
        </div>
        <span className="affinity-mode-badge">Test mode</span>
      </div>

      <div className="headless-demo-body">
        <DemoCode title="View the server-side SDK call">{`
const order = await affinity.orders.create({
  patientId,
  practiceId,
  providerMappingId,
  prescriptions,
});

const signing = await affinity.orderSigningSessions.create({
  orderId: order.id,
  practiceId,
  providerMappingId,
  userId,
});`}</DemoCode>
        <ol className="headless-flow" aria-label="Headless SDK workflow">
          <li>
            <strong>1</strong>
            <span>
              <b>Northstar UI</b>Your form and workflow
            </span>
          </li>
          <ArrowRight aria-hidden size={15} />
          <li>
            <strong>2</strong>
            <span>
              <b>Affinity SDK</b>Unsigned order on your server
            </span>
          </li>
          <ArrowRight aria-hidden size={15} />
          <li>
            <strong>3</strong>
            <span>
              <b>Provider signs</b>PIN stays inside Affinity
            </span>
          </li>
        </ol>

        {loading ? (
          <div className="headless-state" role="status">
            <LoaderCircle aria-hidden className="spin" size={19} />
            Loading Test patients and formulations…
          </div>
        ) : error && !options ? (
          <div className="headless-state headless-state-error" role="alert">
            <span>{error}</span>
            <button
              className="emr-button emr-button-secondary"
              onClick={() => void loadOptions()}
              type="button"
            >
              <RefreshCw aria-hidden size={14} /> Retry
            </button>
          </div>
        ) : options ? (
          <form className="headless-form" onSubmit={submit}>
            <div className="headless-form-grid">
              <label className="headless-field headless-field-wide">
                Patient
                <select
                  defaultValue={options.recommendedPatientId ?? options.patients[0]?.id}
                  name="patientId"
                  required
                >
                  {options.patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.state}
                    </option>
                  ))}
                </select>
              </label>
              <label className="headless-field headless-field-wide">
                Formulation
                <select
                  name="medicationId"
                  onChange={(event) => setSelectedMedicationId(event.currentTarget.value)}
                  required
                  value={selectedMedicationId}
                >
                  {options.medications.map((medication) => (
                    <option key={medication.id} value={medication.id}>
                      {medication.name}
                      {medication.strength ? ` · ${medication.strength}` : ""} ·{" "}
                      {medication.dosageForm}
                    </option>
                  ))}
                </select>
              </label>
              <label className="headless-field">
                Dose
                <input name="dose" placeholder="0.25" required />
              </label>
              <label className="headless-field">
                Dose unit
                <input name="doseUnit" placeholder="mL" required />
              </label>
              <label className="headless-field">
                Frequency
                <input name="frequency" placeholder="once weekly" required />
              </label>
              <label className="headless-field">
                Route
                <input name="route" readOnly value={selectedMedication?.route ?? ""} />
              </label>
              <label className="headless-field">
                Quantity
                <input
                  min="0.01"
                  name="quantity"
                  required
                  step="0.01"
                  type="number"
                  defaultValue="1"
                />
              </label>
              <label className="headless-field">
                Quantity unit
                <input name="quantityUnit" placeholder="mL or capsule" required />
              </label>
              <label className="headless-field">
                Days supply
                <input min="1" name="daysSupply" required type="number" defaultValue="30" />
              </label>
              <label className="headless-field">
                Refills
                <input min="0" name="refills" required type="number" defaultValue="0" />
              </label>
              <label className="headless-field headless-field-wide">
                SIG directions
                <textarea
                  name="directions"
                  placeholder="Enter the complete patient-specific directions"
                  required
                  rows={3}
                />
              </label>
              <label className="headless-field headless-field-wide">
                Clinical difference (if required)
                <select
                  name="compoundingCategory"
                  onChange={(event) => setReasonCategory(event.currentTarget.value)}
                  value={reasonCategory}
                >
                  <option value="">No documented difference required</option>
                  <option value="dosage_form_unavailable">Dosage form unavailable</option>
                  <option value="concentration_adjustment">Concentration adjustment</option>
                  <option value="inactive_ingredient_sensitivity">
                    Inactive ingredient sensitivity
                  </option>
                  <option value="alternate_route">Alternate route</option>
                  <option value="patient_cannot_use_commercial_product">
                    Patient cannot use commercial product
                  </option>
                  <option value="other_patient_specific_need">Other patient-specific need</option>
                </select>
              </label>
              {reasonCategory ? (
                <label className="headless-field headless-field-wide">
                  Patient-specific explanation
                  <textarea
                    name="compoundingContext"
                    placeholder="Explain why the available commercial product does not meet this patient's need"
                    required
                    rows={2}
                  />
                </label>
              ) : null}
            </div>

            <div className="headless-form-footer">
              <p>
                ICD-10-CM diagnoses are optional. The API key and provider signing PIN never enter
                this browser.
              </p>
              <button
                className="emr-button emr-button-primary"
                disabled={
                  pending || options.patients.length === 0 || options.medications.length === 0
                }
                type="submit"
              >
                {pending ? (
                  <LoaderCircle aria-hidden className="spin" size={16} />
                ) : (
                  <ExternalLink aria-hidden size={16} />
                )}
                {pending ? "Creating Test order…" : "Create order & open signing"}
              </button>
            </div>
            {error ? (
              <p className="headless-form-error" role="alert">
                {error}
              </p>
            ) : null}
            {result ? (
              <div className="headless-success" role="status">
                <CheckCircle2 aria-hidden size={18} />
                <span>
                  <strong>Unsigned order created</strong> {result.orderId} · Affinity signing opened
                  securely.
                </span>
              </div>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  );
}

function prepareSigningWindow(signingWindow: Window) {
  signingWindow.opener = null;
  signingWindow.document.title = "Opening Affinity";
  signingWindow.document.body.innerHTML =
    '<main style="font:14px system-ui;display:grid;min-height:100vh;place-content:center;text-align:center;color:#17211d"><strong>Opening Affinity signing…</strong><p style="color:#66736d">Creating a secure, single-use session.</p></main>';
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

function isHeadlessOptions(value: unknown): value is HeadlessOptions {
  return (
    typeof value === "object" &&
    value !== null &&
    "patients" in value &&
    Array.isArray(value.patients) &&
    "medications" in value &&
    Array.isArray(value.medications) &&
    "recommendedPatientId" in value &&
    (value.recommendedPatientId === null || typeof value.recommendedPatientId === "string")
  );
}

function isHeadlessOrder(value: unknown): value is HeadlessOrder {
  return (
    typeof value === "object" &&
    value !== null &&
    "orderId" in value &&
    typeof value.orderId === "string" &&
    "signingSession" in value &&
    typeof value.signingSession === "object" &&
    value.signingSession !== null &&
    "url" in value.signingSession &&
    typeof value.signingSession.url === "string"
  );
}

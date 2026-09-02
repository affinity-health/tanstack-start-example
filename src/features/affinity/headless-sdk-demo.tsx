import { ArrowRight, CheckCircle2, ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { PrescribingTools } from "../webmcp/prescribing-tools";
import {
  canCreateTestOrder,
  createHostedAffinityTestAdapter,
  type HostedOrder,
  type HostedWorkflowOptions,
} from "../../lib/patient-workflow";

export function HeadlessSdkDemo({ preferredPatientName }: { preferredPatientName?: string }) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<HostedWorkflowOptions>();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<HostedOrder>();
  const [reasonCategory, setReasonCategory] = useState("");
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [agentAnnouncement, setAgentAnnouncement] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const adapter = useMemo(() => createHostedAffinityTestAdapter(), []);

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
      const body = await adapter.loadOptions();
      setOptions(body);
      setSelectedMedicationId((current) => current || body.medications[0]?.id || "");
      setSelectedPatientId((current) => {
        if (current) return current;
        const preferredPatient = body.patients.find(
          (patient) => patient.name === preferredPatientName,
        );
        return preferredPatient?.id ?? body.recommendedPatientId ?? body.patients[0]?.id ?? "";
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Test data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!humanConfirmed) {
      setError(
        "Review the draft and complete the clinician confirmation before creating an order.",
      );
      return;
    }
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
      if (!adapter.createOrder) throw new Error("Affinity Test order creation is unavailable.");
      const body = await adapter.createOrder({
        ...(reasonCategory && compoundingContext
          ? { compoundingReason: { category: reasonCategory, context: compoundingContext } }
          : {}),
        daysSupply: Number(form.get("daysSupply")),
        directions: String(form.get("directions")),
        dose: String(form.get("dose")),
        doseUnit: String(form.get("doseUnit")),
        frequency: String(form.get("frequency")),
        medicationId: String(form.get("medicationId")),
        patientId: String(form.get("patientId")),
        quantity: Number(form.get("quantity")),
        quantityUnit: String(form.get("quantityUnit")),
        refills: Number(form.get("refills")),
        returnUrl: `${window.location.origin}${window.location.pathname}`,
        route: String(form.get("route")),
      });
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

  const prepareAgentDraft = useCallback(
    (draft: {
      daysSupply: number;
      directions: string;
      dose: string;
      doseUnit: string;
      frequency: string;
      medicationId: string;
      patientId: string;
      quantity: number;
      quantityUnit: string;
      refills: number;
    }) => {
      setSelectedPatientId(draft.patientId);
      setSelectedMedicationId(draft.medicationId);
      setHumanConfirmed(false);
      setResult(undefined);
      setError(undefined);
      setAgentAnnouncement(
        "Agent prepared the visible Test draft. Clinician confirmation required.",
      );
      window.requestAnimationFrame(() => {
        const form = formRef.current;
        if (!form) return;
        for (const [name, value] of Object.entries(draft)) {
          if (name === "patientId" || name === "medicationId") continue;
          const field = form.elements.namedItem(name);
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            field.value = String(value);
          }
        }
      });
    },
    [],
  );

  return (
    <section className="affinity-demo" aria-labelledby="headless-demo-title">
      <div className="affinity-demo-heading">
        <div>
          <div className="affinity-demo-label">
            <span>Unsigned proposal</span>
            <span>Affinity Test</span>
          </div>
          <h2 id="headless-demo-title">Confirm the draft before provider review</h2>
          <p>
            The agent may fill the form. A clinician must review every field before Northstar
            creates the unsigned Test order.
          </p>
        </div>
        <span className="affinity-mode-badge">Test mode</span>
      </div>

      <div className="headless-demo-body">
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
              <b>Human confirm</b>Unsigned Test order
            </span>
          </li>
          <ArrowRight aria-hidden size={15} />
          <li>
            <strong>3</strong>
            <span>
              <b>Provider review</b>PIN stays inside Affinity
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
          <form
            className="headless-form"
            onChange={(event) => {
              const field = event.target;
              if (!(field instanceof HTMLInputElement) || field.name !== "humanConfirmation")
                setHumanConfirmed(false);
            }}
            onSubmit={submit}
            ref={formRef}
          >
            <PrescribingTools
              medications={options.medications}
              onPrepare={prepareAgentDraft}
              patients={options.patients}
            />
            <p className="sr-only" aria-live="polite">
              {agentAnnouncement}
            </p>
            <div className="headless-form-grid">
              <label className="headless-field headless-field-wide">
                Patient
                <select
                  name="patientId"
                  onChange={(event) => setSelectedPatientId(event.currentTarget.value)}
                  required
                  value={selectedPatientId}
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

            <label className="headless-confirmation">
              <input
                checked={humanConfirmed}
                name="humanConfirmation"
                onChange={(event) => setHumanConfirmed(event.currentTarget.checked)}
                type="checkbox"
              />
              <span>
                <strong>Clinician confirmation</strong>
                I reviewed the patient, formulation, SIG, quantity, and refills. Create an unsigned
                Affinity Test order and open the separate signing step.
              </span>
            </label>

            <div className="headless-form-footer">
              <p>
                ICD-10-CM diagnoses are optional. The API key and provider signing PIN never enter
                this browser.
              </p>
              <button
                className="emr-button emr-button-primary"
                disabled={
                  !canCreateTestOrder({
                    humanConfirmed,
                    medicationCount: options.medications.length,
                    patientCount: options.patients.length,
                    pending,
                  })
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
    '<main style="font:14px system-ui;display:grid;min-height:100vh;place-content:center;text-align:center;color:#15201c"><strong>Opening Affinity signing…</strong><p style="color:#4b5d56">Creating a secure, single-use session.</p></main>';
}

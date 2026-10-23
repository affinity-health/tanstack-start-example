import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import type { OrderCreateParams } from "@affinity-health/sdk";
import { toast } from "sonner";
import { optionsQuery } from "../../../api/prescribing/queries";
import { createOrder } from "../../../api/prescribing/functions";
import { prescriptionInput, type PrescriptionInput } from "../../../api/prescribing/schema";
import { buildOrderInput } from "../../../server/affinity/prescriptions";
import { idempotent, pendingInput } from "../../../lib/idempotency";
import { useWorkspace } from "../../workspace/workspace-layout";
import { resolvePrescriber } from "../../workspace/demo-profile";
import { patients } from "../../../data/patients";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Choice } from "../../../components/choice";
import { MedicationPicker } from "./medication-picker";
import { OrderReview } from "./order-review";
import type { Options, Catalog, Order } from "../../../api/types";
import {
  PrescriptionFields,
  defaultFields,
  fieldInput,
  type PrescriptionFieldsValue,
} from "./prescription-fields";

type Review = {
  prescription: PrescriptionInput;
  npi: string;
  input: OrderCreateParams;
  options: Options;
};
export function PrescriptionForm() {
  const {
    onBusy,
    initial: { sessionId, practice },
    profile,
    openSettings,
  } = useWorkspace();
  const queryClient = useQueryClient();
  const [externalId, setExternal] = useState(patients[0].externalId);
  const [options, setOptions] = useState<Options>();
  const [fields, setFields] = useState<PrescriptionFieldsValue>();
  const [reason, setReason] = useState("");
  const [review, setReview] = useState<Review>();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [order, setOrder] = useState<Order>();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const localPatient = patients.find((p) => p.externalId === externalId)!;
  const identity = resolvePrescriber(profile, localPatient.address.state);
  useEffect(() => {
    try {
      const saved = pendingInput<Review>(sessionId + ":create");
      if (saved) {
        setReview(saved);
        setOptions(saved.options);
        setExternal(saved.prescription.externalId);
        setPending(true);
        setReviewOpen(true);
      }
    } catch {
      setError("The pending order could not be read from this browser's storage.");
    }
  }, [sessionId]);
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Retry the action.");
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  async function chooseMedication(item: Catalog["data"][number]) {
    setOptions(undefined);
    setFields(undefined);
    setReason("");
    setReview(undefined);
    setOrder(undefined);
    await run(async () => {
      const loaded = await queryClient.fetchQuery(optionsQuery(sessionId, item.id));
      setOptions(loaded);
      setFields(defaultFields(loaded));
    });
  }
  function prepareReview() {
    if (pending && review) {
      setReviewOpen(true);
      return;
    }
    if (!options || !fields) return;
    const parsed = prescriptionInput.safeParse({
      externalId,
      medicationId: options.id,
      ...fieldInput(fields),
      ...(reason.trim() ? { compoundingReason: reason.trim() } : {}),
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      return;
    }
    if (options.requirements.includes("compoundingReason") && !reason.trim()) {
      setError("Choose or enter the patient-specific compounding reason.");
      return;
    }
    setReview({
      prescription: parsed.data,
      npi: identity.npi,
      input: buildOrderInput(practice.id, parsed.data, identity.npi),
      options,
    });
    setOrder(undefined);
    setAttested(false);
    setError("");
    setReviewOpen(true);
  }
  async function send() {
    if (!review || !attested || order) return;
    await run(async () => {
      // Freeze this reviewed input after the first attempt, including an uncertain response.
      setPending(true);
      const input = { prescription: review.prescription, npi: review.npi, attested: true as const };
      const created = await idempotent(sessionId + ":create", review, (key) =>
        createOrder({ data: { ...input, key } }),
      );
      setPending(false);
      if (!created.ok) {
        setAttested(false);
        setReviewOpen(false);
        throw new Error(created.message);
      }
      setOrder(created.order);
      void queryClient.invalidateQueries({ queryKey: [sessionId, "orders"] });
      toast.success("Prescription sent to the pharmacy.");
    });
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <h1>New prescription</h1>
          <p className="intro">Choose a patient and medication. Review, then send.</p>
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <fieldset disabled={busy || reviewOpen || pending}>
        <div className="workspace-grid">
          <aside className="patient-panel">
            <section>
              <Choice
                label="EMR Patient"
                value={externalId}
                items={patients.map((p) => ({
                  value: p.externalId,
                  label: `${p.firstName} ${p.lastName} · ${p.address.state}`,
                }))}
                onChange={(value) => {
                  setExternal(value);
                  setOptions(undefined);
                  setFields(undefined);
                  setReview(undefined);
                  setOrder(undefined);
                  setReason("");
                }}
              />
              <div className="patient-caption">
                <span>Born {localPatient.dateOfBirth}</span>
                <span>
                  {localPatient.address.city}, {localPatient.address.state}
                </span>
              </div>
            </section>
          </aside>
          <div className="prescription-panel">
            <section>
              <MedicationPicker
                key={externalId}
                sessionId={sessionId}
                patientState={localPatient.address.state}
                disabled={busy || pending}
                onChange={(item) => void chooseMedication(item)}
              />
              {options && fields && (
                <PrescriptionFields
                  options={options}
                  value={fields}
                  disabled={busy || pending}
                  onChange={setFields}
                />
              )}
              {options?.requirements.includes("compoundingReason") && (
                <div className="compounding-fields">
                  {options.compoundingReasons.length > 0 ? (
                    <Choice
                      label="Patient-specific compounding reason"
                      value={reason}
                      items={options.compoundingReasons.map((value) => ({ value, label: value }))}
                      onChange={setReason}
                    />
                  ) : (
                    <label>
                      Patient-specific compounding reason
                      <textarea
                        rows={3}
                        maxLength={200}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </fieldset>
      <div className="review-prescriber">
        <p>
          {identity.name} · NPI {identity.npi}
        </p>
        <Button variant="ghost" disabled={busy || pending} onClick={openSettings}>
          Prescriber settings
        </Button>
      </div>
      <Button
        className="preview-button"
        disabled={!options || busy || (!pending && !identity.eligible)}
        onClick={prepareReview}
      >
        {pending ? "Review pending request" : "Review prescription"}
      </Button>
      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!busy) setReviewOpen(open);
        }}
      >
        <DialogPopup className="prescription-dialog" closeProps={{ disabled: busy }}>
          <DialogHeader>
            <DialogTitle>{order ? "Prescription submitted" : "Review prescription"}</DialogTitle>
            <DialogDescription>Synthetic data · Test mode</DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {review && <OrderReview input={review.input} options={review.options} />}
            {!order && (
              <label className="check">
                <Checkbox disabled={busy} checked={attested} onCheckedChange={setAttested} />I
                reviewed this patient's history and prescription, confirm no known allergies, and
                authorize signing as the prescriber shown above.
              </label>
            )}
            {pending && !busy && (
              <p role="status">
                The result is uncertain. Retry this exact reviewed request to retrieve or complete
                the same order.
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {order && (
              <p>
                {order.id} · {order.status}
              </p>
            )}
          </DialogPanel>
          <DialogFooter>
            {order ? (
              <Button onClick={() => setReviewOpen(false)}>Done</Button>
            ) : (
              <Button disabled={busy || !attested} onClick={() => void send()}>
                {busy ? "Sending…" : pending ? "Retry same order" : "Sign and send to pharmacy"}
              </Button>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </main>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { optionsQuery } from "../../../api/prescribing/queries";
import { previewOrder, createDraft } from "../../../api/prescribing/functions";
import { getOrder } from "../../../api/orders/functions";
import { idempotent } from "../../../lib/idempotency";
import { sendReviewedOrder } from "../../orders/order-workflow";
import { useWorkspace } from "../../workspace/workspace-layout";
import { toast } from "sonner";
import { resolvePrescriber } from "../../workspace/demo-profile";
import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
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
import { OrderReview, matchesPreview } from "./order-review";
import type { Options, Preview, Order, Catalog } from "../../../api/types";

export function PrescriptionForm() {
  const { onBusy, initial, profile, openSettings } = useWorkspace();
  const { sessionId, practice } = initial;
  const practiceId = practice.id;
  const queryClient = useQueryClient();
  const [externalId, setExternal] = useState(patients[0].externalId);
  const [medicationId, setMedication] = useState("");
  const [options, setOptions] = useState<Options>();
  const [preview, setPreview] = useState<Preview>();
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState<Order>();
  const [attested, setAttested] = useState(false);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (error) toast.error(error, { id: "workspace-error", duration: 8000 });
    else toast.dismiss("workspace-error");
    return () => {
      toast.dismiss("workspace-error");
    };
  }, [error]);

  function clearOrder() {
    setPreview(undefined);
    setSubmitted(false);
    setNotice("");
    setOrder(undefined);
    setAttested(false);
    setSigned(false);
  }
  const inFlight = useRef(false);
  const reviewButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setAttested(false);
  }, [profile]);
  async function run(label: string, action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(label);
    onBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed. Retry the action.");
    } finally {
      inFlight.current = false;
      setBusy("");
      onBusy(false);
    }
  }
  const localPatient = patients.find((p) => p.externalId === externalId)!;
  const {
    npi,
    name,
    eligible: profileReady,
  } = resolvePrescriber(profile, localPatient.address.state);
  const requirements = options?.catalog.prescriptionRequirements;
  const reasonRequired =
    requirements?.compoundingReason === "required" ||
    requirements?.compoundingReasonContext === "required";
  const categories = requirements?.allowedReasonCategories ?? [];
  const reasonReady =
    !reasonRequired ||
    ((requirements?.compoundingReasonContext === "not_supported" || !!reason.trim()) &&
      (!categories.length || !!category));
  async function chooseMedication(item: Catalog["data"][number]) {
    setMedication(item.id);
    setOptions(undefined);
    setError("");
    setReason("");
    setCategory("");
    clearOrder();
    if (!item.ordering.requiresPrescription) {
      setError("This item is a supply, not a prescription. Choose a prescription medication.");
      return;
    }
    if (!item.isOrderable) {
      setError("This medication is not currently available to order. Choose another medication.");
      return;
    }
    await run("Loading defaults", async () =>
      setOptions(await queryClient.fetchQuery(optionsQuery(sessionId, item.id))),
    );
  }
  async function review() {
    await run("Preparing review", async () => {
      if (!options) return;
      // Reopening an existing draft must preserve its ID and signing progress.
      if (preview) {
        setReviewOpen(true);
        return;
      }
      setPreview(
        await previewOrder({
          data: { externalId, medicationId, expectedRevision: options.revision, reason, category },
        }),
      );
      setAttested(false);
      setReviewOpen(true);
    });
  }
  async function save(send: boolean) {
    await run(
      signed ? "Sending to pharmacy" : send ? "Signing prescription" : "Creating draft",
      async () => {
        if (preview?.status !== "complete" || !options || (send && !profileReady)) return;
        if (!signed && !attested)
          throw new Error("Confirm the patient history and prescription review before saving.");
        let draft = order;
        if (!draft) {
          const input = {
            prescription: {
              externalId,
              medicationId,
              expectedRevision: options.revision,
              reason,
              category,
            },
            allergiesReviewed: true as const,
          };
          draft = await idempotent(sessionId + ":create", input, (key) =>
            createDraft({ data: { ...input, key } }),
          );
          setOrder(draft);
          void queryClient.invalidateQueries({ queryKey: [sessionId, "orders"] });
          if (send && !matchesPreview(draft, preview, npi, options, localPatient)) {
            setAttested(false);
            setNotice(
              "The saved prescription differs from the preview. Review the updated details and confirm again before signing.",
            );
            return;
          }
        }
        if (!send) {
          toast.success("Draft created", { description: "Nothing has been sent to the pharmacy." });
          setReviewOpen(false);
          return;
        }
        const result = await sendReviewedOrder(sessionId, draft, npi, (signedOrder) => {
          setOrder(signedOrder);
          setSigned(true);
        });
        setOrder(result.order);
        if (result.status === "changed") {
          setAttested(false);
          setSigned(
            result.order.status === "ready" || result.order.status === "partially_submitted",
          );
          setNotice("This order changed. Review its current details and confirm again.");
          return;
        }
        void queryClient.invalidateQueries({ queryKey: [sessionId, "orders"] });
        setSubmitted(true);
        setSigned(true);
        setNotice("");
        toast.success("Prescription sent to the pharmacy.");
      },
    );
  }
  const canSave = preview?.status === "complete" && !busy && !submitted;
  return (
    <main>
      <div className="page-heading">
        <div>
          <h1>New prescription</h1>
          <p className="intro">Choose a patient and medication. Review, then send.</p>
        </div>
      </div>
      <fieldset disabled={!!busy || reviewOpen}>
        <div className="workspace-grid">
          <aside className="patient-panel">
            <section>
              <Choice
                label="EMR Patient"
                value={externalId}
                items={patients.map((p) => ({
                  value: p.externalId,
                  label: `${p.name.first} ${p.name.last} · ${p.address.state}`,
                }))}
                onChange={(value) => {
                  setExternal(value);
                  setReason("");
                  setCategory("");
                  clearOrder();
                }}
              />
              <div className="patient-caption">
                <span>
                  Born{" "}
                  {new Date(localPatient.dateOfBirth + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  {localPatient.address.city}, {localPatient.address.state}
                </span>
              </div>
            </section>
          </aside>
          <div className="prescription-panel">
            <section>
              <MedicationPicker
                key={practiceId}
                sessionId={sessionId}
                disabled={!!busy || !practiceId}
                onChange={(item) => void chooseMedication(item)}
              />
              {options && reasonRequired && (
                <div className="compounding-fields">
                  {categories.length > 0 && (
                    <Choice
                      label="Compounding reason"
                      value={category}
                      disabled={!!order}
                      items={categories.map((value) => ({
                        value,
                        label:
                          requirements?.reasonCategoryLabels?.[value] ?? value.replaceAll("_", " "),
                      }))}
                      onChange={(value) => {
                        setCategory(value);
                        clearOrder();
                      }}
                    />
                  )}
                  {requirements?.compoundingReasonContext !== "not_supported" && (
                    <label>
                      Patient-specific reason
                      <textarea
                        rows={3}
                        value={reason}
                        disabled={!!order}
                        placeholder="Describe why this patient needs this compounded medication."
                        onChange={(e) => {
                          setReason(e.target.value);
                          clearOrder();
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
              <Button
                ref={reviewButton}
                className="preview-button"
                disabled={!practiceId || !options || !reasonReady || !!busy}
                onClick={review}
              >
                {busy === "Preparing review" ? "Preparing review…" : "Review prescription"}
                <ArrowRight size={16} aria-hidden />
              </Button>
            </section>
          </div>
        </div>
      </fieldset>
      <Dialog
        open={reviewOpen}
        onOpenChange={(open) => {
          if (!busy) setReviewOpen(open);
        }}
      >
        <DialogPopup
          className="prescription-dialog"
          finalFocus={reviewButton}
          closeProps={{ disabled: !!busy }}
        >
          <DialogHeader>
            <DialogTitle>
              {submitted ? "Prescription submitted" : "Review prescription"}
            </DialogTitle>
            <DialogDescription>
              {localPatient.name.first} {localPatient.name.last} · {localPatient.address.state} ·{" "}
              Test mode
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <OrderReview
              preview={preview}
              order={order}
              options={options}
              patient={localPatient}
              reason={reason}
            />
            <div className="review-prescriber">
              <span className="hint">Prescriber</span>
              <p>
                {profileReady
                  ? `${name} · NPI ${npi}`
                  : `No NPI saved for ${localPatient.address.state}.`}
              </p>
              {!signed && (
                <Button variant="ghost" onClick={openSettings}>
                  {profileReady ? "Edit settings" : "Set up prescriber"}
                </Button>
              )}
            </div>
            {preview?.issues.map((issue, i) => (
              <p className="error" key={i}>
                {issue.message}
              </p>
            ))}
            {preview?.status === "complete" && !signed && (
              <div className="review-confirmations">
                <label className="check">
                  <Checkbox disabled={!!busy} checked={attested} onCheckedChange={setAttested} />I
                  reviewed this patient's history and prescription, confirm no known allergies, and
                  authorize signing as the prescriber shown above.
                </label>
              </div>
            )}
            {notice && (
              <p className="review-notice" role="status">
                {notice}
              </p>
            )}
            {error && (
              <div className="review-notice">
                {signed && !submitted && (
                  <p>
                    The prescription is signed. Retry sending below; it will not be signed again.
                  </p>
                )}
                {order && !signed && (
                  <Button
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => {
                      setAttested(false);
                      void run("Refreshing draft", async () => {
                        const refreshed = await getOrder({ data: { orderId: order.id } });
                        setOrder(refreshed);
                      });
                    }}
                  >
                    Refresh draft for review
                  </Button>
                )}
              </div>
            )}
          </DialogPanel>
          <DialogFooter>
            {submitted ? (
              <Button onClick={() => setReviewOpen(false)}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={!canSave || !attested || !!order || signed}
                  onClick={() => save(false)}
                >
                  {order ? "Draft saved" : "Create draft"}
                </Button>
                <Button
                  disabled={!canSave || !profileReady || (!signed && !attested)}
                  onClick={() => save(true)}
                >
                  {busy
                    ? `${busy}…`
                    : signed
                      ? "Retry sending to pharmacy"
                      : "Sign and send to pharmacy"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </main>
  );
}

import { toast } from "sonner";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { read, peekRead, seedRead, catalogPath, optionsPath, type Bootstrap } from "../data/reads";
import { patients } from "../../../data/patients";
import { requireBrowserSession } from "../../../lib/session";
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
import { OrdersView } from "./orders";
import { Choice } from "./choice";
import { MedicationPicker } from "./medication-picker";
import { OrderReview, matchesPreview } from "./order-review";
import type { Profile } from "./prescriber-settings";
import type {
  Practices,
  PatientResult,
  Prescriber,
  Options,
  Preview,
  PreviewInput,
  Order,
  Catalog,
} from "../types";

export function Workspace({
  mode,
  onBusy,
  initial,
  pending,
  profile,
  openSettings,
  renderHeader,
}: {
  mode: "test" | "production";
  onBusy: (busy: boolean) => void;
  initial?: Bootstrap;
  pending: boolean;
  profile: Profile;
  openSettings: () => void;
  renderHeader: (context: {
    practices: Practices["data"];
    practiceId: string;
    onPractice: (id: string) => void;
    onView: (view: "new" | "orders") => void;
    view: "new" | "orders";
  }) => ReactNode;
}) {
  const [view, setView] = useState<"new" | "orders">("new");
  const [ordersVisited, setOrdersVisited] = useState(false);
  const [ordersRevision, setOrdersRevision] = useState(0);
  function changeView(next: "new" | "orders") {
    if (next === "orders") setOrdersVisited(true);
    setView(next);
  }
  useEffect(() => {
    const navigate = () => changeView(location.hash === "#orders" ? "orders" : "new");
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const [starting] = useState(() => {
    const cached = peekRead<Practices>(mode, "practices");
    const practices = cached ?? initial?.practices;
    if (!cached && initial?.practices) seedRead(mode, "practices", initial.practices);
    const practiceId = practices?.data[0]?.id ?? "";
    if (initial?.catalog && practiceId) seedRead(mode, catalogPath(practiceId), initial.catalog);
    return { practices, practiceId };
  });
  const [practices, setPractices] = useState<Practices["data"]>(starting.practices?.data ?? []);
  const [practiceId, setPractice] = useState(starting.practiceId);
  const [externalId, setExternal] = useState(patients[0].externalId);
  const [patient, setPatient] = useState<PatientResult>();
  const [medicationId, setMedication] = useState("");
  const [options, setOptions] = useState<Options>();
  const [preview, setPreview] = useState<Preview>();
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [prescriber, setPrescriber] = useState<Prescriber>();
  const [order, setOrder] = useState<Order>();
  const [attested, setAttested] = useState(false);
  const [signed, setSigned] = useState(false);
  const [busy, setBusy] = useState(starting.practices || initial?.error ? "" : "Loading workspace");
  const [practicesLoaded, setPracticesLoaded] = useState(!!starting.practices);
  const [error, setError] = useState(initial?.error ?? "");
  useEffect(() => {
    if (error) toast.error(error, { id: "workspace-error", duration: 8000 });
    else toast.dismiss("workspace-error");
    return () => {
      toast.dismiss("workspace-error");
    };
  }, [error]);

  // A retry of an identical mutation reuses its key, including after a network error.
  const [keys] = useState(() => new Map<string, string>());
  function clearOrder() {
    setPreview(undefined);
    setPrescriber(undefined);
    setSubmitted(false);
    setNotice("");
    setOrder(undefined);
    setAttested(false);
    setSigned(false);
  }
  async function api<T>(path: string, body?: unknown): Promise<T> {
    if (!body && (path === "practices" || path.startsWith("options?"))) {
      const data = await read<T>(mode, path);

      return data;
    }
    const fingerprint = mode + path + JSON.stringify(body);
    if (!keys.has(fingerprint)) keys.set(fingerprint, crypto.randomUUID());
    const response = await fetch(
      `/api/${path}${path.includes("?") ? "&" : "?"}mode=${mode}`,
      body
        ? {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": keys.get(fingerprint)!,
            },
            body: JSON.stringify(body),
          }
        : undefined,
    );
    const data = await response.json();
    requireBrowserSession(data);

    if (!response.ok) throw new Error(data.details?.detail ?? data.error ?? "Request failed.");
    return data as T;
  }
  const inFlight = useRef(false);
  const reviewButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setAttested(false);
    if (!order) setPrescriber(undefined);
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
  async function load() {
    await run("Loading workspace", async () => {
      const practiceList = await api<Practices>("practices");
      setPractices(practiceList.data);
      setPracticesLoaded(true);
      setPractice(practiceList.data[0]?.id ?? "");
    });
  }
  useEffect(() => {
    if (!pending && !starting.practices && !initial?.error) void load();
  }, [pending]);
  const localPatient = patients.find((p) => p.externalId === externalId)!;
  const { npi, name } = profile.states[localPatient.address.state] ?? { npi: "", name: "" };
  const profileReady =
    /^\d{10}$/.test(npi) &&
    name.trim() &&
    profile.confirmed &&
    (mode === "test" ||
      (!!profile.email.trim() &&
        !!profile.phone.trim() &&
        !!profile.address.line1.trim() &&
        !!profile.address.city.trim() &&
        !!profile.address.state.trim() &&
        !!profile.address.postalCode.trim() &&
        !!profile.states[localPatient.address.state]?.licenseNumber?.trim() &&
        new Date(profile.states[localPatient.address.state]!.expiresAt + "T23:59:59Z").getTime() >
          Date.now()));
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
    const cached = peekRead<Options>(mode, optionsPath(practiceId, item.id));
    if (cached) {
      setOptions(cached);
      return;
    }
    await run("Loading defaults", async () =>
      setOptions(await api<Options>(optionsPath(practiceId, item.id))),
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
      const resolved = patient ?? (await api<PatientResult>("patient", { practiceId, externalId }));
      setPatient(resolved);
      const input: PreviewInput = {
        practiceId,
        patientId: resolved.patient.id,
        prescriptions: [
          {
            medicationId,
            preset: "default",
            expectedRevision: options.revision,
            ...(reasonRequired
              ? {
                  overrides: {
                    clinical: {
                      compoundingReason: {
                        context: reason.trim(),
                        ...(category
                          ? {
                              category: category as NonNullable<
                                Options["compoundingReasonCategoryDefault"]
                              >,
                            }
                          : {}),
                      },
                    },
                  },
                }
              : {}),
          },
        ],
        shipping: { selection: "lowest_cost" },
      };
      setPreview(await api<Preview>("preview", input));
      setAttested(false);
      setReviewOpen(true);
    });
  }
  async function save(send: boolean) {
    await run(
      signed ? "Sending to pharmacy" : send ? "Signing prescription" : "Creating draft",
      async () => {
        if (preview?.status !== "complete" || !patient || (!order && !profileReady)) return;
        if (!signed && !attested)
          throw new Error("Confirm the patient history and prescription review before saving.");
        let registered = prescriber;
        let draft = order;
        if (!draft)
          await api("allergies", { practiceId, patientId: patient.patient.id, confirmed: true });
        if (!draft) {
          if (!registered) {
            registered = await api<Prescriber>("prescriber", {
              practiceId,
              npi,
              name,
              email: profile.email,
              phone: profile.phone,
              address: profile.address,
              licenses: [
                {
                  state: localPatient.address.state,
                  licenseNumber: profile.states[localPatient.address.state]?.licenseNumber,
                  expiresAt: profile.states[localPatient.address.state]?.expiresAt,
                },
              ],
              identityAttestation: true,
            });
            setPrescriber(registered);
          }
          draft = await api<Order>("orders", { ...preview.orderInput, userId: registered.id });
          setOrder(draft);
          setOrdersRevision((value) => value + 1);
          if (send && !matchesPreview(draft, preview, npi, options!, localPatient)) {
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
        if (!registered) throw new Error("Prescriber information is missing. Reopen the review.");
        if (!signed) {
          if (!attested)
            throw new Error("Confirm the prescription and allergy review before signing.");
          await api("sign", {
            orderId: draft.id,
            practiceId,
            userId: registered.id,
            actorId: registered.externalId,
            signatureAttestation: true,
            expectedVersions: draft.prescriptions.map((rx) => ({
              prescriptionId: rx.id,
              version: rx.version,
            })),
          });
          setSigned(true);
          setNotice("");
        }
        await api("submit", {
          orderId: draft.id,
          practiceId,
          userId: registered.id,
          actorId: registered.externalId,
        });
        setSubmitted(true);
        setOrdersRevision((value) => value + 1);
        setNotice("");
        toast.success("Prescription sent to the pharmacy.");
      },
    );
  }
  const canSave =
    preview?.status === "complete" && (!!order || profileReady) && !busy && !submitted;
  return (
    <>
      {renderHeader({
        practices,
        practiceId,
        view,
        onView: changeView,
        onPractice: (value) => {
          setPractice(value);
          setMedication("");
          setOptions(undefined);
          setPatient(undefined);
          setReason("");
          setCategory("");
          clearOrder();
        },
      })}
      <main>
        <div className="page-heading">
          <div>
            <h1>{view === "new" ? "New prescription" : "Orders"}</h1>
            <p className="intro">
              {view === "new"
                ? "Choose a patient and medication. Review, then send."
                : "Review drafts and follow prescriptions sent to the pharmacy."}
            </p>
          </div>
        </div>
        {mode === "production" && (
          <p className="production-note">
            Live sends real prescriptions. Replace the sample EMR patients with your own records
            before prescribing.
          </p>
        )}
        {error && !reviewOpen && !practices.length && (
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        )}
        {practicesLoaded && !busy && !error && !practices.length && (
          <p className="hint">No practices are available for this key.</p>
        )}
        <fieldset hidden={view !== "new"} disabled={!!busy || reviewOpen}>
          <div className="workspace-grid" hidden={view !== "new"}>
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
                    setPatient(undefined);
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
                  mode={mode}
                  practiceId={practiceId}
                  initialCatalog={practiceId === starting.practiceId ? initial?.catalog : undefined}
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
                            requirements?.reasonCategoryLabels?.[value] ??
                            value.replaceAll("_", " "),
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
        {ordersVisited && practiceId && (
          <div hidden={view !== "orders"}>
            <OrdersView
              revision={ordersRevision}
              key={practiceId}
              practiceId={practiceId}
              mode={mode}
              profile={profile}
              api={api}
              onBusy={(value) => {
                onBusy(value);
                setBusy(value ? "Updating order" : "");
              }}
              openSettings={openSettings}
              onChanged={clearOrder}
            />
          </div>
        )}
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
                {mode === "test" ? "Test mode" : "Live"}
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
                  {prescriber
                    ? `${order?.prescriberName ?? name} · NPI ${order?.prescriberNpi ?? npi}`
                    : profileReady
                      ? `${name} · NPI ${npi}`
                      : `No NPI saved for ${localPatient.address.state}.`}
                </p>
                {!order && (
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
                    reviewed this patient's history and prescription, confirm no known allergies,
                    and authorize signing as the prescriber shown above.
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
                          const refreshed = await api<Order>(
                            `order?practiceId=${encodeURIComponent(practiceId)}&orderId=${encodeURIComponent(order.id)}`,
                          );
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
                  <Button disabled={!canSave || (!signed && !attested)} onClick={() => save(true)}>
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
    </>
  );
}

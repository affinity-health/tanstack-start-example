import { useState, useEffect } from "react";
import { patients } from "../../data/patients";
import type {
  Practices,
  PatientResult,
  Prescriber,
  Options,
  Preview,
  PreviewInput,
  Order,
} from "./types";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { MedicationPicker } from "./components/medication-picker";
import { Choice } from "./components/choice";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "../../components/ui/menu";
import {
  MoreHorizontal,
  ChevronDown,
  ArrowRight,
  Check,
  ExternalLink,
  RotateCw,
} from "lucide-react";

type Mode = "test" | "production";
export function PrescribingApp() {
  const [mode, setMode] = useState<Mode>("test");
  const [working, setWorking] = useState(false);
  return (
    <>
      <header className="toolbar">
        <div className="brand">
          <img
            src="https://cdn.joinaffinityai.com/logos/affinity/mark-blue.v2.webp"
            width={30}
            height={30}
            alt=""
          />
          <span>
            Affinity AI <span className="brand-secondary">Prescribing demo</span>
          </span>
        </div>
        <div className="toolbar-actions">
          <Menu>
            <MenuTrigger
              disabled={working}
              render={<Button variant="outline" />}
              className={`environment ${mode}`}
            >
              <span className="mode-dot" />
              {mode === "test" ? "Test" : "Production"}
              <ChevronDown size={14} />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem onClick={() => setMode("test")}>
                Test {mode === "test" && <Check size={15} aria-hidden />}
              </MenuItem>
              <MenuItem onClick={() => setMode("production")}>
                Production {mode === "production" && <Check size={15} aria-hidden />}
              </MenuItem>
            </MenuPopup>
          </Menu>
          <Menu>
            <MenuTrigger render={<Button variant="ghost" size="icon" aria-label="More options" />}>
              <MoreHorizontal />
            </MenuTrigger>
            <MenuPopup align="end">
              <MenuItem
                render={
                  <a
                    href="https://docs.joinaffinityai.com/guides/prescribing-defaults/"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                SDK documentation <ExternalLink size={14} />
              </MenuItem>
              <MenuItem onClick={() => window.location.reload()}>
                <RotateCw size={14} /> Reload workspace
              </MenuItem>
            </MenuPopup>
          </Menu>
        </div>
      </header>
      <Workspace key={mode} mode={mode} onBusy={setWorking} />
      <footer>
        <a
          href="https://docs.joinaffinityai.com/guides/reference/sdks/typescript/"
          target="_blank"
          rel="noreferrer"
        >
          SDK documentation <ExternalLink size={12} aria-hidden />
        </a>
        <span>
          Terminal: <code>bun run example</code>
        </span>
      </footer>
    </>
  );
}
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
function Json({ title, value }: { title: string; value: unknown }) {
  return (
    <details>
      <summary>{title}</summary>
      <pre tabIndex={0}>{pretty(value)}</pre>
    </details>
  );
}

function Workspace({ mode, onBusy }: { mode: Mode; onBusy: (busy: boolean) => void }) {
  const [practices, setPractices] = useState<Practices["data"]>([]);
  const [practiceId, setPractice] = useState("");
  const [externalId, setExternal] = useState(patients[0].externalId);
  const [patient, setPatient] = useState<PatientResult>();
  const [medicationId, setMedication] = useState("");
  const [options, setOptions] = useState<Options>();
  const [preview, setPreview] = useState<Preview>();
  const [directions, setDirections] = useState("");
  const [daysSupply, setDaysSupply] = useState("");
  const [npi, setNpi] = useState("");
  const [name, setName] = useState(mode === "test" ? "Test Prescriber" : "");
  const [email, setEmail] = useState("");
  const [identity, setIdentity] = useState(false);
  const [prescriber, setPrescriber] = useState<Prescriber>();
  const [order, setOrder] = useState<Order>();
  const [attested, setAttested] = useState(false);
  const [signed, setSigned] = useState(false);
  const [allergies, setAllergies] = useState(false);
  const [busy, setBusy] = useState("Loading workspace");
  const [practicesLoaded, setPracticesLoaded] = useState(false);
  const [error, setError] = useState("");
  const [lastResponse, setLastResponse] = useState<unknown>();
  // A retry of an identical mutation reuses its key, including after a network error.
  const [keys] = useState(() => new Map<string, string>());
  function clearOrder() {
    setPreview(undefined);
    setOrder(undefined);
    setAttested(false);
    setSigned(false);
  }
  async function api<T>(path: string, body?: unknown): Promise<T> {
    const fingerprint = mode + path + pretty(body);
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
            body: pretty(body),
          }
        : undefined,
    );
    const data = await response.json();
    setLastResponse(data);
    if (!response.ok) throw new Error(`${data.error} ${data.details ? pretty(data.details) : ""}`);
    return data as T;
  }
  async function run(label: string, action: () => Promise<void>) {
    setBusy(label);
    onBusy(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed. Retry the action.");
    } finally {
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
    void load();
  }, []);
  const selectedPreset = options?.presets.find((p) => p.id === options.defaultPresetId);
  const localPatient = patients.find((p) => p.externalId === externalId)!;
  return (
    <main>
      <div className="page-heading">
        <div>
          <h1>New prescription</h1>
          <p className="intro">Select a patient and medication to get started.</p>
        </div>
      </div>
      {mode === "production" && (
        <p className="production-note">
          Production uses live records. The EMR currently contains sample patients; replace them
          with your own records before creating a live prescription.
        </p>
      )}
      <div className="status-line" role="status" aria-live="polite">
        {busy && busy !== "Loading workspace" && busy !== "Loading defaults"
          ? `${busy}…`
          : signed
            ? "Prescription signed"
            : ""}
      </div>
      {error && (
        <div className="error" role="alert">
          <p>{error}</p>
          {!practices.length && (
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
          )}
        </div>
      )}
      {practicesLoaded && !busy && !error && !practices.length && (
        <p className="production-note">
          No practices are available. Check this key's practice access in Affinity, then reload the
          workspace.
        </p>
      )}
      <fieldset disabled={!!busy}>
        <div className="practice-row">
          {practices.length === 1 ? (
            <span className="practice-name">{practices[0].name}</span>
          ) : practices.length > 1 ? (
            <>
              <Choice
                label="Practice"
                value={practiceId}
                disabled={!!busy || !practices.length}
                items={practices.map((p) => ({ value: p.id, label: p.name }))}
                onChange={(value) => {
                  setPractice(value);
                  setMedication("");
                  setDirections("");
                  setDaysSupply("");
                  setPatient(undefined);
                  setOptions(undefined);
                  setPrescriber(undefined);
                  setAllergies(false);
                  clearOrder();
                }}
              />
            </>
          ) : null}
        </div>
        <div className="workspace-grid">
          <aside className="patient-panel">
            <section>
              <Choice
                label="Patient"
                value={externalId}
                disabled={!!busy}
                items={patients.map((p) => ({
                  value: p.externalId,
                  label: `${p.name.first} ${p.name.last} · ${p.address.state}`,
                }))}
                onChange={(value) => {
                  setExternal(value);
                  setPatient(undefined);
                  setAllergies(false);
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
                {patient && (
                  <span className="ready-label">
                    <Check size={13} aria-hidden />
                    Patient ready
                  </span>
                )}
              </div>
            </section>
          </aside>
          <div className="prescription-panel">
            <section>
              <MedicationPicker
                key={practiceId}
                mode={mode}
                practiceId={practiceId}
                disabled={!!busy || !practiceId}
                onChange={(value) => {
                  setMedication(value);
                  setOptions(undefined);
                  setDirections("");
                  setDaysSupply("");
                  clearOrder();
                  void run("Loading defaults", async () => {
                    setOptions(
                      await api<Options>(
                        `options?${new URLSearchParams({ practiceId, medicationId: value })}`,
                      ),
                    );
                  });
                }}
              />
              {error && medicationId && !options && (
                <Button
                  variant="outline"
                  onClick={() =>
                    run("Loading defaults", async () => {
                      setOptions(
                        await api<Options>(
                          `options?${new URLSearchParams({ practiceId, medicationId })}`,
                        ),
                      );
                    })
                  }
                >
                  Retry medication defaults
                </Button>
              )}
              {!options && !busy && !error && (
                <p className="medication-hint">
                  Select a medication to see its default directions and quantity.
                </p>
              )}
              {options && (
                <>
                  <div className="default-summary" key={medicationId}>
                    <h3 className="summary-heading">Medication defaults</h3>
                    <p>{selectedPreset?.directions || "No default directions available."}</p>
                    <dl>
                      <div>
                        <dt>Quantity</dt>
                        <dd>
                          {selectedPreset?.quantity
                            ? `${selectedPreset.quantity.value} ${selectedPreset.quantity.unit}`
                            : "Not set"}
                        </dd>
                      </div>
                      <div>
                        <dt>Days supply</dt>
                        <dd>{selectedPreset?.daysSupply ?? "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Refills</dt>
                        <dd>{selectedPreset?.refills ?? "Not set"}</dd>
                      </div>
                    </dl>
                  </div>
                  <details className="prescription-adjustments">
                    <summary>
                      <ChevronDown size={14} aria-hidden="true" />
                      Adjust prescription
                    </summary>
                    <div className="fields">
                      <label>
                        Directions
                        <Input
                          value={directions}
                          placeholder="Use the medication default"
                          onChange={(e) => {
                            setDirections(e.target.value);
                            clearOrder();
                          }}
                        />
                      </label>
                      <label>
                        Days supply
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={daysSupply}
                          placeholder="Resolve automatically"
                          onChange={(e) => {
                            setDaysSupply(e.target.value);
                            clearOrder();
                          }}
                        />
                      </label>
                    </div>
                  </details>
                </>
              )}
              <Button
                className="preview-button"
                variant="default"
                disabled={!practiceId || !options}
                onClick={() =>
                  run("Previewing prescription", async () => {
                    clearOrder();
                    const resolved =
                      patient ?? (await api<PatientResult>("patient", { practiceId, externalId }));
                    setPatient(resolved);
                    const input: PreviewInput = {
                      practiceId,
                      patientId: resolved.patient.id,
                      prescriptions: [
                        {
                          medicationId,
                          preset: "default",
                          expectedRevision: options!.revision,
                          overrides: {
                            ...(directions.trim()
                              ? { sig: { format: "free_text", text: directions.trim() } }
                              : {}),
                            ...(daysSupply ? { daysSupply: Number(daysSupply) } : {}),
                          },
                        },
                      ],
                      shipping: { selection: "lowest_cost" },
                    };
                    setPreview(await api<Preview>("preview", input));
                  })
                }
              >
                {busy === "Previewing prescription" ? "Preparing preview…" : "Preview prescription"}
                <ArrowRight size={16} aria-hidden />
              </Button>
              {preview && (
                <>
                  <h3>
                    {preview.status === "complete"
                      ? "Prescription preview"
                      : "A few details are missing"}
                  </h3>
                  {preview.prescriptions.map((p, i) => (
                    <div key={i}>
                      <p>{p.directions || "No default directions available."}</p>
                      <p className="hint">
                        Quantity:{" "}
                        {p.quantity ? `${p.quantity.value} ${p.quantity.unit}` : "Missing"} · Days
                        supply: {p.daysSupply ?? "Missing"} · Refills: {p.refills}
                      </p>
                    </div>
                  ))}
                  {preview.issues.map((issue, i) => (
                    <p className="error" key={i}>
                      {issue.path}: {issue.message}
                    </p>
                  ))}
                  <Json title="Preview details" value={preview} />
                </>
              )}
            </section>
            {preview?.status === "complete" && (
              <section>
                <h2>Sign prescription</h2>
                <div className="fields">
                  <label>
                    NPI
                    <Input
                      inputMode="numeric"
                      maxLength={10}
                      placeholder={mode === "test" ? "10-digit Test NPI" : "10-digit NPI"}
                      value={npi}
                      onChange={(e) => {
                        setNpi(e.target.value);
                        setPrescriber(undefined);
                        setIdentity(false);
                        setOrder(undefined);
                        setAttested(false);
                        setSigned(false);
                      }}
                    />
                  </label>
                  {mode === "production" && (
                    <label>
                      Prescriber name
                      <Input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setPrescriber(undefined);
                          setIdentity(false);
                          setOrder(undefined);
                          setAttested(false);
                          setSigned(false);
                        }}
                      />
                    </label>
                  )}
                </div>
                {mode === "production" && (
                  <label>
                    Prescriber email
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setPrescriber(undefined);
                        setIdentity(false);
                        setOrder(undefined);
                        setAttested(false);
                        setSigned(false);
                      }}
                      placeholder="clinician@practice.com"
                    />
                  </label>
                )}
                <label className="check">
                  <Checkbox checked={allergies} onCheckedChange={setAllergies} />I reviewed this
                  patient’s history: no known allergies.
                </label>
                <label className="check">
                  <Checkbox checked={identity} onCheckedChange={setIdentity} />
                  I confirm this prescriber’s identity and NPI.
                </label>
                <Button
                  variant="outline"
                  disabled={
                    !practiceId ||
                    !identity ||
                    !allergies ||
                    !!order ||
                    !/^\d{10}$/.test(npi) ||
                    !name.trim() ||
                    (mode === "production" && !email.includes("@"))
                  }
                  onClick={() =>
                    run("Preparing prescription", async () => {
                      if (preview?.status !== "complete" || !patient) return;
                      await api("allergies", {
                        practiceId,
                        patientId: patient.patient.id,
                        confirmed: true,
                      });
                      const registered = await api<Prescriber>("prescriber", {
                        practiceId,
                        npi,
                        name,
                        email,
                        identityAttestation: true,
                      });
                      setPrescriber(registered);
                      setOrder(
                        await api<Order>("orders", {
                          ...preview.orderInput,
                          userId: registered.id,
                        }),
                      );
                      setAttested(false);
                    })
                  }
                >
                  Continue to review
                </Button>
              </section>
            )}
            {order && (
              <section>
                <h2>Review and sign</h2>
                {order && (
                  <>
                    <h3>
                      {order.patientName} · {order.id}
                    </h3>
                    {order.prescriptions.map((rx) => (
                      <div key={rx.id}>
                        <h3>
                          {rx.medicationName} {rx.strength}
                        </h3>
                        <p>{rx.directions}</p>
                        <p className="hint">
                          {String(rx.quantity)} {rx.quantityUnit} ·{" "}
                          {String(rx.daysSupply ?? "Missing")} days · {rx.refills} refills · Version{" "}
                          {rx.version}
                        </p>
                      </div>
                    ))}
                    <Json
                      title="Review complete order, patient and dispensing details"
                      value={order}
                    />
                    <Button
                      variant="outline"
                      disabled={signed}
                      onClick={() =>
                        run("Refreshing order for review", async () => {
                          setAttested(false);
                          setOrder(
                            await api<Order>(
                              `order?${new URLSearchParams({ practiceId, orderId: order.id })}`,
                            ),
                          );
                        })
                      }
                    >
                      Refresh order for review
                    </Button>
                    <label className="check">
                      <Checkbox
                        checked={attested}
                        disabled={signed}
                        onCheckedChange={setAttested}
                      />
                      I reviewed the complete order and intend to sign these exact prescription
                      versions as {name}, NPI {npi}.
                    </label>
                    <Button
                      variant="default"
                      disabled={!attested || signed}
                      onClick={() =>
                        run("Signing order", async () => {
                          setAttested(false);
                          await api("sign", {
                            orderId: order.id,
                            practiceId,
                            userId: prescriber!.id,
                            actorId: prescriber!.externalId,
                            signatureAttestation: true,
                            expectedVersions: order.prescriptions.map((rx) => ({
                              prescriptionId: rx.id,
                              version: rx.version,
                            })),
                          });
                          setSigned(true);
                          setAttested(false);
                        })
                      }
                    >
                      {signed ? "Signed" : "Sign prescription"}
                    </Button>
                    {signed && (
                      <p>
                        Signed in {mode === "test" ? "Test" : "Production"}. The order has not been
                        submitted to a pharmacy.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </fieldset>

      {lastResponse !== undefined && (
        <div className="developer-details">
          <Json title="API response" value={lastResponse} />
        </div>
      )}
    </main>
  );
}

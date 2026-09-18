import { useState, useEffect, useId } from "react";
import { createRoot } from "react-dom/client";
import { patients } from "./patients";
import type {
  Practices,
  Catalog,
  PatientResult,
  Prescriber,
  Options,
  Preview,
  PreviewInput,
  Order,
} from "./workflow";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Checkbox } from "./components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "./components/ui/select";
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "./components/ui/menu";
import { MoreHorizontal, ChevronDown, Stethoscope, ExternalLink, RotateCw } from "lucide-react";

type Mode = "test" | "production";
function Choice({
  label,
  value,
  onChange,
  items,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="choice">
      <label id={id}>{label}</label>
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v ?? "")}
        items={items}
        disabled={disabled}
      >
        <SelectTrigger aria-labelledby={id}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  );
}
function App() {
  const [mode, setMode] = useState<Mode>("test");
  const [working, setWorking] = useState(false);
  return (
    <>
      <header className="toolbar">
        <div className="brand">
          <Stethoscope size={21} />
          <span>
            Affinity <span className="brand-secondary">/ EMR</span>
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
              <MenuItem onClick={() => setMode("test")}>Test {mode === "test" ? "✓" : ""}</MenuItem>
              <MenuItem onClick={() => setMode("production")}>
                Production {mode === "production" ? "✓" : ""}
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
  const [catalog, setCatalog] = useState<Catalog["data"]>([]);
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
  const [busy, setBusy] = useState("");
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
      const [practiceList, medicationList] = await Promise.all([
        api<Practices>("practices"),
        api<Catalog>("catalog"),
      ]);
      setPractices(practiceList.data);
      setCatalog(medicationList.data);
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
          <p className="intro">Choose a patient. Review the defaults. Preview and sign.</p>
        </div>
        <span className="workspace-label">
          {mode === "test" ? "Test workspace" : "Production workspace"}
        </span>
      </div>
      {mode === "production" && (
        <p className="production-note">
          Production uses live records. The EMR currently contains sample patients; replace them
          with your own records before creating a live prescription.
        </p>
      )}
      <div className="status-line" role="status">
        {busy ? `${busy}…` : signed ? "Prescription signed" : ""}
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
      {!busy && !error && (!practices.length || !catalog.length) && (
        <p className="production-note">
          {!practices.length
            ? "No practices are available. Check this key’s practice access in Affinity, then reload the workspace."
            : "No medications are available in this environment. Check your catalog access in Affinity, then reload the workspace."}
        </p>
      )}
      <fieldset disabled={!!busy}>
        <div className="practice-row">
          {practices.length === 1 ? (
            <span className="hint">{practices[0].name}</span>
          ) : (
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
          )}
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
              <div className="patient-identity">
                <span className="avatar">
                  {localPatient.name.first[0]}
                  {localPatient.name.last[0]}
                </span>
                <div>
                  <strong>
                    {localPatient.name.first} {localPatient.name.last}
                  </strong>
                  <span>
                    {localPatient.address.city}, {localPatient.address.state}
                  </span>
                </div>
              </div>
              <p className="hint">Born {localPatient.dateOfBirth}</p>
              {patient && <p className="hint">Patient ready in Affinity</p>}
            </section>
          </aside>
          <div className="prescription-panel">
            <section>
              <Choice
                label="Medication"
                value={medicationId}
                disabled={!!busy || !practiceId || !catalog.length}
                items={catalog.map((m) => ({
                  value: m.id,
                  label: `${m.name} ${m.strength} · ${m.pharmacyName}`,
                }))}
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
              {options && (
                <>
                  <div className="default-summary">
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
                  <details>
                    <summary>Adjust prescription</summary>
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
                Preview prescription
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

      {lastResponse !== undefined && <Json title="Last API response" value={lastResponse} />}
      <footer>
        Affinity SDK playground{" "}
        <span>
          Terminal: <code>bun run example</code>
        </span>
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

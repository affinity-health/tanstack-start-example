import { useState } from "react";
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

const pretty = (value: unknown) => JSON.stringify(value, null, 2);
function Json({ title, value }: { title: string; value: unknown }) {
  return (
    <details>
      <summary>{title}</summary>
      <pre tabIndex={0}>{pretty(value)}</pre>
    </details>
  );
}

function App() {
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
  const [preset, setPreset] = useState("default");
  const [overrides, setOverrides] = useState("{}");
  const [npi, setNpi] = useState("");
  const [name, setName] = useState("Test Prescriber");
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
    const fingerprint = path + pretty(body);
    if (!keys.has(fingerprint)) keys.set(fingerprint, crypto.randomUUID());
    const response = await fetch(
      `/api/${path}`,
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
    setError("");
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed. Retry the action.");
    } finally {
      setBusy("");
    }
  }
  const localPatient = patients.find((p) => p.externalId === externalId)!;
  return (
    <main>
      <header>
        <h1>Prescribing demo</h1>
        <a href="https://docs.joinaffinityai.com/guides/prescribing-defaults/">SDK docs</a>
      </header>
      <p className="intro">An EMR patient, an Affinity prescription. Test mode.</p>
      <p role="status">{busy ? `${busy}…` : ""}</p>
      {error && (
        <pre className="error" role="alert">
          {error}
        </pre>
      )}
      <fieldset disabled={!!busy}>
        <div className="fields">
          <label>
            Practice
            <select
              value={practiceId}
              onChange={(e) => {
                setPractice(e.target.value);
                setPatient(undefined);
                setOptions(undefined);
                setPrescriber(undefined);
                setAllergies(false);
                clearOrder();
              }}
            >
              <option value="">Select a practice</option>
              {practices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() =>
              run("Loading practices and medications", async () => {
                setPractices((await api<Practices>("practices")).data);
                setCatalog((await api<Catalog>("catalog")).data);
              })
            }
          >
            Connect to Affinity
          </button>
        </div>
        <section>
          <h2>Patient</h2>
          <label>
            Demo EMR patient
            <select
              value={externalId}
              onChange={(e) => {
                setExternal(e.target.value);
                setPatient(undefined);
                setAllergies(false);
                clearOrder();
              }}
            >
              {patients.map((p) => (
                <option key={p.externalId} value={p.externalId}>
                  {p.name.first} {p.name.last} · {p.address.state}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">
            Born {localPatient.dateOfBirth} · {localPatient.externalId}
          </p>
          <button
            disabled={!practiceId}
            onClick={() =>
              run("Resolving patient", async () => {
                setPatient(await api<PatientResult>("patient", { practiceId, externalId }));
                clearOrder();
              })
            }
          >
            Create or reuse patient
          </button>
          {patient && (
            <>
              <p className="hint">
                {patient.reused ? "Reused" : "Created"}: {patient.patient.id}
              </p>
              <Json title="Patient record" value={patient.patient} />
              <label className="check">
                <input
                  type="checkbox"
                  checked={allergies}
                  onChange={(e) => setAllergies(e.target.checked)}
                />
                I reviewed this synthetic patient's history: no known allergies.
              </label>
              <button
                disabled={!allergies}
                onClick={() =>
                  run("Saving allergy review", async () => {
                    await api("allergies", {
                      practiceId,
                      patientId: patient.patient.id,
                      confirmed: true,
                    });
                  })
                }
              >
                Save allergy review
              </button>
            </>
          )}
        </section>
        <section>
          <h2>Medication</h2>
          <label>
            Catalog medication
            <select
              value={medicationId}
              onChange={(e) => {
                setMedication(e.target.value);
                setOptions(undefined);
                setOverrides("{}");
                setDirections("");
                setDaysSupply("");
                setPreset("default");
                clearOrder();
              }}
            >
              <option value="">Select a medication</option>
              {catalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.strength} · {m.pharmacyName}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!practiceId || !medicationId}
            onClick={() =>
              run("Loading defaults", async () => {
                setOptions(
                  await api<Options>(
                    `options?${new URLSearchParams({ practiceId, medicationId })}`,
                  ),
                );
                clearOrder();
              })
            }
          >
            View medication defaults
          </button>
          {options && (
            <>
              <Json title="Medication defaults and prescribing options" value={options} />
              <label>
                Directions preset
                <select
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value);
                    clearOrder();
                  }}
                >
                  <option value="default">Affinity default</option>
                  {options.presets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.source}: {p.directions}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                {options.presets.find(
                  (p) => p.id === (preset === "default" ? options.defaultPresetId : preset),
                )?.directions ?? "No default directions available."}
              </p>
              <div className="fields">
                <label>
                  Directions override
                  <input
                    value={directions}
                    placeholder="Use the selected preset"
                    onChange={(e) => {
                      setDirections(e.target.value);
                      clearOrder();
                    }}
                  />
                </label>
                <label>
                  Days supply override
                  <input
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
              <details>
                <summary>Edit prescription overrides</summary>
                <p className="hint">
                  Optional SDK overrides for directions, quantity, days supply, refills, or clinical
                  requirements. Leave empty fields out to use defaults.
                </p>
                <label>
                  Overrides JSON
                  <textarea
                    rows={8}
                    value={overrides}
                    onChange={(e) => {
                      setOverrides(e.target.value);
                      clearOrder();
                    }}
                  />
                </label>
              </details>
            </>
          )}
          <button
            disabled={!patient || !options}
            onClick={() =>
              run("Previewing prescription", async () => {
                clearOrder();
                const input: PreviewInput = {
                  practiceId,
                  patientId: patient!.patient.id,
                  prescriptions: [
                    {
                      medicationId,
                      preset,
                      expectedRevision: options!.revision,
                      overrides: {
                        ...JSON.parse(overrides),
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
          </button>
          {preview && (
            <>
              <h3>Preview: {preview.status}</h3>
              {preview.prescriptions.map((p, i) => (
                <div key={i}>
                  <p>{p.directions || "No default directions available."}</p>
                  <p className="hint">
                    Quantity: {pretty(p.quantity)} · Days supply: {p.daysSupply ?? "Missing"} ·
                    Refills: {p.refills}
                  </p>
                </div>
              ))}
              {preview.issues.map((issue, i) => (
                <p className="error" key={i}>
                  {issue.path}: {issue.message}
                </p>
              ))}
              <Json title="Full preview, shipping and estimated prices" value={preview} />
            </>
          )}
        </section>
        <section>
          <h2>Prescriber</h2>
          <div className="fields">
            <label>
              Test NPI
              <input
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit Affinity Test NPI"
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
            <label>
              Prescriber name
              <input
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
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={identity}
              onChange={(e) => setIdentity(e.target.checked)}
            />
            I confirm this is the Test prescriber for this demo.
          </label>
          <button
            disabled={!practiceId || !identity || !/^\d{10}$/.test(npi) || !name.trim()}
            onClick={() =>
              run("Registering prescriber", async () => {
                setPrescriber(
                  await api<Prescriber>("prescriber", {
                    practiceId,
                    npi,
                    name,
                    identityAttestation: true,
                  }),
                );
              })
            }
          >
            Register or reuse prescriber
          </button>
          {prescriber && (
            <p className="hint">
              Registered: {prescriber.id} · NPI {npi}
            </p>
          )}
        </section>
        <section>
          <h2>Review and sign</h2>
          <button
            disabled={preview?.status !== "complete" || !prescriber || !!order}
            onClick={() =>
              run("Creating draft", async () => {
                if (preview?.status !== "complete") return;
                setOrder(
                  await api<Order>("orders", { ...preview.orderInput, userId: prescriber!.id }),
                );
                setAttested(false);
              })
            }
          >
            Create draft from preview
          </button>
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
                    {String(rx.quantity)} {rx.quantityUnit} · {String(rx.daysSupply ?? "Missing")}{" "}
                    days · {rx.refills} refills · Version {rx.version}
                  </p>
                </div>
              ))}
              <Json title="Review complete order, patient and dispensing details" value={order} />
              <button
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
              </button>
              <label className="check">
                <input
                  type="checkbox"
                  checked={attested}
                  disabled={signed}
                  onChange={(e) => setAttested(e.target.checked)}
                />
                I reviewed the complete order and intend to sign these exact prescription versions
                as {name}, NPI {npi}.
              </label>
              <button
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
              </button>
              {signed && (
                <p>Signed in Test mode. The order has not been submitted to a pharmacy.</p>
              )}
            </>
          )}
        </section>
      </fieldset>

      {lastResponse !== undefined && <Json title="Last API response" value={lastResponse} />}
      <footer>
        Edit <code>example.ts</code> and run <code>bun run example</code> to try the SDK without the
        website.
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

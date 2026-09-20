import type { patients } from "../../../data/patients";
import type { Options, Order, Preview } from "../../../api/types";

// Optional nulls and object key order have no clinical meaning.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry != null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  return value ?? null;
}
function equivalent(actual: unknown, expected: unknown) {
  return JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected));
}

function address(value: object | null | undefined) {
  return Object.fromEntries(
    Object.entries(value ?? {}).filter(([key, entry]) => key !== "line2" || entry !== ""),
  );
}

// Saved dispensing snapshots can contain the UUID behind the public shipping ID.
function shippingId(id: string | null | undefined) {
  if (!id || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return id;
  const alphabet = "0123456789abcdefghjkmnpqrstvwxyz";
  let value = BigInt(`0x${id.replaceAll("-", "")}`);
  let encoded = "";
  for (let i = 0; i < 26; i++) {
    encoded = alphabet[Number(value & 31n)] + encoded;
    value >>= 5n;
  }
  return `shp_${encoded}`;
}

// Never sign silently if creation changed the prescription the clinician reviewed.
export function matchesPreview(
  order: Order,
  preview: Preview,
  npi: string,
  options: Options,
  patient: (typeof patients)[number],
) {
  if (
    preview.status !== "complete" ||
    !("patientId" in preview.orderInput) ||
    order.patientId !== preview.orderInput.patientId ||
    order.practiceId !== preview.orderInput.practiceId ||
    (order.prescriberNpi != null && order.prescriberNpi !== npi) ||
    order.prescriptions.length !== preview.prescriptions.length
  )
    return false;
  return order.prescriptions.every((rx, i) => {
    const expected = preview.prescriptions[i];
    const input = preview.orderInput.prescriptions[i];
    const clinical = input.clinical;
    return (
      rx.patientSnapshot.legalName === `${patient.name.first} ${patient.name.last}` &&
      rx.patientSnapshot.dateOfBirth === patient.dateOfBirth &&
      rx.patientSnapshot.state === patient.address.state &&
      equivalent(address(rx.patientSnapshot.address), address(patient.address)) &&
      equivalent(rx.structuredSig, input.structuredSig) &&
      equivalent(
        { ...rx.dispensing, shippingOptionId: shippingId(rx.dispensing?.shippingOptionId) },
        { ...input.dispensing, shippingOptionId: shippingId(input.dispensing?.shippingOptionId) },
      ) &&
      rx.catalogItemId === expected.medicationId &&
      rx.pharmacyId === options.catalog.pharmacyId &&
      rx.directions === expected.directions &&
      Number(rx.quantity) === expected.quantity?.value &&
      rx.quantityUnit === expected.quantity?.unit &&
      Number(rx.daysSupply) === expected.daysSupply &&
      rx.refills === expected.refills &&
      equivalent(
        {
          ...rx.clinical,
          allergies: rx.clinical?.allergies ?? [],
          conditions: rx.clinical?.conditions ?? [],
          medications: rx.clinical?.medications ?? [],
          observations: rx.clinical?.observations ?? [],
        },
        {
          allergies: [], // The combined attestation confirms no known allergies.
          conditions: (clinical?.diagnoses ?? []).map((diagnosis) => ({
            ...diagnosis,
            codeSystem: "icd-10-cm",
            source: "Doctor",
          })),
          medications: (clinical?.currentMedications ?? []).map((display) => ({
            display,
            source: "Doctor",
          })),
          observations: clinical?.observations ?? [],
          compoundingReason: clinical?.compoundingReason,
        },
      )
    );
  });
}
const money = (cents: number | null | undefined) =>
  cents == null
    ? "Not available"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export function OrderReview({
  preview,
  order,
  options,
  patient,
  reason,
}: {
  preview?: Preview;
  order?: Order;
  options?: Options;
  patient: (typeof patients)[number];
  reason: string;
}) {
  if (!preview || !options) return null;
  const rx = order?.prescriptions[0];
  const first = preview.prescriptions[0];
  return (
    <div className="order-review">
      <div className="review-medication">
        {options.catalog.imageUrl && (
          <img
            src={options.catalog.imageUrl}
            alt=""
            onError={(e) => {
              e.currentTarget.hidden = true;
            }}
          />
        )}
        <div>
          <h3>
            {rx?.medicationName ?? options.catalog.name} {rx?.strength ?? options.catalog.strength}
          </h3>
          <p className="hint">{rx?.pharmacyName ?? options.catalog.pharmacyName}</p>
        </div>
      </div>
      <p className="review-directions">
        {rx?.directions ?? first?.directions ?? "Directions unavailable"}
      </p>
      <dl className="review-facts">
        <div>
          <dt>Quantity</dt>
          <dd>
            {rx
              ? `${rx.quantity} ${rx.quantityUnit}`
              : first?.quantity
                ? `${first.quantity.value} ${first.quantity.unit}`
                : "Missing"}
          </dd>
        </div>
        <div>
          <dt>Days supply</dt>
          <dd>{String(rx?.daysSupply ?? first?.daysSupply ?? "Missing")}</dd>
        </div>
        <div>
          <dt>Refills</dt>
          <dd>{rx?.refills ?? first?.refills ?? "Missing"}</dd>
        </div>
      </dl>
      {reason && (
        <div>
          <span className="hint">Patient-specific reason</span>
          <p>{rx?.clinical?.compoundingReason?.context ?? reason}</p>
        </div>
      )}
      <div className="review-delivery">
        <span className="hint">Deliver to</span>
        <p>{rx?.patientSnapshot.legalName ?? `${patient.name.first} ${patient.name.last}`}</p>
        <p>
          {rx?.patientSnapshot.address
            ? Object.values(rx.patientSnapshot.address).filter(Boolean).join(", ")
            : `${patient.address.line1}, ${patient.address.city}, ${patient.address.state} ${patient.address.postalCode}`}
        </p>
        <p className="hint">Born {rx?.patientSnapshot.dateOfBirth ?? patient.dateOfBirth}</p>
      </div>
      <dl className="review-facts">
        <div>
          <dt>Medication</dt>
          <dd>{money(first?.medicationSubtotalCents)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{money(first?.shippingAmountCents)}</dd>
        </div>
      </dl>
      {order && (
        <p className="hint">
          Order {order.id} · Version {rx?.version}
        </p>
      )}
      <details className="review-details">
        <summary>Full {order ? "order" : "preview"} details</summary>
        <pre tabIndex={0}>{JSON.stringify(order ?? preview, null, 2)}</pre>
      </details>
    </div>
  );
}

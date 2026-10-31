import type { OrderBody } from "../../../server/affinity/prescriptions";
import type { Options } from "../../../api/types";
export function OrderReview({ input, options }: { input: OrderBody; options: Options }) {
  const rx = input.prescriptions[0];
  const shipping = options.shippingOptions.find((s) => s.id === input.shipping.optionId);
  return (
    <div className="order-review">
      <div className="review-medication">
        <div>
          <h3>
            {options.name} {options.strength}
          </h3>
          <p className="hint">{options.pharmacy.name}</p>
        </div>
      </div>
      <p className="review-directions">{rx.directions}</p>
      <dl className="review-facts">
        <div>
          <dt>Quantity</dt>
          <dd>
            {rx.quantity} {options.quantityUnit}
          </dd>
        </div>
        <div>
          <dt>Refills</dt>
          <dd>{rx.refills}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{shipping?.name}</dd>
        </div>
      </dl>
      {rx.compoundingReason && <p>{rx.compoundingReason}</p>}
      <div className="review-delivery">
        <span className="hint">Deliver to</span>
        <p>
          {input.patient.firstName} {input.patient.lastName}
        </p>
        <p>{Object.values(input.patient.address).filter(Boolean).join(", ")}</p>
        <p>Born {input.patient.dateOfBirth}</p>
      </div>
      <div className="review-prescriber">
        <span className="hint">Prescriber</span>
        <p>
          {input.prescriber?.firstName} {input.prescriber?.lastName} · NPI {input.prescriber?.npi}
        </p>
      </div>
      <details className="review-details">
        <summary>Full order request</summary>
        <pre tabIndex={0}>{JSON.stringify(input, null, 2)}</pre>
      </details>
    </div>
  );
}

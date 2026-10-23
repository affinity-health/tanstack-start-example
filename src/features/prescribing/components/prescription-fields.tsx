import type { Options } from "../../../api/types";
import type { PrescriptionInput } from "../../../api/prescribing/schema";
import { Choice } from "../../../components/choice";
import { Input } from "../../../components/ui/input";

export type PrescriptionFieldsValue = {
  directions: string;
  quantity: string;
  refills: string;
  shippingOptionId: string;
};
export function defaultFields(
  options: Pick<Options, "defaultDirections">,
): PrescriptionFieldsValue {
  return {
    directions: options.defaultDirections ?? "",
    quantity: "",
    refills: "0",
    shippingOptionId: "",
  };
}
export function fieldInput(
  value: PrescriptionFieldsValue,
): Pick<PrescriptionInput, "directions" | "quantity" | "refills" | "shippingOptionId"> {
  return {
    directions: value.directions,
    quantity: Number(value.quantity),
    refills: value.refills.trim() ? Number(value.refills) : Number.NaN,
    shippingOptionId: value.shippingOptionId,
  };
}
export function PrescriptionFields({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Options;
  value: PrescriptionFieldsValue;
  onChange: (value: PrescriptionFieldsValue) => void;
  disabled: boolean;
}) {
  const change = (key: keyof PrescriptionFieldsValue, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <div className="compounding-fields">
      <label>
        Directions
        <textarea
          rows={3}
          required
          maxLength={2000}
          value={value.directions}
          disabled={disabled}
          onChange={(e) => change("directions", e.target.value)}
        />
      </label>
      {options.quantities.length ? (
        <Choice
          label={`Quantity${options.quantityUnit ? ` (${options.quantityUnit})` : ""}`}
          value={value.quantity}
          disabled={disabled}
          items={options.quantities.map((q) => ({ value: String(q), label: String(q) }))}
          onChange={(next) => change("quantity", next)}
        />
      ) : (
        <label>
          Quantity{options.quantityUnit ? ` (${options.quantityUnit})` : ""}
          <Input
            type="number"
            required
            min={1}
            step={1}
            value={value.quantity}
            disabled={disabled}
            onChange={(e) => change("quantity", e.target.value)}
          />
        </label>
      )}
      <label>
        Refills
        <Input
          type="number"
          min={0}
          max={99}
          step={1}
          required
          value={value.refills}
          disabled={disabled}
          onChange={(e) => change("refills", e.target.value)}
        />
      </label>
      <Choice
        label="Shipping"
        value={value.shippingOptionId}
        disabled={disabled}
        items={options.shippingOptions.map((s) => ({
          value: s.id,
          label: `${s.name} · $${(s.price / 100).toFixed(2)}`,
        }))}
        onChange={(next) => change("shippingOptionId", next)}
      />
    </div>
  );
}

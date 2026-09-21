import type { Options } from "../../../api/types";
import type { PrescriptionInput } from "../../../api/prescribing/schema";
import { Choice } from "../../../components/choice";
import { Input } from "../../../components/ui/input";

export type PrescriptionFieldsValue = {
  directions: string;
  quantity: string;
  unit: string;
  daysSupply: string;
  refills: string;
  shippingOptionId: string;
};

export function defaultFields(options: Options): PrescriptionFieldsValue {
  const preset = options.presets.find((entry) => entry.id === options.defaultPresetId);
  return {
    directions: preset?.directions ?? options._default?.directions ?? "",
    quantity: String(preset?.quantity?.value ?? ""),
    unit: preset?.quantity?.unit ?? options.catalog.unit ?? "",
    daysSupply: String(preset?.daysSupply ?? ""),
    refills: String(preset?.refills ?? ""),
    shippingOptionId: "",
  };
}

export function fieldOverrides(
  options: Options,
  value: PrescriptionFieldsValue,
): Partial<PrescriptionInput> {
  const defaults = defaultFields(options);
  const regimenChanged =
    value.directions !== defaults.directions ||
    value.quantity !== defaults.quantity ||
    value.unit !== defaults.unit;
  return {
    ...(value.directions !== defaults.directions ? { directions: value.directions } : {}),
    ...(value.quantity !== defaults.quantity || value.unit !== defaults.unit
      ? { quantity: { value: Number(value.quantity), unit: value.unit } }
      : {}),
    ...(value.daysSupply !== defaults.daysSupply || regimenChanged
      ? { daysSupply: Number(value.daysSupply) }
      : {}),
    ...(value.refills !== defaults.refills
      ? { refills: value.refills.trim() ? Number(value.refills) : Number.NaN }
      : {}),
    ...(value.shippingOptionId ? { shippingOptionId: value.shippingOptionId } : {}),
  };
}

export function PrescriptionFields({
  options,
  value,
  onChange,
  disabled,
  expanded,
  onExpandedChange,
}: {
  options: Options;
  value: PrescriptionFieldsValue;
  onChange: (value: PrescriptionFieldsValue) => void;
  disabled: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const requirements = options.catalog.prescriptionRequirements;
  const constraint = options.catalog.quantityConstraint;
  const quantities =
    constraint && "quantity" in constraint
      ? [constraint.quantity]
      : constraint && "quantities" in constraint
        ? constraint.quantities
        : (requirements.allowedQuantities ?? []);
  const range = constraint && "minimum" in constraint ? constraint : undefined;
  const unit = range?.unit ?? requirements.quantityIncrement?.unit ?? value.unit;
  const shipping = options.catalog.shippingOptions.filter(
    (option) =>
      option.destinationTypes.includes("patient") &&
      option.temperatures.includes(options.catalog.coldShip ? "refrigerated" : "ambient"),
  );
  const change = (key: keyof PrescriptionFieldsValue, next: string) =>
    onChange({ ...value, ...(key === "directions" ? { daysSupply: "" } : {}), [key]: next });
  const daysSupplyField = requirements.allowedDaysSupply?.length ? (
    <Choice
      label="Days supply"
      value={value.daysSupply}
      disabled={disabled}
      items={requirements.allowedDaysSupply.map((days) => ({
        value: String(days),
        label: String(days),
      }))}
      onChange={(next) => change("daysSupply", next)}
    />
  ) : (
    <label>
      Days supply
      <Input
        type="number"
        min={1}
        step={1}
        required
        value={value.daysSupply}
        disabled={disabled}
        onChange={(event) => change("daysSupply", event.target.value)}
      />
    </label>
  );
  return (
    <div className="compounding-fields">
      <details open={expanded} onToggle={(event) => onExpandedChange(event.currentTarget.open)}>
        <summary>Edit prescription details</summary>
        <div className="compounding-fields">
          <label>
            Directions
            <textarea
              rows={3}
              required
              maxLength={2000}
              value={value.directions}
              disabled={disabled}
              onChange={(event) => change("directions", event.target.value)}
            />
          </label>
          {quantities.length ? (
            <Choice
              label="Quantity"
              value={JSON.stringify([value.quantity, value.unit])}
              disabled={disabled}
              items={quantities.map((quantity) => ({
                value: JSON.stringify([String(quantity.value), quantity.unit]),
                label: `${quantity.value} ${quantity.unit}`,
              }))}
              onChange={(next) => {
                const [quantity, unit] = JSON.parse(next) as [string, string];
                onChange({ ...value, quantity, unit, daysSupply: "" });
              }}
            />
          ) : (
            <label>
              Quantity{unit ? ` (${unit})` : ""}
              <Input
                type="number"
                required
                min={Number(range?.minimum ?? requirements.quantityIncrement?.min ?? 0.000001)}
                max={
                  range?.maximum == null && requirements.quantityIncrement?.max == null
                    ? undefined
                    : Number(range?.maximum ?? requirements.quantityIncrement?.max)
                }
                step={String(range?.increment ?? requirements.quantityIncrement?.value ?? "any")}
                value={value.quantity}
                disabled={disabled}
                onChange={(event) =>
                  onChange({ ...value, quantity: event.target.value, unit, daysSupply: "" })
                }
              />
            </label>
          )}
          {!defaultFields(options).unit &&
            !range?.unit &&
            !requirements.quantityIncrement?.unit &&
            !quantities.length && (
              <label>
                Quantity unit
                <Input
                  type="text"
                  required
                  maxLength={100}
                  value={value.unit}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({ ...value, unit: event.target.value, daysSupply: "" })
                  }
                />
              </label>
            )}
          <label>
            Refills
            <Input
              type="number"
              min={0}
              max={requirements.maxRefills ?? 99}
              step={1}
              required
              value={value.refills}
              disabled={disabled}
              onChange={(event) => change("refills", event.target.value)}
            />
          </label>
          {daysSupplyField}
          {shipping.length > 1 && (
            <Choice
              label="Shipping"
              value={value.shippingOptionId || "lowest_cost"}
              disabled={disabled}
              items={[
                { value: "lowest_cost", label: "Lowest cost eligible shipping" },
                ...shipping.map((option) => ({ value: option.id, label: option.label })),
              ]}
              onChange={(next) => change("shippingOptionId", next === "lowest_cost" ? "" : next)}
            />
          )}
        </div>
      </details>
    </div>
  );
}

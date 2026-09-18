import { useId } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "../../../components/ui/select";
export function Choice({
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

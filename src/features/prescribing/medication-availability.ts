import type { Medication } from "../../api/types";
export function availableForPatient(item: Pick<Medication, "restrictedStates">, state: string) {
  return !item.restrictedStates.includes(state.toUpperCase());
}

/** Whether every word of the search appears in the medication's name, strength or pharmacy. */
export function matchesSearch(
  item: Pick<Medication, "name" | "fullName" | "strength" | "form" | "pharmacy">,
  search: string,
) {
  const text = [item.name, item.fullName, item.strength, item.form, item.pharmacy.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

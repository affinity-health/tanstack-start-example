import { expect, test } from "bun:test";
import { availableForPatient } from "./medication-availability";

const medication = {
  isOrderable: true,
  ordering: { requiresPrescription: true },
  allowedStates: ["MI", "OH", "TX"],
  restrictedStates: [],
};

test("offers are shown only when the pharmacy can ship to the selected patient state", () => {
  expect(availableForPatient(medication, "TX")).toBe(true);
  expect(availableForPatient(medication, "CA")).toBe(false);
  expect(availableForPatient({ ...medication, allowedStates: [] }, "CA")).toBe(true);
  expect(
    availableForPatient({ ...medication, allowedStates: [], restrictedStates: ["CA"] }, "CA"),
  ).toBe(false);
  expect(availableForPatient({ ...medication, isOrderable: false }, "TX")).toBe(false);
  expect(
    availableForPatient(
      { ...medication, ordering: { ...medication.ordering, requiresPrescription: false } },
      "TX",
    ),
  ).toBe(false);
});

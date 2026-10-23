import { expect, test } from "bun:test";
import { availableForPatient } from "./medication-availability";
test("medications are allowed by default and explicit state restrictions apply", () => {
  expect(availableForPatient({ restrictedStates: [] }, "CA")).toBe(true);
  expect(availableForPatient({ restrictedStates: ["CA"] }, "ca")).toBe(false);
  expect(availableForPatient({ restrictedStates: ["CA"] }, "TX")).toBe(true);
});

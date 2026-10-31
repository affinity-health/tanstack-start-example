import { expect, test } from "bun:test";
import { availableForPatient, matchesSearch } from "./medication-availability";
test("medications are allowed by default and explicit state restrictions apply", () => {
  expect(availableForPatient({ restrictedStates: [] }, "CA")).toBe(true);
  expect(availableForPatient({ restrictedStates: ["CA"] }, "ca")).toBe(false);
  expect(availableForPatient({ restrictedStates: ["CA"] }, "TX")).toBe(true);
});

test("search matches every word against name, strength, form and pharmacy", () => {
  const item = {
    name: "Semaglutide",
    fullName: "Semaglutide Acetate",
    strength: "2.5 mg/mL",
    form: "Vial",
    pharmacy: { id: "pharm_01j2y8m6jcc9tt24af5pw9x1bc", name: "PerfectRx Pharmacy" },
  };
  expect(matchesSearch(item, "")).toBe(true);
  expect(matchesSearch(item, "sema")).toBe(true);
  expect(matchesSearch(item, "SEMAGLUTIDE perfectrx")).toBe(true);
  expect(matchesSearch(item, "acetate 2.5")).toBe(true);
  expect(matchesSearch(item, "tirzepatide")).toBe(false);
});

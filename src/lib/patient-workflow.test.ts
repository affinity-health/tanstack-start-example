import { describe, expect, test } from "bun:test";

import { findPatient, prepareMedicationReview, searchPatients } from "./patient-workflow";

describe("patient workflow", () => {
  test("searches synthetic patients with the same fields shown in the UI", () => {
    expect(searchPatients({ query: "metabolic" }).map((patient) => patient.name)).toEqual([
      "Ada Zieme",
    ]);
    expect(searchPatients({ query: "CA", status: "eligible" })).toHaveLength(2);
  });

  test("finds a patient by exact name or synthetic ID", () => {
    expect(findPatient("ada zieme")?.id).toBe("pat_ada_zieme");
    expect(findPatient("pat_ada_zieme")?.name).toBe("Ada Zieme");
    expect(findPatient("Ada")).toBeUndefined();
  });

  test("prepares a reversible review path for an eligible synthetic patient", () => {
    expect(prepareMedicationReview("Ada Zieme")).toEqual({
      ok: true,
      path: "/medication-orders?feature=headless&patientId=pat_ada_zieme",
      patient: expect.objectContaining({ id: "pat_ada_zieme", name: "Ada Zieme" }),
    });
  });

  test("blocks preparation when eligibility needs review", () => {
    expect(prepareMedicationReview("Denise Kuhn")).toEqual({
      ok: false,
      error: "Denise Kuhn requires eligibility review before medication preparation.",
    });
  });
});

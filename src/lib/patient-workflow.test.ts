import { describe, expect, test } from "bun:test";

import {
  canCreateTestOrder,
  createHostedAffinityTestAdapter,
  createSyntheticDemoAdapter,
  findPatient,
  prepareMedicationReview,
  searchPatients,
} from "./patient-workflow";

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
      path: "/medication-orders?patientId=pat_ada_zieme",
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

describe("prescribing workflow adapters", () => {
  test("requires an independent human confirmation before Test order creation", () => {
    const ready = { medicationCount: 1, patientCount: 1, pending: false };

    expect(canCreateTestOrder({ ...ready, humanConfirmed: false })).toBe(false);
    expect(canCreateTestOrder({ ...ready, humanConfirmed: true })).toBe(true);
    expect(canCreateTestOrder({ ...ready, humanConfirmed: true, pending: true })).toBe(false);
    expect(canCreateTestOrder({ ...ready, humanConfirmed: true, medicationCount: 0 })).toBe(false);
  });

  test("normalizes synthetic demo patients behind the workflow seam", async () => {
    const options = await createSyntheticDemoAdapter().loadOptions();

    expect(options.patients[0]).toEqual({ id: "pat_ada_zieme", name: "Ada Zieme", state: "CA" });
    expect(options.medications).toEqual([]);
    expect(options.recommendedPatientId).toBe("pat_ada_zieme");
  });

  test("keeps hosted Test transport and order semantics inside its adapter", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });
      if (String(input).endsWith("headless-options")) {
        return Response.json({ medications: [], patients: [], recommendedPatientId: null });
      }
      return Response.json({
        orderId: "ord_test",
        prescriptionIds: ["rx_test"],
        signingSession: { expiresAt: "2026-09-03T00:00:00Z", url: "https://test.example/sign" },
      });
    }) as typeof fetch;
    const adapter = createHostedAffinityTestAdapter(fetcher);

    await adapter.loadOptions();
    const order = await adapter.createOrder?.({
      daysSupply: 30,
      directions: "Clinician supplied directions",
      dose: "1",
      doseUnit: "capsule",
      frequency: "daily",
      medicationId: "med_test",
      patientId: "pat_test",
      quantity: 30,
      quantityUnit: "capsule",
      refills: 0,
      returnUrl: "https://demo.example/medication-orders",
      route: "oral",
    });

    expect(adapter.source).toBe("affinity-test");
    expect(order?.orderId).toBe("ord_test");
    expect(requests.map(({ input }) => String(input))).toEqual([
      "/api/affinity/headless-options",
      "/api/affinity/headless-order",
    ]);
    expect(JSON.parse(String(requests[1]?.init?.body))).toEqual(
      expect.objectContaining({ patientId: "pat_test" }),
    );
  });
});

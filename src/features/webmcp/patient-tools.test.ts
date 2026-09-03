import { describe, expect, mock, test } from "bun:test";

import { createPatientTools } from "./patient-tools";

describe("patient WebMCP tools", () => {
  test("search updates the visible patient controls and returns bounded records", async () => {
    const searchPatients = mock(() => {});
    const tools = createPatientTools({
      openPatient: () => {},
      prepareReview: () => {},
      searchPatients,
    });

    const response = await tools[0]!.execute({ query: "CA", status: "eligible" });

    expect(searchPatients).toHaveBeenCalledWith(
      "CA",
      "eligible",
      "Agent search found 2 synthetic patients.",
    );
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ count: 2, syntheticData: true }),
    );
  });

  test("opens the same patient record the human UI uses", async () => {
    const openPatient = mock(() => {});
    const tools = createPatientTools({
      openPatient,
      prepareReview: () => {},
      searchPatients: () => {},
    });

    const response = await tools[1]!.execute({ patient: "Ada Zieme" });

    expect(openPatient).toHaveBeenCalledWith(
      "pat_ada_zieme",
      "Agent opened Ada Zieme's synthetic patient record.",
    );
    expect(response.structuredContent).toEqual(expect.objectContaining({ syntheticData: true }));
  });

  test("prepares a review without creating a prescription", async () => {
    const prepareReview = mock(() => {});
    const tools = createPatientTools({
      openPatient: () => {},
      prepareReview,
      searchPatients: () => {},
    });

    const response = await tools[2]!.execute({ patient: "Ada Zieme" });

    expect(prepareReview).toHaveBeenCalledWith(
      "/medication-orders?patientId=pat_ada_zieme",
      "Prepared Ada Zieme's medication review. No order was created.",
    );
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ prescriptionCreated: false, syntheticData: true }),
    );
  });

  test("does not navigate an ineligible patient into prescribing", async () => {
    const prepareReview = mock(() => {});
    const tools = createPatientTools({
      openPatient: () => {},
      prepareReview,
      searchPatients: () => {},
    });

    const response = await tools[2]!.execute({ patient: "Denise Kuhn" });

    expect(prepareReview).not.toHaveBeenCalled();
    expect(response.content[0]?.text).toContain("requires eligibility review");
    expect(response.isError).toBe(true);
  });
});

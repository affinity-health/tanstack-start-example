import { describe, expect, mock, test } from "bun:test";

import { createPrescribingTools } from "./prescribing-tools";

const medications = [
  {
    dosageForm: "capsule",
    id: "med_test",
    name: "Test formulation",
    route: "oral",
    strength: "1 mg",
  },
];
const patients = [{ id: "pat_test", name: "Ada Test", state: "CA" }];
const validDraft = {
  daysSupply: 30,
  directions: "Take one capsule daily",
  dose: "1",
  doseUnit: "capsule",
  frequency: "daily",
  medication: "Test formulation",
  patient: "Ada Test",
  quantity: 30,
  quantityUnit: "capsule",
  refills: 0,
};

describe("prescribing WebMCP tools", () => {
  test("returns only visible Test option labels", async () => {
    const tools = createPrescribingTools({ medications, onPrepare: () => {}, patients });

    const response = await tools[0]!.execute({});

    expect(response.structuredContent).toEqual(
      expect.objectContaining({
        environment: "Affinity Test",
        medications: [
          {
            dosageForm: "capsule",
            name: "Test formulation",
            route: "oral",
            strength: "1 mg",
          },
        ],
        patients: [{ name: "Ada Test", state: "CA" }],
      }),
    );
  });

  test("prepares a visible draft but requires human confirmation", async () => {
    const onPrepare = mock(() => {});
    const tools = createPrescribingTools({ medications, onPrepare, patients });

    const response = await tools[1]!.execute(validDraft);

    expect(onPrepare).toHaveBeenCalledWith(
      expect.objectContaining({ medicationId: "med_test", patientId: "pat_test" }),
    );
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ confirmationRequired: true, orderCreated: false }),
    );
  });

  test("rejects unknown options without changing the form", async () => {
    const onPrepare = mock(() => {});
    const tools = createPrescribingTools({ medications, onPrepare, patients });

    const response = await tools[1]!.execute({ ...validDraft, patient: "Unknown" });

    expect(onPrepare).not.toHaveBeenCalled();
    expect(response.isError).toBe(true);
  });
});

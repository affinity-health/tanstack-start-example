import { expect, test } from "bun:test";
import { jsonResponse } from "./json-response";

test("SDK metadata crosses the server boundary as JSON without losing clinical fields", () => {
  const response = jsonResponse({
    practiceId: "prac_test",
    prescriptions: [
      { daysSupply: 30, refills: 0, patientSnapshot: { address: { state: "CA", line2: null } } },
    ],
    metadata: { external: "test", nested: [true, 1, null] } as Record<string, unknown>,
    nextCursor: undefined,
  });
  expect(response.prescriptions[0]?.refills).toBe(0);
  expect(response.prescriptions[0]?.patientSnapshot.address).toEqual({ state: "CA", line2: null });
  expect(response.metadata).toEqual({ external: "test", nested: [true, 1, null] });
  expect(Object.hasOwn(response, "nextCursor")).toBe(false);
});

import { afterEach, expect, spyOn, test } from "bun:test";
import { AffinityError } from "@affinity-health/sdk";
import { createAffinity } from "./client";
import { buildOrderInput } from "./prescriptions";

const environment = {
  AFFINITY_API_KEY: process.env.AFFINITY_API_KEY,
  AFFINITY_API_URL: process.env.AFFINITY_API_URL,
  DEVBOX_API_KEY: process.env.DEVBOX_API_KEY,
};
afterEach(() => {
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("current contract preserves proxy paths, list cursors, inline identity, and the saved order key", async () => {
  process.env.AFFINITY_API_KEY = "sk_test_synthetic";
  process.env.AFFINITY_API_URL = "https://proxy.example.test/api/v1";
  process.env.DEVBOX_API_KEY = "synthetic-proxy-key";
  const requests: Request[] = [];
  const mock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async (input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1]) => {
        const request = new Request(input, init);
        requests.push(request);
        if (request.method === "GET")
          return Response.json({
            object: "list",
            url: "/v1/medications",
            data: [],
            hasMore: true,
            nextCursor: "opaque-page-2",
          });
        return Response.json({ id: "ord_01j2y8m6jcc9tt24af5pw9x1bc", status: "submitted" });
      },
      { preconnect: globalThis.fetch.preconnect },
    ),
  );
  try {
    const api = createAffinity();
    const page = await api.medications.list({ limit: "25" });
    await api.medications.list({ limit: "25", startingAfter: page.nextCursor! });
    expect(new URL(requests[1].url).searchParams.get("startingAfter")).toBe("opaque-page-2");
    const body = buildOrderInput(
      "prac_01j2y8m6jcc9tt24af5pw9x1bc",
      {
        externalId: "demo-emr-patient-ca",
        medicationId: "med_01j2y8m6jcc9tt24af5pw9x1bc",
        directions: "Synthetic test directions",
        quantity: 1,
        refills: 0,
        shippingOptionId: "shp_01j2y8m6jcc9tt24af5pw9x1bc",
        compoundingReason: "Synthetic patient-specific reason",
      },
      "1234567893",
    );
    const order = await api.orders.create(body, { idempotencyKey: "saved-order-key" });
    expect(order.status).toBe("submitted");
    expect(requests).toHaveLength(3);
    const created = requests[2];
    expect(new URL(created.url).pathname).toBe("/api/v1/orders");
    expect(created.method).toBe("POST");
    expect(created.headers.get("Idempotency-Key")).toBe("saved-order-key");
    expect(await created.json()).toEqual({
      practiceId: "prac_01j2y8m6jcc9tt24af5pw9x1bc",
      patient: {
        externalId: "demo-emr-patient-ca",
        firstName: "Alex",
        lastName: "Example",
        gender: "unknown",
        dateOfBirth: "1980-01-10",
        email: "alex@example.test",
        phone: "+14155550100",
        address: {
          line1: "100 Test Street",
          city: "San Francisco",
          state: "CA",
          postalCode: "94107",
        },
        allergies: [],
      },
      prescriber: { npi: "1234567893", firstName: "Test", lastName: "Prescriber" },
      prescriptions: [
        {
          medicationId: "med_01j2y8m6jcc9tt24af5pw9x1bc",
          directions: "Synthetic test directions",
          quantity: 1,
          refills: 0,
          compoundingReason: "Synthetic patient-specific reason",
        },
      ],
      shippingOptionId: "shp_01j2y8m6jcc9tt24af5pw9x1bc",
      signatureAttestation: true,
    });
    for (const request of requests) {
      expect(request.headers.get("Authorization")).toBe("Bearer sk_test_synthetic");
      expect(request.headers.get("X-Api-Key")).toBe("synthetic-proxy-key");
      expect(request.headers.get("Affinity-Version")).toBe("2026-10-20");
    }
  } finally {
    mock.mockRestore();
  }
});

test("rejects Live keys and keeps SDK API error metadata", async () => {
  process.env.AFFINITY_API_KEY = "sk_live_synthetic";
  expect(() => createAffinity()).toThrow("Test API key");
  process.env.AFFINITY_API_KEY = "sk_test_synthetic";
  process.env.AFFINITY_API_URL = "https://api.example.test";
  const mock = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(
      {
        code: "not_found",
        detail: "Practice not found",
        status: 404,
        requestId: "req_test",
        title: "Not found",
        instance: "/v1/practices/prac_test",
        type: "about:blank",
      },
      { status: 404 },
    ),
  );
  try {
    const request = createAffinity().practices.get("prac_test");
    await expect(request).rejects.toBeInstanceOf(AffinityError);
    await expect(request).rejects.toMatchObject({
      statusCode: 404,
      code: "not_found",
      requestId: "req_test",
      problem: { detail: "Practice not found" },
    });
  } finally {
    mock.mockRestore();
  }
});

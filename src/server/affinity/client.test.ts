import { afterEach, expect, spyOn, test } from "bun:test";
import { AffinityError } from "@affinity-health/sdk";
import { createAffinity } from "./client";
import { resolvePatient } from "./patients";

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

test("new SDK preserves proxy paths, practice scope, and persisted signing keys", async () => {
  process.env.AFFINITY_API_KEY = "sk_test_synthetic";
  process.env.AFFINITY_API_URL = "https://proxy.example.test/api/v1";
  process.env.DEVBOX_API_KEY = "synthetic-proxy-key";
  const requests: Request[] = [];
  const mock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async (input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1]) => {
        const request = new Request(input, init);
        requests.push(request);
        if (new URL(request.url).pathname.endsWith("/auth/access"))
          return Response.json({
            serviceAccount: { subjectType: "platform", subjectId: "acct_test" },
          });
        if (new URL(request.url).pathname.endsWith("/patients") && request.method === "GET")
          return Response.json({ data: [], hasMore: false });
        if (request.method === "POST" && new URL(request.url).pathname.endsWith("/patients"))
          return Response.json({ id: "pat_test" });
        return Response.json({ orderId: "ord_test" });
      },
      { preconnect: globalThis.fetch.preconnect },
    ),
  );
  try {
    const api = createAffinity();
    const result = await resolvePatient(api, "prac_test", "demo-emr-patient-ca", "patient-key");
    expect(result.patient.id).toBe("pat_test");
    const versions = [{ prescriptionId: "rx_test", version: 3 }];
    await api.forPractice("prac_test").orders.sign(
      "ord_test",
      {
        prescriber: { npi: "1234567893" },
        signatureAttestation: true,
        expectedVersions: versions,
      },
      { idempotencyKey: "persisted-signing-key" },
    );
    expect(requests.filter((r) => r.url.endsWith("/auth/access"))).toHaveLength(1);
    expect(new URL(requests[1].url).pathname).toBe("/api/v1/practices/prac_test/patients");
    expect(requests[2].headers.get("Idempotency-Key")).toBe("patient-key");
    const signed = requests.at(-1)!;
    expect(signed.headers.get("Idempotency-Key")).toBe("persisted-signing-key");
    expect(await signed.json()).toEqual({
      practiceId: "prac_test",
      prescriber: { npi: "1234567893" },
      signatureAttestation: true,
      expectedVersions: versions,
    });
    await api.forPractice("prac_test").orders.submit("ord_test", {
      idempotencyKey: "persisted-submission-key",
    });
    const submitted = requests.at(-1)!;
    expect(new URL(submitted.url).pathname).toBe("/api/v1/orders/ord_test/submit");
    expect(submitted.headers.get("Idempotency-Key")).toBe("persisted-submission-key");
    expect(await submitted.json()).toEqual({ practiceId: "prac_test" });
    for (const request of requests) {
      expect(request.headers.get("Authorization")).toBe("Bearer sk_test_synthetic");
      expect(request.headers.get("X-Api-Key")).toBe("synthetic-proxy-key");
      expect(request.headers.get("Affinity-Version")).toBe("2026-09-28");
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

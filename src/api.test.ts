import { describe, expect, test } from "bun:test";
import type { Affinity } from "@affinity-health/sdk";
import { handleApi } from "./api";
import { resolvePatient } from "./workflow";

function request(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost:3001/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": "retry-key", ...headers },
    body: JSON.stringify(body),
  });
}
function client(parts: object = {}) {
  return {
    apiKeys: { retrieve: async () => ({ livemode: false }) },
    ...parts,
  } as unknown as Affinity;
}

describe("local prescribing API", () => {
  test("rejects cross-origin writes before using credentials", async () => {
    const response = await handleApi(
      request("orders", {}, { Origin: "https://other.example" }),
      () => {
        throw new Error("Must not create client");
      },
    );
    expect(response.status).toBe(403);
  });
  test("rejects non-local hosts", async () => {
    expect((await handleApi(new Request("http://example.com/api/health"))).status).toBe(403);
  });
  test("refuses Live mode before any write", async () => {
    const response = await handleApi(request("orders", { practiceId: "prac_test" }), () =>
      client({ apiKeys: { retrieve: async () => ({ livemode: true }) } }),
    );
    expect(response.status).toBe(400);
  });
  test("reuses an existing EMR patient without creating or overwriting it", async () => {
    const affinity = client({
      patients: {
        list: async (_practice: string, query: { externalId: string }) => {
          expect(query.externalId).toBe("demo-emr-patient-ca");
          return { data: [{ id: "pat_existing" }] };
        },
        retrieve: async () => ({ id: "pat_existing" }),
      },
    });
    expect(await resolvePatient(affinity, "prac_test", "demo-emr-patient-ca")).toMatchObject({
      patient: { id: "pat_existing" },
      reused: true,
    });
  });
  test("creates a missing patient with a stable retry key", async () => {
    const affinity = client({
      patients: {
        list: async () => ({ data: [] }),
        create: async (
          _practice: string,
          patient: { externalId: string },
          options: { idempotencyKey: string },
        ) => {
          expect(patient.externalId).toBe("demo-emr-patient-ca");
          expect(options.idempotencyKey).toBe("retry-key");
          return { id: "pat_new" };
        },
      },
    });
    expect(
      (await resolvePatient(affinity, "prac_test", "demo-emr-patient-ca", "retry-key")).reused,
    ).toBe(false);
  });
  test("requires explicit signing intent", async () => {
    expect(
      (
        await handleApi(request("sign", { practiceId: "prac_test", actorId: "demo-user" }), () =>
          client(),
        )
      ).status,
    ).toBe(400);
  });
  test("signs the reviewed versions with the clinician actor and retry key", async () => {
    const expectedVersions = [{ prescriptionId: "rx_one", version: 3 }];
    const affinity = client({
      withActor: (actor: unknown) => {
        expect(actor).toEqual({ type: "user", id: "clinician-123" });
        return {
          orders: {
            sign: async (id: string, body: unknown, options: unknown) => {
              expect(id).toBe("ord_test");
              expect(body).toEqual({
                practiceId: "prac_test",
                userId: "user_test",
                signatureAttestation: true,
                expectedVersions,
              });
              expect(options).toEqual({ idempotencyKey: "retry-key" });
              return { signed: true };
            },
          },
        };
      },
    });
    const response = await handleApi(
      request("sign", {
        orderId: "ord_test",
        actorId: "clinician-123",
        practiceId: "prac_test",
        userId: "user_test",
        signatureAttestation: true,
        expectedVersions,
      }),
      () => affinity,
    );
    expect(await response.json()).toEqual({ signed: true });
  });
  test("does not erase existing allergies", async () => {
    const affinity = client({
      patients: { retrieveAllergies: async () => ({ allergies: [{ name: "Example allergy" }] }) },
    });
    expect(
      (
        await handleApi(
          request("allergies", { practiceId: "prac_test", patientId: "pat_test", confirmed: true }),
          () => affinity,
        )
      ).status,
    ).toBe(409);
  });
});

test("published SDK sends registration idempotency and actor headers", async () => {
  const { Affinity } = await import("@affinity-health/sdk");
  const affinity = new Affinity("sk_test_transport_fixture", {
    fetch: async (_url, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("idempotency-key")).toBe("registration-retry");
      expect(headers.get("affinity-actor-type")).toBe("system");
      expect(JSON.parse(String(init?.body)).identityAttestation).toBe(true);
      return Response.json({ id: "user_test" });
    },
  });
  await affinity.team.createUser(
    "prac_test",
    {
      externalId: "demo-prescriber",
      name: "Test",
      email: "test@example.test",
      npi: "1234567893",
      role: "prescriber",
      identityAttestation: true,
    },
    { idempotencyKey: "registration-retry" },
  );
});

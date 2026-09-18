import type { CreatePatientParams } from "@affinity-health/sdk";

// These records belong to the demo EMR. Affinity IDs are resolved by externalId.
export const patients = [
  {
    externalId: "demo-emr-patient-ca",
    name: { first: "Alex", last: "Example" },
    dateOfBirth: "1980-01-10",
    email: "alex@example.test",
    phone: "+14155550100",
    address: {
      line1: "100 Test Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94107",
      country: "US",
    },
  },
  {
    externalId: "demo-emr-patient-tx",
    name: { first: "Sam", last: "Example" },
    dateOfBirth: "1990-05-15",
    email: "sam@example.test",
    phone: "+15125550100",
    address: {
      line1: "100 Test Street",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "US",
    },
  },
] satisfies CreatePatientParams[];

import type { Affinity } from "@affinity-health/sdk";

// Synthetic demographics belong to this EMR and are sent inline with each order.
export const patients = [
  {
    externalId: "demo-emr-patient-ca",
    firstName: "Alex",
    lastName: "Example",
    sex: "unknown",
    dateOfBirth: "1980-01-10",
    email: "alex@example.test",
    phone: "+14155550100",
    address: {
      line1: "100 Test Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94107",
    },
  },
  {
    externalId: "demo-emr-patient-tx",
    firstName: "Sam",
    lastName: "Example",
    sex: "unknown",
    dateOfBirth: "1990-05-15",
    email: "sam@example.test",
    phone: "+15125550100",
    address: {
      line1: "100 Test Street",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
    },
  },
] satisfies Omit<Affinity.PatientInput, "allergies">[];

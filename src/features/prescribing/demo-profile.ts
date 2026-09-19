import type { Profile } from "./components/prescriber-settings";
export const demoNpi = "1234567893";
export const demoProfile: Profile = {
  email: "prescriber@example.test",
  phone: "+14155550100",
  address: {
    line1: "100 Test Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94107",
    country: "US",
  },
  states: Object.fromEntries(
    ["CA", "TX"].map((state) => [
      state,
      {
        npi: demoNpi,
        name: "Test Prescriber",
        licenseNumber: "",
        expiresAt: "",
      },
    ]),
  ),
  // This is a named Test fixture, not an assertion of Live prescribing authority.
  confirmed: true,
};

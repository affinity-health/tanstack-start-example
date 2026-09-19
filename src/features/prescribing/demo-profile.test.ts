import { expect, test } from "bun:test";
import { demoProfile, parseProfile, resolvePrescriber } from "./demo-profile";

test("default NPI works without a name and state overrides take precedence", () => {
  const profile = { defaultNpi: "1234567893", states: { TX: "1111111112" } };
  expect(resolvePrescriber(profile, "CA")).toEqual({
    npi: "1234567893",
    name: "Test Prescriber",
    eligible: true,
  });
  expect(resolvePrescriber(profile, "TX")).toEqual({
    npi: "1111111112",
    name: "Riley Five-State Test",
    eligible: true,
  });
  expect(resolvePrescriber({ ...profile, states: {} }, "TX").npi).toBe("1234567893");
});
test("Test identities stay restricted to supported states and fixtures", () => {
  expect(resolvePrescriber({ defaultNpi: "1111111112", states: {} }, "WA").eligible).toBe(false);
  expect(resolvePrescriber(demoProfile, "XX").eligible).toBe(false);
  expect(resolvePrescriber({ defaultNpi: "9999999999", states: {} }, "CA").eligible).toBe(false);
});
test("stored settings roundtrip and corrupt or legacy data falls back safely", () => {
  const profile = { defaultNpi: "1111111112", states: { WA: "1234567893" } };
  expect(parseProfile(JSON.stringify(profile))).toEqual(profile);
  for (const input of [
    null,
    "{",
    "[]",
    '{"defaultNpi":"1234567893","states":[]}',
    '{"states":{"CA":{"npi":"1234567893"}}}',
    '{"defaultNpi":"1234567893","states":{"CA":"real-npi"}}',
  ])
    expect(parseProfile(input)).toEqual(demoProfile);
});

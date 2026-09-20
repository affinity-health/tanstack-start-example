export const demoNpi = "1234567893";
export const states =
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
    " ",
  );
export type Profile = { defaultNpi: string; states: Record<string, string> };
export const demoProfile: Profile = { defaultNpi: demoNpi, states: {} };
export function isTestNpi(npi: unknown): npi is string {
  return npi === demoNpi || npi === "1111111112";
}
export function resolvePrescriber(profile: Profile, state: string) {
  const npi = profile.states[state] ?? profile.defaultNpi;
  return {
    npi,
    name: npi === demoNpi ? "Test Prescriber" : "Riley Five-State Test",
    eligible:
      isTestNpi(npi) &&
      states.includes(state) &&
      (npi === demoNpi || ["CA", "FL", "NY", "PA", "TX"].includes(state)),
  };
}
export function parseProfile(value: string | null): Profile {
  try {
    const profile = JSON.parse(value ?? "null");
    if (
      !profile ||
      !isTestNpi(profile.defaultNpi) ||
      !profile.states ||
      typeof profile.states !== "object" ||
      Array.isArray(profile.states)
    )
      return demoProfile;
    if (
      !Object.entries(profile.states).every(
        ([state, npi]) => states.includes(state) && isTestNpi(npi),
      )
    )
      return demoProfile;
    return { defaultNpi: profile.defaultNpi, states: profile.states };
  } catch {
    return demoProfile;
  }
}

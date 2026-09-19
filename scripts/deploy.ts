import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, randomInt } from "node:crypto";

// The environment runner loads .env.prod before this script starts.
const testKey = process.env.AFFINITY_TEST_API_KEY;
if (!testKey?.startsWith("sk_test_"))
  throw new Error("Set AFFINITY_TEST_API_KEY in .env.prod first.");
const pin = process.env.DEMO_PIN || String(randomInt(1_000_000_000, 10_000_000_000));
const sessionSecret = process.env.DEMO_SESSION_SECRET || randomBytes(32).toString("hex");
if (!/^\d{4,}$/.test(pin)) throw new Error("DEMO_PIN must have at least 4 digits.");
if (sessionSecret.length < 32)
  throw new Error("DEMO_SESSION_SECRET must have at least 32 characters.");

const additions = [
  !process.env.DEMO_PIN && `DEMO_PIN=${pin}`,
  !process.env.DEMO_SESSION_SECRET && `DEMO_SESSION_SECRET=${sessionSecret}`,
].filter(Boolean);
if (additions.length) {
  const existing = await Bun.file(".env.prod")
    .text()
    .catch(() => "");
  await writeFile(".env.prod", `${existing.trimEnd()}\n\n${additions.join("\n")}\n`, {
    mode: 0o600,
  });
  console.log("Saved the demo PIN and session secret in .env.prod.");
}

async function run(command: string[]) {
  const child = Bun.spawn(command, { stdout: "inherit", stderr: "inherit" });
  const code = await child.exited;
  if (code !== 0) throw new Error(`${command[0]} exited with status ${code}.`);
}

await run(["bun", "run", "build:worker"]);
const directory = await mkdtemp(join(tmpdir(), "affinity-deploy-"));
try {
  const file = join(directory, "secrets.json");
  await writeFile(
    file,
    JSON.stringify({
      AFFINITY_TEST_API_KEY: testKey,
      AFFINITY_PRODUCTION_API_KEY: process.env.AFFINITY_PRODUCTION_API_KEY || "",
      AFFINITY_API_URL: process.env.AFFINITY_API_URL || "",
      ...(process.env.DEVBOX_API_KEY ? { DEVBOX_API_KEY: process.env.DEVBOX_API_KEY } : {}),
      AFFINITY_WEBHOOK_SECRET: process.env.AFFINITY_WEBHOOK_SECRET || "",
      AFFINITY_WEBHOOK_ORGANIZATION_ID: process.env.AFFINITY_WEBHOOK_ORGANIZATION_ID || "",
      AFFINITY_WEBHOOK_LIVEMODE: process.env.AFFINITY_WEBHOOK_LIVEMODE || "false",
      DEMO_PIN: pin,
      DEMO_SESSION_SECRET: sessionSecret,
    }),
    { mode: 0o600 },
  );
  await run(["bunx", "wrangler", "deploy", "--secrets-file", file]);
} finally {
  await rm(directory, { recursive: true, force: true });
}

import { parseEnv } from "node:util";

const [environment, ...command] = process.argv.slice(2);
if (!["dev", "prod"].includes(environment) || !command.length)
  throw new Error("Usage: bun scripts/run.ts <dev|prod> <command...>");

const file = `.env.${environment}`;
const configured = parseEnv(await Bun.file(file).text());
const env = { ...process.env };
// Never inherit app credentials from the old .env or another environment.
for (const name of Object.keys(env)) {
  if (name.startsWith("AFFINITY_") || name.startsWith("DEMO_")) delete env[name];
}
Object.assign(env, configured);
const child = Bun.spawn(command, { env, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
process.exit(await child.exited);

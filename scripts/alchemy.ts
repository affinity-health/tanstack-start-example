const token = process.env.CLOUDFLARE_EMR_DEMO_API_TOKEN;
if (!token) throw new Error("Set CLOUDFLARE_EMR_DEMO_API_TOKEN in Doppler affinity/stg.");
const child = Bun.spawn(
  ["bun", "--no-env-file", "node_modules/alchemy/bin/cli.js", ...process.argv.slice(2)],
  {
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  },
);
process.exit(await child.exited);
export {};

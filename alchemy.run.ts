import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

// Independent demo stack. Keep this checkout's .alchemy state; do not deploy from empty state.
export default Alchemy.Stack(
  "affinity-emr-demo",
  {
    providers: Cloudflare.providers(),
    state: Alchemy.localState(),
  },
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    if (stage !== "demo" && stage !== "local") throw new Error("Expected demo or local stage.");
    const site = yield* Cloudflare.Website.Vite("Demo", {
      name: stage === "demo" ? "affinity-emr-demo" : "affinity-emr-demo-local",
      rootDir: ".",
      main: "./src/server.ts",
      dev: stage === "local" ? { port: 1337, host: "127.0.0.1", strictPort: true } : undefined,
      domain: stage === "demo" ? "demo-emr.joinaffinityai.com" : undefined,
      compatibility: { flags: ["nodejs_compat", "nodejs_compat_populate_process_env"] },
      env: {
        ...(stage === "local" && process.env.VITE_BASE_PATH === "/emr-demo/"
          ? { DEMO_DEV_ORIGIN: "https://affinity.harbr.run" }
          : {}),
        DEMO_SESSIONS: Cloudflare.DurableObject("DemoSessions"),
        AFFINITY_TEST_API_KEY: Config.redacted("AFFINITY_DEMO_API_KEY"),
        DEMO_SESSION_SECRET: Config.redacted("AFFINITY_DEMO_SESSION_SECRET"),
        AFFINITY_API_URL: "https://api.joinaffinityai.com",
      },
    });
    return { url: site.url };
  }),
);

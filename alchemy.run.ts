import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

const developmentPort = Number.parseInt(process.env.DEV_SERVICE_PORT ?? "3001", 10);

export const Database = Cloudflare.D1.Database("Database", {
  migrationsDir: "./migrations",
  primaryLocationHint: "enam",
});

const AuthSecret = Alchemy.Random("AuthSecret");
const AuthSecretValue = AuthSecret.pipe(Effect.map((secret) => secret.text));

const WebsiteBindings = {
  AFFINITY_API_KEY: Config.redacted("AFFINITY_API_KEY"),
  AFFINITY_API_URL: Config.string("AFFINITY_API_URL").pipe(
    Config.withDefault("https://api.joinaffinityai.com"),
  ),
  AFFINITY_CONNECT_URL: Config.string("AFFINITY_CONNECT_URL").pipe(
    Config.withDefault("https://connect.joinaffinityai.com"),
  ),
  AFFINITY_DEMO_PATIENT_STATE: Config.string("AFFINITY_DEMO_PATIENT_STATE").pipe(
    Config.withDefault("CA"),
  ),
  AFFINITY_PROVIDER_MAPPING_ID: Config.string("AFFINITY_PROVIDER_MAPPING_ID").pipe(
    Config.withDefault(""),
  ),
  AFFINITY_WEBHOOK_SECRET: Config.redacted("AFFINITY_WEBHOOK_SECRET"),
  APP_URL: Config.string("APP_URL").pipe(Config.withDefault("http://localhost:3001")),
  BETTER_AUTH_SECRET: AuthSecretValue,
  DB: Database,
} as const;

export const Website = Cloudflare.Website.Vite("Website", {
  compatibility: {
    flags: ["nodejs_compat"],
  },
  dev: {
    port: developmentPort,
  },
  env: WebsiteBindings,
});

export type WebsiteEnv = {
  AFFINITY_API_KEY: string;
  AFFINITY_API_URL: string;
  AFFINITY_CONNECT_URL: string;
  AFFINITY_DEMO_PATIENT_STATE: string;
  AFFINITY_PROVIDER_MAPPING_ID: string;
  AFFINITY_WEBHOOK_SECRET: string;
  APP_URL: string;
  BETTER_AUTH_SECRET: string;
  DB: Cloudflare.InferEnv<{ DB: typeof Database }>["DB"];
};

export default Alchemy.Stack(
  "TanStackStartExample",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const database = yield* Database;
    const website = yield* Website;

    return {
      databaseName: database.databaseName,
      url: website.url.as<string>(),
    };
  }),
);

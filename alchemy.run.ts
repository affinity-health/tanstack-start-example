import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

export const Database = Cloudflare.D1.Database("Database", {
  migrationsDir: "./migrations",
  primaryLocationHint: "enam",
});

const AuthSecret = Alchemy.Random("AuthSecret");
const AuthSecretValue = AuthSecret.pipe(Effect.map((secret) => secret.text));

const WebsiteBindings = {
  AFFINITY_API_KEY: Config.redacted("AFFINITY_API_KEY"),
  AFFINITY_API_URL: "https://api-staging.joinaffinityai.com",
  AFFINITY_CONNECT_URL: "https://connect-staging.joinaffinityai.com",
  AFFINITY_PROVIDER_MAPPING_ID: Config.string("AFFINITY_PROVIDER_MAPPING_ID").pipe(
    Config.withDefault(""),
  ),
  AFFINITY_WEBHOOK_SECRET: Config.redacted("AFFINITY_WEBHOOK_SECRET"),
  APP_URL: "https://api.dawson.gg",
  BETTER_AUTH_SECRET: AuthSecretValue,
  DB: Database,
} as const;

export const Website = Cloudflare.Website.Vite("Website", {
  compatibility: {
    flags: ["nodejs_compat"],
  },
  dev: {
    port: 3001,
  },
  env: WebsiteBindings,
});

export type WebsiteEnv = {
  AFFINITY_API_KEY: string;
  AFFINITY_API_URL: string;
  AFFINITY_CONNECT_URL: string;
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

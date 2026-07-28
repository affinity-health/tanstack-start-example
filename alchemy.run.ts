import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export const Database = Cloudflare.D1.Database("Database", {
  migrationsDir: "./migrations",
  primaryLocationHint: "enam",
});

const AuthSecret = Alchemy.Random("AuthSecret");
const AuthSecretValue = AuthSecret.pipe(Effect.map((secret) => secret.text));

const WebsiteBindings = {
  BETTER_AUTH_SECRET: AuthSecretValue,
  DB: Database,
} as const;

export const Website = Cloudflare.Website.Vite("Website", {
  compatibility: {
    flags: ["nodejs_compat"],
  },
  dev: {
    port: 3000,
  },
  env: WebsiteBindings,
});

export type WebsiteEnv = {
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

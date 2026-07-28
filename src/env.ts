import * as cloudflare from "cloudflare:workers";

import type { WebsiteEnv } from "../alchemy.run";

export const env = new Proxy({} as WebsiteEnv, {
  get(_, property) {
    return cloudflare.env[property as keyof typeof cloudflare.env];
  },
});

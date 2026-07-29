import { describe, expect, test } from "bun:test";

import { requestOrigin } from "./request-origin";

describe("requestOrigin", () => {
  test("uses the direct request origin without proxy headers", () => {
    expect(requestOrigin(new Request("http://localhost:3001/api/health"))).toBe(
      "http://localhost:3001",
    );
  });

  test("restores the public HTTPS origin behind a tunnel", () => {
    const request = new Request("http://api.dawson.gg/api/affinity/component-session");

    expect(requestOrigin(request, "https://api.dawson.gg")).toBe("https://api.dawson.gg");
  });

  test("uses the forwarded host when the internal request host differs", () => {
    const request = new Request("http://127.0.0.1:3001/api/affinity/component-session", {
      headers: {
        "x-forwarded-host": "api.dawson.gg",
        "x-forwarded-proto": "https",
      },
    });

    expect(requestOrigin(request)).toBe("https://api.dawson.gg");
  });

  test("uses Cloudflare visitor metadata when x-forwarded-proto is unavailable", () => {
    const request = new Request("http://api.dawson.gg/api/affinity/component-session", {
      headers: {
        "cf-visitor": JSON.stringify({ scheme: "https" }),
      },
    });

    expect(requestOrigin(request)).toBe("https://api.dawson.gg");
  });
});

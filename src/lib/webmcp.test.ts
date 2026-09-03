import { describe, expect, test } from "bun:test";

import { registerWebMcpTools, type WebMcpModelContext, type WebMcpTool } from "./webmcp";

const tool: WebMcpTool = {
  name: "test_tool",
  description: "A test tool.",
  execute: () => ({ content: [{ type: "text", text: "ok" }] }),
};

describe("WebMCP registration", () => {
  test("degrades cleanly when the browser API is unavailable", async () => {
    const statuses: string[] = [];
    const registration = registerWebMcpTools(undefined, [tool], (status) => statuses.push(status));

    expect(await registration.ready).toBe("unsupported");
    expect(statuses).toEqual(["unsupported"]);
    expect(registration.dispose()).toBeUndefined();
  });

  test("registers tools and aborts their shared lifecycle", async () => {
    const signals: AbortSignal[] = [];
    const context: WebMcpModelContext = {
      async registerTool(_registeredTool, options) {
        if (options?.signal) signals.push(options.signal);
      },
    };
    const registration = registerWebMcpTools(context, [tool]);

    expect(await registration.ready).toBe("active");
    expect(signals[0]?.aborted).toBe(false);
    registration.dispose();
    expect(signals[0]?.aborted).toBe(true);
  });
});

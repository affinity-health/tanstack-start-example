export type WebMcpContent = {
  type: "text";
  text: string;
};

export type WebMcpResult = {
  content: WebMcpContent[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
};

export type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: Record<string, unknown>): WebMcpResult | Promise<WebMcpResult>;
};

export type WebMcpModelContext = {
  registerTool(tool: WebMcpTool, options?: { signal?: AbortSignal }): Promise<void>;
};

declare global {
  interface Document {
    readonly modelContext: WebMcpModelContext;
  }
}

export type WebMcpRegistrationStatus = "active" | "error" | "registering" | "unsupported";

export function registerWebMcpTools(
  modelContext: WebMcpModelContext | undefined,
  tools: readonly WebMcpTool[],
  onStatus?: (status: WebMcpRegistrationStatus) => void,
) {
  if (!modelContext) {
    onStatus?.("unsupported");
    return {
      dispose() {},
      ready: Promise.resolve<WebMcpRegistrationStatus>("unsupported"),
    };
  }

  const controller = new AbortController();
  onStatus?.("registering");
  const ready = Promise.all(
    tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })),
  ).then(
    () => {
      onStatus?.("active");
      return "active" as const;
    },
    () => {
      onStatus?.("error");
      return "error" as const;
    },
  );

  return {
    dispose() {
      controller.abort();
    },
    ready,
  };
}

export function registerDocumentWebMcpTools(
  tools: readonly WebMcpTool[],
  onStatus?: (status: WebMcpRegistrationStatus) => void,
) {
  const modelContext = typeof document === "undefined" ? undefined : document.modelContext;
  if (!modelContext) return registerWebMcpTools(undefined, tools, onStatus);

  return registerWebMcpTools(
    {
      registerTool: (tool, options) =>
        document.modelContext.registerTool(
          {
            name: tool.name,
            title: tool.title,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: tool.annotations,
            execute: tool.execute,
          },
          options,
        ),
    },
    tools,
    onStatus,
  );
}

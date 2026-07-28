import { createServerFn } from "@tanstack/react-start";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { createAuth }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("../server/auth"),
  ]);
  const request = getRequest();

  return createAuth(request).api.getSession({
    headers: request.headers,
  });
});

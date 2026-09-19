const base = (import.meta.env?.BASE_URL ?? "/").replace(/\/$/, "");
export const appPath = (path: string) => base + path;
export const appPathname = (pathname: string) =>
  base && (pathname === base || pathname.startsWith(base + "/"))
    ? pathname.slice(base.length) || "/"
    : pathname;

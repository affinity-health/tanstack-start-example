import type { Catalog, Options, Practices } from "../types";
import { requireBrowserSession } from "../../../lib/session";

export type Mode = "test" | "production";
export type Bootstrap = { practices?: Practices; catalog?: Catalog; error?: string };
type Entry = { value?: unknown; expires: number; pending?: Promise<unknown> };
const cache = new Map<string, Entry>();
const lifetime = 60_000;
const limit = 100;

export function readUrl(mode: Mode, path: string) {
  const url = new URL("/api/" + path, "http://local");
  url.searchParams.set("mode", mode);
  url.searchParams.sort();
  return url.pathname + url.search;
}

function put(key: string, entry: Entry) {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > limit) cache.delete(cache.keys().next().value!);
}

// Browser memory only. Never share credential-scoped data between SSR requests.
export function seedRead(mode: Mode, path: string, value: unknown) {
  if (typeof window !== "undefined")
    put(readUrl(mode, path), { value, expires: Date.now() + lifetime });
}

export function peekRead<T>(mode: Mode, path: string): T | undefined {
  if (typeof window === "undefined") return;
  const entry = cache.get(readUrl(mode, path));
  return entry && entry.expires > Date.now() ? (entry.value as T) : undefined;
}

export async function read<T>(mode: Mode, path: string): Promise<T> {
  const key = readUrl(mode, path);
  const cached = peekRead<T>(mode, path);
  if (cached !== undefined) return cached;
  const existing = cache.get(key)?.pending;
  if (existing) return existing as Promise<T>;
  const entry: Entry = { expires: 0 };
  entry.pending = fetch(key)
    .then(async (response) => {
      const data = await response.json();
      requireBrowserSession(data);
      if (!response.ok) throw new Error(data.error || "Request failed.");
      entry.value = data;
      entry.expires = Date.now() + lifetime;
      return data as T;
    })
    .finally(() => {
      entry.pending = undefined;
      if (!entry.expires && cache.get(key) === entry) cache.delete(key);
    });
  put(key, entry);
  return entry.pending as Promise<T>;
}

export function catalogPath(practiceId: string, query = "", cursor = "") {
  return `catalog?${new URLSearchParams({ practiceId, query: query.trim(), startingAfter: cursor })}`;
}
export function optionsPath(practiceId: string, medicationId: string) {
  return `options?${new URLSearchParams({ practiceId, medicationId })}`;
}
export function prefetchOptions(mode: Mode, practiceId: string, medicationId: string) {
  void read<Options>(mode, optionsPath(practiceId, medicationId)).catch(() => {});
}

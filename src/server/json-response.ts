type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonResponse<T> = unknown extends T
  ? JsonValue
  : T extends readonly (infer U)[]
    ? JsonResponse<U>[]
    : T extends object
      ? { [K in keyof T]: JsonResponse<T[K]> }
      : T;

// Materialize the JSON boundary before returning API responses through TanStack Start.
export function jsonResponse<T>(value: T): JsonResponse<T> {
  return JSON.parse(JSON.stringify(value)) as JsonResponse<T>;
}

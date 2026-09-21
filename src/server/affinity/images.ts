type CatalogArtwork = { imageUrl?: string | null; defaultImageUrl?: string | null };

// SDK 1.10.0 discards defaultImageUrl. Resolve the demo's display image before
// SDK decoding, until a published SDK exposes that field to the UI.
export async function withCatalogArtwork(input: RequestInfo | URL, response: Response) {
  const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
  if (!response.ok || !/\/v1\/catalog\/items(?:\/[^/]+\/prescribing-options)?$/.test(path))
    return response;

  const body = (await response.json()) as {
    data?: CatalogArtwork[];
    catalog?: CatalogArtwork;
  };
  for (const item of body.data ?? (body.catalog ? [body.catalog] : [])) {
    item.imageUrl ||= item.defaultImageUrl ?? null;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return Response.json(body, { status: response.status, statusText: response.statusText, headers });
}

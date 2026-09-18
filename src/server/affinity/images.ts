// Only the configured API origin receives the Devbox credential. Public CDN URLs stay direct.
export function medicationImageUrl(value: string | null): string | null {
  if (!value || !process.env.DEVBOX_API_KEY || !process.env.AFFINITY_API_URL) return value;
  try {
    const api = new URL(process.env.AFFINITY_API_URL);
    const image = new URL(value, api);
    if (image.origin !== api.origin || !image.pathname.startsWith("/cdn/")) return value;
    return `/api/medication-image?${new URLSearchParams({ path: image.pathname + image.search })}`;
  } catch {
    return value;
  }
}
export function withMedicationImages<T extends { imageUrl: string | null; imageUrls: string[] }>(
  item: T,
): T {
  return {
    ...item,
    imageUrl: medicationImageUrl(item.imageUrl),
    imageUrls: item.imageUrls.map((url) => medicationImageUrl(url)!),
  };
}

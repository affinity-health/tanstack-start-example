import type { Affinity } from "@affinity-health/sdk";

// Affinity distinguishes unassigned drafts from drafts awaiting their prescriber's signature.
// Merge the two ordered streams without skipping records at a page boundary.
export async function listDrafts(affinity: Affinity, practiceId: string, cursor = "") {
  const statuses = ["draft", "requires_provider_signature"] as const;
  let positions: Record<string, string> = {};
  if (cursor) {
    const parsed = JSON.parse(cursor);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.entries(parsed).some(
        ([key, value]) =>
          !statuses.includes(key as (typeof statuses)[number]) || typeof value !== "string",
      )
    )
      throw new Error("Invalid draft page. Refresh orders and try again.");
    positions = parsed;
  }
  const pages = await Promise.all(
    statuses.map((status) =>
      affinity.orders.list({
        practiceId,
        status,
        startingAfter: positions[status] || undefined,
        limit: 25,
        sort: "newest",
      }),
    ),
  );
  const combined = pages
    .flatMap((page, index) => page.data.map((order) => ({ order, status: statuses[index] })))
    .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt));
  const selected = combined.slice(0, 25);
  for (const { order, status } of selected) positions[status] = order.id;
  return {
    ...pages[0],
    data: selected.map(({ order }) => order),
    hasMore: combined.length > 25 || pages.some((page) => page.hasMore),
    nextCursor: JSON.stringify(positions),
  };
}

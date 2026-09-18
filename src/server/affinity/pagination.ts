export async function listAll<T extends { id: string }>(
  list: (cursor?: string) => Promise<{ data: T[]; hasMore: boolean }>,
) {
  const first = await list();
  const data = [...first.data];
  let page = first;
  while (page.hasMore && page.data.length) {
    const cursor = page.data.at(-1)!.id;
    page = await list(cursor);
    if (page.data.at(-1)?.id === cursor)
      throw new Error("Affinity returned a repeated pagination cursor.");
    data.push(...page.data);
  }
  return { ...first, data, hasMore: false };
}

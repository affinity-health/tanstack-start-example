import { expect, test } from "bun:test";
import { withCatalogArtwork } from "./images";

test("catalog reads retain pharmacy photos and use default artwork when absent", async () => {
  const items = [
    { imageUrl: null, defaultImageUrl: "https://cdn.example/vial.webp" },
    {
      imageUrl: "https://cdn.example/photo.webp",
      defaultImageUrl: "https://cdn.example/vial.webp",
    },
    { imageUrl: null, defaultImageUrl: null },
  ];
  const list = await withCatalogArtwork(
    "https://api.example/v1/catalog/items?limit=25",
    Response.json({ data: items }),
  );
  expect(
    (await list.json()).data.map((item: { imageUrl: string | null }) => item.imageUrl),
  ).toEqual(["https://cdn.example/vial.webp", "https://cdn.example/photo.webp", null]);
  const options = await withCatalogArtwork(
    "https://api.example/v1/catalog/items/cat_test/prescribing-options",
    Response.json({ catalog: items[0] }),
  );
  expect((await options.json()).catalog.imageUrl).toBe("https://cdn.example/vial.webp");
  const error = Response.json({ detail: "Not found" }, { status: 404 });
  expect(await withCatalogArtwork("https://api.example/v1/catalog/items", error)).toBe(error);
  const order = Response.json({ catalog: items[0] });
  expect(await withCatalogArtwork("https://api.example/v1/orders", order)).toBe(order);
});

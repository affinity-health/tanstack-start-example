import { describe, expect, mock, test } from "bun:test";

import { createMarketplaceTools } from "./marketplace-tools";

function actions() {
  return {
    addToCart: mock(() => {}),
    inspectCart: mock(() => [
      { patientId: "pat_ada_zieme", productId: "med_semaglutide_b12", quantity: 1 },
    ]),
    openProduct: mock(() => {}),
    searchMarketplace: mock(() => {}),
  };
}

describe("marketplace WebMCP tools", () => {
  test("searches the visible synthetic catalog", async () => {
    const handlers = actions();
    const response = await createMarketplaceTools(handlers)[0]!.execute({
      query: "semaglutide",
      category: "metabolic",
    });
    expect(handlers.searchMarketplace).toHaveBeenCalledWith(
      "semaglutide",
      "Metabolic",
      "Marketplace search found 1 product.",
    );
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ count: 1, syntheticData: true }),
    );
  });

  test("opens a product in the human interface", async () => {
    const handlers = actions();
    await createMarketplaceTools(handlers)[1]!.execute({ product: "Semaglutide + B12" });
    expect(handlers.openProduct).toHaveBeenCalledWith(
      "med_semaglutide_b12",
      "Opened Semaglutide + B12 in the marketplace.",
    );
  });

  test("adds to a named patient cart without checkout", async () => {
    const handlers = actions();
    const response = await createMarketplaceTools(handlers)[2]!.execute({
      product: "med_semaglutide_b12",
      patient: "Ada Zieme",
    });
    expect(handlers.addToCart).toHaveBeenCalledWith(
      "med_semaglutide_b12",
      "pat_ada_zieme",
      "Added Semaglutide + B12 to Ada Zieme's visible cart. Clinician checkout is still required.",
    );
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ checkoutConfirmed: false }),
    );
  });

  test("inspects a cart without exposing a checkout action", async () => {
    const handlers = actions();
    const response = await createMarketplaceTools(handlers)[3]!.execute({ patient: "Ada Zieme" });
    expect(handlers.inspectCart).toHaveBeenCalled();
    expect(response.structuredContent).toEqual(
      expect.objectContaining({ checkoutConfirmed: false }),
    );
    expect(createMarketplaceTools(handlers).map((tool) => tool.name)).not.toContain(
      "confirm_checkout",
    );
  });
});

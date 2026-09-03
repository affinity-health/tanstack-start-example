import { demoCatalog, demoPatients } from "../../lib/demo-data";
import type { CartLine } from "../marketplace/clinic-commerce";
import type { WebMcpResult, WebMcpTool } from "../../lib/webmcp";

type MarketplaceToolActions = {
  addToCart(productId: string, patientId: string, message: string): void;
  inspectCart(patientId: string, message: string): CartLine[];
  openProduct(productId: string, message: string): void;
  searchMarketplace(query: string, category: string, message: string): void;
};

export function createMarketplaceTools(actions: MarketplaceToolActions): WebMcpTool[] {
  return [
    {
      name: "search_medication_marketplace",
      title: "Search the medication marketplace",
      description:
        "Searches Northstar's synthetic Test catalog and applies the search to the visible Marketplace screen.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", maxLength: 120 },
          category: {
            type: "string",
            enum: ["all", "metabolic", "dermatology", "general wellness", "sexual health"],
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const query = typeof input.query === "string" ? input.query.trim() : "";
        const category = readCategory(input.category);
        const matches = demoCatalog.filter(
          (product) =>
            (category === "All" || product.category === category) &&
            (!query ||
              [product.name, product.description, product.strength]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase())),
        );
        const message = `Marketplace search found ${matches.length} product${matches.length === 1 ? "" : "s"}.`;
        actions.searchMarketplace(query, category, message);
        return result(message, {
          count: matches.length,
          products: matches.map(({ category: group, dosageForm, id, name, price, strength }) => ({
            category: group,
            dosageForm,
            id,
            name,
            price,
            strength,
          })),
          syntheticData: true,
        });
      },
    },
    {
      name: "open_marketplace_product",
      title: "Open a marketplace product",
      description: "Opens one synthetic product in Northstar's visible product detail sheet.",
      inputSchema: {
        type: "object",
        properties: {
          product: {
            type: "string",
            description: "Exact product name or ID returned by marketplace search.",
          },
        },
        required: ["product"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const product = findProduct(input.product);
        if (!product) return error("No synthetic marketplace product matched that name or ID.");
        const message = `Opened ${product.name} in the marketplace.`;
        actions.openProduct(product.id, message);
        return result(message, { product, syntheticData: true });
      },
    },
    {
      name: "add_marketplace_product_to_cart",
      title: "Add a product to a patient cart",
      description:
        "Adds one synthetic Test product to the named patient's visible Northstar cart. It cannot confirm checkout, create an order, or prescribe.",
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "string", description: "Exact product name or ID." },
          patient: { type: "string", description: "Exact synthetic patient name or ID." },
        },
        required: ["product", "patient"],
        additionalProperties: false,
      },
      execute(input) {
        const product = findProduct(input.product);
        if (!product) return error("No synthetic marketplace product matched that name or ID.");
        const patient = findPatient(input.patient);
        if (!patient) return error("No synthetic patient matched that name or ID.");
        const message = `Added ${product.name} to ${patient.name}'s visible cart. Clinician checkout is still required.`;
        actions.addToCart(product.id, patient.id, message);
        return result(message, {
          checkoutConfirmed: false,
          patientId: patient.id,
          productId: product.id,
          syntheticData: true,
        });
      },
    },
    {
      name: "inspect_patient_cart",
      title: "Inspect a patient cart",
      description:
        "Opens and returns the named patient's visible Northstar cart without confirming checkout.",
      inputSchema: {
        type: "object",
        properties: {
          patient: { type: "string", description: "Exact synthetic patient name or ID." },
        },
        required: ["patient"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        const patient = findPatient(input.patient);
        if (!patient) return error("No synthetic patient matched that name or ID.");
        const message = `Opened ${patient.name}'s cart for review.`;
        const lines = actions.inspectCart(patient.id, message);
        return result(message, {
          checkoutConfirmed: false,
          items: lines.map((line) => ({
            ...line,
            product: demoCatalog.find((product) => product.id === line.productId)?.name,
          })),
          patientId: patient.id,
          syntheticData: true,
        });
      },
    },
  ];
}

function findProduct(value: unknown) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return demoCatalog.find(
    (product) => product.id.toLowerCase() === key || product.name.toLowerCase() === key,
  );
}
function findPatient(value: unknown) {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return demoPatients.find(
    (patient) => patient.id.toLowerCase() === key || patient.name.toLowerCase() === key,
  );
}
function readCategory(value: unknown) {
  const key = typeof value === "string" ? value.toLowerCase() : "all";
  return demoCatalog.find((product) => product.category.toLowerCase() === key)?.category ?? "All";
}
function result(text: string, structuredContent?: Record<string, unknown>): WebMcpResult {
  return { content: [{ type: "text", text }], ...(structuredContent ? { structuredContent } : {}) };
}
function error(text: string): WebMcpResult {
  return { content: [{ type: "text", text }], isError: true };
}

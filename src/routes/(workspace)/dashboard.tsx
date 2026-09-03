import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

import { EmrShell } from "../../components/emr-shell";
import { useClinicCommerce } from "../../features/marketplace/clinic-commerce";
import { demoCatalog, demoPatients, type DemoCatalogProduct } from "../../lib/demo-data";
import { requireSession } from "../../lib/require-session";

export const Route = createFileRoute("/(workspace)/dashboard")({
  beforeLoad: requireSession,
  head: () => ({ meta: [{ title: "Marketplace | Northstar Health" }] }),
  component: Marketplace,
});

function Marketplace() {
  const { session } = Route.useRouteContext();
  const commerce = useClinicCommerce();
  const product = demoCatalog.find((item) => item.id === commerce.openProductId);
  const [patientId, setPatientId] = useState(commerce.selectedCartPatientId);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") commerce.closeProduct();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [commerce]);

  function addProduct() {
    if (!product) return;
    commerce.addToCart(product.id, patientId);
    commerce.setActivity(
      `Added ${product.name} to ${demoPatients.find((patient) => patient.id === patientId)?.name}'s cart.`,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <EmrShell
      actions={
        <Link className="emr-button emr-button-secondary" to="/cart">
          <ShoppingCart aria-hidden size={16} />
          Cart{commerce.cartCount ? ` (${commerce.cartCount})` : ""}
        </Link>
      }
      current="overview"
      description="Synthetic products from Affinity Test"
      session={session}
      title="Medication marketplace"
    >
      <section className="marketplace-toolbar" aria-label="Marketplace filters">
        <label className="emr-search marketplace-search">
          <Search aria-hidden size={16} />
          <span className="sr-only">Search marketplace</span>
          <input
            placeholder="Search medications, strengths, or dosage forms"
            type="search"
            value={commerce.query}
            onChange={(event) => commerce.setQuery(event.target.value)}
          />
        </label>
        <div className="marketplace-categories" aria-label="Product category">
          <SlidersHorizontal aria-hidden size={15} />
          {commerce.categories.map((category) => (
            <button
              aria-pressed={commerce.category === category}
              className={commerce.category === category ? "is-active" : undefined}
              key={category}
              onClick={() => commerce.setCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="marketplace-count">
        <span>{commerce.products.length} products</span>
        <span>Test catalog · No Live data</span>
      </div>
      {commerce.products.length ? (
        <section className="marketplace-grid" aria-label="Medication products">
          {commerce.products.map((item) => (
            <ProductCard
              key={item.id}
              onOpen={() => {
                commerce.openProduct(item.id);
                setAdded(false);
              }}
              product={item}
            />
          ))}
        </section>
      ) : (
        <section className="marketplace-empty">
          <Search aria-hidden size={24} />
          <h2>No products found</h2>
          <p>Try another name, strength, or category.</p>
          <button
            className="emr-button emr-button-secondary"
            onClick={() => {
              commerce.setQuery("");
              commerce.setCategory("All");
            }}
            type="button"
          >
            Clear filters
          </button>
        </section>
      )}

      {product ? (
        <>
          <button
            aria-label="Close product details"
            className="emr-sheet-backdrop"
            onClick={commerce.closeProduct}
            type="button"
          />
          <aside
            aria-label={`${product.name} details`}
            className="emr-detail-sheet product-detail-sheet"
          >
            <header className="emr-sheet-header">
              <div>
                <h2>{product.name}</h2>
                <p>
                  {product.category} · {product.dosageForm}
                </p>
              </div>
              <button aria-label="Close details" onClick={commerce.closeProduct} type="button">
                <X aria-hidden size={18} />
              </button>
            </header>
            <div className="emr-sheet-body">
              <div
                className={`product-art product-art-${product.category.toLowerCase().replaceAll(" ", "-")}`}
              >
                <span>{product.dosageForm}</span>
                <strong>{product.name.split(" ")[0]}</strong>
                <small>{product.strength}</small>
              </div>
              <section className="product-detail-copy">
                <h3>Product details</h3>
                <p>{product.description}</p>
                <dl>
                  <div>
                    <dt>Strength</dt>
                    <dd>{product.strength}</dd>
                  </div>
                  <div>
                    <dt>Dosage form</dt>
                    <dd>{product.dosageForm}</dd>
                  </div>
                  <div>
                    <dt>Test pharmacy</dt>
                    <dd>{product.pharmacy}</dd>
                  </div>
                  <div>
                    <dt>Estimated price</dt>
                    <dd>${product.price}</dd>
                  </div>
                </dl>
              </section>
              <label className="product-patient-select">
                Patient
                <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                  {demoPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} · {patient.state}
                    </option>
                  ))}
                </select>
              </label>
              <p className="product-safety-note">
                Adding this product only updates the cart. A clinician must review and confirm
                checkout.
              </p>
            </div>
            <footer className="emr-sheet-footer">
              <button
                className="emr-button emr-button-primary emr-button-full"
                onClick={addProduct}
                type="button"
              >
                {added ? <Check aria-hidden size={16} /> : <ShoppingCart aria-hidden size={16} />}
                {added ? "Added to cart" : "Add to patient cart"}
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </EmrShell>
  );
}

function ProductCard({ onOpen, product }: { onOpen(): void; product: DemoCatalogProduct }) {
  const artClass = product.category.toLowerCase().replaceAll(" ", "-");
  return (
    <button className="marketplace-product" onClick={onOpen} type="button">
      <span className={`product-art product-art-${artClass}`}>
        <span>{product.dosageForm}</span>
        <strong>{product.name.split(" ")[0]}</strong>
        <small>{product.strength}</small>
      </span>
      <span className="product-card-copy">
        <small>{product.category}</small>
        <strong>{product.name}</strong>
        <span>{product.strength}</span>
        <span className="product-card-meta">
          <span>{product.pharmacy}</span>
          <b>From ${product.price}</b>
        </span>
      </span>
    </button>
  );
}

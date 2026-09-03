import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";

export function HeroProductVisual() {
  return (
    <figure className="hero-visual">
      <div className="hero-image-shell is-error">
        <div
          className="hero-product-fallback"
          role="img"
          aria-label="Medication marketplace and patient cart"
        >
          <div className="fallback-topbar">
            <span />
            <span>Northstar clinic</span>
            <small>Affinity Test</small>
          </div>
          <div className="fallback-progress">
            <span className="is-complete">Search catalog</span>
            <span className="is-current">Open product</span>
            <span>Add to cart</span>
            <span>Clinician checkout</span>
          </div>
          <div className="fallback-workspace">
            <div>
              <small>Medication marketplace</small>
              <strong>Semaglutide + B12</strong>
              <span>2.5 mg / 1 mg per mL</span>
              <span>Northstar Test Pharmacy</span>
            </div>
            <div>
              <small>Ada Zieme&apos;s cart</small>
              <strong>1 product</strong>
              <span className="fallback-confirmation">
                <ShieldCheck aria-hidden weight="duotone" />
                Clinician checkout required
              </span>
            </div>
          </div>
        </div>
      </div>
      <figcaption>
        <span>
          <CheckCircle aria-hidden weight="fill" />
          Synthetic Test catalog
        </span>
        <span>Agent cannot check out</span>
      </figcaption>
    </figure>
  );
}

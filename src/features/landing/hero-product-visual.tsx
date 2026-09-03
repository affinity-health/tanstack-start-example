import { CheckCircle, ShieldCheck } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export function HeroProductVisual() {
  const [status, setStatus] = useState<"loaded" | "error">("error");
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setStatus("loaded");
  }, []);

  return (
    <figure className="hero-visual">
      <div className={`hero-image-shell is-${status}`}>
        <img
          ref={imageRef}
          src="/images/affinity-prescribing-hero.png"
          alt="The Northstar clinic medication workspace on a laptop in daylight"
          width="1600"
          height="900"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
        {status === "error" ? (
          <div className="hero-product-fallback" role="img" aria-label="Unsigned proposal workflow">
            <div className="fallback-topbar">
              <span />
              <span>Northstar clinic</span>
              <small>Affinity Test</small>
            </div>
            <div className="fallback-progress">
              <span className="is-complete">Encounter</span>
              <span className="is-complete">Catalog match</span>
              <span className="is-current">Unsigned proposal</span>
              <span>Human confirm</span>
            </div>
            <div className="fallback-workspace">
              <div>
                <small>Synthetic patients</small>
                <strong>Ada Zieme</strong>
                <span>Metabolic health follow up</span>
                <span>Eligible for review</span>
              </div>
              <div>
                <small>Order status</small>
                <strong>Not created</strong>
                <span className="fallback-confirmation">
                  <ShieldCheck aria-hidden weight="duotone" /> Human confirmation required
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <figcaption>
        <span>
          <CheckCircle aria-hidden weight="fill" /> Encounter complete
        </span>
        <span>Unsigned proposal only</span>
      </figcaption>
    </figure>
  );
}
